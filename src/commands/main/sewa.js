export default {
  name: "sewa",
  type: "main",
  desc: "Jipatie GenesisBot Premium au Rent Bot yako 📲",
  aliases: ["buy", "vip", "rent", "premium", "donate"],
  execute: async ({ hisoka, m, command }) => {
    let text = `
╭──⭓ *GenesisBot Services* 💡
│
│ ⭕ *Premium Access*:
│ - Ksh 150 (30 days)
│ - Ksh 250 (60 days)
│ - Ksh 350 (90 days)
│
│ ⭕ *Rent GenesisBot*:
│ - Ksh 200 (30 days)
│ - Ksh 300 (60 days)
│ - Ksh 400 (90 days)
│
│ ✅ Premium = No ads, fast access, early features.
│ ✅ Renting = You get your own Genesis bot, fully hosted.
│
│ 💳 *Payment Options*:
│ - M-Pesa: *0738701209* (Your Number)
│ - Airtel Money: *0738701209*
│ - PayPal: https://paypal.me/genesisbot
│ - BuyGoods Till: *123456*
│
│ 📞 Contact Owner:
│ https://wa.me/254738701209?text=Genesis%20Bot%20Premium
╰────────────◆`

    await hisoka.sendMessage(m.from, {
      image: { url: "https://https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-photos%2Fpicture&psig=AOvVaw21LWFT7sa465xyHb8JNYMF&ust=1751911695906000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCIiWlObpqI4DFQAAAAAdAAAAABAE" }, // Optional QR code
      caption: text
    }, { quoted: m })
  }
}
