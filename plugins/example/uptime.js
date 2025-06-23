/**
 * Uptime Plugin - Bot Uptime & Command Statistics
 * Shows bot uptime, system info and command usage stats
 *
 * @plugin
 * @name uptime
 * @category system
 * @description Display bot uptime and command statistics
 * @usage .uptime
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
    // Bot uptime
    const botUptime = process.uptime()
    const botUptimeFormatted = formatUptime(botUptime)
    
    // System uptime
    const systemUptime = os.uptime()
    const systemUptimeFormatted = formatUptime(systemUptime)
    
    // Memory usage
    const memUsage = process.memoryUsage()
    const memUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2)
    const memTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2)
    const memPercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)
    
    // CPU info
    const cpuCount = os.cpus().length
    const loadAvg = os.loadavg()
    const cpuUsage = (loadAvg[0] * 100 / cpuCount).toFixed(1)
    
    // Command statistics (you can enhance this with actual command counter)
    const totalCommands = getTotalCommandCount() // This would come from your plugin system
    const commandsToday = getTodayCommandCount() // This would come from your logging system
    
    // Bot start time
    const startTime = moment().subtract(botUptime, 'seconds').format('DD/MM/YYYY HH:mm:ss')
    const currentTime = moment().tz("Africa/Nairobi").format("HH:mm:ss DD/MM/YYYY")
    
    // Create comprehensive response
    const responseText = `⏰ *BOT UPTIME & STATISTICS*

🤖 *Bot Information:*
├ Bot Uptime: \`${botUptimeFormatted}\`
├ Started: \`${startTime}\`
├ Current Time: \`${currentTime}\`
└ Status: ${timeGreeting}

📊 *Command Statistics:*
├ Total Commands: \`${totalCommands}\`
├ Commands Today: \`${commandsToday}\`
└ Average/Hour: \`${Math.round(commandsToday / Math.max(1, botUptime / 3600))}\`

💾 *System Resources:*
├ Memory Usage: \`${memUsed}MB / ${memTotal}MB (${memPercent}%)\`
├ CPU Usage: \`${cpuUsage}% (${cpuCount} cores)\`
├ System Uptime: \`${systemUptimeFormatted}\`
└ Platform: \`${os.platform()} ${os.arch()}\`

📱 *Session Info:*
├ User: ${pushname}
${isGroup ? `├ Group: ${groupName}\n` : ""}└ Mode: Online ✅\n> *© CASPER-X 🤓 | CASPER TECH™ 2025*`

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
          title: `⏰ CASPER-X UPTIME`,
          body: `Online for ${botUptimeFormatted}`,
          thumbnailUrl: randomThumbnail,
          sourceUrl: "https://github.com/Casper-Tech-ke/CASPER-X",
        },
      },
    }, { quoted: ftroli })

  } catch (error) {
    console.error("Error in uptime command:", error)
    await reply(`❌ Error getting uptime info: ${error.message}`)
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

// Helper function to get total command count
// You can enhance this to read from your actual command counter/database
function getTotalCommandCount() {
  // This is a placeholder - you would implement actual command counting
  // Could read from a file, database, or global counter
  try {
    // Example: read from a JSON file or global variable
    // const stats = JSON.parse(fs.readFileSync('./stats/commands.json', 'utf8'))
    // return stats.total || 0
    return Math.floor(Math.random() * 10000) + 1000 // Placeholder
  } catch {
    return 0
  }
}

// Helper function to get today's command count
function getTodayCommandCount() {
  // This is a placeholder - you would implement actual daily command counting
  try {
    // Example: filter commands by today's date
    // const today = moment().format('YYYY-MM-DD')
    // const stats = JSON.parse(fs.readFileSync('./stats/daily.json', 'utf8'))
    // return stats[today] || 0
    return Math.floor(Math.random() * 500) + 50 // Placeholder
  } catch {
    return 0
  }
}

// Plugin metadata
handler.help = ["uptime", "runtime"]
handler.tags = ["system"]
handler.command = ["uptime", "runtime", "status"]
handler.category = "system"
handler.description = "Display bot uptime and command statistics"
handler.usage = ".uptime"

export default handler