import config from "../config.js"
import { LocalAuth } from 'whatsapp-web.js'
import puppeteer from "puppeteer"
import chokidar from "chokidar"
import path from 'path'
import { platform } from 'os'

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

  const hisoka = new Client({
    authStrategy: new LocalAuth({
      dataPath: `./${config.session.Path}`,
      clientId: `${config.session.Name}`
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-web-security",
        "--disable-features=site-per-process"
      ]
    },
    takeoverTimeoutMs: 0,
    autoClearSession: true,
    qrMaxRetries: 0 // ⟸ disables QR completely
  })

  // ✅ Request Pairing Code
  hisoka.once("require_pairing_code", async () => {
    const code = await hisoka.requestPairingCode(config.pairingNumber) // Example: '254712345678'
    console.log(`🔐 Pairing Code: ${code}`)
  })

  hisoka.on("ready", () => {
    console.info("✅ GenesisBot is online and connected to WhatsApp!")
  })

  hisoka.on("auth_failure", console.error)
  hisoka.on("disconnected", () => start())

  hisoka.on("message_create", async (msg) => {
    const m = await serialize(hisoka, msg)
    await Message(hisoka, m)
  })

  // Write DB every 30 seconds
  setInterval(async () => {
    if (global.db) await database.write(global.db)
  }, 30000)

  hisoka.initialize()
}

// Auto command hot-reload
let choki = chokidar.watch(Func.__filename(path.join(process.cwd(), 'src', 'commands')), { ignored: /^\./ })
choki
  .on('change', async filePath => {
    const cmd = await import(Func.__filename(filePath) + "?v=" + Date.now())
    global.commands.set(cmd?.default?.name, cmd)
  })
  .on('add', async filePath => {
    const cmd = await import(Func.__filename(filePath) + "?v=" + Date.now())
    global.commands.set(cmd?.default?.name, cmd)
  })

start()
