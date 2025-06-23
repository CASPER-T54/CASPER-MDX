/*
📌 Feature Name: Download Mediafire (BK9 API)
🏷️ Type: Plugin ESM
🔗 Source: https://whatsapp.com/channel/0029VaxvdhJ6buMSjkRBNR2d
✍️ Converted By: ZenzXD
📧 Powered by: BK9 API
*/

import fetch from 'node-fetch';
import { basename } from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const handler = async (m, { conn, args, prefix, command }) => {
  if (!args[0]) return m.reply(`Please enter a MediaFire URL.\n\nExample:\n${prefix + command} https://www.mediafire.com/file/xxxxx`);

  try {
    const apiUrl = `https://bk9.fun/download/mediafire?url=${encodeURIComponent(args[0])}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw 'Failed to fetch from BK9 API.';

    const data = await res.json();
    if (!data.status || !data.BK9) throw 'Could not parse BK9 response.';

    const {
      name,
      size,
      uploaded,
      filetype,
      mime,
      link
    } = data.BK9;

    const caption = `
━━━━〔 *CASPER-X MEDIAFIRE DOWNLOADER* 〕━━━━
📁 *File Name:* ${name}
📦 *Size:* ${size}
🗂 *Type:* ${filetype}
📄 *MIME:* ${mime}
🕓 *Uploaded:* ${uploaded}
     *CASPER TECH KENYA*
`.trim();

    const ucapanWaktu = 'Your requested MediaFire file is ready!';
    const thumbUrl = 'https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540771/IMG_20250504_085507_zqduz3.png';
    const fkethmb = await (await fetch(thumbUrl)).buffer();

    const ftroli = {
      key: {
        remoteJid: "120363362839073981@g.us",
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
          title: `CASPER-X MEDIAFIRE DOWNLOADER `,
          body: ucapanWaktu,
          thumbnailUrl: thumbUrl,
          thumbnail: fkethmb,
          sourceUrl: "https://whatsapp.com/channel/0029VazABxMJZg40sEZBX242",
        },
      },
      text: caption,
    };

    await conn.sendMessage(m.chat, HIRAGIIJob, {
      quoted: ftroli,
    //  ephemeralExpiration: 999,
    });

    // Download file to temp and send
    const response = await fetch(link);
    if (!response.ok) throw 'Failed to download the file.';
    const buffer = await response.buffer();
    const tmpPath = join(tmpdir(), basename(name));

    fs.writeFileSync(tmpPath, buffer);

    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(tmpPath),
      fileName: name,
      mimetype: 'application/octet-stream'
    }, { quoted: m });

    fs.unlinkSync(tmpPath); // Clean up

  } catch (e) {
    console.error(e);
    m.reply(typeof e === 'string' ? e : 'An error occurred while processing the MediaFire download.');
  }
};

handler.help = ['mediafire <url>', 'mf <link>'];
handler.tags = ['downloader'];
handler.command = ["mf","mediafire"];

export default handler;
