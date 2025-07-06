export default {
    name: 'Genesis',
    aliases: ['develer'],
    type: 'main',
    execute: async({ hisoka, m, config }) => {
        let text = `👑 *Bot Owner(s)* 👑\n\n`
        for (const contact of config.options.owner) {
            text += `• wa.me/${contact}\n`
        }
        m.reply(text.trim())
    }
}

