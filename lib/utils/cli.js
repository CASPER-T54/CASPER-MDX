#!/usr/bin/env node

/**
 * Copyright (C) 2025 LatestURL
 *
 * HIRAGII Bot Settings CLI Manager
 * Command line interface for managing bot settings
 */

import readline from 'readline'
import chalk from 'chalk'
import Table from 'cli-table3'
import { 
  initSettings, 
  getSettings, 
  getSettingsSummary,
  enableAutoViewStatus,
  disableAutoViewStatus,
  enableAutoLikeStatus,
  disableAutoLikeStatus,
  setStatusEmoji,
  enableAutoRead,
  disableAutoRead,
  enableNewsletterRead,
  disableNewsletterRead,
  enablePresenceSimulator,
  disablePresenceSimulator,
  setPresenceMode,
  setPresenceInterval,
  addExcludeContact,
  removeExcludeContact,
  exportSettings,
  importSettings,
  resetSettings
} from './set.js'

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Main CLI class
class SettingsCLI {
  constructor() {
    this.running = true
  }
  
  async start() {
    console.log(chalk.cyan(`
╔══════════════════════════════════════╗
║        CASPER-X Settings Manager      ║
║              Version 1.0.0           ║
╚══════════════════════════════════════╝
    `))
    
    // Initialize settings
    await initSettings()
    console.log(chalk.green('Settings loaded successfully!\n'))
    
    // Show main menu
    this.showMainMenu()
    
    // Start command processing
    this.processCommands()
  }
  
  showMainMenu() {
    console.log(chalk.yellow('Available Commands:'))
    
    const table = new Table({
      chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
        'right': '║', 'right-mid': '╢', 'middle': '│'
      },
      style: { head: ['cyan'], border: ['grey'] },
      head: ['Command', 'Description'],
      colWidths: [20, 40]
    })
    
    table.push(
      ['status', 'Manage auto status features'],
      ['read', 'Manage auto read features'],
      ['presence', 'Manage presence simulator'],
      ['filters', 'Manage contact/group filters'],
      ['show', 'Show current settings'],
      ['export [file]', 'Export settings to file'],
      ['import [file]', 'Import settings from file'],
      ['reset', 'Reset all settings to default'],
      ['help', 'Show detailed help'],
      ['exit', 'Exit settings manager']
    )
    
