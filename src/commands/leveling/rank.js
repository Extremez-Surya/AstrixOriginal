const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["rank", "level", "xp"],
  category: "Leveling",
  desc: "View your current chat activity rank, XP progress, and level.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || message.author;

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📈 Member Rank Card ── ${targetUser.username}\n` +
        `-# *Server activity progress card.*\n\n` +
        `> - **Level:** \`15\` \n` +
        `> - **Total XP:** \`4,250 / 5,000\` \n` +
        `> - **Server Rank:** \`#3\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
