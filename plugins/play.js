import fetch from 'node-fetch'
import { toAudio } from '../lib/converter.js'

const handler = async (m, {
  conn,
  text,
  prefix,
  command,
  fkontak,
  reply
}) => {
  if (!text) return reply(`❗ Usage:\n*${prefix + command} song name*\n\nExample:\n${prefix + command} Alan Walker Faded`)

  try {
    // Step 1: Search video
    const searchRes = await fetch(`https://apis.davidcyriltech.my.id/youtube/search?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson?.status || !searchJson.results?.length) {
      return reply('❌ No video found.')
    }

    const video = searchJson.results[0]
     const caption = `🎵 *${video.title}*\n📆 Published: ${video.published}\n⏱ Duration: ${video.duration}\n👁 Views: ${video.views.toLocaleString()}\n🔗 URL: ${video.url}\n\n> © CASPER-X 🤓 | CASPER TECH™ 2025`

     
    reply(`🎧 *Fetching:* ${caption}\n⏳ Please wait...`)

    // Step 2: Download MP3 from BK9
    const dlRes = await fetch(`https://bk9.fun/download/ytmp3?url=${encodeURIComponent(video.url)}&type=mp3`)
    const dlJson = await dlRes.json()

    if (!dlJson?.status || !dlJson.BK9?.downloadUrl) {
      return reply('❌ Failed to download MP3.')
    }

    const audioBuffer = await fetch(dlJson.BK9.downloadUrl).then(res => res.arrayBuffer())

    // Step 3: Caption details
/*    const caption = `🎵 *${video.title}*\n📆 Published: ${video.published}\n⏱ Duration: ${video.duration}\n👁 Views: ${video.views.toLocaleString()}\n🔗 URL: ${video.url}\n\n© CASPER-X 🤓 | CASPER TECH™ 2025`
*/
    // Step 4: Send Audio Quoted with Caption
    await conn.sendMessage(m.chat, {
      audio: Buffer.from(audioBuffer),
      mimetype: 'audio/mpeg',
      ptt: false,
      caption
    }, { quoted: fkontak })

  } catch (err) {
    console.error(err)
    reply('⚠️ Error occurred while processing your request.')
  }
}

handler.help = ['play']
handler.tags = ['downloader']
handler.command = ['play']

export default handler
