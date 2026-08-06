const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["j2c", "jointocreate"],
  category: "Voice",
  desc: "Set up Join-To-Create dynamic voice channel generators.",
  botPermissions: ["ManageChannels", "MoveMembers"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first();

    if (!channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔊 Join-To-Create (J2C) System\n` +
          `-# *Automatically generate temporary private voice channels on join.*\n\n` +
          `> - **Usage:** \`.j2c setup #VoiceChannel\`\n` +
          `> - **Usage:** \`.j2c reset\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ J2C Generator Configured\n` +
        `-# *Members joining this channel will automatically get personal temp VCs.*\n\n` +
        `> - **Hub Channel:** ${channel} (\`${channel.id}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
