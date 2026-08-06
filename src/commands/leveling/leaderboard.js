const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["leaderboard", "lb", "top"],
  category: "Leveling",
  desc: "Display the server XP leaderboard for top active members.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🏆 Server Leveling Leaderboard\n` +
        `-# *Top most active chat members in ${message.guild.name}*\n\n` +
        `> 1. **User1** ── Level 42 (12,450 XP)\n` +
        `> 2. **User2** ── Level 38 (10,120 XP)\n` +
        `> 3. **User3** ── Level 31 (8,900 XP)\n` +
        `> 4. **User4** ── Level 25 (6,740 XP)\n` +
        `> 5. **User5** ── Level 22 (5,110 XP)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
