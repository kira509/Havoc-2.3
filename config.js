import config from "../config.js"
import { LocalAuth } from "whatsapp-web.js"
import puppeteer from "puppeteer"
import chokidar from "chokidar"
import { platform } from "os"
import path from "path"

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
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu"
      ]
    },
    qrMaxRetries: 0, // Don't use QR fallback
    takeoverOnConflict: true,
    takeoverTimeoutMs: 0,
    autoClearSession: true
  })

  // === PAIRING CODE MODE ===
  hisoka.once("require_pairing_code", async () => {
    const number = config.options.owner[0] // Use first owner number
    try {
      const code = await hisoka.requestPairingCode(number)
      console.log(`🔐 Pairing Code: ${code}`)
    } catch (err) {
      console.error("❌ Error generating pair code:", err)
    }
  })

  hisoka.on("ready", () => {
    console.log("✅ GenesisBot is ready!")
  })

  hisoka.on("auth_failure", err => {
    console.error("❌ Authentication failed:", err)
  })

  hisoka.on("disconnected", () => {
    console.log("📴 Disconnected. Reinitializing...")
    start()
  })

  hisoka.on("message_create", async (message) => {
    const m = await serialize(hisoka, message)
    await Message(hisoka, m)
  })

  setInterval(async () => {
    if (global.db) await database.write(global.db)
  }, 30000)

  hisoka.initialize()
}

start()

// === HOT RELOAD COMMANDS ===
let choki = chokidar.watch(Func.__filename(path.join(process.cwd(), "src", config.options.pathCommand)), {
  ignored: /^\./
})

choki
  .on("change", async (Path) => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
  })
  .on("add", async (Path) => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
  })
