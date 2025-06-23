import fetch from 'node-fetch'
import { Sticker } from 'wa-sticker-formatter'

const handler = async (m, {
  conn,
  text,
  command,
  prefix,
  ftroli,
  fkontak,
  reply
}) => {
  if (!text) return reply(`⚠️ Please provide text\nExample: *${prefix + command} Casper tech*`)

  try {
    const apiUrl = `https://api.nexoracle.com/image-creating/attp?apikey=851c4eaee30bb1d2fc&text=${encodeURIComponent(text)}`
    const res = await fetch(apiUrl)
    
    if (!res.ok) throw `❌ Failed to download image. Status: ${res.status}`

    const buffer = await res.buffer()

    const sticker = new Sticker(buffer, {
      type: 'full',
      pack: 'CASPER-X',
      author: 'TRABY',
      categories: ['🔥', '💥'],
      id: 'casper-tech-animated',
      quality: 80,
      animated: true
    })

    const stickerBuffer = await sticker.toBuffer()

    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: fkontak })
  } catch (e) {
    console.error(e)
    reply('❌ Failed to create sticker. Try again later.')
  }
}

handler.help = ['attp <text>']
handler.tags = ['sticker']
handler.command = ['brat2']

export default handler
