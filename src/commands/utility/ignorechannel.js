const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["ignorechannel", "ignore-channel"],
  category: "Utility",
  desc: "Ignore bot commands in a specific text channel.",
  botPermissions: ["ManageGuild"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🚫 Channel Ignored\n> - **Ignored Channel:** ${channel} (\`${channel.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
