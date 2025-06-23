/*
📌 Nama Fitur: Image Upscaler
🏷️ Type : Plugin Esm
🔗 Sumber : https://whatsapp.com/channel/0029Vaim5GzISTkTPWB4d51d
✍️ Convert By ZenzXD
*/

import fetch from 'node-fetch'
import FormData from 'form-data'

let handler = async (m, {
  conn,
  args,
  text,
  command,
  prefix,
  quoted: quotedMessage,
  mime,
  isGroup,
  isOwner,
  sender,
  pushname,
  participants,
  groupMetadata,
  groupName,
  isAdmins,
  isBotAdmins,
  isCreator,
  botNumber,
  store,
  fkontak,
  ftroli,
  qevent,
  reply,
  greetingMessage,
}) => {
  const react = async (emoji) => {
    try {
      await conn.sendMessage(m.chat, {
        react: {
          text: emoji,
          key: m.key
        }
      })
    } catch (e) {
    }
  }

  await react('⏳')

  try {
    let q = m.quoted || m
    let mime = (q.msg || q).mimetype || q.mimetype || q.mediaType || ''
    if (!mime) throw '📷 Please send or reply to an image first.'
    if (!/image\/(jpe?g|png)/.test(mime)) throw `Format *${mime}* is not supported.`

    let img = await q.download?.()
    if (!img) throw 'Failed to download image.'

    const imageUrl = await uploadToCatbox(img)

    const api = `https://zenz.biz.id/tools/remini?url=${encodeURIComponent(imageUrl)}`
    const res = await fetch(api)
    if (!res.ok) throw 'API error occurred'

    const json = await res.json()
    if (!json.status || !json.result?.result_url) throw 'Invalid API response.'

    const buffer = await fetch(json.result.result_url).then(v => v.buffer())

    // Using ftroli for the response message
    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: '*Done! ✨*\n\n> *© CASPER-X 🤓 | CASPER TECH™ 2025*',
    }, { quoted: fkontak })

    await react('✅')
  } catch (e) {
    await react('❌')
    // Using reply handler for error messages
    reply(typeof e === 'string' ? e : 'An error occurred. Please try again later.')
  }
}

handler.help = ['hd', 'remini']
handler.tags = ['tools','images']
handler.command = /^(hd|remini)$/i

export default handler

async function uploadToCatbox(buffer) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', buffer, 'image.jpg')

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form
  })

  const url = await res.text()
  if (!url.startsWith('https://')) throw 'Error occurred while uploading to Catbox'
  return url.trim()
}