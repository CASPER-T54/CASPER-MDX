import fetch from 'node-fetch'

const API_KEY = '851c4eaee30bb1d2fc'
const BRANDING = '\n> © CASPER-X 🤓 | CASPER TECH™ 2025'

const handler = async (m, {
  conn,
  text,
  command,
  prefix,
  fkontak,
  reply
}) => {
  if (!text) return reply(`❗ Usage:\n*${prefix + command} text1 | text2 [| text3]*`)

  const gfxNum = parseInt(command.replace('gfx', ''))
  let url = ''
  const parts = text.split('|').map(part => part.trim())

  // Build API URL based on gfx number
  if ([1, 2, 3, 4, 7, 8].includes(gfxNum)) {
    if (parts.length < 2) return reply(`❗ *GFX${gfxNum}* requires 2 texts.\nUsage: *${prefix + command} text1 | text2*`)
    url = `https://api.nexoracle.com/image-creating/gfx?apikey=${API_KEY}&text1=${encodeURIComponent(parts[0])}&text2=${encodeURIComponent(parts[1])}`

  } else if ([5, 6].includes(gfxNum)) {
    if (parts.length < 3) return reply(`❗ *GFX${gfxNum}* requires 3 texts.\nUsage: *${prefix + command} text1 | text2 | text3*`)
    url = `https://api.nexoracle.com/image-creating/gfx6?apikey=${API_KEY}&text1=${encodeURIComponent(parts[0])}&text2=${encodeURIComponent(parts[1])}&text3=${encodeURIComponent(parts[2])}`

  } else if ([9, 10, 11, 12].includes(gfxNum)) {
    url = `https://api.nexoracle.com/image-creating/gfx${gfxNum}?apikey=${API_KEY}&text=${encodeURIComponent(text)}`

  } else {
    return reply('❌ Invalid GFX number.')
  }

  try {
    const res = await fetch(url)
    if (!res.ok) throw `⚠️ Failed to generate GFX${gfxNum} (Status: ${res.status})`

    const buffer = await res.buffer()

    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: BRANDING
    }, { quoted: fkontak })

  } catch (e) {
    console.error(e)
    reply(`❌ Error generating GFX${gfxNum}. Try again later.`)
  }
}

handler.help = Array.from({ length: 12 }, (_, i) => `gfx${i + 1} <text(s)>`)
handler.tags = ['image']
handler.command = [
  'gfx1', 'gfx2', 'gfx3', 'gfx4', 'gfx5', 'gfx6',
  'gfx7', 'gfx8', 'gfx9', 'gfx10', 'gfx11'
]

export default handler
