import axios from 'axios';

let handler = async (m, { conn, text, ftroli, prefix, command }) => {
  try {
    if (!text) {
      return m.reply(`❗ Please provide a search term!\n\nExample: *${prefix + command} funny cats*`);
    }

    // Notify user about the search
    await m.reply('🔍 Searching for stickers...');

    // Call Tenor API
    const { data } = await axios.get(`https://g.tenor.com/v1/search?q=${encodeURIComponent(text)}&key=LIVDSRZULELA&limit=8`);

    if (!data?.results?.length) {
      return m.reply('❌ No stickers found for that search term!');
    }

    // Limit to 5 results
    const results = data.results.slice(0, 5);

    for (let i = 0; i < results.length; i++) {
      const media = results[i]?.media?.[0]?.mp4?.url;
      if (!media) continue;

      await conn.sendMessage(m.chat, {
        video: { url: media },
        caption: `🎬 *Sticker ${i + 1}*\n🔎 *Search:* ${text}`,
        mimetype: 'video/mp4'
      }, { quoted: ftroli });
    }
  } catch (error) {
    console.error('❌ Sticker Search Error:', error);
    await m.reply('❌ An error occurred while searching for stickers. Please try again later.');
  }
};

// Command metadata
handler.help = ['stickersearch <keyword>', 'ssearch <keyword>', 'stickers <keyword>'];
handler.tags = ['tools'];
handler.command = ["stickersearch", "ssearch", "stickers"];

export default handler;
