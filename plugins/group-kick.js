const handler = async (m, {
	conn,
	text,
	participants,
	prefix,
	command,
	reply,
	isGroup,
	isAdmin,
	isBotAdmin,
	groupMetadata
}) => {
	// Enhanced permission checking
	if (!isGroup) return reply('❌ This command can only be used in groups!')
	if (!isAdmin) return reply('❌ Only group admins can remove members!')
	if (!isBotAdmin) return reply('❌ Bot must be a group admin to remove members!')
	
	let targetUsers = []
	
	// Check if it's a reply to a message (remove the person who sent that message)
	if (m.quoted) {
		const quotedMsg = m.quoted
		const quotedSender = quotedMsg.sender || quotedMsg.participant || quotedMsg.key?.participant
		
		if (quotedSender) {
			targetUsers.push(quotedSender)
			reply(`🎯 Removing the sender of the quoted message: ${quotedSender.split('@')[0]}`)
		} else {
			return reply('❌ Could not identify the sender of the quoted message!')
		}
	} else {
		// Process phone numbers from text
		if (!text) {
			return reply(`⚠️ Please provide phone numbers or reply to a message!\n\nExamples:\n• ${prefix + command} 254712345678\n• ${prefix + command} 254712345678,254798765432\n• Reply to someone's message with: ${prefix + command}`)
		}
		
		const numbersToRemove = text.split(',')
			.map(v => v.replace(/[^0-9]/g, ''))
			.filter(v => v.length > 4 && v.length < 20)
		
		if (numbersToRemove.length === 0) {
			return reply('❌ Please provide valid phone numbers!')
		}
		
		// Convert phone numbers to JIDs
		const _participants = participants.map(user => user.id)
		
		for (let number of numbersToRemove) {
			// Try different JID formats
			const jidFormats = [
				number + '@s.whatsapp.net',
				number + '@lid',
				number + '@c.us'
			]
			
			// Find which format matches a current participant
			for (let jid of jidFormats) {
				if (_participants.includes(jid)) {
					targetUsers.push(jid)
					console.log(`Found participant to remove: ${number} -> ${jid}`)
					break
				}
			}
		}
	}
	
	if (targetUsers.length === 0) {
		return reply('❌ No valid users found to remove from the group!')
	}
	
	reply('🔄 Processing remove request...')
	
	try {
		// Get current participants and their info
		const currentParticipants = participants
		const botJid = conn.user.jid || conn.user.id
		
		// Filter out users that cannot be removed
		let validTargets = []
		let cannotRemove = []
		
		for (let userJid of targetUsers) {
			// Check if target is the bot itself
			if (userJid === botJid) {
				cannotRemove.push({ jid: userJid, reason: 'Cannot remove bot itself' })
				continue
			}
			
			// Find participant info
			const participantInfo = currentParticipants.find(p => p.id === userJid)
			
			if (!participantInfo) {
				cannotRemove.push({ jid: userJid, reason: 'User not in group' })
				continue
			}
			
			// Check if target is an admin (optional safety check)
			if (participantInfo.admin) {
				const forceRemove = text && (text.toLowerCase().includes('force') || text.toLowerCase().includes('bypass'))
				if (!forceRemove) {
					cannotRemove.push({ jid: userJid, reason: 'User is admin (use "force" to override)' })
					continue
				}
			}
			
			validTargets.push(userJid)
		}
		
		// Report issues
		if (cannotRemove.length > 0) {
			let issueMsg = '⚠️ *Cannot Remove:*\n'
			for (let issue of cannotRemove) {
				const phone = issue.jid.split('@')[0]
				issueMsg += `• ${phone}: ${issue.reason}\n`
			}
			await reply(issueMsg)
		}
		
		if (validTargets.length === 0) {
			return reply('❌ No valid users can be removed!')
		}
		
		// Perform the removal using groupParticipantsUpdate
		console.log('Attempting to remove users:', validTargets)
		const result = await conn.groupParticipantsUpdate(m.chat, validTargets, 'remove')
		
		// Process results
		let successCount = 0
		let failedCount = 0
		let failedUsers = []
		
		// Check the removal results
		for (let jid of validTargets) {
			try {
				// Get updated group metadata to verify removal
				const updatedMetadata = await conn.groupMetadata(m.chat)
				const stillInGroup = updatedMetadata.participants.some(p => p.id === jid)
				
				if (!stillInGroup) {
					successCount++
					console.log(`✅ Successfully removed: ${jid}`)
				} else {
					failedCount++
					failedUsers.push(jid.split('@')[0])
					console.log(`❌ Failed to remove: ${jid}`)
				}
			} catch (error) {
				console.error(`Error checking removal status for ${jid}:`, error)
				failedCount++
				failedUsers.push(jid.split('@')[0])
			}
		}
		
		// Send final status
		let finalMsg = '📊 *Remove Members Results:*\n\n'
		
		if (successCount > 0) {
			finalMsg += `✅ Successfully removed: ${successCount}\n`
		}
		
		if (failedCount > 0) {
			finalMsg += `❌ Failed to remove: ${failedCount}\n`
			if (failedUsers.length > 0) {
				finalMsg += `   Numbers: ${failedUsers.join(', ')}\n`
			}
		}
		
		if (cannotRemove.length > 0) {
			finalMsg += `⚠️ Could not process: ${cannotRemove.length}\n`
		}
		
		finalMsg += `\n📱 Total processed: ${targetUsers.length}`
		
		reply(finalMsg)
		
	} catch (error) {
		console.error('Error in remove command:', error)
		reply(`❌ Failed to remove members: ${error.message}`)
	}
}

handler.help = ['remove', 'kick', '-'].map(v => v + ' <number>')
handler.tags = ['group']
handler.command = ['remove', 'kick']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler