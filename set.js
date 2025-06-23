/**
 * Copyright (C) 2025 LatestURL
 *
 * This code is licensed under the MIT License.
 * See the LICENSE file in the repository root for full license text.
 *
 * HIRAGII Bot Global Settings Configuration
 * Version: 1.0.0
 * Created by LatestURL
 * GitHub: https://github.com/latesturl/HIRAGII
 */

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"
import moment from "moment-timezone"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Settings file path
const SETTINGS_FILE = path.join(__dirname, "config", "settings.json")
const CONFIG_DIR = path.join(__dirname, "config")

// Get current time for logging
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Default settings configuration
const DEFAULT_SETTINGS = {
  // Auto Handler Settings
  autoHandler: {
    // Status Settings
    autoViewStatus: true,
    autoLikeStatus: true,
    statusLikeEmoji: '🩷️',
    statusEmojis: ['❤️', '👍', '🔥', '😍', '💯', '⭐', '🎉', '👏'],
    randomEmoji: false,
    
    // Message Reading Settings
    autoReadMessages: false,
    autoReadPrivateOnly: false,
    autoReadGroupOnly: true,
    autoReadNewsletter: true,
    
    // Presence Simulator Settings
    presenceSimulator: {
      enabled: false,
      mode: 'online', // 'online', 'typing', 'recording'
      interval: 3000, // 30 seconds
      randomize: true,
      randomInterval: {
        min: 1500, // 15 seconds
        max: 6000  // 60 seconds
      }
    },
    
    // Advanced Settings
    delays: {
      statusLike: 200, // 2 seconds delay between status likes
      messageRead: 500,  // 0.5 seconds delay for message reading
      presenceUpdate: 1000 // 1 second delay for presence updates
    },
    
    // Filters
    filters: {
      excludeContacts: [], // Phone numbers to exclude from auto features
      includeContacts: [], // Only these contacts (if not empty)
      excludeGroups: [],   // Group IDs to exclude
      includeGroups: [],   // Only these groups (if not empty)
      excludeKeywords: [], // Messages containing these keywords will be ignored
      onlyKeywords: []     // Only process messages with these keywords (if not empty)
    },
    
    // Logging
    logging: true,
    detailedLogs: false
  },
  
  // Bot General Settings
  bot: {
    name: "CASPER-X",
    version: "1.0.0",
    prefix: ".",
    timezone: "Africa/Nairobi",
    language: "en",
    autoRestart: true,
    debugMode: false
  },
  
  // Security Settings
  security: {
    owners: [], // Owner phone numbers
    admins: [], // Admin phone numbers
    blacklist: [], // Blacklisted phone numbers
    antiSpam: {
      enabled: true,
      maxMessages: 5,
      timeWindow: 60000 // 1 minute
    }
  },
  
  // Database Settings
  database: {
    type: "json", // json, mongodb, mysql
    autoBackup: true,
    backupInterval: 86400000, // 24 hours
    maxBackups: 7
  },
  
  // Performance Settings
  performance: {
    maxConcurrentOperations: 10,
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 30
    },
    caching: {
      enabled: true,
      ttl: 300000 // 5 minutes
    }
  }
}

