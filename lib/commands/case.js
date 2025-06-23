import "../settings/config.js"
import fs from "fs"
import util from "util"
import chalk from "chalk"
import path from "path"
import { fileURLToPath } from "url"
import { loadPlugins, getCommands } from "../utils/pluginLoader.js"
import gradient from "gradient-string"
import moment from "moment-timezone"
import Table from "cli-table3"
import axios from "axios"
import { Sticker } from 'wa-sticker-formatter'

// Add these imports at the top of the file
import { exec } from "child_process"
import { toAudio } from "../converter.js"
import { writeExif } from "../exif.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set timezone to African time (Nairobi)
moment.tz.setDefault(global.appearance.timezone || "Africa/Nairobi")

// Function to get current time in African timezone
const getAfricanTime = (format = global.appearance.timeFormat || "HH:mm:ss") => {
  return moment().format(format)
}

// Function to get current date in African timezone
const getAfricanDate = (format = global.appearance.dateFormat || "DD/MM/YYYY") => {
  return moment().format(format)
}

// Function to get full date and time in African timezone
const getAfricanDateTime = (format = global.appearance.fullDateFormat || "DD/MM/YYYY HH:mm:ss") => {
  return moment().format(format)
}

//================= { TIME & GREETINGS } =================\\
const time2 = moment().tz("Africa/Nairobi").format("HH:mm:ss")
let timeGreeting

if (time2 < "03:00:00") {
  timeGreeting = "Good Night 🌃"
} else if (time2 < "06:00:00") {
  timeGreeting = "Good Dawn 🌆"
} else if (time2 < "11:00:00") {
  timeGreeting = "Good Morning 🏙️"
} else if (time2 < "15:00:00") {
  timeGreeting = "Good Afternoon 🏞️"
} else if (time2 < "19:00:00") {
  timeGreeting = "Good Evening 🌄"
} else {
  timeGreeting = "Good Night 🌃"
}

// African time zones
const eat = moment(Date.now()).tz("Africa/Nairobi").locale("en").format("HH:mm:ss z")     // East Africa Time
const cat = moment(Date.now()).tz("Africa/Cairo").locale("en").format("HH:mm:ss z")      // Central Africa Time
const wat = moment(Date.now()).tz("Africa/Lagos").locale("en").format("HH:mm:ss z")      // West Africa Time

//================= { ENHANCED REACT EMOJIS } =================\\
const reactionEmojis = [
  "📚", "💭", "💫", "🌌", "🌏", "✨", "🌷", "🍁", "🪻",
  "🎯", "⚡", "🔥", "💎", "🌟", "🎨", "🚀", "💝", "🎭",
  "🎪", "🎨", "🎵", "🎶", "🎸", "🎹", "🎤", "🎧", "📱",
  "💻", "⌨️", "🖥️", "📺", "📷", "📸", "🎬", "🎞️", "📹",
  "🔍", "🔎", "💡", "🔧", "⚙️", "🛠️", "⚖️", "🎲", "🎮",
  "🕹️", "🎯", "🎪", "🎨", "🎭", "🎪", "🎨", "🎵", "🎶"
]
const randomEmoji = () => reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)]

// Array of custom thumbnail URLs
const thumbnailUrls = [
  "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540763/IMG_20250504_085512_iqmqlu.png",
  "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540730/IMG_20250504_085705_lnhjkn.png",
  "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540746/IMG_20250504_091304_y0ajun.png",
  "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540752/IMG_20250504_085652_paa7v4.png",
  "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540766/IMG_20250504_085406_r6vbwf.png",
  "https://res.cloudinary.com/dkuwzqmr0/image/upload/v1746540769/IMG_20250504_085357_u5fog6.png"
]

// Function to get random thumbnail URL
const getRandomThumbnail = () => {
  return thumbnailUrls[Math.floor(Math.random() * thumbnailUrls.length)]
}

// Simplified function to get group admins (combines all admin types)
const getGroupAdmins = (participants) => {
  const admins = []
  
  if (!participants || !Array.isArray(participants)) {
    return admins
  }
  
  for (const participant of participants) {
    // Include both admin and superadmin in the same array
    if (participant.admin === "admin" || participant.admin === "superadmin") {
      admins.push(participant.id)
    }
  }
  return admins
}

