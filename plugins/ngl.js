import fetch from 'node-fetch';

const handler = async (m, { conn, args, prefix, command }) => {
  let [title, ...teks] = args;

  if (!title || teks.length === 0) {
    return m.reply(`⚠️ Please enter a *title* and *message text*.\n\nExample:\n${prefix + command} Anonymous Chat Hello there!`);
  }

  const textParam = teks.join(' ');
  const api = `https://flowfalcon.dpdns.org/imagecreator/ngl?title=${encodeURIComponent(title)}&text=${encodeURIComponent(textParam)}`;

  try {
    const res = await fetch(api);
    if (!res.ok) throw 'Failed to fetch image from API.';

    const buffer = Buffer.from(await res.arrayBuffer());

    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: `🕵️ *NGL Generated!*\n📌 Title: ${title}\n💬 Message: ${textParam}`,
    }, {
      quoted: {
        key: {
          remoteJid: "120363362839073981@g.us", // your group ID
          participant: "0@s.whatsapp.net",
        },
        message: {
          orderMessage: {
            itemCount: 2025,
            status: 1,
            thumbnail: buffer,
            surface: 1,
            message: "CASPER-X | NGL CREATOR",
            orderTitle: "Anonymous Message Generator",
            sellerJid: "0@s.whatsapp.net"
          }
        }
      }
    });

  } catch (e) {
    console.error(e);
    m.reply('❌ An error occurred while generating the image. Please try again later.');
  }
};

handler.command = /^ngl$/i;
handler.help = ['ngl <title> <text>'];
handler.tags = ['maker'];

export default handler;
