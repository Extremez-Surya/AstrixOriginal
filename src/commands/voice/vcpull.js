const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["vcpull", "voicepull", "pullvc"],
  category: "Voice",
  desc: "Pull a member into your current voice channel.",
  botPermissions: ["MoveMembers"],
  userPermissions: ["MoveMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply("Mention user to pull: `.vcpull @user`");

    if (!message.member.voice.channel) {
      return message.reply("You must be connected to a voice channel to pull someone.");
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (member && member.voice.channel) {
      await member.voice.setChannel(message.member.voice.channelId).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ➡️ Member Pulled into Voice\n> - **User:** ${targetUser} \n> - **Destination Channel:** ${message.member.voice.channel}`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
