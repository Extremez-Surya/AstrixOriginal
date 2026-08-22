const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
  SectionBuilder,
  ThumbnailBuilder,
} = require("discord.js");
const badgeManager = require("../../lib/badgeManager");
const { developerIds, team } = require("../../lib/config.json");

const authorizedDevs = [
  ...new Set([
    ...(developerIds || []),
    ...(team ? team.map((t) => t.id) : []),
  ]),
];

function isDev(userId) {
  return authorizedDevs.includes(userId);
}

module.exports = {
  name: "badges",
  category: "Information",
  description: "View or manage official Discord & custom Astrix badges.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "User whose badges you want to inspect or manage.",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
    {
      name: "action",
      description: "Developer action (add, remove, or list available badges).",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "View Badges", value: "view" },
        { name: "Grant Badge (Devs Only)", value: "add" },
        { name: "Revoke Badge (Devs Only)", value: "remove" },
        { name: "List Custom Badges", value: "list" },
      ],
    },
    {
      name: "badge",
      description: "Badge ID to grant or revoke (e.g. owner, dev, vip, partner).",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const action = interaction.options.getString("action") || "view";
    const targetUserOpt = interaction.options.getUser("user");
    const badgeId = interaction.options.getString("badge")?.toLowerCase();

    // Handling Management Sub-commands (Dev Only)
    if (action === "add") {
      if (!isDev(interaction.user.id)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Access Denied\n` +
              `-# *Granting custom badges is restricted strictly to authorized bot developers and team members.*`,
          ),
        );
        return interaction
          .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
          .catch(() => null);
      }

      const targetUser = targetUserOpt;
      if (!targetUser || !badgeId) {
        const available = Object.keys(badgeManager.CUSTOM_BADGES).join(", ");
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Missing Arguments\n` +
              `-# *Please specify both a target user and a badge ID.*` +
              `\n\n> - **Available Badges:** \`${available}\``,
          ),
        );
        return interaction
          .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
          .catch(() => null);
      }

      const success = badgeManager.addBadge(targetUser.id, badgeId);
      const bInfo = badgeManager.CUSTOM_BADGES[badgeId] || { name: badgeId, emoji: "🏷️" };

      const content = success
        ? `### <:badge:1539875454725521488> Badge Granted Successfully\n` +
          `-# *Added badge ${bInfo.emoji} **${bInfo.name}** (\`${badgeId}\`) to ${targetUser.username}.*`
        : `### <:red_star:1539875482680696834> Badge Already Present\n` +
          `-# *User ${targetUser.username} already possesses the badge \`${badgeId}\`.*`;

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
          ),
        );

      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    if (action === "remove") {
      if (!isDev(interaction.user.id)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Access Denied\n` +
              `-# *Revoking custom badges is restricted strictly to authorized bot developers and team members.*`,
          ),
        );
        return interaction
          .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
          .catch(() => null);
      }

      const targetUser = targetUserOpt;
      if (!targetUser || !badgeId) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Missing Arguments\n` +
              `-# *Please specify both a target user and a badge ID.*`,
          ),
        );
        return interaction
          .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
          .catch(() => null);
      }

      const success = badgeManager.removeBadge(targetUser.id, badgeId);

      const content = success
        ? `### <:badge:1539875454725521488> Badge Revoked Successfully\n` +
          `-# *Removed badge \`${badgeId}\` from ${targetUser.username}.*`
        : `### <:red_star:1539875482680696834> Badge Not Found\n` +
          `-# *User ${targetUser.username} does not have badge \`${badgeId}\`.*`;

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
          ),
        );

      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    if (action === "list") {
      const allBadges = badgeManager.CUSTOM_BADGES;
      const listLines = Object.entries(allBadges).map(
        ([id, b]) => `> - ${b.emoji} **${b.name}** — \`${id}\``,
      );

      const content = [
        `### <:badge:1539875454725521488> Available Custom Badges`,
        `-# *Bot Developer & Staff Badges System Registry.*`,
        "",
        ...listLines,
      ].join("\n");

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
          ),
        );

      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    // Default: Viewing Badges
    const targetUser = targetUserOpt || interaction.user;
    const fetchedUser = await client.users
      .fetch(targetUser.id, { force: true })
      .catch(() => targetUser);
    const flags = fetchedUser.flags?.toArray() || [];

    const badgeMap = {
      Staff: "<:discordstaff:1528681364340080713> Discord Staff",
      Partner: "<:partner:1528681364340080713> Partnered Server Owner",
      Hypesquad:
        "<:hypesquad:1528681364340080713> HypeSquad Events Coordinator",
      BugHunterLevel1: "<:bughunter1:1528681364340080713> Bug Hunter Level 1",
      BugHunterLevel2: "<:bughunter2:1528681364340080713> Bug Hunter Level 2",
      HypeSquadOnlineHouse1: "<:bravery:1528681364340080713> HypeSquad Bravery",
      HypeSquadOnlineHouse2:
        "<:brilliance:1528681364340080713> HypeSquad Brilliance",
      HypeSquadOnlineHouse3: "<:balance:1528681364340080713> HypeSquad Balance",
      PremiumEarlySupporter:
        "<:EarlySupporter:1539875579292024833> Early Supporter",
      VerifiedDeveloper:
        "<:developers:1539875562124738602> Early Verified Bot Developer",
      CertifiedModerator:
        "<:mod:1528681364340080713> Discord Certified Moderator",
      ActiveDeveloper: "<:activedev:1528681364340080713> Active Developer",
      BotHTTPInteractions: "<:bot:1528696929649954866> HTTP Bot",
    };

    const discordBadges = flags.map((f) => badgeMap[f] || `\`${f}\``);
    if (fetchedUser.bot)
      discordBadges.unshift("<:bote:1539875512757911643> Verified Bot");

    const customBadges = badgeManager.getUserBadges(fetchedUser.id);
    const customBadgeLines = customBadges.map(
      (b) => `> - ${b.emoji} **${b.name}** (\`${b.id}\`)`,
    );
    const discordBadgeLines = discordBadges.map((b) => `> - ${b}`);

    const totalCount = customBadges.length + discordBadges.length;

    const badgesContent = [
      `### <:badge:1539875454725521488> Profile Badges ── ${fetchedUser.username}`,
      `-# *Official Discord flags and custom developer-granted badges.*`,
      "",
      customBadges.length > 0
        ? `> <:red_star:1539875482680696834> **Custom Astrix Badges**\n${customBadgeLines.join("\n")}`
        : null,
      customBadges.length > 0 && discordBadges.length > 0 ? "" : null,
      discordBadges.length > 0
        ? `> <:rshield:1539875466939338773> **Discord System Badges**\n${discordBadgeLines.join("\n")}`
        : null,
      totalCount === 0
        ? `> - *No public or custom profile badges found.*`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const telemetryContent = [
      `> <:stats:1539875420256866314> **Telemetry Summary**`,
      `> - **Total Badges:** \`${totalCount}\``,
      `> - **User ID:** \`${fetchedUser.id}\``,
    ].join("\n");

    const files = [];
    const container = new ContainerBuilder();
    const avatarUrl = fetchedUser.displayAvatarURL({
      extension: "png",
      size: 512,
    });

    if (avatarUrl) {
      try {
        const avatarAttachment = new AttachmentBuilder(avatarUrl, {
          name: "user_avatar.png",
        });
        files.push(avatarAttachment);

        const section = new SectionBuilder()
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL("attachment://user_avatar.png"),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(badgesContent),
          );

        container.addSectionComponents(section);
      } catch (e) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(badgesContent),
        );
      }
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(badgesContent),
      );
    }

    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(telemetryContent),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
        ),
      );

    return interaction
      .editReply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
