const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["invc", "invoice", "vclist"],
  category: "Voice",
  desc: "List members currently connected to voice channels in the server.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const vcMembers = message.guild.members.cache.filter((m) => m.voice.channel);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎙️ Active Voice Channel Overview\n` +
        `-# *Current active voice connections.*\n\n` +
        `> - **Total Connected Members:** \`${vcMembers.size}\` \n` +
        `> - **Active Channels:** \`${new Set(vcMembers.map((m) => m.voice.channelId)).size}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
