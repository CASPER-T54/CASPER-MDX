import fs from 'fs'

const dbFile = './lib/antibot.json'
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '{}', 'utf-8')

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(dbFile))
  } catch {
    return {}
  }
}

function saveData(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2))
}

function isBotMessage(msg) {
  return (
    msg?.buttonsMessage ||
    msg?.templateMessage ||
    msg?.listMessage ||
    msg?.viewOnceMessage?.message?.buttonsMessage ||
    msg?.viewOnceMessage?.message?.templateMessage
  )
}

function isSuspiciousId(id = '') {
  const len = id.length
  return (
    (id.startsWith('B1EY') && len === 20) ||
    (id.startsWith('BAE5') && len === 16) ||
    (id.startsWith('3EB0') && (len === 22 || len === 40))
  )
}

// Helper to safely get participant name or fallback
function getNameOrId(participants, id) {
  const p = participants.find((x) => x.id === id)
  if (!p) return '@' + id.split('@')[0]
  return p?.name || '@' + id.split('@')[0]
}

// Before handler for message monitoring
export async function before(m, { conn }) {
  if (!m.isGroup || m.fromMe || m.isBaileys) return

  const db = loadData()
  const setting = db[m.chat] || { enabled: false, mode: 'kick' }
  if (!setting.enabled) return

  // Fetch metadata safely
  const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
  if (!groupMetadata) return
  const participants = groupMetadata.participants || []

  // Get bot number and admins list
  const botNumber = conn.user?.id?.split(':')[0] + '@s.whatsapp.net'
  const groupAdmins = participants
    .filter((p) => p.admin === 'admin' || p.admin === 'superadmin')
    .map((p) => p.id)

  const isBotAdmins = groupAdmins.includes(botNumber)
  if (!isBotAdmins) return // antibot only works if bot is admin

  const isAdmins = groupAdmins.includes(m.sender)
  if (isAdmins) return // ignore admin messages

  const id = m.key?.id || ''
  const msg = m.message

  // Check if message is a bot-like message
  const botMsg = isBotMessage(msg)
  const suspiciousId = isSuspiciousId(id)

  if (botMsg || suspiciousId) {
    const senderName = getNameOrId(participants, m.sender)
    const reason = suspiciousId ? 'Suspicious sender ID' : 'Bot-like message detected'

    // Send warning message with mention
    await conn.sendMessage(m.chat, {
      text: `*[ANTI BOT]*\nUser: ${senderName}\nReason: ${reason}\nAction: ${setting.mode.toUpperCase()}`,
      mentions: [m.sender],
    })

    if (setting.mode === 'kick') {
      // Kick user
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {
        conn.sendMessage(m.chat, {
          text: `❌ Failed to kick user ${senderName}. Make sure I have admin rights.`,
        })
      })
    } else if (setting.mode === 'delete') {
      // Delete the message
      await conn.sendMessage(m.chat, { delete: m.key }).catch(() => {})
    }
  }
}

// Main command handler - Fixed to match your handler structure
export default async function handler(m, { text, isGroup, isAdmins, reply }) {
  if (!isGroup) return reply('🚫 This command is only for groups.')
  if (!isAdmins) return reply('🔒 You must be a group admin to use this command.')

  const db = loadData()
  db[m.chat] = db[m.chat] || { enabled: false, mode: 'kick' }

  const input = (text || '').toLowerCase()

  if (input === 'off') {
    db[m.chat].enabled = false
    saveData(db)
    return reply('✅ *Antibot disabled.*')
  }

  if (input === 'on kick') {
    db[m.chat].enabled = true
    db[m.chat].mode = 'kick'
    saveData(db)
    return reply('✅ *Antibot enabled.* Action: Kick suspicious users or bots.')
  }

  if (input === 'on delete') {
    db[m.chat].enabled = true
    db[m.chat].mode = 'delete'
    saveData(db)
    return reply('✅ *Antibot enabled.* Action: Delete suspicious bot messages.')
  }

  // Show current status and usage
  const currentStatus = db[m.chat].enabled 
    ? `🟢 *Enabled* (Mode: ${db[m.chat].mode.toUpperCase()})`
    : `🔴 *Disabled*`

  return reply(
    `*🤖 ANTIBOT SETTINGS*\n\n` +
    `*Current Status:* ${currentStatus}\n\n` +
    `*Usage:*\n` +
    `• \`antibot on kick\` - Enable and kick detected bots\n` +
    `• \`antibot on delete\` - Enable and delete bot messages\n` +
    `• \`antibot off\` - Disable antibot\n\n` +
    `*Features:*\n` +
    `• Detects suspicious message IDs\n` +
    `• Identifies bot-like messages\n` +
    `• Protects against spam bots`
  )
}

// Plugin metadata
handler.command = ['antibot']
handler.category = 'group'
handler.description = 'Protect group from bot spam'
handler.usage = 'antibot [on kick/on delete/off]'
handler.group = true
handler.admin = true