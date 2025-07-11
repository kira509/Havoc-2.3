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
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    },
    takeoverTimeoutMs: 'Infinity',
    autoClearSession: true
  })

  hisoka.once("require_pairing_code", async () => {
    const code = await hisoka.requestPairingCode("254738701209") // your number without +
    console.log(`🔐 Pairing Code
