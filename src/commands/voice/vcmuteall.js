const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["vcmuteall", "voicemuteall", "muteallvc"],
  category: "Voice",
  desc: "Mute all connected members in your voice channel.",
  botPermissions: ["MuteMembers"],
  userPermissions: ["MuteMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.member.voice.channel) {
      return message.reply("You must be connected to a voice channel to use this command.");
    }

    const channel = message.member.voice.channel;
    for (const [, member] of channel.members) {
      if (!member.user.bot && member.id !== message.author.id) {
        await member.voice.setMute(true).catch(() => null);
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔇 All Members Muted\n> - **Voice Channel:** ${channel} (\`${channel.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
