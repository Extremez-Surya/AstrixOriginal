const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["vcunmute", "voice-unmute"],
  category: "Voice",
  desc: "Unmute a member in a voice channel.",
  botPermissions: ["MuteMembers"],
  userPermissions: ["MuteMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply("Mention user to voice unmute: `.vcunmute @user`");

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (member && member.voice.channel) await member.voice.setMute(false).catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎙️ Member Voice Unmuted\n> - **User:** ${targetUser} (\`${targetUser.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
