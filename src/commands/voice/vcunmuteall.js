const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["vcunmuteall", "voiceunmuteall", "unmuteallvc"],
  category: "Voice",
  desc: "Unmute all connected members in your voice channel.",
  botPermissions: ["MuteMembers"],
  userPermissions: ["MuteMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.member.voice.channel) {
      return message.reply("You must be connected to a voice channel to use this command.");
    }

    const channel = message.member.voice.channel;
    for (const [, member] of channel.members) {
      if (!member.user.bot) {
        await member.voice.setMute(false).catch(() => null);
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔊 All Members Unmuted\n> - **Voice Channel:** ${channel} (\`${channel.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