// Create a formatted log table with gradient
const createLogTable = (data) => {
  const table = new Table({
    chars: {
      top: "═",
      "top-mid": "╤",
      "top-left": "╔",
      "top-right": "╗",
      bottom: "═",
      "bottom-mid": "╧",
      "bottom-left": "╚",
      "bottom-right": "╝",
      left: "║",
      "left-mid": "╟",
      mid: "─",
      "mid-mid": "┼",
      right: "║",
      "right-mid": "╢",
      middle: "│",
    },
    style: {
      head: ["cyan"],
      border: ["grey"],
      compact: true,
    },
  })

  const rows = []
  for (const [key, value] of Object.entries(data)) {
    rows.push([chalk.cyan(key), chalk.white(value)])
  }

  table.push(...rows)
  return table.toString()
}

// Load plugins
let plugins = {}
let commands = {}

// Initialize plugins
const initPlugins = async () => {
  try {
    const startTime = Date.now()
    console.log(chalk.yellow(`[${getAfricanTime()}] Loading plugins...`))
    plugins = await loadPlugins()
    commands = getCommands(plugins)
    const loadTime = Date.now() - startTime

    const successGradient = gradient(global.appearance.theme.gradients.success)
    console.log(
      successGradient(
        `[${getAfricanTime()}] Successfully loaded ${Object.keys(commands).length} commands from plugins in ${loadTime}ms`,
      ),
    )

    return Object.keys(commands).length
  } catch (error) {
    const errorGradient = gradient(global.appearance.theme.gradients.error)
    console.error(errorGradient(`[${getAfricanTime()}] Failed to load plugins:`), error)
    return 0
  }
}

// Function to reload plugins
export const reloadPlugins = async () => {
  return await initPlugins()
}

// Bot mode (public or self)
let isPublic = true

export default async (conn, m, chatUpdate, store) => {
  try {
    // Update the body parsing section
    var body =
      (m.mtype === "conversation"
        ? m.message?.conversation
        : m.mtype === "imageMessage"
          ? m.message?.imageMessage?.caption
          : m.mtype === "videoMessage"
            ? m.message?.videoMessage?.caption
            : m.mtype === "extendedTextMessage"
              ? m.message?.extendedTextMessage?.text
              : m.mtype === "buttonsResponseMessage"
                ? m.message?.buttonsResponseMessage?.selectedButtonId
                : m.mtype === "listResponseMessage"
                  ? m.message?.listResponseMessage?.singleSelectReply?.selectedRowId
                  : m.mtype === "templateButtonReplyMessage"
                    ? m.message?.templateButtonReplyMessage?.selectedId
                    : m.mtype === "interactiveResponseMessage"
                      ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id
                      : m.mtype === "messageContextInfo"
                        ? m.message?.buttonsResponseMessage?.selectedButtonId ||
                          m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
                          m.text
                        : "") || ""

    const budy = typeof m.text === "string" ? m.text : ""

    // Handle multi-prefix configuration
    let prefix = global.prefix.main
    let isCmd = false
    let command = ""

    if (global.prefix.multi) {
      for (const pfx of global.prefix.list) {
        if (body.startsWith(pfx)) {
          prefix = pfx
          isCmd = true
          command = body.slice(pfx.length).trim().split(" ").shift().toLowerCase()
          break
        }
      }
    } else {
      isCmd = body.startsWith(prefix)
      command = isCmd ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase() : ""
    }

    const args = body.trim().split(/ +/).slice(1)
    const text = args.join(" ")
    const q = text

    // Add section for quoted message handling
    const fatkuns = m.quoted || m
    const quoted =
      fatkuns.mtype === "buttonsMessage"
        ? fatkuns[Object.keys(fatkuns)[1]]
        : fatkuns.mtype === "templateMessage"
          ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]]
          : fatkuns.mtype === "product"
            ? fatkuns[Object.keys(fatkuns)[0]]
            : m.quoted
              ? m.quoted
              : m
    const mime = (quoted.msg || quoted).mimetype || ""
    const qmsg = quoted.msg || quoted
    const isMedia = /image|video|sticker|audio/.test(mime)

    //================= { USER & BOT IDENTITY } =================\\
    const botNumber = await conn.decodeJid(conn.user?.id || conn.user?.jid || "")
    const connectedUser = conn.user?.id || conn.user?.jid || ""

    // Get owner numbers from config
    const ownerNumbers = global.owner.map((o) => o.number + "@s.whatsapp.net")

    const sender = m.key.fromMe
      ? (connectedUser.split(":")[0] + "@s.whatsapp.net") || connectedUser
      : m.key.participant || m.key.remoteJid
    const senderNumber = sender.split("@")[0]

    // Check if sender is an owner (including bot number)
    const isOwner = ownerNumbers.includes(sender) || sender === botNumber

    // Check if sender is a developer
    const isDev = global.owner.some((o) => o.number === senderNumber && o.isDev)

    const itsMe = m.sender === botNumber ? true : false
    const isCreator = [botNumber, ...ownerNumbers].includes(m.sender) || m.sender === botNumber
    const pushname = m.pushName || `User-${senderNumber}`
    const isBot = botNumber.includes(senderNumber)

    //================= { SIMPLIFIED GROUP MANAGEMENT } =================\\
    // Improved Group Management Section for main handler
