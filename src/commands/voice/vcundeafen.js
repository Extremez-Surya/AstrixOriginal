const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["vcundeafen", "vcundeaf", "voice-undeaf"],
  category: "Voice",
  desc: "Undeafen a member in a voice channel.",
  botPermissions: ["DeafenMembers"],
  userPermissions: ["DeafenMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply("Mention user to voice undeafen: `.vcundeaf @user`");

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (member && member.voice.channel) await member.voice.setDeaf(false).catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎧 Member Voice Undeafened\n> - **User:** ${targetUser} (\`${targetUser.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
