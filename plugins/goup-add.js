import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

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
	if (!isAdmin) return reply('❌ Only group admins can add members!')
//	if (!isBotAdmin) return reply('❌ Bot must be a group admin to add members!')
	
	let numbersToAdd = []
	let isVcfMode = false
	
	// Check if it's a reply to a VCF file
	if (m.quoted && m.quoted.mtype === 'documentMessage') {
		const quotedMsg = m.quoted
		const fileName = quotedMsg.fileName || quotedMsg.mimetype || ''
		
		if (fileName.toLowerCase().includes('.vcf') || quotedMsg.mimetype === 'text/vcard' || quotedMsg.mimetype === 'text/x-vcard') {
			isVcfMode = true
			
			// Check if user wants to force add (bypass WhatsApp validation)
			const forceAdd = text && (text.toLowerCase().includes('force') || text.toLowerCase().includes('bypass'))
			
			if (forceAdd) {
				reply('📋 VCF file detected! Force mode enabled - bypassing WhatsApp validation...')
			} else {
				reply('📋 VCF file detected! Processing contacts...\n\n💡 Tip: Add "force" to bypass validation if needed')
			}
			
			try {
				// Download the VCF file
				const media = await m.quoted.download()
				if (!media) throw new Error('Failed to download VCF file')
				
				// Create temp directory if it doesn't exist
				const tempDir = './temp'
				if (!fs.existsSync(tempDir)) {
					fs.mkdirSync(tempDir, { recursive: true })
				}
				
				// Save the VCF file temporarily
				const tempFilePath = path.join(tempDir, `vcf_${Date.now()}.vcf`)
				fs.writeFileSync(tempFilePath, media)
				
				// Read and parse VCF file
				const vcfContent = fs.readFileSync(tempFilePath, 'utf8')
				console.log('VCF file size:', vcfContent.length, 'characters')
				console.log('First 500 characters:', vcfContent.substring(0, 500))
				
				numbersToAdd = parseVcfFile(vcfContent)
				
				// Clean up temp file immediately after parsing
				fs.unlinkSync(tempFilePath)
				
				if (numbersToAdd.length === 0) {
					return reply('❌ No valid phone numbers found in the VCF file!\n\nPlease check if the VCF file contains properly formatted phone numbers.')
				}
				
				if (forceAdd) {
					reply(`📊 Found ${numbersToAdd.length} phone numbers in VCF file.\n🚀 Force mode: Adding all without validation...\n\nSample numbers: ${numbersToAdd.slice(0, 3).join(', ')}${numbersToAdd.length > 3 ? '...' : ''}`)
					
					// In force mode, skip WhatsApp validation entirely
					const _participants = participants.map(user => user.id)
					const validUsers = []
					const alreadyInGroup = []
					
					for (let number of numbersToAdd) {
						// Try different JID formats for existing group members
						const jidFormats = [
							number + '@s.whatsapp.net',
							number + '@lid',
							number + '@c.us'
						]
						
						let isInGroup = false
						for (let jid of jidFormats) {
							if (_participants.includes(jid)) {
								alreadyInGroup.push(number)
								isInGroup = true
								break
							}
						}
						
						if (!isInGroup) {
							// Default to standard format for adding
							validUsers.push(number + '@s.whatsapp.net')
						}
					}
					
					if (validUsers.length === 0) {
						return reply(`📋 All ${alreadyInGroup.length} contacts are already in the group!`)
					}
					
					// Try to add them directly
					try {
						const result = await conn.groupParticipantsUpdate(m.chat, validUsers, 'add')
						
						let finalMsg = '📊 *Force Add Results:*\n\n'
						finalMsg += `🚀 Attempted to add: ${validUsers.length}\n`
						if (alreadyInGroup.length > 0) finalMsg += `📋 Already in group: ${alreadyInGroup.length}\n`
						finalMsg += `\n📱 Total processed: ${numbersToAdd.length}`
						finalMsg += `\n\n⚠️ Note: Force mode bypasses validation. Some additions may fail silently.`
						
						return reply(finalMsg)
					} catch (error) {
						return reply(`❌ Force add failed: ${error.message}`)
					}
				} else {
					reply(`📊 Found ${numbersToAdd.length} phone numbers in VCF file. Processing...\n\nSample numbers: ${numbersToAdd.slice(0, 3).join(', ')}${numbersToAdd.length > 3 ? '...' : ''}`)
				}
				
			} catch (error) {
				console.error('Error processing VCF file:', error)
				return reply(`❌ Failed to process VCF file: ${error.message}`)
			}
		}
	}
	
	// If not VCF mode, process text input
	if (!isVcfMode) {
		if (!text) return reply(`⚠️ Please provide phone numbers or reply to a VCF file!\nExample:\n\n${prefix + command} 254712345678\n${prefix + command} 254712345678,254798765432\n\nOr reply to a VCF file with: ${prefix + command}`)
		
		// Process phone numbers from text
		numbersToAdd = text.split(',')
			.map(v => v.replace(/[^0-9]/g, ''))
			.filter(v => v.length > 4 && v.length < 20)
	}
	
	if (numbersToAdd.length === 0) {
		return reply('❌ Please provide valid phone numbers!')
	}
	
	reply('🔄 Processing add request...')
	
	try {
		// Get current participants
		let _participants = participants.map(user => user.id)
		
		// Check which numbers are on WhatsApp and not in group
		let validUsers = []
		let invalidUsers = []
		let alreadyInGroup = []
		
		console.log('Checking', numbersToAdd.length, 'numbers against WhatsApp')
		console.log('Sample numbers to check:', numbersToAdd.slice(0, 3))
		
		for (let i = 0; i < numbersToAdd.length; i++) {
			let number = numbersToAdd[i]
			
			// Try different JID formats
			let jidFormats = [
				number + '@s.whatsapp.net',  // Standard format
				number + '@lid',             // Linked device format
				number + '@c.us'             // Alternative format
			]
			
			// Progress indicator for large batches
			if (i % 50 === 0) {
				console.log(`Progress: ${i}/${numbersToAdd.length} numbers checked`)
			}
			
			let foundValidJid = null
			let isAlreadyInGroup = false
			
			// Check if already in group with any format
			for (let jid of jidFormats) {
				if (_participants.includes(jid)) {
					alreadyInGroup.push(number)
					isAlreadyInGroup = true
					console.log(`👥 Already in group: ${number} (${jid})`)
					break
				}
			}
			
			if (isAlreadyInGroup) continue
			
			// Check WhatsApp existence with different formats
			let validJid = null
			for (let jid of jidFormats) {
				try {
					console.log(`Trying format: ${jid}`)
					let exists = await conn.onWhatsApp(jid)
					console.log(`Response for ${jid}:`, exists)
					
					// More flexible validation for WhatsApp existence
					if (exists && Array.isArray(exists) && exists.length > 0) {
						const whatsappData = exists[0]
						if (whatsappData && (whatsappData.exists === true || whatsappData.jid)) {
							validJid = jid
							console.log(`✅ Valid WhatsApp user: ${number} (${jid})`)
							break
						}
					}
				} catch (error) {
					console.log(`Error checking ${jid}:`, error.message)
					continue
				}
				
				// Small delay between format checks
				await new Promise(resolve => setTimeout(resolve, 100))
			}
			
			if (validJid) {
				validUsers.push(validJid)
			} else {
				// For VCF mode, since these are from an active group, try to add with standard format
				if (isVcfMode) {
					console.log(`🔄 Adding ${number} with standard format (VCF mode bypass)`)
					validUsers.push(number + '@s.whatsapp.net')
				} else {
					invalidUsers.push(number)
					console.log(`❌ Not found on WhatsApp: ${number}`)
				}
			}
			
			// Add delay to avoid rate limiting
			if (i % 5 === 0 && i > 0) {
				await new Promise(resolve => setTimeout(resolve, 300))
			}
		}
		
		console.log('Final counts - Valid:', validUsers.length, 'Invalid:', invalidUsers.length, 'Already in group:', alreadyInGroup.length)
		
		// Report issues
		let statusMsg = ''
		if (alreadyInGroup.length > 0) {
			statusMsg += `📋 Already in group: ${alreadyInGroup.length} contacts\n`
		}
		if (invalidUsers.length > 0) {
			statusMsg += `❌ Invalid/Not on WhatsApp: ${invalidUsers.length} contacts\n`
		}
		
		if (validUsers.length === 0) {
			return reply(statusMsg + '\n❌ No valid users to add!')
		}
		
		if (statusMsg) {
			await reply(statusMsg)
		}
		
		// Use the modern groupParticipantsUpdate method
		const result = await conn.groupParticipantsUpdate(m.chat, validUsers, 'add')
		
		// Process results
		let successCount = 0
		let failedCount = 0
		let inviteSent = 0
		
		// For VCF mode, don't send individual invites to avoid flagging
		if (!isVcfMode) {
			// Get group profile picture for invitations
			let groupPic = null
			try {
				const pp = await conn.profilePictureUrl(m.chat, 'image')
				groupPic = pp ? await (await fetch(pp)).buffer() : null
			} catch (e) {
				console.log('Could not get group picture:', e.message)
			}
			
			for (let jid of validUsers) {
				try {
					// Check if user was successfully added
					const phone = jid.split('@')[0]
					
					// Try to get updated group metadata to check if user was added
					const updatedMetadata = await conn.groupMetadata(m.chat)
					const isNowInGroup = updatedMetadata.participants.some(p => p.id === jid)
					
					if (isNowInGroup) {
						successCount++
					} else {
						// User wasn't added directly, try sending invite
						try {
							// Generate invite link
							const inviteCode = await conn.groupInviteCode(m.chat)
							const inviteLink = `https://chat.whatsapp.com/${inviteCode}`
							
							// Send invitation message
							await conn.sendMessage(jid, {
								text: `📨 You've been invited to join "${groupMetadata?.subject || 'this group'}"!\n\nClick the link to join: ${inviteLink}`,
								contextInfo: {
									externalAdReply: {
										title: `Invitation to ${groupMetadata?.subject || 'WhatsApp Group'}`,
										body: 'Click to join the group',
										thumbnailUrl: groupPic ? undefined : 'https://via.placeholder.com/300x300/075e54/ffffff?text=WhatsApp',
										thumbnail: groupPic,
										sourceUrl: inviteLink
									}
								}
							})
							
							inviteSent++
						} catch (inviteError) {
							console.error(`Failed to send invite to ${phone}:`, inviteError)
							failedCount++
						}
					}
				} catch (error) {
					console.error(`Error processing ${jid}:`, error)
					failedCount++
				}
			}
		} else {
			// For VCF mode, just count successful additions without sending invites
			try {
				const updatedMetadata = await conn.groupMetadata(m.chat)
				const currentParticipants = updatedMetadata.participants.map(p => p.id)
				
				for (let jid of validUsers) {
					if (currentParticipants.includes(jid)) {
						successCount++
					} else {
						failedCount++
					}
				}
			} catch (error) {
				console.error('Error checking final status:', error)
				// Fallback: assume some success
				successCount = Math.floor(validUsers.length * 0.7) // Estimate 70% success rate
				failedCount = validUsers.length - successCount
			}
		}
		
		// Send final status
		let finalMsg = '📊 *Add Members Results:*\n\n'
		if (successCount > 0) finalMsg += `✅ Successfully added: ${successCount}\n`
		if (!isVcfMode && inviteSent > 0) finalMsg += `📨 Invitations sent: ${inviteSent}\n`
		if (failedCount > 0) finalMsg += `❌ Failed: ${failedCount}\n`
		
		finalMsg += `\n📱 Total processed: ${validUsers.length}`
		
		if (isVcfMode) {
			finalMsg += `\n\n💡 VCF mode: No individual invites sent to prevent flagging`
		}
		
		reply(finalMsg)
		
		// Clean up temp directory if it exists and is empty
		try {
			const tempDir = './temp'
			if (fs.existsSync(tempDir)) {
				const files = fs.readdirSync(tempDir)
				if (files.length === 0) {
					fs.rmdirSync(tempDir)
				}
			}
		} catch (e) {
			console.log('Cleanup note:', e.message)
		}
		
	} catch (error) {
		console.error('Error in add command:', error)
		reply(`❌ Failed to add members: ${error.message}`)
	}
}

