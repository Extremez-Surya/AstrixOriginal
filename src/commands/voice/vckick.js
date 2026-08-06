const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["vckick", "vcdisconnect", "voice-kick"],
  category: "Voice",
  desc: "Disconnect a member from a voice channel.",
  botPermissions: ["MoveMembers"],
  userPermissions: ["MoveMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply("Mention user to disconnect: `.vckick @user`");

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (member && member.voice.channel) await member.voice.disconnect().catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔌 Member Disconnected from Voice\n> - **User:** ${targetUser} (\`${targetUser.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
