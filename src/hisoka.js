import config from "../config.js"
import pkg from "whatsapp-web.js"
const { LocalAuth, Client } = pkg

import chokidar from "chokidar"
import puppeteer from "puppeteer"
import path from "path"
import { platform } from "os"

import API from "./lib/lib.api.js"
import Function from "./lib/lib.function.js"
import { serialize } from "./lib/whatsapp.serialize.js"
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
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  })

  const hisoka = new Client({
    authStrategy: new LocalAuth({
      dataPath: `./${config.session.Path}`,
      clientId: `${config.session.Name}`
    }),
    puppeteer: browser,
    takeoverTimeoutMs: 0,
    authTimeoutMs: 0,
    qrMaxRetries: 0
  })

  // ✅ Use Pairing Code Instead of QR
  hisoka.once("require_pairing_code", async () => {
    const code = await hisoka.requestPairingCode(config.options.owner[0])
    console.log(`🔐 Pairing Code: ${code}`)
  })

  hisoka.on("ready", () => console.info("✅ GenesisBot connected!"))
  hisoka.on("auth_failure", console.error)
  hisoka.on("disconnected", () => start())

  hisoka.on("message_create", async (msg) => {
    const m = await serialize(hisoka, msg)
    await Message(hisoka, m)
  })

  // autosave DB
  setInterval(async () => {
    if (global.db) await database.write(global.db)
  }, 30000)

  hisoka.initialize()
}

start()

let choki = chokidar.watch(Func.__filename(path.join(process.cwd(), 'src', 'commands')), { ignored: /^\./ })
choki
  .on('change', async Path => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
  })
  .on('add', async Path => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
  })