// Settings management class
class GlobalSettings {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS }
    this.loaded = false
  }
  
  // Initialize settings
  async init() {
    try {
      // Ensure config directory exists
      await this.ensureConfigDir()
      
      // Load existing settings
      await this.load()
      
      this.loaded = true
      this.log('Global settings initialized', 'success')
      
      return this.settings
    } catch (error) {
      this.log(`Error initializing settings: ${error.message}`, 'error')
      return this.settings
    }
  }
  
  // Ensure config directory exists
  async ensureConfigDir() {
    try {
      await fs.access(CONFIG_DIR)
    } catch {
      await fs.mkdir(CONFIG_DIR, { recursive: true })
      this.log('Config directory created', 'info')
    }
  }
  
  // Load settings from file
  async load() {
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf8')
      const loadedSettings = JSON.parse(data)
      
      // Merge with defaults to ensure all properties exist
      this.settings = this.mergeDeep(DEFAULT_SETTINGS, loadedSettings)
      
      this.log('Settings loaded from file', 'success')
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it with defaults
        await this.save()
        this.log('Settings file created with defaults', 'info')
      } else {
        this.log(`Error loading settings: ${error.message}`, 'error')
      }
    }
  }
  
  // Save settings to file
  async save() {
    try {
      await this.ensureConfigDir()
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(this.settings, null, 2))
      this.log('Settings saved to file', 'success')
    } catch (error) {
      this.log(`Error saving settings: ${error.message}`, 'error')
    }
  }
  
  // Get all settings
  getAll() {
    return { ...this.settings }
  }
  
  // Get specific setting
  get(path) {
    return this.getNestedValue(this.settings, path)
  }
  
  // Set specific setting
  async set(path, value) {
    this.setNestedValue(this.settings, path, value)
    await this.save()
    this.log(`Setting updated: ${path} = ${JSON.stringify(value)}`, 'info')
  }
  
  // Update multiple settings
  async update(updates) {
    this.settings = this.mergeDeep(this.settings, updates)
    await this.save()
    this.log('Multiple settings updated', 'info')
  }
  
  // Reset to defaults
  async reset() {
    this.settings = { ...DEFAULT_SETTINGS }
    await this.save()
    this.log('Settings reset to defaults', 'warning')
  }
  
  // Auto Handler specific methods
  async enableAutoViewStatus() {
    await this.set('autoHandler.autoViewStatus', true)
  }
  
  async disableAutoViewStatus() {
    await this.set('autoHandler.autoViewStatus', false)
  }
  
  async enableAutoLikeStatus() {
    await this.set('autoHandler.autoLikeStatus', true)
  }
  
  async disableAutoLikeStatus() {
    await this.set('autoHandler.autoLikeStatus', false)
  }
  
  async setStatusEmoji(emoji) {
    await this.set('autoHandler.statusLikeEmoji', emoji)
  }
  
  async enableRandomEmoji() {
    await this.set('autoHandler.randomEmoji', true)
  }
  
  async disableRandomEmoji() {
    await this.set('autoHandler.randomEmoji', false)
  }
  
  async enableAutoRead() {
    await this.set('autoHandler.autoReadMessages', true)
  }
  
  async disableAutoRead() {
    await this.set('autoHandler.autoReadMessages', false)
  }
  
  async enableNewsletterRead() {
    await this.set('autoHandler.autoReadNewsletter', true)
  }
  
  async disableNewsletterRead() {
    await this.set('autoHandler.autoReadNewsletter', false)
  }
  
  async enablePresenceSimulator() {
    await this.set('autoHandler.presenceSimulator.enabled', true)
  }
  
  async disablePresenceSimulator() {
    await this.set('autoHandler.presenceSimulator.enabled', false)
  }
  
  async setPresenceMode(mode) {
    if (!['online', 'typing', 'recording'].includes(mode)) {
      throw new Error('Invalid presence mode. Use: online, typing, or recording')
    }
    await this.set('autoHandler.presenceSimulator.mode', mode)
  }
  
  async setPresenceInterval(interval) {
    if (interval < 5000) {
      throw new Error('Presence interval must be at least 5 seconds')
    }
    await this.set('autoHandler.presenceSimulator.interval', interval)
  }
  
  // Filter management methods
  async addExcludeContact(number) {
    const current = this.get('autoHandler.filters.excludeContacts') || []
    if (!current.includes(number)) {
      current.push(number)
      await this.set('autoHandler.filters.excludeContacts', current)
    }
  }
  
  async removeExcludeContact(number) {
    const current = this.get('autoHandler.filters.excludeContacts') || []
    const updated = current.filter(n => n !== number)
    await this.set('autoHandler.filters.excludeContacts', updated)
  }
  
  async addExcludeGroup(groupId) {
    const current = this.get('autoHandler.filters.excludeGroups') || []
    if (!current.includes(groupId)) {
      current.push(groupId)
      await this.set('autoHandler.filters.excludeGroups', current)
    }
  }
  
  async removeExcludeGroup(groupId) {
    const current = this.get('autoHandler.filters.excludeGroups') || []
    const updated = current.filter(g => g !== groupId)
    await this.set('autoHandler.filters.excludeGroups', updated)
  }
  
  // Utility methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }
  
  setNestedValue(obj, path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }
      return current[key]
    }, obj)
    target[lastKey] = value
  }
  
  mergeDeep(target, source) {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }
  
  log(message, type = 'info') {
    if (!this.get('autoHandler.logging')) return
    
    const colors = {
      info: chalk.cyan,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    }
    
    const color = colors[type] || chalk.white
    console.log(color(`[${getTime()}] [SETTINGS] ${message}`))
  }
  
  // Export current settings to file
  async exportSettings(filePath) {
    try {
      await fs.writeFile(filePath, JSON.stringify(this.settings, null, 2))
      this.log(`Settings exported to ${filePath}`, 'success')
    } catch (error) {
      this.log(`Error exporting settings: ${error.message}`, 'error')
    }
  }
  
  // Import settings from file
  async importSettings(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8')
      const importedSettings = JSON.parse(data)
      
      this.settings = this.mergeDeep(DEFAULT_SETTINGS, importedSettings)
      await this.save()
      
      this.log(`Settings imported from ${filePath}`, 'success')
    } catch (error) {
      this.log(`Error importing settings: ${error.message}`, 'error')
    }
  }
  
  // Get settings summary
  getSummary() {
    const autoHandler = this.get('autoHandler')
    
    return {
      autoViewStatus: autoHandler.autoViewStatus,
      autoLikeStatus: autoHandler.autoLikeStatus,
      statusEmoji: autoHandler.statusLikeEmoji,
      autoReadMessages: autoHandler.autoReadMessages,
      autoReadNewsletter: autoHandler.autoReadNewsletter,
      presenceSimulator: autoHandler.presenceSimulator.enabled,
      presenceMode: autoHandler.presenceSimulator.mode,
      excludedContacts: autoHandler.filters.excludeContacts.length,
      excludedGroups: autoHandler.filters.excludeGroups.length,
      logging: autoHandler.logging
    }
  }
}