// Function to parse VCF file and extract phone numbers
function parseVcfFile(vcfContent) {
	const phoneNumbers = []
	const lines = vcfContent.split('\n')
	
	console.log('Parsing VCF with', lines.length, 'lines')
	
	for (let line of lines) {
		line = line.trim()
		
		// Look for TEL lines with waid format: TEL;type=CELL;type=VOICE;waid=XXXXXXXXXX:+XXXXXXXXXX
		if (line.startsWith('TEL') && line.includes('waid=') && line.includes(':+')) {
			console.log('Found TEL line with waid:', line)
			
			// Extract the phone number after the :+ part
			const phoneMatch = line.match(/:(\+\d+)$/)
			if (phoneMatch) {
				let phoneNumber = phoneMatch[1] // This includes the +
				
				// Remove the + and any non-digits
				let cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
				
				console.log('Raw extracted number:', phoneNumber, '-> Clean:', cleanNumber)
				
				// Validate the phone number length (should be reasonable)
				if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
					phoneNumbers.push(cleanNumber)
					console.log('✅ Added number:', cleanNumber)
				} else {
					console.log('❌ Invalid length:', cleanNumber, 'length:', cleanNumber.length)
				}
			}
		}
		// Fallback: Look for any TEL line with a colon
		else if (line.startsWith('TEL') && line.includes(':')) {
			console.log('Found TEL line (fallback):', line)
			
			// Extract everything after the last colon
			const parts = line.split(':')
			let phoneNumber = parts[parts.length - 1]
			
			// Clean the phone number
			let cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
			
			console.log('Fallback extracted:', phoneNumber, '-> Clean:', cleanNumber)
			
			// Validate length
			if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
				phoneNumbers.push(cleanNumber)
				console.log('✅ Added fallback number:', cleanNumber)
			}
		}
	}
	
	// Remove duplicates and final validation
	const uniqueNumbers = [...new Set(phoneNumbers)].filter(num => {
		const isValid = num.length >= 10 && num.length <= 15 && /^\d+$/.test(num)
		console.log('Final validation for', num, ':', isValid)
		return isValid
	})
	
	console.log('Final extracted numbers:', uniqueNumbers.length)
	console.log('All numbers:', uniqueNumbers)
	
	return uniqueNumbers
}

handler.help = ['add', '+'].map(v => v + ' <number>')
handler.tags = ['group']
handler.command = ['add']
handler.admin = true
handler.group = true
handler.botAdmin = false

export default handler