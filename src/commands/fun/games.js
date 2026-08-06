const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["games", "minigames"],
  category: "Fun",
  desc: "Access interactive minigames menu (TicTacToe, Trivia, RPS).",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎮 Interactive Minigames\n` +
        `-# *Challenge your friends or play solo minigames.*\n\n` +
        `> - **Available Games:** \`.tictactoe @user\` | \`.trivia\` | \`.rps <rock|paper|scissors>\` | \`.blackjack\` | \`.slots\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
