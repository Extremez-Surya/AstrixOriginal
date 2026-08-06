const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["counting", "countgame"],
  category: "Fun",
  desc: "Set up or view counting channel status and high score.",
  botPermissions: ["SendMessages", "ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔢 Counting Channel Setup\n` +
        `-# *Members count up one by one in numerical order.*\n\n` +
        `> - **Channel:** ${channel} (\`${channel.id}\`)\n` +
        `> - **Current Count:** \`1\` | **High Score:** \`100\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
