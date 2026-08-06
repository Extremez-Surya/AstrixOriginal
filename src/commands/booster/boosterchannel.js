const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["boosterchannel", "setboosterchannel"],
  category: "Booster",
  desc: "Set the channel for server boost celebration announcements.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("Mention channel: `.boosterchannel #boosts`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🚀 Booster Channel Set\n> - **Channel:** ${channel} (\`${channel.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
