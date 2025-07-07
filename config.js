import { fileURLToPath } from "url"
import fs from "fs"

// Command usage & download limits per user type
const limit = {
   free: 25,
   premium: 250,
   VIP: "Unlimited",
   download: {
      free: 30_000_000,       // 30MB
      premium: 100_000_000,   // 100MB
      VIP: 1_130_000_000       // ~1.13GB
   }
}

export default {
   limit,

   // External API settings (plug in your API keys securely)
  APIs: {
  neoxr: {
    URI: 'https://neoxr-api.vercel.app',
    Key: process.env.BOT_API_KEY
  }
}
,

   // GenesisBot system messages
   msg: {
      owner: '⚠️ This command is restricted to GenesisBot owners.',
      group: '⚠️ This command can only be used in group chats.',
      private: '⚠️ This command works only in private chats.',
      admin: '⚠️ This command requires group admin privileges.',
      botAdmin: '⚠️ I need admin rights to perform this action.',
      bot: '⚠️ This feature is only accessible by the bot.',
      locked: '⚠️ This feature is currently disabled.',
      media: '📎 Please reply to a media message.',
      error: '❌ Something went wrong while executing the command.',
      quoted: '💬 Please reply to a message.',
      wait: '⏳ Processing your request... Please wait.',
      premium: '👑 This command is reserved for Premium users.',
      vip: '🌟 Only VIP users can access this exclusive feature.',
      dlFree: `📦 File exceeds ${formatSize(limit.download.free)}. Upgrade to Premium to continue.`,
      dlPremium: `📦 File exceeds ${formatSize(limit.download.premium)}. VIP required.`,
      dlVIP: `📦 File exceeds ${formatSize(limit.download.VIP)}. File too large for WhatsApp Web.`
   },

   // GenesisBot control options
   options: {
      public: false, // true = public bot, false = private (owner-only)
      URI: "database.json", // Replace with MongoDB URI if needed
      owner: ["254738701209"], // Add your WhatsApp numbers
      pathCommand: 'commands' // Folder where your commands are stored
   },

   // Exif metadata for sticker branding
   Exif: {
      packId: "https://genesisbot.com",
      packName: "✨ Created with Havoc",
      packPublish: "Genesis Dev Team",
      packEmail: "support@genesisbot.com",
      packWebsite: "https://genesisbot.com",
      androidApp: "https://play.google.com/store/apps/details?id=com.genesis.bot",
      iOSApp: "https://apps.apple.com/app/genesisbot/id1234567890",
      categories: ['🤖', '🔥', '👑'],
      isAvatar: 0
   },

   // Session file path and name
   session: {
      Path: "session",
      Name: "genesis"
   }
}

// Format file size to human-readable string
function formatSize(bytes) {
   if (bytes >= 1_000_000_024) return (bytes / 1_000_000_024).toFixed(2) + " GB"
   if (bytes >= 1_000_024) return (bytes / 1_000_024).toFixed(2) + " MB"
   if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB"
   if (bytes > 1) return bytes + " bytes"
   if (bytes === 1) return "1 byte"
   return "0 bytes"
}

// Hot reload the config file when updated
let fileP = fileURLToPath(import.meta.url)
fs.watchFile(fileP, () => {
    fs.unwatchFile(fileP)
    console.log(`♻️ GenesisBot config updated: "${fileP}"`)
    import(`${import.meta.url}?update=${Date.now()}`)
})

