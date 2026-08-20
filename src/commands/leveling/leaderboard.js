const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const levelingManager = require("../../lib/levelingManager");

const ITEMS_PER_PAGE = 10;

const BADGES = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

module.exports = {
  alias: ["leaderboard", "lb", "top", "xptop"],
  category: "Leveling",
  desc: "Display the server XP leaderboard for top active members.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const guildId = message.guild.id;
    const leaderboardData = levelingManager.getLeaderboard(guildId, 100);

    if (!leaderboardData.length) {
      const emptyContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🏆 Server Leveling Leaderboard\n` +
          `-# *No members have earned XP on this server yet.*`
        )
      );
      return message
        .reply({
          components: [emptyContainer],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    const totalPages = Math.ceil(leaderboardData.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    const buildLeaderboardPage = (page, disabled = false) => {
      const start = page * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageEntries = leaderboardData.slice(start, end);

      const lines = pageEntries.map((entry, index) => {
        const rank = start + index + 1;
        const badge = BADGES[rank] ? `${BADGES[rank]} ` : `\`#${rank}\` `;
        return `> ${badge}<@${entry.userId}> ── Level **${entry.level}** (\`${entry.totalXp.toLocaleString()} XP\`)`;
      });

      const userRank = levelingManager.getRankPosition(guildId, message.author.id);

      const mainContent =
        `### 🏆 **Server Leveling Leaderboard** ── Page ${page + 1}/${totalPages}\n` +
        `-# *Top most active members in ${message.guild.name}*\n\n` +
        lines.join("\n") +
        `\n\n> -# **Your Rank:** \`#${userRank.position} / ${userRank.total}\``;

      const prevBtn = new ButtonBuilder()
        .setCustomId("lb_prev")
        .setLabel("Previous")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || page === 0);

      const nextBtn = new ButtonBuilder()
        .setCustomId("lb_next")
        .setLabel("Next")
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || page >= totalPages - 1);

      const row = new ActionRowBuilder().addComponents(prevBtn, nextBtn);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addActionRowComponents(row);

      return container;
    };

    const initialContainer = buildLeaderboardPage(currentPage);
    const replyMsg = await message
      .reply({
        components: [initialContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      })
      .catch(() => null);

    if (!replyMsg) return;

    const collector = replyMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      if (i.customId === "lb_prev" && currentPage > 0) {
        currentPage--;
      } else if (i.customId === "lb_next" && currentPage < totalPages - 1) {
        currentPage++;
      }
      const updatedContainer = buildLeaderboardPage(currentPage);
      await replyMsg
        .edit({
          components: [updatedContainer],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    });

    collector.on("end", async () => {
      const finalContainer = buildLeaderboardPage(currentPage, true);
      await replyMsg
        .edit({
          components: [finalContainer],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    });
  },
};
