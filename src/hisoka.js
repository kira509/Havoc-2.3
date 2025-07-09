

import config from "../config.js"
import { LocalAuth } from "whatsapp-web.js"
import chokidar from "chokidar"
import path from "path"
import { platform } from "os"
import puppeteer from "puppeteer"
import qrcode from "qrcode-terminal"

import API from "./lib/lib.api.js"
import Function from "./lib/lib.function.js"
import { Client, serialize } from "./lib/whatsapp.serialize.js"
import { Message, readCommands } from "./event/event.message.js"
import { database as databes } from "./lib/lib.database.js"

const database = new databes()
global.Func = Function
global.api = API
global.commands = new (await import("./lib/lib.collection.js")).default

async function start () {
    process.on("uncaughtException", console.error)
    process.on("unhandledRejection", console.error)

    readCommands()

    const content = await database.read()
    if (!content || Object.keys(content).length === 0) {
        global.db = { users: {}, groups: {}, ...(content || {}) }
        await database.write(global.db)
    } else {
        global.db = content
    }

    const hisoka = new Client({
        authStrategy: new LocalAuth({
            dataPath : `./${config.session.Path}`,
            clientId : `${config.session.Name}`
        }),
        puppeteer: {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-cache",
                "--disable-application-cache",
                "--disable-accelerated-2d-canvas"
            ]
        },
        markOnlineAvailable: true,
        qrMaxRetries: 0, // No QR scanning
        takeoverTimeoutMs: 'Infinity',
        autoClearSession: true
    })

    // === Pair Code Handling ===
    hisoka.once("require_pairing_code", async () => {
        const code = await hisoka.requestPairingCode("2547XXXXXXXX") // Replace with real number
        console.log(`🔐 Pairing Code: ${code}`)
    })

    hisoka.on("ready", () => console.info("✅ GenesisBot connected!"))
    hisoka.on("auth_failure", console.error)
    hisoka.on("disconnected", () => start())

    hisoka.on("message_create", async (message) => {
        const m = await (await serialize(hisoka, message))
        await (await Message(hisoka, m))
    })

    setInterval(async () => {
        if (global.db) await database.write(global.db)
    }, 3000)

    hisoka.initialize()
}

start()

// === Hot-reload commands ===
const choki = chokidar.watch(Func.__filename(path.join(process.cwd(), "src", "commands")), { ignored: /^\./ })
choki
.on("change", async (Path) => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
})
.on("add", async (Path) => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
})
