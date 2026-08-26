const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const antiraidManager = require("../../lib/antiraidManager");
const { buildAntiraidNavMenu } = require("../../lib/security/handleAntiRaidInteraction");
const EMOJIS = require("../../lib/emojis");

function parseDuration(s) {
  if (!s) return null;
  const match = s.match(/^(\d+)(s|m)$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  return unit === "s" ? num * 1000 : num * 60 * 1000;
}

function buildNotice(title, description, isError = true) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${isError ? EMOJIS.cross || "❌" : EMOJIS.ticky_red || "✅"} ${title}`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(description)
    );
  return container;
}

module.exports = {
  alias: ["raidwipe", "antiraidwipe"],
  category: "Anti Raid",
  desc: "Purge raiders who joined within a recent time window.",
  botPermissions: ["BanMembers", "KickMembers"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({
        components: [
          buildNotice("Permission Denied", "You need **Administrator** permissions to execute a raidwipe."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (!args || args.length < 2) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🧹 **Anti-Raid • Raidwipe Mass Purge Hub**\n` +
            `-# Instantly purge recent raiders who joined during a raid wave\n\n` +
            `> **Protection Scope:** Filters accounts joined within 30s to 15m.\n` +
            `> **Purge Actions:** \`BAN\` (deletes messages + permanent) or \`KICK\` (instant removal).\n\n` +
            `-# Select a rapid-purge preset below or execute \`raidwipe <time> <ban|kick>\``
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

      const actionMenu = new StringSelectMenuBuilder()
        .setCustomId("antiraid_raidwipe_select_preset")
        .setPlaceholder("⚡ Select Rapid Raidwipe Purge Preset...")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Purge Last 1 Minute (BAN)")
            .setValue("preset_1m_ban")
            .setDescription("Bans all accounts joined within the last 60 seconds")
            .setEmoji("🧹"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Purge Last 5 Minutes (BAN)")
            .setValue("preset_5m_ban")
            .setDescription("Bans all accounts joined within the last 5 minutes")
            .setEmoji("🧹"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Purge Last 10 Minutes (BAN)")
            .setValue("preset_10m_ban")
            .setDescription("Bans all accounts joined within the last 10 minutes")
            .setEmoji("🧹"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Purge Last 5 Minutes (KICK)")
            .setValue("preset_5m_kick")
            .setDescription("Kicks all accounts joined within the last 5 minutes")
            .setEmoji("👢"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Purge Last 15 Minutes (KICK)")
            .setValue("preset_15m_kick")
            .setDescription("Kicks all accounts joined within the last 15 minutes")
            .setEmoji("👢")
        );

      const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("commands"));
      const actionRow = new ActionRowBuilder().addComponents(actionMenu);

      const cpBtn = new ButtonBuilder()
        .setCustomId("antiraid_nav_overview")
        .setLabel("Control Center")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Primary);

      const refreshBtn = new ButtonBuilder()
        .setCustomId("antiraid_btn_refresh")
        .setLabel("Refresh")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Secondary);

      const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

      container.addActionRowComponents(actionRow);
      container.addActionRowComponents(navRow);
      container.addActionRowComponents(btnRow);
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Raid Quarantine`)
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const timeArg = args[0];
    const action = String(args[1] || "").toLowerCase();
    const remaining = args.slice(2);
    const confirmRequested = remaining.includes("confirm") || remaining.includes("--confirm");
    const reason =
      remaining.filter((r) => r !== "confirm" && r !== "--confirm").join(" ") ||
      `Raidwipe execution by ${message.author.tag}`;

    const durationMs = parseDuration(timeArg);
    if (!durationMs || durationMs < 1000 || durationMs > 15 * 60 * 1000) {
      return message.reply({
        components: [
          buildNotice(
            "Invalid Duration",
            "Please specify a duration between `1s` and `15m`. Format: `10s` or `5m`."
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (!["ban", "kick"].includes(action)) {
      return message.reply({
        components: [
          buildNotice("Invalid Action", "Action must be either `ban` or `kick`."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const me = message.guild.members.me;
    if (action === "ban" && !me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({
        components: [
          buildNotice("Bot Missing Permission", "I need the **Ban Members** permission to execute bans."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (action === "kick" && !me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply({
        components: [
          buildNotice("Bot Missing Permission", "I need the **Kick Members** permission to execute kicks."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const cutoff = Date.now() - durationMs;
    await message.guild.members.fetch().catch(() => null);

    const filtered = message.guild.members.cache.filter(
      (m) => m.joinedTimestamp && m.joinedTimestamp >= cutoff
    );

    if (filtered.size === 0) {
      return message.reply({
        components: [
          buildNotice("No Matching Members", `No members found who joined within the last \`${timeArg}\`.`, false),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const executor = message.member;
    const isGuildOwner = message.guild.ownerId === executor.id;
    const botHighest = me.roles.highest?.position ?? 0;
    const execHighest = executor.roles.highest?.position ?? 0;
    const safeThreshold = 25;

    const toProcess = [];
    let protectedCount = 0;

    for (const member of filtered.values()) {
      if (!member || !member.id) continue;
      if (member.id === executor.id || member.id === me.id || member.id === message.guild.ownerId) {
        protectedCount++;
        continue;
      }
      if (member.user?.bot || member.roles.cache.some((r) => r.managed)) {
        protectedCount++;
        continue;
      }

      const targetHighest = member.roles.highest?.position ?? 0;

      if (!isGuildOwner && execHighest <= targetHighest) {
        protectedCount++;
        continue;
      }
      if (botHighest <= targetHighest) {
        protectedCount++;
        continue;
      }

      toProcess.push(member);
    }

    if (toProcess.length === 0) {
      return message.reply({
        components: [
          buildNotice("No Eligible Members", "No members could be purged after role hierarchy and protection checks.", false),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Confirmation dialog for large mass purge (> 25 members)
    if (toProcess.length > safeThreshold && !confirmRequested) {
      const confirmId = `raidwipe_confirm_${message.author.id}_${Date.now()}`;
      const cancelId = `raidwipe_cancel_${message.author.id}_${Date.now()}`;

      const confirmContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.Warn_red || "⚠️"} Raidwipe Confirmation Required\n` +
              `-# Action: **${action.toUpperCase()}** \`${toProcess.length}\` members who joined in the last \`${timeArg}\`.\n\n` +
              `> This action exceeds the safety threshold of \`${safeThreshold}\` members. Confirm execution below.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        );

      const confirmBtn = new ButtonBuilder()
        .setCustomId(confirmId)
        .setLabel(`Confirm ${action.toUpperCase()} (${toProcess.length})`)
        .setStyle(ButtonStyle.Danger);

      const cancelBtn = new ButtonBuilder()
        .setCustomId(cancelId)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

      confirmContainer.addActionRowComponents(
        new ActionRowBuilder().addComponents(confirmBtn, cancelBtn)
      );

      if (!client.raidwipeConfirmations) client.raidwipeConfirmations = new Map();
      client.raidwipeConfirmations.set(confirmId, {
        guildId: message.guild.id,
        authorId: message.author.id,
        action,
        reason,
        toProcessIds: toProcess.map((m) => m.id),
      });

      return message.reply({
        components: [confirmContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    let successful = 0;
    let failed = 0;

    for (const member of toProcess) {
      try {
        if (action === "ban") {
          await member.ban({ reason, deleteMessageSeconds: 0 });
          successful++;
        } else {
          await member.kick(reason);
          successful++;
        }
      } catch (_) {
        failed++;
      }
    }

    antiraidManager.incrementStats(message.guild.id, "blockedCount", successful);

    const summary = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.ticky_red || "✅"} Raidwipe Execution Summary\n` +
            `> - **Time Window:** \`${timeArg}\`\n` +
            `> - **Action:** \`${action.toUpperCase()}\`\n` +
            `> - **Matching Members Found:** \`${filtered.size}\`\n` +
            `> - **Eligible After Hierarchy Check:** \`${toProcess.length}\`\n` +
            `> - **Successfully Removed:** \`${successful}\` member(s)\n` +
            `> - **Failed Removals:** \`${failed}\` member(s)\n` +
            `> - **Protected (Bots/Staff):** \`${protectedCount}\` member(s)`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Raidwipe executed by ${message.author.tag} • ASTRIXCODE™`
        )
      );

    return message.reply({
      components: [summary],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
