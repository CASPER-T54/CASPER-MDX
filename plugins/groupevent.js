/*
📌 Feature Name: Upload to Pastebin
🏷️ Type: Plugin ESM
🔗 Source: https://whatsapp.com/channel/0029VaxvdhJ6buMSjkRBNR2d
✍️ Converted By: ZenzXD
📃 Function: *Uploads text/code to Pastebin*
*/

import fetch from 'node-fetch';

let handler = async (m, { conn, reply, text, prefix, command }) => {
  if (!text) throw `Please enter the text you want to upload.\n\nExample:\n${prefix + command} Hello, my name is Casper  🗿`;

  const apiKey = '4iXqa681ImN0ykqHeUInKGGAvET6A4u6';
  const apiUrl = 'https://pastebin.com/api/api_post.php';
  const params = new URLSearchParams();
  params.append('api_dev_key', apiKey);
  params.append('api_option', 'paste');
  params.append('api_paste_code', text);

  await reply('Please wait while I upload your text...');

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      body: params
    });
    const url = await res.text();

    if (!url.startsWith('http')) throw 'Failed to create pastebin link!';

    // --- Custom Response Setup ---
    const teks = `✅ Paste created successfully:\n${url}`;
    const ucapanWaktu = 'Here is your generated Pastebin link!';
    const thumbUrl = 'https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540771/IMG_20250504_085507_zqduz3.png';
    const fkethmb = await (await fetch(thumbUrl)).buffer();

    const ftroli = {
      key: {
        remoteJid: "120363362839073981@g.us", // Your group ID
        participant: "0@s.whatsapp.net",
      },
      message: {
        orderMessage: {
          itemCount: 999,
          status: 1,
          thumbnail: fkethmb,
          thumbnailUrl: thumbUrl,
          surface: 1,
          message: "CASPER-X Bot",
          orderTitle: "Activated!",
          sellerJid: "0@s.whatsapp.net",
        },
      },
    };

    const HIRAGIIJob = {
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: `𝙲𝙰𝚂𝙿𝙴𝚁-𝚃𝙴𝙲𝙷 `,
          newsletterJid: `120363375953549654@newsletter`,
        },
        externalAdReply: {
          showAdAttribution: true,
          title: `CASPER-X`,
          body: ucapanWaktu,
          thumbnailUrl: thumbUrl,
          thumbnail: fkethmb,
          sourceUrl: "https://whatsapp.com/channel/0029VazABxMJZg40sEZBX242",
        },
      },
      text: teks,
    };

    return conn.sendMessage(m.chat, HIRAGIIJob, {
      quoted: ftroli,
     // ephemeralExpiration: 999,
    });

  } catch (e) {
    console.error(e);
    m.reply('An error occurred while creating the paste. Please try again later.');
  }
};

handler.command = ["bin"];
handler.help = ['uppastebin <text>'];
handler.tags = ['tools'];

export default handler;
