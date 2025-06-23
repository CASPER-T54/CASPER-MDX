// Node.js version check
const nodeVersion = process.versions.node.split(".")[0]
if (Number.parseInt(nodeVersion) < 20) {
  console.error("\x1b[31m%s\x1b[0m", "╔════════════════════════════════════════════════════════╗")
  console.error("\x1b[31m%s\x1b[0m", "║                   ERROR: NODE.JS VERSION               ║")
  console.error("\x1b[31m%s\x1b[0m", "╚════════════════════════════════════════════════════════╝")
  console.error("\x1b[31m%s\x1b[0m", `[ERROR] You are using Node.js v${process.versions.node}`)
  console.error("\x1b[31m%s\x1b[0m", "[ERROR] CASPER-XI requires Node.js v20 or higher to run properly")
  console.error("\x1b[31m%s\x1b[0m", "[ERROR] Please update your Node.js installation and try again")
  console.error("\x1b[31m%s\x1b[0m", "[ERROR] Visit https://nodejs.org to download the latest version")
  console.error("\x1b[31m%s\x1b[0m", "╔════════════════════════════════════════════════════════╗")
  console.error("\x1b[31m%s\x1b[0m", "║                  SHUTTING DOWN...                      ║")
  console.error("\x1b[31m%s\x1b[0m", "╚════════════════════════════════════════════════════════╝")
  process.exit(1)
}

import baileys from "@whiskeysockets/baileys"
const {
  default: makeWASocket,
  DisconnectReason,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
  useMultiFileAuthState,
  downloadContentFromMessage,
  jidNormalizedUser,
} = baileys

import pino from "pino"
import { Boom } from "@hapi/boom"
import fs from "fs"
import path from "path"
import readline from "readline"
import PhoneNumber from "awesome-phonenumber"
import chalk from "chalk"
import { smsg } from "./lib/myfunction.js"
import cron from "node-cron"
import { fileURLToPath } from "url"
import caseHandler from "./lib/commands/case.js"
import { exec } from "child_process"
import figlet from "figlet"
import gradient from "gradient-string"
import moment from "moment-timezone"
import Box from "cli-box"
import os from "os"

// Add this import near the top of the file, with the other imports
import { startTerminalChat, handleIncomingMessage } from "./lib/utils/terminalChat.js"

import {
  handleStatusViewReact,
  handleAutoRead,
  handleAntiCall,
  handleGroupParticipants
} from './lib/utils/auto.js';

// Add sleep function definition
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import config
import "./lib/settings/config.js"

// Set timezone to WIB (Jakarta)
moment.tz.setDefault(global.appearance.timezone || "Asia/Jakarta")

// Function to get current time in WIB
const getWIBTime = (format = global.appearance.timeFormat || "HH:mm:ss") => {
  return moment().format(format)
}

// Function to get current date in WIB
const getWIBDate = (format = global.appearance.dateFormat || "DD/MM/YYYY") => {
  return moment().format(format)
}

// Function to get full date and time in WIB
const getWIBDateTime = (format = global.appearance.fullDateFormat || "DD/MM/YYYY HH:mm:ss") => {
  return moment().format(format)
}

// Create necessary directories if they don't exist
if (!fs.existsSync("./lib")) {
  fs.mkdirSync("./lib")
}
if (!fs.existsSync("./lib/commands")) {
  fs.mkdirSync("./lib/commands", { recursive: true })
}
if (!fs.existsSync("./lib/settings")) {
  fs.mkdirSync("./lib/settings", { recursive: true })
}
if (!fs.existsSync("./plugins")) {
  fs.mkdirSync("./plugins", { recursive: true })
}

// Create tmp directory if it doesn't exist
if (!fs.existsSync("./tmp")) {
  fs.mkdirSync("./tmp", { recursive: true })
  console.log(chalk.green(`[${getWIBTime()}] Created tmp directory: ./tmp`))
}

// Get terminal width for responsive display
const getTerminalWidth = () => {
  const columns = process.stdout.columns || 80
  const minWidth = global.appearance.theme.minWidth || 60
  const maxWidth = global.appearance.theme.maxWidth || 100

  // Ensure width is within bounds
  return Math.max(minWidth, Math.min(minWidth, maxWidth))
}

