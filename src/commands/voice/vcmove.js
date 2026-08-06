const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["vcmove", "voicemove", "voice-move"],
  category: "Voice",
  desc: "Move a member to a target voice channel.",
  botPermissions: ["MoveMembers"],
  userPermissions: ["MoveMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    const targetChannel = message.mentions.channels.first();
    if (!targetUser || !targetChannel) return message.reply("Usage: `.vcmove @user #TargetVC`");

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (member && member.voice.channel) await member.voice.setChannel(targetChannel.id).catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ➡️ Member Moved\n> - **User:** ${targetUser} \n> - **New Voice Channel:** ${targetChannel}`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
