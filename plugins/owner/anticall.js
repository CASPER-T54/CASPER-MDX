import fs from 'fs'

const anticallFile = './lib/anticall.json'

// Create file if it doesn't exist
if (!fs.existsSync(anticallFile)) {
  fs.writeFileSync(anticallFile, JSON.stringify({ enabled: false }, null, 2))
}

let callWarning = {}
let listenerRegistered = false

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(anticallFile))
  } catch {
    return { enabled: false }
  }
}

function saveData(data) {
  fs.writeFileSync(anticallFile, JSON.stringify(data, null, 2))
}

// Sleep function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Global call listener - register immediately when module loads
const registerCallListener = (conn) => {
  if (listenerRegistered || !conn) return
  listenerRegistered = true

  console.log('[ANTI-CALL] Registering call event listener...')

  // Listen for call events using the working pattern
  conn.ev.on('call', async (celled) => {
    console.log('[ANTI-CALL] Call event detected:', celled)
    
    const data = loadData()
    if (!data.enabled) {
      console.log('[ANTI-CALL] Anti-call is disabled, ignoring calls')
      return
    }

    // Get bot number for comparison
    let botNumber = await conn.decodeJid(conn.user.id)
    
    for (let kopel of celled) {
      console.log('[ANTI-CALL] Processing call:', kopel)
      
      // Only process individual calls (not group calls) with "offer" status
      if (kopel.isGroup == false && kopel.status == "offer") {
        const callerId = kopel.from
        
        console.log(`[ANTI-CALL] Incoming ${kopel.isVideo ? 'video' : 'audio'} call from ${callerId}`)

        try {
          // First warning: save flag and send message
          if (!callWarning[callerId]) {
            console.log(`[ANTI-CALL] First call from ${callerId}, sending warning`)
            callWarning[callerId] = true
            
            await conn.sendTextWithMentions(callerId, 
              `*🚫 [CALL WARNING]*\n\n` +
              `⚠️ *Do not call the bot!*\n\n` +
              `My owner cannot receive ${kopel.isVideo ? 'video' : 'audio'} calls at the moment.\n\n` +
              `If you call again, you will be automatically blocked.\n\n` +
              `Sorry @${callerId.split('@')[0]}, this is an automated warning.\n\n` +
              `_If you called by mistake, please contact my owner._`
            )
            
            // Clear warning after 10 minutes
            setTimeout(() => {
              delete callWarning[callerId]
              console.log(`[ANTI-CALL] Warning cleared for ${callerId}`)
            }, 10 * 60 * 1000)
            
          } else {
            console.log(`[ANTI-CALL] Second call from ${callerId}, blocking user`)
            
            // Second call: send message, then block
            await conn.sendTextWithMentions(callerId,
              `*🔴 [ANTI-CALL ACTIVATED]*\n\n` +
              `❌ *You were already warned!*\n\n` +
              `My owner cannot receive ${kopel.isVideo ? 'video' : 'audio'} calls at the moment.\n\n` +
              `Sorry @${callerId.split('@')[0]}, you are now being blocked for causing disturbance.\n\n` +
              `If you called by mistake please look for means to contact my owner to be unblocked!\n\n` +
              `_Goodbye!_`
            )

            // Wait a bit before blocking
            await sleep(8000)

            // Block sender
            await conn.updateBlockStatus(callerId, 'block')
            console.log(`[ANTI-CALL] Blocked user: ${callerId}`)
            
            delete callWarning[callerId]
          }
        } catch (err) {
          console.error('[ANTI-CALL] Error handling call:', err)
        }
      }
    }
  })

  // Also listen for connection updates
  conn.ev.on('connection.update', (update) => {
    if (update.connection === 'open') {
      console.log('[ANTI-CALL] Connection opened, call listener ready')
    }
  })
}

/**
 * This function runs for every message to ensure listener is registered
 */
export async function before(m, { conn }) {
  // Register listener if not already done
  registerCallListener(conn)
}

// Main command handler
export default async function handler(m, { args, reply, isOwner, isCreator, sender, botNumber }) {
  // Only allow owner/creator or bot number
  if (!isCreator && sender !== botNumber) {
    return reply('🔒 This command can only be used by the bot owner.')
  }

  const data = loadData()
  const cmd = (args[0] || '').toLowerCase()

  if (cmd === 'on') {
    if (data.enabled) return reply('⚠️ *Anti Call is already active.*')
    
    data.enabled = true
    saveData(data)
    return reply(
      '✅ *Anti Call successfully activated.*\n\n' +
      '🔹 Users will get a warning on first call\n' +
      '🔹 Second call will result in auto-block\n' +
      '🔹 All calls will be automatically rejected'
    )
  }

  if (cmd === 'off') {
    if (!data.enabled) return reply('⚠️ *Anti Call is already inactive.*')
    
    data.enabled = false
    saveData(data)
    // Clear all warnings when disabled
    callWarning = {}
    return reply('❌ *Anti Call successfully disabled.*')
  }

  // Show current status and usage
  const currentStatus = data.enabled ? '🟢 *Enabled*' : '🔴 *Disabled*'
  const warningCount = Object.keys(callWarning).length

  return reply(
    `*📞 ANTI-CALL SETTINGS*\n\n` +
    `*Current Status:* ${currentStatus}\n` +
    `*Active Warnings:* ${warningCount}\n\n` +
    `*Usage:*\n` +
    `• \`anticall on\` - Enable anti-call protection\n` +
    `• \`anticall off\` - Disable anti-call protection\n\n` +
    `*How it works:*\n` +
    `• First call: Warning message sent\n` +
    `• Second call: Auto-block after 8 seconds\n` +
    `• Warnings expire after 10 minutes`
  )
}

// Plugin metadata
handler.command = ['anticall']
handler.category = 'owner'
handler.description = 'Protect bot from unwanted calls'
handler.usage = 'anticall [on/off]'
handler.owner = true
handler.metadata = {
  owner: true
}