// Display CASPER-XI banner with improved styling using figlet and gradient
const displayBanner = () => {
  return new Promise((resolve) => {
    // Clear the terminal
    console.clear()

    // Get terminal width
    const termWidth = getTerminalWidth()

    // Create a timestamp header
    const timeHeader = `[${getWIBDateTime()}]`
    console.log(chalk.gray(timeHeader + " Starting CASPER-XI Bot...\n"))

    // Create figlet text
    figlet.text(
      "CASPER-XI",
      {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: termWidth,
        whitespaceBreak: true,
      },
      (err, data) => {
        if (err) {
          console.log(chalk.red("Something went wrong with figlet"))
          console.dir(err)
          resolve()
          return
        }

        // Apply gradient to figlet output
        const mainGradient = gradient(global.appearance.theme.gradient)
        console.log(mainGradient(data))

        // Display additional information
        const title = `${global.botName} WhatsApp Bot v${global.botVersion} | © ${global.ownerName} 2025`

        // Create a box for the title
        const boxConfig = {
          w: termWidth - 4,
          h: 3,
          stringify: false,
          marks: {
            nw: "╔",
            n: "═",
            ne: "╗",
            e: "║",
            se: "╝",
            s: "═",
            sw: "╚",
            w: "║",
          },
          hAlign: "center",
          vAlign: "middle",
        }

        const titleBox = new Box(boxConfig, title)
        console.log(mainGradient(titleBox.stringify()))

        // Add timestamp
        console.log(chalk.gray(`[${getWIBDateTime()}] System initialized\n`))

        resolve()
      },
    )
  })
}

// Initialize store
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) })

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

// Get session directory from config
const SESSION_DIR = globalThis.sessionDir || "./session"

// Create session directory if it doesn't exist
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
  console.log(chalk.green(`[${getWIBTime()}] Created session directory: ${SESSION_DIR}`))
}

/**
 * Cleans session files while preserving creds.json
 * @returns {Object} - Result of the cleaning operation
 */
const clearSessionFiles = async () => {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      return { success: false, error: "Session directory does not exist", removedCount: 0, preservedCount: 0 }
    }

    const files = fs.readdirSync(SESSION_DIR)
    let removedCount = 0
    let preservedCount = 0

    for (const file of files) {
      const filePath = path.join(SESSION_DIR, file)
      if (fs.statSync(filePath).isDirectory()) continue
      if (file === "creds.json") {
        preservedCount++
        continue
      }
      fs.unlinkSync(filePath)
      removedCount++
    }

    console.log(
      chalk.green(
        `[${getWIBTime()}] Session cleaned: Removed ${removedCount} files, preserved ${preservedCount} files`,
      ),
    )
    return { success: true, removedCount, preservedCount }
  } catch (error) {
    console.error(chalk.red(`[${getWIBTime()}] Error cleaning session:`), error)
    return { success: false, error: error.message, removedCount: 0, preservedCount: 0 }
  }
}

// Create a box with text centered inside using gradient
const createBox = (text, width = null, padding = 1) => {
  // Get terminal width if not specified
  width = width || getTerminalWidth() - 10

  const mainGradient = gradient(global.appearance.theme.gradient)
  const boxChars = global.appearance.theme.box || {
    cornerChar: "+",
    horizontalChar: "=",
    verticalChar: "|",
  }

  const horizontalBorder = boxChars.cornerChar + boxChars.horizontalChar.repeat(width - 2) + boxChars.cornerChar
  const emptyLine = boxChars.verticalChar + " ".repeat(width - 2) + boxChars.verticalChar

  let result = mainGradient(horizontalBorder) + "\n"

  // Add padding top
  for (let i = 0; i < padding; i++) {
    result += mainGradient(emptyLine) + "\n"
  }

  // Add text centered
  const paddingLeft = Math.floor((width - text.length - 2) / 2)
  const paddingRight = width - text.length - 2 - paddingLeft
  result +=
    mainGradient(boxChars.verticalChar) +
    " ".repeat(paddingLeft) +
    chalk.white(text) +
    " ".repeat(paddingRight) +
    mainGradient(boxChars.verticalChar) +
    "\n"

  // Add padding bottom
  for (let i = 0; i < padding; i++) {
    result += mainGradient(emptyLine) + "\n"
  }

  result += mainGradient(horizontalBorder)
  return result
}

