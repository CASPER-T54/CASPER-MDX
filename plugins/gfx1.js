import fetch from 'node-fetch'

const handler = async (m, {
  conn,
  text,
  command,
  prefix,
  fkontak,
  reply
}) => {
  if (!text) {
    return reply(`❗ Usage:\n*${prefix + command} your text here*\n\nExample:\n${prefix + command} Casper`)
  }

  const gfxUrl = `https://api.nexoracle.com/image-creating/gfx12?apikey=851c4eaee30bb1d2fc&text=${encodeURIComponent(text)}`
  const branding = `\n> © CASPER-X 🤓 | CASPER TECH™ 2025`

  try {
    const res = await fetch(gfxUrl)
    if (!res.ok) throw `⚠️ Failed to generate GFX (Status: ${res.status})`

    const buffer = await res.buffer()

    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: branding
    }, { quoted: fkontak })

  } catch (e) {
    console.error(e)
    reply('❌ Error generating GFX image. Please try again.')
  }
}

handler.help = ['gfx1 <text>']
handler.tags = ['image']
handler.command = ["gfx12"]

export default handler
