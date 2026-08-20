const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const levelingManager = require("../../lib/levelingManager");

function renderProgressBar(current, max, length = 14) {
  const percentage = Math.min(1, Math.max(0, current / max));
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  return "▰".repeat(filled) + "▱".repeat(empty);
}

module.exports = {
  alias: ["rank", "level", "xp"],
  category: "Leveling",
  desc: "View chat activity rank, XP progress, and current level.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || message.author;
    const guildId = message.guild.id;

    const data = levelingManager.getMemberData(guildId, targetUser.id);
    const nextNeeded = levelingManager.xpToNextLevel(data.level);
    const { position, total } = levelingManager.getRankPosition(guildId, targetUser.id);

    const progressBar = renderProgressBar(data.xp, nextNeeded);
    const percent = Math.floor((data.xp / nextNeeded) * 100);

    const requesterTag = message.author.tag;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📈 **Member Rank Card** ── ${targetUser.username}\n` +
          `-# *Server activity & XP progression profile*\n\n` +
          `> - **Level:** \`${data.level}\` \n` +
          `> - **Server Rank:** \`#${position} / ${total}\` \n` +
          `> - **Current Level XP:** \`${data.xp.toLocaleString()} / ${nextNeeded.toLocaleString()} XP\` (\`${percent}%\`)\n` +
          `> - **Total Accumulated XP:** \`${data.totalXp.toLocaleString()} XP\`\n\n` +
          `**Progress:** \`[${progressBar}]\` \`${percent}%\``
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Requested by ${requesterTag} • Powered by Astrix Leveling`
        )
      );

    return message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      })
      .catch(() => null);
  },
};
