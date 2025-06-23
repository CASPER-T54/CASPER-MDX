import chalk from "chalk";
import os from "os";

const readMore = String.fromCharCode(8206).repeat(4001);
const thumbUrl = "https://your-server.com/thumb.jpg"; // Replace with actual thumbnail URL

const handler = async (m, { conn, usedPrefix, plugins, command }) => {
  try {
    const pushName = m.pushName || "there";

    const ucapanWaktu = (() => {
      const hour = new Date().getHours();
      if (hour < 4) return "Good Night";
      if (hour < 10) return "Good Morning";
      if (hour < 15) return "Good Afternoon";
      if (hour < 18) return "Good Evening";
      return "Good Night";
    })();

    // Send loading message first (reply to command)
    const loadingMessage = await conn.sendMessage(m.chat, {
      text: "⏳ *Loading your command menu... Please wait while we polish the buttons!*"
    }, { quoted: m });

    // Measure bot speed after loading message
    const start = performance.now();
    const ping = Math.floor(performance.now() - start);

    const jokes = [
      "Why did the bot go broke? Because it lost its cache! 💸",
      "Why don't robots panic? Because they always keep their *byte*! 🤖",
      "Why did the developer go broke? Because he used up all his cache! 💰",
      "My AI friend got a job as a chef... now it makes *byte-sized* meals! 🍽️"
    ];

    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

    // Dynamic category-command mapping
    const categoryMap = {};
    for (const name in plugins) {
      const plugin = plugins[name];
      if (!plugin?.help || plugin.disabled) continue;

      const category = plugin.tags?.[0] || "others";
      if (!categoryMap[category]) categoryMap[category] = [];

      for (const help of plugin.help) {
        categoryMap[category].push(`➳ ${usedPrefix}${help}`);
      }
    }

    // Compose message
    let menuText = `*Hey ${pushName}! 👋*
*${ucapanWaktu}*

`;
    menuText += `*📶 Ping Speed:* ${ping}ms
_${randomJoke}_

`;
    menuText += `*☰ CASPER-XMD Main Menu*
_Powered by Casper Tech_
${readMore}

`;

    for (const category in categoryMap) {
      menuText += `❁ *${category.toUpperCase()}*
`;
      menuText += categoryMap[category].join("\n") + `\n${readMore}\n\n`;
    }

    menuText += `📅 *Date:* ${new Date().toLocaleString()}
🧠 *Casper Tech AI - Always at Your Service!*`;

    // Create fake quoted message with branding
    const replyMessage = {
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
          body: `${ucapanWaktu}`,
          thumbnailUrl: thumbUrl,
          thumbnail: "",
          sourceUrl: "https://whatsapp.com/channel/0029VazABxMJZg40sEZBX242",
        },
      },
      text: menuText.trim(),
    };

    await conn.sendMessage(m.chat, {
      image: { url: thumbUrl },
      caption: menuText.trim()
    }, { quoted: replyMessage });

  } catch (error) {
    console.error(chalk.red(`[Menu Error] ${error.message}`));
    await conn.sendMessage(m.chat, {
      text: "⚠️ Error occurred while generating the menu."
    }, { quoted: m });
  }
};

handler.help = ["menu"];
handler.tags = ["main"];
handler.command = ["menu", "help"];
handler.register = true;

export default handler;
