/**
 * OS Plugin - System Information
 * Shows detailed system and bot information
 *
 * @plugin
 * @name os
 * @category system
 * @description Display system information
 * @usage .os
 * @version 1.0.0
 * @author CASPER-X
 */

import os from "os"
import moment from "moment-timezone"

const handler = async (m, { 
  conn, 
  reply, 
  timeGreeting, 
  eat, 
  cat, 
  wat, 
  botNumber, 
  pushname, 
  isGroup, 
  groupName,
  ftroli
}) => {
  try {
    // System uptime
    const uptime = process.uptime()
    const uptimeFormatted = formatUptime(uptime)
    
    // Memory usage
    const memUsage = process.memoryUsage()
    const memUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2)
    const memTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2)
    
    // System info
    const platform = os.platform()
    const arch = os.arch()
    const nodeVersion = process.version
    const cpuCount = os.cpus().length
    
    // Current time
    const currentTime = moment().tz("Africa/Nairobi").format("HH:mm:ss DD/MM/YYYY")
    
    // Create comprehensive response
    const responseText = `🖥️ *CASPER-X SYSTEM INFORMATION*

⚡ *Bot Status:*
├ Uptime: \`${uptimeFormatted}\`
├ Memory: \`${memUsed}MB / ${memTotal}MB\`
├ Platform: \`${platform} (${arch})\`
├ Node.js: \`${nodeVersion}\`
└ CPU Cores: \`${cpuCount}\`

🌍 *African Time Zones:*
├ EAT (Nairobi): \`${eat}\`
├ CAT (Cairo): \`${cat}\`
└ WAT (Lagos): \`${wat}\`

📱 *Session Info:*
├ Mode: Online ✅
├ Greeting: ${timeGreeting}
${isGroup ? `├ Group: ${groupName}\n` : ""}└ User: ${pushname}

⏰ *Current Time:* ${currentTime}\n> *© CASPER-X 🤓 | CASPER TECH™ 2025*`

    // Send response with random thumbnail
    const thumbnails = [
      "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540763/IMG_20250504_085512_iqmqlu.png",
      "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540730/IMG_20250504_085705_lnhjkn.png",
      "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540746/IMG_20250504_091304_y0ajun.png",
      "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540752/IMG_20250504_085652_paa7v4.png",
      "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540766/IMG_20250504_085406_r6vbwf.png",
      "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540769/IMG_20250504_085357_u5fog6.png"
    ]
    const randomThumbnail = thumbnails[Math.floor(Math.random() * thumbnails.length)]

    await conn.sendMessage(m.chat, {
      text: responseText,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: `CASPER TECH`,
          newsletterJid: `120363375953549654@newsletter`,
        },
        externalAdReply: {
          showAdAttribution: true,
          title: `🖥️ SYSTEM INFO`,
          body:  `${timeGreeting}`,
          thumbnailUrl: randomThumbnail,
          sourceUrl: "https://github.com/Casper-Tech-ke/CASPER-X",
        },
      },
    }, { quoted: ftroli })

  } catch (error) {
    console.error("Error in os command:", error)
    await reply(`❌ Error getting system info: ${error.message}`)
  }
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  let result = []
  if (days > 0) result.push(`${days}d`)
  if (hours > 0) result.push(`${hours}h`)
  if (minutes > 0) result.push(`${minutes}m`)
  if (secs > 0) result.push(`${secs}s`)
  
  return result.join(" ") || "0s"
}

// Plugin metadata
handler.help = ["os", "system"]
handler.tags = ["system"]
handler.command = ["os", "system", "info"]
handler.category = "system"
handler.description = "Display system information"
handler.usage = ".os"

export default handler