// Bot mode (public or self)
global.isPublic = true

// Watch for plugin changes
const watchPluginsDirectory = () => {
  const pluginsDir = path.join(__dirname, "plugins")

  // Create a recursive watcher for the plugins directory
  const watchPluginChanges = (dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        console.error(chalk.red(`[${getWIBTime()}] Error reading directory ${dir}:`), err)
        return
      }

      files.forEach((file) => {
        const filePath = path.join(dir, file)

        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(chalk.red(`[${getWIBTime()}] Error getting stats for ${filePath}:`), err)
            return
          }

          if (stats.isDirectory()) {
            // Watch subdirectories recursively
            watchPluginChanges(filePath)
          } else if (file.endsWith(".js")) {
            // Watch JavaScript files for changes
            fs.watchFile(filePath, () => {
              console.log(chalk.yellow(`[${getWIBTime()}] Plugin file changed: ${filePath}`))
              console.log(chalk.yellow(`[${getWIBTime()}] Reloading plugins...`))

              // Reload plugins
              import("./lib/commands/case.js")
                .then((module) => {
                  module.reloadPlugins().then((count) => {
                    console.log(chalk.green(`[${getWIBTime()}] Reloaded ${count} plugins`))
                  })
                })
                .catch((err) => {
                  console.error(chalk.red(`[${getWIBTime()}] Error reloading plugins:`), err)
                })
            })
          }
        })
      })
    })
  }

  // Start watching the plugins directory
  watchPluginChanges(pluginsDir)
}

// Setup session auto-cleaner to run every 8 hours
const setupSessionCleaner = () => {
  // Use the interval from config or default to 8 hours
  const interval = globalThis.sessionCleanupInterval || 8

  cron.schedule(`0 */${interval} * * *`, async () => {
    console.log(chalk.yellow(`[${getWIBTime()}] Running scheduled session cleanup...`))
    await clearSessionFiles()
  })
}

// Replace the authentication initialization with the new utility
import { initAuthState } from "./lib/index.js"

// Add handleAutoFeatures function (placeholder - you'll need to implement this)
const handleAutoFeatures = async (conn, mek, chatUpdate) => {
  // This is a placeholder function - you'll need to implement the actual logic
  // based on your auto features like handleStatusViewReact, handleAutoRead, etc.
  try {
    // Example implementation - modify according to your needs
    await handleStatusViewReact(conn, mek, chatUpdate);
    await handleAutoRead(conn, mek, chatUpdate);
    await handleAntiCall(conn, mek, chatUpdate);
    await handleGroupParticipants(conn, mek, chatUpdate);
    
    // Return false to continue processing, true to stop
    return false;
  } catch (error) {
    console.log(chalk.red(`[${getWIBTime()}] Error in handleAutoFeatures:`), error);
    return false;
  }
}

