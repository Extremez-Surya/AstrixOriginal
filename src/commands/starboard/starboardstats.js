const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { getGuildConfig } = require("../../lib/starboardManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["starboardstats", "sbstats", "starstats", "topstars"],
  category: "Starboard",
  desc: "Display server Starboard showcase statistics and top-starred messages.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const config = getGuildConfig(message.guild.id);
    const total = config.starredMessages?.length || 0;
    const sorted = [...(config.starredMessages || [])].sort((a, b) => (b.starCount || 0) - (a.starCount || 0));
    const top5 = sorted.slice(0, 5);

    let topText = "";
    if (top5.length === 0) {
      topText = "*No messages have reached the starboard yet.*";
    } else {
      topText = top5
        .map(
          (entry, i) =>
            `> **#${i + 1}.** <@${entry.authorId}> in <#${entry.channelId}> — ⭐ \`${entry.starCount} stars\` (<t:${Math.floor((entry.createdAt || Date.now()) / 1000)}:R>)`,
        )
        .join("\n");
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⭐ **STARBOARD SHOWCASE LEADERBOARD** • ${message.guild.name}\n\n` +
            `> - **Channel:** ${config.channelId ? `<#${config.channelId}>` : "`Not set`"}\n` +
            `> - **Total Showcased:** \`${total}\` messages\n` +
            `> - **Active Emojis:** ${config.emojis?.map((e) => `${e.emoji} (${e.threshold}+)`).join(", ") || "`⭐ (3+)`"}\n\n` +
            `**Top Starred Messages:**\n` +
            `${topText}`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Starboard Engine*`),
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
