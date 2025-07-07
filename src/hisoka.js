import config from "../config.js"
import { Client, LocalAuth } from 'whatsapp-web.js'
import chokidar from "chokidar"
import { chromium } from 'playwright-chromium'
import { platform } from 'os'
import path from 'path'

/* … all your existing imports … */

async function start () {

  /* … unchanged database boot-strap … */

  const hisoka = new Client({
    authStrategy: new LocalAuth({
      dataPath : `./${config.session.Path}`,
      clientId : `${config.session.Name}`
    }),
    playwright: {
      headless: true,
      args: [ /* same flags */ ],
      executablePath: chromium.executablePath()
    },
    markOnlineAvailable: true,
    qrMaxRetries: 0,          // ⟸ don’t bother with QR
    takeoverTimeoutMs: 'Infinity',
    autoClearSession: true
  })

  // ---- PAIR-CODE HANDLING -----------------------------------
  hisoka.once("require_pairing_code", async () => {
    const code = await hisoka.requestPairingCode("254738701209") // no “+”
    console.log(`🔐  Pairing Code: ${code}`)
  })
  // -----------------------------------------------------------

  hisoka.on("ready", () => console.info("✅ GenesisBot connected!"))
  hisoka.on("auth_failure", console.error)
  hisoka.on("disconnected", () => start())

  /* … your existing message handler … */

  hisoka.initialize()
}

start()