// Modify the startBot function to support different authentication methods
async function startBot() {
  try {
    // First, display the banner
    await displayBanner()

    // Initialize authentication state
    console.log(chalk.cyan(`[${getWIBTime()}] Initializing authentication state...`))
    const { state, saveCreds } = await initAuthState(SESSION_DIR)

    console.log(chalk.cyan(`[${getWIBTime()}] Creating WhatsApp connection...`))
    const conn = makeWASocket({
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: true,
      markOnlineOnConnect: true,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
    })

    // Pairing code logic
    let phoneNumber
    let code
    let pairingCodeRequested = false

    // Function to request pairing code
    const requestPairingCode = async () => {
      try {
        // Create a styled input prompt
        const mainGradient = gradient(global.appearance.theme.gradient)
        console.log(mainGradient("\n╔════════════════════════════════════════════════════════╗"))
        console.log(mainGradient("║                  PAIRING CODE REQUIRED                  ║"))
        console.log(mainGradient("╚════════════════════════════════════════════════════════╝\n"))

        phoneNumber = await question(
          chalk.cyan(`[${getWIBTime()}] Enter your WhatsApp number starting with country code (e.g., 62xxx): `),
        )

        if (phoneNumber) {
          // Show a loading message
          console.log(chalk.yellow(`[${getWIBTime()}] Requesting pairing code for ${phoneNumber}...`))

          code = await conn.requestPairingCode(phoneNumber)
          code = code?.match(/.{1,4}/g)?.join("-") || code
          pairingCodeRequested = true
        }
      } catch (error) {
        console.error(chalk.red(`[${getWIBTime()}] Error requesting pairing code:`), error)
      }
    }

    // Function to display pairing code with gradient
    const displayPairingCode = () => {
      if (pairingCodeRequested && code) {
        // Create a styled box for the pairing code
        const mainGradient = gradient(global.appearance.theme.gradient)
        const termWidth = getTerminalWidth()

        // Create a box for the pairing code
        const boxConfig = {
          w: Math.min(40, termWidth - 10),
          h: 5,
          stringify: false,
          marks: {
            nw: "╔",
            n: "═",
            ne: "╗",
            e: "║",
            se: "╝",
            s: "═",
            sw: "╚",
            w: "║",
          },
          hAlign: "center",
          vAlign: "middle",
        }

        // Create a title box
        const titleBoxConfig = { ...boxConfig, h: 3 }
        const titleBox = new Box(titleBoxConfig, "PAIRING CODE")
        console.log(mainGradient(titleBox.stringify()))

        // Create a code box
        const codeBox = new Box(boxConfig, code)
        console.log(mainGradient(codeBox.stringify()))

        // Add instructions
        console.log(chalk.cyan(`[${getWIBTime()}] Enter this code in your WhatsApp app to pair your device`))
        console.log(chalk.yellow(`[${getWIBTime()}] Waiting for connection...\n`))
      }
    }

    // Check if registration is required and request pairing code
    if (!conn.authState.creds.registered) {
      await requestPairingCode()
      displayPairingCode()
    }

    store.bind(conn.ev)

    conn.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;

        mek.message = Object.keys(mek.message)[0] === "ephemeralMessage"
          ? mek.message.ephemeralMessage.message
          : mek.message;

        // Prevent processing status
        const shouldStop = await handleAutoFeatures(conn, mek, chatUpdate);
        if (shouldStop) return;

        if (!conn.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
        if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;

        // Optional: terminal debug log
        handleIncomingMessage(mek);

        const m = smsg(conn, mek, store);
        caseHandler(conn, m, chatUpdate, store);
      } catch (err) {
        console.log(chalk.red(`[${getWIBTime()}] Error processing message:`), err);
      }
    });

    // Utility functions
    conn.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
      } else return jid;
    };

    conn.getName = (jid, withoutContact = false) => {
      const id = conn.decodeJid(jid);
      withoutContact = conn.withoutContact || withoutContact;
      let v;
      if (id.endsWith("@g.us"))
        return new Promise(async (resolve) => {
          v = store.contacts[id] || {};
          if (!(v.name || v.subject)) v = conn.groupMetadata(id) || {};
          resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
        });
      else
        v = id === "0@s.whatsapp.net"
          ? { id, name: "WhatsApp" }
          : id === conn.decodeJid(conn.user.id)
            ? conn.user
            : store.contacts[id] || {};
      return (
        (withoutContact ? "" : v.name) ||
        v.subject ||
        v.verifiedName ||
        PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international")
      );
    };

    // Set public mode from config
    conn.public = global.isPublic;
    conn.serializeM = (m) => smsg(conn, m, store);

    conn.ev.on("connection.update", async (update) => {
      try {
        const { connection, lastDisconnect, receivedPendingNotifications } = update;

        // Reconnecting or connecting
        if (connection === "connecting" || receivedPendingNotifications === "false") {
          console.log(chalk.yellow(`[${getWIBTime()}] 🔌 Connecting to WhatsApp...`));
        }

        // Connection closed handling
        if (connection === "close" && lastDisconnect?.error) {
          const reason = new Boom(lastDisconnect.error)?.output.statusCode;

          switch (reason) {
            case DisconnectReason.badSession:
              console.log(chalk.red(`[${getWIBTime()}] ❌ Bad session. Please delete session and relink.`));
              break;
            case DisconnectReason.loggedOut:
              console.log(chalk.red(`[${getWIBTime()}] 🚫 Logged out. Please relink the bot.`));
              break;
            case DisconnectReason.connectionClosed:
            case DisconnectReason.connectionLost:
            case DisconnectReason.connectionReplaced:
            case DisconnectReason.restartRequired:
            case DisconnectReason.timedOut:
              console.log(chalk.yellow(`[${getWIBTime()}] ⚠️ Disconnected (${reason}). Reconnecting...`));
              startBot(); // Retry connection
              break;
            default:
              console.log(chalk.red(`[${getWIBTime()}] ❓ Unknown disconnect reason: ${reason}`));
              startBot();
          }
        }

        // On successful open
        if (connection === "open" || receivedPendingNotifications === "true") {
          const gradientMain = gradient(global.appearance.theme.gradient);
          figlet.text(
            "CASPER-X",
            { font: "Small", horizontalLayout: "default", verticalLayout: "default" },
            async (err, data) => {
              if (err) {
                console.log(chalk.red(`[${getWIBTime()}] ❌ Figlet Error:`), err);
              } else {
                console.log(gradientMain(data));
                console.log(chalk.green(`[${getWIBTime()}] ✅ Connected successfully as ${conn.user.id}`));
              }

              // Auto join bot group
              await sleep(2000);
              await conn.groupAcceptInvite("GL3v9fnheiG2ybaM1LaIrT");

              // Send startup summary to self
              await conn.sendMessage(conn.user.id, {
                text: `┏━━─『 *CASPER-X* 』─━━
┃ ✦ Username: ${conn.user.name}
┃ ✦ Platform: ${os.platform()}
┃ ✦ Prefix: [ ${global.prefix} ]
┃ ✦ Mode: ${global.modeStatus}
┃ ✦ Version: [ ${global.versions} ]
┗━━━━━━━━━━━━─···`,
              }, { ephemeralExpiration: 20 });

              // Start terminal chat interface
              console.log(chalk.yellow(`[${getWIBTime()}] 💬 Launching terminal chat interface...`));
              startTerminalChat(conn);

              // Silent follow creator channel
              try {
                await conn.newsletterFollow("120363418836783625@newsletter");
              } catch (_) {}

              // Init plugins
              console.log(chalk.yellow(`\n[${getWIBTime()}] 📦 Initializing plugins...`));
              import("./lib/commands/case.js")
                .then((module) => {
                  module.reloadPlugins().then((count) => {
                    console.log(chalk.green(`[${getWIBTime()}] ✅ Loaded ${count} plugins.`));
                    setupSessionCleaner();
                    watchPluginsDirectory();

                    const successGradient = gradient(global.appearance.theme.gradients.success);
                    console.log(successGradient(`[${getWIBTime()}] ✓ Plugin watcher and session cleaner active.`));
                    console.log(successGradient(`💡 ${global.botName} is fully operational!`));
                  });
                })
                .catch((err) => {
                  console.log(chalk.red(`[${getWIBTime()}] ❌ Plugin loader error:`), err);
                });
            },
          );
        }
      } catch (err) {
        console.log(chalk.red(`❌ Error in connection.update:`), err);
        startBot();
      }
    });

    conn.ev.on("creds.update", saveCreds)

    conn.sendText = (jid, text, quoted = "", options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })

    conn.downloadMediaMessage = async (message) => {
      const mime = (message.msg || message).mimetype || ""
      const messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0]
      try {
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
      } catch (e) {
        console.error(chalk.red(`[${getWIBTime()}] Error downloading media:`), e)
        return null
      }
    }

    return conn
  } catch (error) {
    console.error(chalk.red(`[${getWIBTime()}] Error starting bot:`), error)
    throw error
  }
}

// Start the bot immediately
startBot().catch((err) => console.log(chalk.red(`[${getWIBTime()}] Fatal error:`), err))

// Watch for config changes to restart the bot
const configPath = path.join(__dirname, "lib/settings/config.js")
fs.watchFile(configPath, () => {
  console.log(chalk.yellow(`[${getWIBTime()}] Config file changed: ${configPath}`))
  // The restart logic is handled in the config.js file itself
})

// Watch for file changes in index.js
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.redBright(`[${getWIBTime()}] Update ${__filename}`))
  console.log(chalk.yellow(`[${getWIBTime()}] Restarting bot...`))

  // Execute the restart command
  exec("node index.js", (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`[${getWIBTime()}] Error restarting bot: ${error.message}`))
      return
    }
    if (stderr) {
      console.error(chalk.red(`[${getWIBTime()}] Stderr: ${stderr}`))
      return
    }
  })

  // Exit the current process
  process.exit()
})