import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const handler = async (m, {
  conn,
  text,
  command,
  prefix,
  ftroli,
  fkontak,
  reply
}) => {
  if (!text || !text.includes('|')) {
    return reply(`❗ Usage:\n*${prefix + command} username|comment text*\n\nExample:\n${prefix + command} Casper|Hi Guys, Subscribe to my Channel`)
  }

  const [username, commentText] = text.split('|').map(s => s.trim())
  const imageUrl = `https://api.nexoracle.com/image-creating/yt-comment?apikey=851c4eaee30bb1d2fc&username=${encodeURIComponent(username)}&text=${encodeURIComponent(commentText)}&img=https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540730/IMG_20250504_085705_lnhjkn.png`

  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw `⚠️ Failed to fetch image (Status: ${res.status})`
    
    const buffer = await res.buffer()

    const branding = `\n> © CASPER-X 🤓 | CASPER TECH™ 2025`
    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: branding
    }, { quoted: fkontak })

  } catch (e) {
    console.error(e)
    reply('❌ Error generating image. Try again later.')
  }
}

handler.help = ['ytcomment <username|comment>']
handler.tags = ['image']
handler.command = ['comment','ytcomment','ytimg']

export default handler
