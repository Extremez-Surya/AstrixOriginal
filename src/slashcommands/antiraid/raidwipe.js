const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const antiraidManager = require("../../lib/antiraidManager");
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
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${isError ? EMOJIS.cross || "❌" : EMOJIS.ticky_red || "✅"} ${title}`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

module.exports = {
  name: "raidwipe",
  category: "Anti Raid",
  description: "Purge raiders who joined within a recent time window.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["BanMembers", "KickMembers"],
  userPermissions: ["Administrator"],
  devOnly: false,

  options: [
    {
      name: "time",
      description: "Time window (e.g. 10s, 5m, 15m).",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "action",
      description: "Action to execute on raiders.",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Ban", value: "ban" },
        { name: "Kick", value: "kick" },
      ],
    },
    {
      name: "reason",
      description: "Reason for the raidwipe.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  async execute(client, interaction) {
    if (!interaction.guild) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        components: [buildNotice("Permission Denied", "You need **Administrator** permissions.")],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const timeArg = interaction.options.getString("time");
    const action = interaction.options.getString("action").toLowerCase();
    const reason = interaction.options.getString("reason") || `Raidwipe execution by ${interaction.user.tag}`;

    const durationMs = parseDuration(timeArg);
    if (!durationMs || durationMs < 1000 || durationMs > 15 * 60 * 1000) {
      return interaction.reply({
        components: [buildNotice("Invalid Duration", "Specify duration between `1s` and `15m` (e.g. `10s`, `5m`).")],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const me = interaction.guild.members.me;
    if (action === "ban" && !me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        components: [buildNotice("Bot Permission Missing", "I need **Ban Members** permission.")],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    if (action === "kick" && !me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        components: [buildNotice("Bot Permission Missing", "I need **Kick Members** permission.")],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    await interaction.deferReply().catch(() => null);

    const cutoff = Date.now() - durationMs;
    await interaction.guild.members.fetch().catch(() => null);

    const filtered = interaction.guild.members.cache.filter(
      (m) => m.joinedTimestamp && m.joinedTimestamp >= cutoff
    );

    if (filtered.size === 0) {
      return interaction.editReply({
        components: [buildNotice("No Matching Members", `No members joined within the last \`${timeArg}\`.`, false)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    const executor = interaction.member;
    const isGuildOwner = interaction.guild.ownerId === executor.id;
    const botHighest = me.roles.highest?.position ?? 0;
    const execHighest = executor.roles.highest?.position ?? 0;
    const safeThreshold = 25;

    const toProcess = [];
    let protectedCount = 0;

    for (const member of filtered.values()) {
      if (!member || !member.id) continue;
      if (member.id === executor.id || member.id === me.id || member.id === interaction.guild.ownerId) {
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
      return interaction.editReply({
        components: [buildNotice("No Eligible Members", "No eligible members to purge after safety checks.", false)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (toProcess.length > safeThreshold) {
      const confirmId = `raidwipe_confirm_${interaction.user.id}_${Date.now()}`;
      const cancelId = `raidwipe_cancel_${interaction.user.id}_${Date.now()}`;

      const confirmContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.Warn_red || "⚠️"} Raidwipe Confirmation Required\n` +
              `-# Action: **${action.toUpperCase()}** \`${toProcess.length}\` members who joined in the last \`${timeArg}\`.\n\n` +
              `> Exceeds safe threshold of \`${safeThreshold}\` members. Confirm execution below.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

      const confirmBtn = new ButtonBuilder()
        .setCustomId(confirmId)
        .setLabel(`Confirm ${action.toUpperCase()} (${toProcess.length})`)
        .setStyle(ButtonStyle.Danger);

      const cancelBtn = new ButtonBuilder()
        .setCustomId(cancelId)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

      confirmContainer.addActionRowComponents(new ActionRowBuilder().addComponents(confirmBtn, cancelBtn));

      if (!client.raidwipeConfirmations) client.raidwipeConfirmations = new Map();
      client.raidwipeConfirmations.set(confirmId, {
        guildId: interaction.guild.id,
        authorId: interaction.user.id,
        action,
        reason,
        toProcessIds: toProcess.map((m) => m.id),
      });

      return interaction.editReply({
        components: [confirmContainer],
        flags: MessageFlags.IsComponentsV2,
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

    antiraidManager.incrementStats(interaction.guild.id, "blockedCount", successful);

    const summary = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.ticky_red || "✅"} Raidwipe Execution Summary\n` +
            `> - **Time Window:** \`${timeArg}\`\n` +
            `> - **Action:** \`${action.toUpperCase()}\`\n` +
            `> - **Matching Members Found:** \`${filtered.size}\`\n` +
            `> - **Eligible After Checks:** \`${toProcess.length}\`\n` +
            `> - **Successfully Removed:** \`${successful}\` member(s)\n` +
            `> - **Failed Removals:** \`${failed}\` member(s)\n` +
            `> - **Protected (Bots/Staff):** \`${protectedCount}\` member(s)`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Executed by ${interaction.user.tag} • ASTRIXCODE™`)
      );

    return interaction.editReply({
      components: [summary],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