//================= { IMPROVED GROUP MANAGEMENT } =================\\
const isGroup = m.isGroup || m.chat.endsWith('@g.us')

let groupMetadata = null
let groupName = ""
let participants = []
let groupAdmins = []
let groupOwner = ""

if (isGroup) {
  try {
    // Get fresh group metadata
    groupMetadata = await conn.groupMetadata(m.chat)
    if (groupMetadata) {
      groupName = groupMetadata.subject || "Unknown Group"
      participants = groupMetadata.participants || []
      groupOwner = groupMetadata.owner || ""
      
      // Extract all admin types
      groupAdmins = participants
        .filter(p => p.admin === "admin" || p.admin === "superadmin")
        .map(p => p.id)
      
      // Debug logging
      if (global.debug) {
        console.log(chalk.cyan(`[DEBUG] Group: ${groupName}`))
        console.log(chalk.cyan(`[DEBUG] Bot Number: ${botNumber}`))
        console.log(chalk.cyan(`[DEBUG] Connected User: ${connectedUser}`))
        console.log(chalk.cyan(`[DEBUG] Group Owner: ${groupOwner}`))
        console.log(chalk.cyan(`[DEBUG] Group Admins: ${JSON.stringify(groupAdmins)}`))
        console.log(chalk.cyan(`[DEBUG] Participants count: ${participants.length}`))
      }
    }
  } catch (error) {
    console.error(chalk.red(`[${getAfricanTime()}] Group metadata error:`), error)
  }
}

// Improved bot admin detection
const isBotAdmin = isGroup ? (() => {
  if (!groupMetadata || !participants.length) return false
  
  // Check multiple JID formats for bot
  const botJids = [
    botNumber,
    connectedUser,
    botNumber.split('@')[0] + '@s.whatsapp.net',
    connectedUser.split('@')[0] + '@s.whatsapp.net'
  ].filter(Boolean)
  
  // Check if bot is in admin list or is group owner
  const isAdmin = groupAdmins.some(admin => botJids.includes(admin))
  const isOwner = botJids.some(bot => bot === groupOwner)
  
  if (global.debug) {
    console.log(chalk.magenta(`[DEBUG] Bot JIDs: ${JSON.stringify(botJids)}`))
    console.log(chalk.magenta(`[DEBUG] Is Admin: ${isAdmin}`))
    console.log(chalk.magenta(`[DEBUG] Is Owner: ${isOwner}`))
  }
  
  return isAdmin || isOwner
})() : false

// Improved user admin detection
const isAdmin = isGroup ? (
  groupAdmins.includes(sender) || 
  sender === groupOwner ||
  isCreator
) : false

// Group owner detection
const isGroupOwner = isGroup ? (
  sender === groupOwner || 
  (groupOwner === "" && groupAdmins.includes(sender)) ||
  isCreator
) : false

