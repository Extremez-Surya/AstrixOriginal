const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["slots", "slot"],
  category: "Fun",
  desc: "Spin the slot machine for a chance to hit the jackpot.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const items = ["🍇", "🍊", "🍋", "🍒", "7️⃣", "💎"];
    const s1 = items[Math.floor(Math.random() * items.length)];
    const s2 = items[Math.floor(Math.random() * items.length)];
    const s3 = items[Math.floor(Math.random() * items.length)];

    const won = s1 === s2 && s2 === s3;
    const outcomeText = won ? "🎉 JACKPOT! You won!" : "Better luck next time!";

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎰 Slot Machine\n\n` +
        `> # [ ${s1} | ${s2} | ${s3} ]\n\n` +
        `> **Result:** \`${outcomeText}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
