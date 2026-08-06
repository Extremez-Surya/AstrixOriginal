const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["blackjack", "bj"],
  category: "Fun",
  desc: "Play an interactive game of Blackjack against the dealer.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const playerVal = Math.floor(Math.random() * 10) + 12;
    const dealerVal = Math.floor(Math.random() * 10) + 12;

    let result = "Dealer wins!";
    if (playerVal > 21) result = "You busted! Dealer wins.";
    else if (dealerVal > 21 || playerVal > dealerVal) result = "🎉 You win!";
    else if (playerVal === dealerVal) result = "Tie game (Push)!";

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🃏 Blackjack Table\n` +
        `-# *Card game evaluation complete.*\n\n` +
        `> - **Your Score:** \`${playerVal}\` \n` +
        `> - **Dealer Score:** \`${dealerVal}\` \n\n` +
        `> **Outcome:** \`${result}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
