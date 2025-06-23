/**
 * Copyright (C) 2025 LatestURL
 *
 * This code is licensed under the MIT License.
 * See the LICENSE file in the repository root for full license text.
 *
 * HIRAGII Bot Auto Handler for WhatsApp Features
 * Version: 1.0.0
 * Created by LatestURL
 * GitHub: https://github.com/latesturl/HIRAGII
 */

import chalk from "chalk"
import fs from "fs"
import { fileURLToPath } from "url"
import path from "path"
import moment from "moment-timezone"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Global connection reference
let conn = null
let autoSettings = {
  autoViewStatus: true,
  autoLikeStatus: true,
  statusLikeEmoji: '💝',
  autoReadMessages: false,
  autoReadNewsletter: false,
  presenceSimulator: {
    enabled: false,
    mode: 'online', // 'online', 'typing', 'recording'
    interval: 300, // 30 seconds
    randomize: true
  },
  logging: true
}

// Tracking variables
let presenceInterval = null
let viewedStatuses = new Set()
let likedStatuses = new Set()
let lastPresenceUpdate = 0

// Get current time for logging
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Log function with settings check
const log = (message, type = 'info') => {
  if (!autoSettings.logging) return
  
  const colors = {
    info: chalk.cyan,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    status: chalk.magenta
  }
  
  const color = colors[type] || chalk.white
  console.log(color(`[${getTime()}] [AUTO] ${message}`))
}

// Initialize auto handler
export const initAutoHandler = async (waConnection, settings = {}) => {
  conn = waConnection
  
  // Merge settings
  autoSettings = { ...autoSettings, ...settings }
  
  log('Auto Handler initialized', 'success')
  log(`Settings: ${JSON.stringify(autoSettings, null, 2)}`, 'info')
  
  // Start presence simulator if enabled
  if (autoSettings.presenceSimulator.enabled) {
    startPresenceSimulator()
  }
}

// Update settings
export const updateAutoSettings = (newSettings) => {
  const oldSettings = { ...autoSettings }
  autoSettings = { ...autoSettings, ...newSettings }
  
  log('Settings updated', 'info')
  
  // Handle presence simulator state change
  if (oldSettings.presenceSimulator.enabled !== autoSettings.presenceSimulator.enabled) {
    if (autoSettings.presenceSimulator.enabled) {
      startPresenceSimulator()
    } else {
      stopPresenceSimulator()
    }
  }
  
  return autoSettings
}

// Get current settings
export const getAutoSettings = () => {
  return { ...autoSettings }
}

// Auto view status handler
export const handleStatusView = async (statusMessage) => {
  if (!autoSettings.autoViewStatus || !conn) return
  
  try {
    const statusId = statusMessage.key.id
    const sender = statusMessage.key.remoteJid
    
    // Skip if already viewed
    if (viewedStatuses.has(statusId)) return
    
    // Only process status@broadcast
    if (sender !== 'status@broadcast') return
    
    // Mark as viewed to avoid duplicates
    viewedStatuses.add(statusId)
    
    // View the status
    await conn.readMessages([statusMessage.key])
    
    log(`Auto-viewed status from ${statusMessage.pushName || 'Unknown'}`, 'status')
    
    // Clean up old viewed statuses (keep last 1000)
    if (viewedStatuses.size > 1000) {
      const statusArray = Array.from(viewedStatuses)
      viewedStatuses = new Set(statusArray.slice(-500))
    }
    
  } catch (error) {
    log(`Error auto-viewing status: ${error.message}`, 'error')
  }
}

// Auto like status handler
export const handleStatusLike = async (statusMessage) => {
  if (!autoSettings.autoLikeStatus || !conn) return
  
  try {
    const statusId = statusMessage.key.id
    const sender = statusMessage.key.remoteJid
    
    // Skip if already liked
    if (likedStatuses.has(statusId)) return
    
    // Only process status@broadcast
    if (sender !== 'status@broadcast') return
    
    // Skip own status
    if (statusMessage.key.fromMe) return
    
    // Mark as liked to avoid duplicates
    likedStatuses.add(statusId)
    
    // Send reaction (like)
    await conn.sendMessage('status@broadcast', {
      react: {
        text: autoSettings.statusLikeEmoji,
        key: statusMessage.key
      }
    })
    
    log(`Auto-liked status from ${statusMessage.pushName || 'Unknown'} with ${autoSettings.statusLikeEmoji}`, 'status')
    
    // Clean up old liked statuses (keep last 1000)
    if (likedStatuses.size > 1000) {
      const statusArray = Array.from(likedStatuses)
      likedStatuses = new Set(statusArray.slice(-500))
    }
    
  } catch (error) {
    log(`Error auto-liking status: ${error.message}`, 'error')
  }
}

// Auto read messages handler
export const handleAutoRead = async (message) => {
  if (!autoSettings.autoReadMessages || !conn) return
  
  try {
    // Skip own messages
    if (message.key.fromMe) return
    
    const sender = message.key.remoteJid
    
    // Skip status broadcasts
    if (sender === 'status@broadcast') return
    
    // Auto read the message
    await conn.readMessages([message.key])
    
    const isGroup = sender.endsWith('@g.us')
    const senderName = message.pushName || sender.split('@')[0]
    
  //  log(`Auto-read message from ${senderName} ${isGroup ? '(Group)' : '(Private)'}`, 'info')
    
  } catch (error) {
    log(`Error auto-reading message: ${error.message}`, 'error')
  }
}

