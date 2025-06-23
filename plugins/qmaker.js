import fetch from 'node-fetch'

const API_KEY = '851c4eaee30bb1d2fc'
const BRANDING = '\n> © CASPER-X 🤓 | CASPER TECH™ 2025'

const handler = async (m, {
  conn,
  text,
  prefix,
  command,
  fkontak,
  reply
}) => {
  if (!text || !text.includes('|')) {
    return reply(`❗ Usage:\n*${prefix + command} quote text | author*\n\nExample:\n${prefix + command} I'm hiding what I'm feeling  | - Casper tech `)
  }

  const [quoteText, authorText] = text.split('|').map(s => s.trim())

  const url = `https://api.nexoracle.com/image-creating/quotes-maker?apikey=${API_KEY}&text1=${encodeURIComponent(quoteText)}&text2=${encodeURIComponent(authorText)}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw `⚠️ Failed to generate quote image (Status: ${res.status})`

    const buffer = await res.buffer()

    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: BRANDING
    }, { quoted: fkontak })

  } catch (e) {
    console.error(e)
    reply(`❌ Error generating quote. Try again later.`)
  }
}

handler.help = ['quote <text> | <author>']
handler.tags = ['image']
handler.command = ['qmaker', 'quotemaker']

export default handler
