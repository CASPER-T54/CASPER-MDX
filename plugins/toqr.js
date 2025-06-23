import fetch from 'node-fetch'

const handler = async (m, {
  conn,
  text,
  command,
  prefix,
  ftroli,
  fkontak,
  reply
}) => {
  if (!text) {
    return reply(`❗ Usage:\n*${prefix + command} your text here*\n\nExample:\n${prefix + command} https://caspertech.co4.in`)
  }

  const qrUrl = `https://api.nexoracle.com/image-creating/qr-code?apikey=851c4eaee30bb1d2fc&text=${encodeURIComponent(text)}`
  const branding = `\n> © CASPER-X 🤓 | CASPER TECH™ 2025`

  try {
    const res = await fetch(qrUrl)
    if (!res.ok) throw `⚠️ Failed to generate QR code (Status: ${res.status})`

    const buffer = await res.buffer()

    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: branding
    }, { quoted: fkontak })

  } catch (e) {
    console.error(e)
    reply('❌ Error generating QR code. Please try again.')
  }
}

handler.help = ['qrcode <text/url>']
handler.tags = ['tools','images']
handler.command = ['toqr','qr','textqr']

export default handler