// Auto read newsletter handler
export const handleNewsletterRead = async (message) => {
  if (!autoSettings.autoReadNewsletter || !conn) return
  
  try {
    const sender = message.key.remoteJid
    
    // Only process newsletter messages (ends with @newsletter)
    if (!sender.endsWith('@newsletter')) return
    
    // Skip own messages
    if (message.key.fromMe) return
    
    // Auto read the newsletter message
    await conn.readMessages([message.key])
    
    const newsletterName = message.pushName || sender.split('@')[0]
   // log(`Auto-read newsletter from ${newsletterName}`, 'info')
    
  } catch (error) {
    log(`Error auto-reading newsletter: ${error.message}`, 'error')
  }
}

// Presence simulator
const startPresenceSimulator = () => {
  if (presenceInterval) {
    clearInterval(presenceInterval)
  }
  
  log(`Starting presence simulator - Mode: ${autoSettings.presenceSimulator.mode}`, 'success')
  
  const updatePresence = async () => {
    if (!conn || !autoSettings.presenceSimulator.enabled) return
    
    try {
      let presenceType = autoSettings.presenceSimulator.mode
      
      // Randomize presence if enabled
      if (autoSettings.presenceSimulator.randomize) {
        const modes = ['available', 'composing', 'recording']
        presenceType = modes[Math.floor(Math.random() * modes.length)]
      }
      
      // Map modes to WhatsApp presence types
      const presenceMap = {
        'online': 'available',
        'typing': 'composing',
        'recording': 'recording'
      }
      
      const mappedPresence = presenceMap[presenceType] || presenceType
      
      // Update presence
      await conn.sendPresenceUpdate(mappedPresence)
      
      log(`Presence updated to: ${presenceType}`, 'info')
      lastPresenceUpdate = Date.now()
      
    } catch (error) {
      log(`Error updating presence: ${error.message}`, 'error')
    }
  }
  
  // Initial update
  updatePresence()
  
  // Set interval for continuous updates
  presenceInterval = setInterval(updatePresence, autoSettings.presenceSimulator.interval)
}

const stopPresenceSimulator = () => {
  if (presenceInterval) {
    clearInterval(presenceInterval)
    presenceInterval = null
    log('Presence simulator stopped', 'warning')
  }
}

// Main message handler - call this from your main bot
export const handleAutoFeatures = async (message) => {
  if (!conn || !message) return
  
  try {
    const sender = message.key.remoteJid
    
    // Handle different message types
    if (sender === 'status@broadcast') {
      // Handle status messages
      await handleStatusView(message)
      await handleStatusLike(message)
    } else if (sender.endsWith('@newsletter')) {
      // Handle newsletter messages
      await handleNewsletterRead(message)
    } else {
      // Handle regular messages
      await handleAutoRead(message)
    }
    
  } catch (error) {
    log(`Error in auto features handler: ${error.message}`, 'error')
  }
}

// Presence update for specific chats
export const updatePresenceForChat = async (chatId, presenceType = 'available') => {
  if (!conn) return
  
  try {
    await conn.sendPresenceUpdate(presenceType, chatId)
    log(`Presence updated to ${presenceType} for chat: ${chatId.split('@')[0]}`, 'info')
  } catch (error) {
    log(`Error updating presence for chat: ${error.message}`, 'error')
  }
}

// Batch operations
export const performBatchStatusOperations = async () => {
  if (!conn) return
  
  log('Starting batch status operations...', 'info')
  
  try {
    // Get all status messages
    const statusMessages = await conn.fetchStatus()
    
    for (const status of statusMessages) {
      if (autoSettings.autoViewStatus) {
        await handleStatusView(status)
      }
      
      if (autoSettings.autoLikeStatus) {
        await handleStatusLike(status)
        // Add delay to avoid spam
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    log('Batch status operations completed', 'success')
    
  } catch (error) {
    log(`Error in batch status operations: ${error.message}`, 'error')
  }
}

// Statistics
export const getAutoStats = () => {
  return {
    viewedStatuses: viewedStatuses.size,
    likedStatuses: likedStatuses.size,
    lastPresenceUpdate: lastPresenceUpdate,
    presenceSimulatorActive: !!presenceInterval,
    settings: autoSettings
  }
}

// Clean up function
export const cleanupAutoHandler = () => {
  stopPresenceSimulator()
  viewedStatuses.clear()
  likedStatuses.clear()
  log('Auto handler cleaned up', 'warning')
}

// Export settings management functions
export const enableAutoViewStatus = () => updateAutoSettings({ autoViewStatus: true })
export const disableAutoViewStatus = () => updateAutoSettings({ autoViewStatus: false })
export const enableAutoLikeStatus = () => updateAutoSettings({ autoLikeStatus: true })
export const disableAutoLikeStatus = () => updateAutoSettings({ autoLikeStatus: false })
export const enableAutoRead = () => updateAutoSettings({ autoReadMessages: true })
export const disableAutoRead = () => updateAutoSettings({ autoReadMessages: false })
export const enableNewsletterRead = () => updateAutoSettings({ autoReadNewsletter: true })
export const disableNewsletterRead = () => updateAutoSettings({ autoReadNewsletter: false })

export const setStatusEmoji = (emoji) => updateAutoSettings({ statusLikeEmoji: emoji })
export const setPresenceMode = (mode) => updateAutoSettings({ 
  presenceSimulator: { ...autoSettings.presenceSimulator, mode } 
})

// Watch for file changes
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.redBright(`[${getTime()}] Update ${__filename}`))
  import(`file://${__filename}?update=${Date.now()}`).catch(console.error)
})