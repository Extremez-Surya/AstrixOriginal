const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["j2csetup", "jointocreatesetup"],
  category: "Voice",
  desc: "Set a voice channel as a Join-To-Create temp VC hub.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("Mention channel: `.j2csetup #VoiceChannel`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔊 J2C Hub Set\n> - **Generator Channel:** ${channel} (\`${channel.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
