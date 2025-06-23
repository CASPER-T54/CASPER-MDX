/**
 * Ping Plugin - Response Time Test
 * Tests the bot's response time
 *
 * @plugin
 * @name ping
 * @category system
 * @description Test bot response time
 * @usage .ping
 * @version 1.0.0
 * @author CASPER-X
 */

import { performance } from "perf_hooks"

const handler = async (m, { 
  conn, 
  reply, 
  timeGreeting, 
  ftroli
}) => {
  try {
    // Start performance measurement
    const startTime = performance.now()
    const messageStart = new Date().getTime()
    
    // Send initial ping message
    await reply("🏓 Pinging...")
    
    // Calculate response time
    const messageEnd = new Date().getTime()
    const endTime = performance.now()
    
    const messageResponseTime = messageEnd - messageStart
    const performanceTime = (endTime - startTime).toFixed(2)
    
    // Create response
    const responseText = `🏓 *CASPER-X SPEED TEST!*

📊 *Response Time:*
├ Message: \`${messageResponseTime}ms\`
├ Performance: \`${performanceTime}ms\`
└ Status: ${messageResponseTime < 100 ? "🟢 Excellent" : messageResponseTime < 300 ? "🟡 Good" : "🔴 Slow"}\n> *© CASPER-X 🤓 | CASPER TECH™ 2025*`

    // Send response with thumbnail
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
          title: `🏓 SPEED TEST`,
          body: `${timeGreeting}`,
          thumbnailUrl: "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540763/IMG_20250504_085512_iqmqlu.png",
          sourceUrl: "https://github.com/Casper-Tech-ke/CASPER-X",
        },
      },
    }, { quoted: ftroli })

  } catch (error) {
    console.error("Error in ping command:", error)
    await reply(`❌ Error testing ping: ${error.message}`)
  }
}

// Plugin metadata
handler.help = ["ping"]
handler.tags = ["system"]
handler.command = ["ping"]
handler.category = "system"
handler.description = "Test bot response time"
handler.usage = ".ping"

export default handler