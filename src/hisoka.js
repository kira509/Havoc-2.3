import config from "../config.js"
import { LocalAuth } from "whatsapp-web.js"
import chokidar from "chokidar"
import puppeteer from "puppeteer"
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
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      executablePath: await puppeteer.executablePath()
    },
    qrMaxRetries: 0, // Disable QR retries
    takeoverTimeoutMs: 'Infinity',
    autoClearSession: true
  })

  // Pairing Code Mode
  hisoka.once("require_pairing_code", async () => {
    const code = await hisoka.requestPairingCode(config.pairCodeNumber || "254700000000") // replace with your number
    console.log(`🔐 Pairing Code: ${code}`)
  })

  hisoka.on("ready", () => console.info("✅ GenesisBot connected!"))
  hisoka.on("auth_failure", console.error)
  hisoka.on("disconnected", () => start())

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

// Watch command folder for changes
let choki = chokidar.watch(Func.__filename(path.join(process.cwd(), 'src', 'commands')), { ignored: /^\./ })
choki
  .on('change', async (Path) => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
  })
  .on('add', async function (Path) {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
  })