// Debug logging for admin status
if (isGroup && global.debug) {
  console.log(chalk.magenta(`[DEBUG] Final Admin Status:`))
  console.log(chalk.magenta(`- Bot is Admin: ${isBotAdmin}`))
  console.log(chalk.magenta(`- User is Admin: ${isAdmin}`))
  console.log(chalk.magenta(`- User is Group Owner: ${isGroupOwner}`))
  console.log(chalk.magenta(`- Is Creator: ${isCreator}`))
  console.log(chalk.magenta(`- Sender: ${sender}`))
}
    // Fake thumbnail for fake messages
    const fkethmb = Buffer.alloc(0)
    const thumbUrl = getRandomThumbnail()

    //================= { FAKE MESSAGES } =================\\
    const fkontak = {
      key: {
        participant: `0@s.whatsapp.net`,
        ...(m.chat
          ? {
              remoteJid: `status@broadcast`,
            }
          : {}),
      },
      message: {
        contactMessage: {
          displayName: "CASPER-X",
          vcard: `BEGIN:VCARD
VERSION:3.0
N:XL;${pushname},;;;
FN:${pushname}
item1.TEL;waid=0:0
item1.X-ABLabel:Mobile
END:VCARD`,
          jpegThumbnail: fkethmb,
          thumbnail: fkethmb,
          thumbnailUrl: getRandomThumbnail(),
          sendEphemeral: true,
        },
      },
    }

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
          thumbnailUrl: getRandomThumbnail(),
          surface: 1,
          message: "CASPER-X Bot",
          orderTitle: "Activated!",
          sellerJid: "0@s.whatsapp.net",
        },
      },
    }

    const qevent = {
      key: {
        participant: `0@s.whatsapp.net`,
        ...(m.chat
          ? {
              remoteJid: "",
            }
          : {}),
      },
      message: {
        eventMessage: {
          isCanceled: false,
          name: `${timeGreeting}`,
          description: "CASPER-X Bot",
          location: {
            degreesLatitude: 0,
            degreesLongitude: 0,
            name: "CASPER-X Bot",
          },
          joinLink: " ",
          startTime: "12345678",
        },
      },
    }

    // Custom reply function with external ad
    const reply = async (teks) => {
      const HIRAGIIJob = {
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterName: `CASPER TECH`,
            newsletterJid: `120363375953549654@newsletter`,
          },
          externalAdReply: {
            showAdAttribution: true,
            title: `CASPER-X`,
            body: `${timeGreeting}`,
            thumbnailUrl: getRandomThumbnail(),
            thumbnail: "",
            sourceUrl: "https://github.com/Casper-Tech-ke/CASPER-X",
          },
        },
        text: teks,
      }
      return conn.sendMessage(m.chat, HIRAGIIJob, {
        quoted: ftroli,
      })
    }

    // Check if bot should respond based on mode
    const shouldRespond = isPublic || isCreator || m.key.fromMe || sender === botNumber

    if (!shouldRespond) return

    // Console logging with improved formatting
    if (m.message && isCmd) {
      const logData = {
        SENDER: pushname || "Unknown",
        JID: m.sender,
        ...(isGroup && { GROUP: groupName || "Unknown" }),
        ...(isGroup && isAdmin && { STATUS: "ADMIN" }),
        COMMAND: `${prefix}${command}`,
        MODE: isPublic ? "public" : "self",
        TIMESTAMP: getAfricanDateTime(),
      }

      console.log(createLogTable(logData))
    }

    //================= { SIMPLIFIED COMMAND HANDLER } =================\\
    const isPremium = false

    // Simplified permission checking function
    const checkPermissions = (metadata) => {
      // Owner/Creator bypass all restrictions
      if (isCreator) return true

      // Check owner-only commands
      if (metadata?.owner) {
        return false
      }

      // Check group-only commands
      if (metadata?.group && !isGroup) {
        reply("❌ This command can only be used in groups!")
        return false
      }

      // Check admin-only commands
      if (metadata?.admin && !isAdmin) {
        reply("❌ This command can only be used by group admins!")
        return false
      }

      // Check if bot needs admin permissions
      if (metadata?.botAdmin && !isBotAdmin) {
        reply(`❌ Bot must be a group admin to use this command!\n\n🔍 *Debug Info:*\n- Bot Admin Status: ${isBotAdmin}\n- Group: ${groupName}\n- Make sure bot is promoted to admin`)
        return false
      }

      // Check premium commands
      if (metadata?.premium && !isPremium) {
        reply("💎 This command is only for premium users!")
        return false
      }

      return true
    }

    // Check if command exists in plugins
    if (isCmd && commands[command]) {
      try {
        // Send reaction
        await conn.sendMessage(m.chat, { react: { text: randomEmoji(), key: m.key } })

        // Get plugin metadata and handler
        const { category, handler, metadata } = commands[command]

        // Check permissions
        if (!checkPermissions(metadata)) {
          return
        }

        // Execute the plugin handler
        await handler(m, {
          conn,
          args,
          text,
          command,
          prefix,
          quoted,
          mime,
          isGroup,
          isOwner,
          isDev,
          sender,
          pushname,
          participants,
          groupMetadata,
          groupName,
          isAdmin,
          isBotAdmin,
          isGroupOwner,
          groupOwner,
          groupAdmins,
          isCreator,
          botNumber,
          connectedUser,
          store,
          fkontak,
          ftroli,
          qevent,
          reply,
          timeGreeting,
          eat,
          cat,
          wat,
        })

        console.log(chalk.green(`[${getAfricanTime()}] [PLUGIN] Executed ${category}/${command}`))
      } catch (error) {
        console.error(chalk.red(`[${getAfricanTime()}] [PLUGIN] Error executing ${command}:`), error)
        reply(`❌ Error executing command: ${error.message}`)
      }
      return
    }

    //================= { BUILT-IN COMMANDS } =================\\
    switch (command) {
      case "self": {
        if (!isCreator) return

        if (!isPublic) return reply(`🔒 Bot is already in self mode!`)

        isPublic = false
        reply(`🔒 Bot switched to *self mode*. Only the owner can use commands now.`)
        break
      }

      case "public": {
        if (!isCreator) return

        if (isPublic) return reply(`🌐 Bot is already in public mode!`)

        isPublic = true
        reply(`🌐 Bot switched to *public mode*. Everyone can now use commands.`)
        break
      }

      case "admintest": {
        if (!isGroup) return reply("This command only works in groups!")
        
        const status = `
🔍 *Admin Status Debug*

👤 *User Info:*
- Name: ${pushname}
- JID: ${sender}
- Is Admin: ${isAdmin}
- Is Group Owner: ${isGroupOwner}
- Is Creator: ${isCreator}

🤖 *Bot Info:*
- Bot JID: ${botNumber}
- Is Bot Admin: ${isBotAdmin}

📊 *Group Info:*
- Group: ${groupName}
- Owner: ${groupOwner || "Not set"}
- Total Admins: ${groupAdmins.length}
- Total Participants: ${participants.length}
- Admin List: ${groupAdmins.join(', ') || "None"}
        `
        
        reply(status)
        break
      }

      //================= { TOOLS COMMANDS } =================\\
      case "toaudio":
      case "tomp3": {
        if (!/video/.test(mime) && !/audio/.test(mime))
          return reply(`🎵 Reply to a video/audio with command *${prefix + command}*`)
        if (!quoted) return reply(`🎵 Reply to a video/audio with command *${prefix + command}*`)

        reply("🔄 Converting to audio... Please wait")

        try {
          const media = await quoted.download()
          const audio = await toAudio(media, "mp4")
          conn.sendMessage(
            m.chat,
            {
              document: audio.data,
              mimetype: "audio/mpeg",
              fileName: `audio.mp3`,
            },
            { quoted: fkontak },
          )
        } catch (error) {
          console.error(chalk.red(`[${getAfricanTime()}] Error in ${command}:`), error)
          reply(`❌ Error: ${error.message}`)
        }
        break
      }

      case "tovn": {
        if (!/video/.test(mime) && !/audio/.test(mime))
          return reply(`🎤 Reply to a video/audio with command *${prefix + command}*`)
        if (!quoted) return reply(`🎤 Reply to a video/audio with command *${prefix + command}*`)

        reply("🔄 Converting to voice note... Please wait")

        try {
          const media = await quoted.download()
          const audio = await toAudio(media, "mp4")
          conn.sendMessage(
            m.chat,
            {
              audio: audio.data,
              mimetype: "audio/mpeg",
              ptt: true,
            },
            { quoted: ftroli },
          )
        } catch (error) {
          console.error(chalk.red(`[${getAfricanTime()}] Error in ${command}:`), error)
          reply(`❌ Error: ${error.message}`)
        }
        break
      }

      case "toimg":
      case "toimage": {
        if (!quoted) return reply("🖼️ Reply to a sticker")
        if (!/webp/.test(mime)) return reply(`🖼️ Reply to a sticker with command *${prefix + command}*`)

        reply("🔄 Converting to image... Please wait")

        try {
          const media = await quoted.download()
          const tmpFile = `./tmp/${Date.now()}.webp`
          const outputFile = `./tmp/${Date.now()}.png`

          fs.writeFileSync(tmpFile, media)

          exec(`ffmpeg -i "${tmpFile}" "${outputFile}"`, (err) => {
            fs.unlinkSync(tmpFile)
            if (err) {
              console.error(chalk.red(`[${getAfricanTime()}] Error in ${command}:`), err)
              return reply(`❌ Error: ${err.message}`)
            }

            const buffer = fs.readFileSync(outputFile)
            conn.sendMessage(
              m.chat,
              {
                image: buffer,
                caption: `✅ Successfully converted to image`,
              },
              { quoted: qevent },
            )

            fs.unlinkSync(outputFile)
          })
        } catch (error) {
          console.error(chalk.red(`[${getAfricanTime()}] Error in ${command}:`), error)
          reply(`❌ Error: ${error.message}`)
        }
        break
      }

      case "brat": {
        if (!text) return reply('❌ Please enter some text to generate a sticker.')

        await conn.sendMessage(m.chat, {
            react: { text: "⏱️", key: m.key }
        })

        try {
            const url = `https://api.hanggts.xyz/imagecreator/brat?text=${encodeURIComponent(text)}`
            const response = await axios.get(url, { responseType: "arraybuffer" })

            const sticker = new Sticker(response.data, {
                pack: "CASPER-X",
                author: "TRABY",
                type: "image"
            })

            const stikerBuffer = await sticker.toBuffer()
            await conn.sendMessage(m.chat, { sticker: stikerBuffer }, { quoted: qevent })

        } catch (err) {
            console.error("❌ Error:", err)
            reply("An error occurred while creating the sticker.")
        }
        break
      }

      case "sticker":
      case "s": {
        if (!quoted) return reply(`🏷️ Reply to an image or video with command *${prefix + command}*`)

        if (!/image|video/.test(mime)) {
          return reply(`🏷️ Reply to an image or video with command *${prefix + command}*`)
        }

        reply("🔄 Creating sticker... Please wait")

        try {
          const media = await quoted.download()

          if (/video/.test(mime)) {
            if ((quoted.msg || quoted).seconds > 10) {
              return reply("⏰ Maximum video duration is 10 seconds!")
            }
          }

          const sticker = await writeExif(media, {
            packname: "CASPER-X",
            author: "TRABY",
          })

          await conn.sendMessage(m.chat, { sticker: { url: sticker } }, { quoted: ftroli })

          if (fs.existsSync(sticker)) {
            fs.unlinkSync(sticker)
          }
        } catch (error) {
          console.error(chalk.red(`[${getAfricanTime()}] Error in ${command}:`), error)
          reply(`❌ Error creating sticker: ${error.message}`)
        }
        break
      }

      //================= { OWNER COMMANDS } =================\\
      default: {
        // Eval command for owner (=>)
        if (budy.startsWith("=>")) {
          if (!isCreator) return
          function Return(sul) {
            const sat = JSON.stringify(sul, null, 2)
            let bang = util.format(sat)
            if (sat == undefined) bang = util.format(sul)
            return reply(bang)
          }
          try {
            reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
          } catch (e) {
            reply(String(e))
          }
        }

        // Eval command for owner (>)
        if (budy.startsWith(">")) {
          if (!isCreator) return
          try {
            let evaled = eval(budy.slice(2))
            if (typeof evaled !== "string") evaled = util.inspect(evaled)
            reply(evaled)
          } catch (err) {
            reply(String(err))
          }
        }

        // Terminal command for owner ($)
        if (budy.startsWith("$")) {
          if (!isCreator) return
          exec(budy.slice(2), (err, stdout) => {
            if (err) return reply(`❌ ${err}`)
            if (stdout) return reply(stdout)
          })
        }

        // Unknown command logging
        if (isCmd) {
          console.log(chalk.yellow(`[${getAfricanTime()}] Unknown command: ${command} from ${pushname}`))
        }
      }
    }
  } catch (err) {
    console.log(util.format(err))
  }
}

//================= { FILE WATCHER } =================\\
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.redBright(`[${getAfricanTime()}] Update ${__filename}`))
  import(`file://${__filename}?update=${Date.now()}`).catch(console.error)
})