    console.log(table.toString())
    console.log('')
  }
  
  processCommands() {
    rl.on('line', async (input) => {
      const args = input.trim().split(' ')
      const command = args[0].toLowerCase()
      
      try {
        switch (command) {
          case 'status':
            await this.handleStatusCommands(args.slice(1))
            break
            
          case 'read':
            await this.handleReadCommands(args.slice(1))
            break
            
          case 'presence':
            await this.handlePresenceCommands(args.slice(1))
            break
            
          case 'filters':
            await this.handleFilterCommands(args.slice(1))
            break
            
          case 'show':
            this.showCurrentSettings()
            break
            
          case 'export':
            await this.exportSettings(args[1] || 'settings-backup.json')
            break
            
          case 'import':
            await this.importSettings(args[1] || 'settings-backup.json')
            break
            
          case 'reset':
            await this.confirmReset()
            break
            
          case 'help':
            this.showDetailedHelp()
            break
            
          case 'exit':
            console.log(chalk.yellow('Goodbye!'))
            process.exit(0)
            break
            
          case '':
            // Empty command, show menu again
            this.showMainMenu()
            break
            
          default:
            console.log(chalk.red(`Unknown command: ${command}`))
            console.log(chalk.yellow('Type "help" for available commands\n'))
        }
      } catch (error) {
        console.log(chalk.red(`Error: ${error.message}\n`))
      }
      
      this.prompt()
    })
    
    this.prompt()
  }
  
  async handleStatusCommands(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('Status Commands:'))
      console.log('  view on/off     - Toggle auto view status')
      console.log('  like on/off     - Toggle auto like status')
      console.log('  emoji [emoji]   - Set status like emoji')
      console.log('  random on/off   - Toggle random emoji\n')
      return
    }
    
    const subCommand = args[0].toLowerCase()
    
    switch (subCommand) {
      case 'view':
        if (args[1] === 'on') {
          await enableAutoViewStatus()
          console.log(chalk.green('✅ Auto view status enabled\n'))
        } else if (args[1] === 'off') {
          await disableAutoViewStatus()
          console.log(chalk.red('❌ Auto view status disabled\n'))
        } else {
          console.log(chalk.yellow('Usage: status view on/off\n'))
        }
        break
        
      case 'like':
        if (args[1] === 'on') {
          await enableAutoLikeStatus()
          console.log(chalk.green('✅ Auto like status enabled\n'))
        } else if (args[1] === 'off') {
          await disableAutoLikeStatus()
          console.log(chalk.red('❌ Auto like status disabled\n'))
        } else {
          console.log(chalk.yellow('Usage: status like on/off\n'))
        }
        break
        
      case 'emoji':
        if (args[1]) {
          await setStatusEmoji(args[1])
          console.log(chalk.green(`✅ Status emoji set to: ${args[1]}\n`))
        } else {
          console.log(chalk.yellow('Usage: status emoji [emoji]\n'))
        }
        break
        
      default:
        console.log(chalk.red(`Unknown status command: ${subCommand}\n`))
    }
  }
  
  async handleReadCommands(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('Read Commands:'))
      console.log('  messages on/off    - Toggle auto read messages')
      console.log('  newsletter on/off  - Toggle auto read newsletters')
      console.log('  private on/off     - Auto read private messages only')
      console.log('  groups on/off      - Auto read group messages only\n')
      return
    }
    
    const subCommand = args[0].toLowerCase()
    
    switch (subCommand) {
      case 'messages':
        if (args[1] === 'on') {
          await enableAutoRead()
          console.log(chalk.green('✅ Auto read messages enabled\n'))
        } else if (args[1] === 'off') {
          await disableAutoRead()
          console.log(chalk.red('❌ Auto read messages disabled\n'))
        }
        break
        
      case 'newsletter':
        if (args[1] === 'on') {
          await enableNewsletterRead()
          console.log(chalk.green('✅ Auto read newsletters enabled\n'))
        } else if (args[1] === 'off') {
          await disableNewsletterRead()
          console.log(chalk.red('❌ Auto read newsletters disabled\n'))
        }
        break
        
      default:
        console.log(chalk.red(`Unknown read command: ${subCommand}\n`))
    }
  }
  
  async handlePresenceCommands(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('Presence Commands:'))
      console.log('  on/off              - Toggle presence simulator')
      console.log('  mode [online/typing/recording] - Set presence mode')
      console.log('  interval [seconds]  - Set update interval')
      console.log('  random on/off       - Toggle random mode\n')
      return
    }
    
    const subCommand = args[0].toLowerCase()
    
    switch (subCommand) {
      case 'on':
        await enablePresenceSimulator()
        console.log(chalk.green('✅ Presence simulator enabled\n'))
        break
        
      case 'off':
        await disablePresenceSimulator()
        console.log(chalk.red('❌ Presence simulator disabled\n'))
        break
        
      case 'mode':
        if (['online', 'typing', 'recording'].includes(args[1])) {
          await setPresenceMode(args[1])
          console.log(chalk.green(`✅ Presence mode set to: ${args[1]}\n`))
        } else {
          console.log(chalk.yellow('Usage: presence mode [online/typing/recording]\n'))
        }
        break
        
      case 'interval':
        if (args[1] && !isNaN(args[1])) {
          const seconds = parseInt(args[1])
          await setPresenceInterval(seconds * 1000)
          console.log(chalk.green(`✅ Presence interval set to: ${seconds} seconds\n`))
        } else {
          console.log(chalk.yellow('Usage: presence interval [seconds]\n'))
        }
        break
        
      default:
        console.log(chalk.red(`Unknown presence command: ${subCommand}\n`))
    }
  }
  
  async handleFilterCommands(args) {
    if (args.length === 0) {
      console.log(chalk.yellow('Filter Commands:'))
      console.log('  exclude add [number]     - Add contact to exclude list')
      console.log('  exclude remove [number]  - Remove contact from exclude list')
      console.log('  exclude list             - Show excluded contacts')
      console.log('  groups list              - Show group filters\n')
      return
    }
    
    const subCommand = args[0].toLowerCase()
    
    switch (subCommand) {
      case 'exclude':
        if (args[1] === 'add' && args[2]) {
          await addExcludeContact(args[2])
          console.log(chalk.green(`✅ Added ${args[2]} to exclude list\n`))
        } else if (args[1] === 'remove' && args[2]) {
          await removeExcludeContact(args[2])
          console.log(chalk.green(`✅ Removed ${args[2]} from exclude list\n`))
        } else if (args[1] === 'list') {
          const settings = getSettings()
          const excluded = settings.autoHandler.filters.excludeContacts
          console.log(chalk.cyan('Excluded Contacts:'))
          excluded.forEach(contact => console.log(`  - ${contact}`))
          console.log('')
        }
        break
        
      default:
        console.log(chalk.red(`Unknown filter command: ${subCommand}\n`))
    }
  }
  
  showCurrentSettings() {
    const summary = getSettingsSummary()
    
    console.log(chalk.cyan('\n📋 Current Settings Summary:\n'))
    
    const table = new Table({
      chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
        'right': '║', 'right-mid': '╢', 'middle': '│'
      },
      style: { head: ['cyan'], border: ['grey'] },
      head: ['Setting', 'Status'],
      colWidths: [25, 15]
    })
    
    table.push(
      ['Auto View Status', summary.autoViewStatus ? '✅ ON' : '❌ OFF'],
      ['Auto Like Status', summary.autoLikeStatus ? '✅ ON' : '❌ OFF'],
      ['Status Emoji', summary.statusEmoji],
      ['Auto Read Messages', summary.autoReadMessages ? '✅ ON' : '❌ OFF'],
      ['Auto Read Newsletter', summary.autoReadNewsletter ? '✅ ON' : '❌ OFF'],
      ['Presence Simulator', summary.presenceSimulator ? '✅ ON' : '❌ OFF'],
      ['Presence Mode', summary.presenceMode],
      ['Excluded Contacts', summary.excludedContacts.toString()],
      ['Excluded Groups', summary.excludedGroups.toString()],
      ['Logging', summary.logging ? '✅ ON' : '❌ OFF']
    )
    
    console.log(table.toString())
    console.log('')
  }
  
  showDetailedHelp() {
    console.log(chalk.cyan(`
📖 CASPER-X Settings Manager - Detailed Help

🔍 NAVIGATION:
• Type command name to see sub-commands
• Use "show" to see current settings
• Use "exit" to quit

📱 STATUS FEATURES:
• status view on/off     - Automatically view all status updates
• status like on/off     - Automatically like all status updates  
• status emoji [emoji]   - Set custom emoji for status likes

📖 READING FEATURES:
• read messages on/off   - Auto-read all incoming messages
• read newsletter on/off - Auto-read newsletter messages

👤 PRESENCE FEATURES:
• presence on/off        - Enable/disable presence simulator
• presence mode [type]   - Set to online, typing, or recording
• presence interval [s]  - Set update interval in seconds

🔧 FILTERS:
• filters exclude add [number]    - Don't auto-interact with contact
• filters exclude remove [number] - Remove from exclude list
• filters exclude list           - Show excluded contacts

💾 BACKUP & RESTORE:
• export [filename]      - Save settings to file
• import [filename]      - Load settings from file
• reset                 - Reset all settings to default

⚠️  WARNING: Reset will permanently delete all custom settings!
    `))
  }
  
  async exportSettings(filename) {
    try {
      await exportSettings(filename)
      console.log(chalk.green(`✅ Settings exported to: ${filename}\n`))
    } catch (error) {
      console.log(chalk.red(`❌ Export failed: ${error.message}\n`))
    }
  }
  
  async importSettings(filename) {
    try {
      await importSettings(filename)
      console.log(chalk.green(`✅ Settings imported from: ${filename}\n`))
    } catch (error) {
      console.log(chalk.red(`❌ Import failed: ${error.message}\n`))
    }
  }
  
  async confirmReset() {
    console.log(chalk.red('⚠️  WARNING: This will reset ALL settings to default values!'))
    rl.question(chalk.yellow('Type "CONFIRM" to proceed: '), async (answer) => {
      if (answer === 'CONFIRM') {
        await resetSettings()
        console.log(chalk.green('✅ Settings reset to defaults\n'))
      } else {
        console.log(chalk.cyan('Reset cancelled\n'))
      }
      this.prompt()
    })
  }
  
  prompt() {
    rl.setPrompt(chalk.green('CASPER-TECH> '))
    rl.prompt()
  }
}

// Start CLI if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new SettingsCLI()
  cli.start().catch(console.error)
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nGoodbye!'))
    process.exit(0)
  })
}

export default SettingsCLI