// Create global instance
const globalSettings = new GlobalSettings()

// Export singleton instance and methods
export default globalSettings
export const settings = globalSettings

// Convenient export functions
export const initSettings = () => globalSettings.init()
export const getSettings = () => globalSettings.getAll()
export const getSetting = (path) => globalSettings.get(path)
export const setSetting = (path, value) => globalSettings.set(path, value)
export const updateSettings = (updates) => globalSettings.update(updates)
export const resetSettings = () => globalSettings.reset()
export const saveSettings = () => globalSettings.save()

// Auto Handler convenience functions
export const enableAutoViewStatus = () => globalSettings.enableAutoViewStatus()
export const disableAutoViewStatus = () => globalSettings.disableAutoViewStatus()
export const enableAutoLikeStatus = () => globalSettings.enableAutoLikeStatus()
export const disableAutoLikeStatus = () => globalSettings.disableAutoLikeStatus()
export const setStatusEmoji = (emoji) => globalSettings.setStatusEmoji(emoji)
export const enableAutoRead = () => globalSettings.enableAutoRead()
export const disableAutoRead = () => globalSettings.disableAutoRead()
export const enableNewsletterRead = () => globalSettings.enableNewsletterRead()
export const disableNewsletterRead = () => globalSettings.disableNewsletterRead()
export const enablePresenceSimulator = () => globalSettings.enablePresenceSimulator()
export const disablePresenceSimulator = () => globalSettings.disablePresenceSimulator()
export const setPresenceMode = (mode) => globalSettings.setPresenceMode(mode)
export const setPresenceInterval = (interval) => globalSettings.setPresenceInterval(interval)

// Filter management exports
export const addExcludeContact = (number) => globalSettings.addExcludeContact(number)
export const removeExcludeContact = (number) => globalSettings.removeExcludeContact(number)
export const addExcludeGroup = (groupId) => globalSettings.addExcludeGroup(groupId)
export const removeExcludeGroup = (groupId) => globalSettings.removeExcludeGroup(groupId)

// Utility exports
export const exportSettings = (filePath) => globalSettings.exportSettings(filePath)
export const importSettings = (filePath) => globalSettings.importSettings(filePath)
export const getSettingsSummary = () => globalSettings.getSummary()