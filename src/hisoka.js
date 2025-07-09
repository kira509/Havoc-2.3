import config from "../config.js"
import { LocalAuth } from "whatsapp-web.js"
import chokidar from "chokidar"
import puppeteer from "puppeteer"
import path from "path"
import { fileURLToPath } from "url"
import { platform } from "os"

import API from "./lib/lib.api.js"
import Function from "./lib/lib.function.js"
import { Client, serialize } from "./lib/whatsapp.serialize.js"
import { Message, readCommands } from "./event/event.message.js"
import { database as databes } from "./lib/lib.database.js"

const database = new databes()
global.Func = Function
global.api = API
global.commands = new (await import("./lib/lib.collection.js")).default

async function start() {
   process.on("uncaughtException", console.error)
   process.on("unhandledRejection", console.error)
   readCommands()

   const content = await database.read()
   global.db = content && Object.keys(content).length === 0
      ? { users: {}, groups: {}, ...content }
      : content || {}
   await database.write(global.db)

   const browser = await puppeteer.launch({
      headless: true,
      args: [
         "--no-sandbox",
         "--disable-setuid-sandbox",
         "--disable-dev-shm-usage",
         "--disable-accelerated-2d-canvas",
         "--disable-gpu",
         "--disable-cache",
         "--disable-application-cache",
         "--no-first-run",
         "--no-zygote",
         "--disable-infobars"
      ]
   })

   const hisoka = new Client({
      authStrategy: new LocalAuth({
         dataPath: `./${config.session.Path}`,
         clientId: `${config.session.Name}`
      }),
      puppeteer: browser,
      webVersionCache: {
         type: 'remote',
         remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
      },
      takeoverOnConflict: true,
      takeoverTimeoutMs: 'Infinity',
      autoClearSession: true
   })

   // 📲 Pair Code Login Handler
   hisoka.once("require_pairing_code", async () => {
      const code = await hisoka.requestPairingCode(config.options.owner[0])
      console.log(`🔐 Pairing Code: ${code}`)
   })

   hisoka.on("ready", () => {
      console.log("✅ GenesisBot connected!")
   })

   hisoka.on("auth_failure", console.error)

   hisoka.on("disconnected", () => {
      console.log("⚠️ Disconnected. Restarting GenesisBot...")
      start()
   })

   hisoka.on("message_create", async (message) => {
      const m = await serialize(hisoka, message)
      await Message(hisoka, m)
   })

   // Auto-save DB
   setInterval(async () => {
      if (global.db) await database.write(global.db)
   }, 30000)

   hisoka.initialize()
}

start()

// 🔁 Hot reload command files
let commandsPath = path.join(process.cwd(), 'src', 'commands')
let choki = chokidar.watch(Func.__filename(commandsPath), { ignored: /^\./ })
choki
   .on('change', async (Path) => {
      const command = await import(Func.__filename(Path) + "?v=" + Date.now())
      global.commands.set(command?.default?.name, command)
   })
   .on('add', async (Path) => {
      const command = await import(Func.__filename(Path) + "?v=" + Date.now())
      global.commands.set(command?.default?.name, command)
   })
