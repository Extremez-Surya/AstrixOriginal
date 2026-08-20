const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["crimefile", "modhistory", "history", "cases"],
  category: "Moderation",
  desc: "View moderation case history and offenses for a user or the server.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (targetUser) {
      const userCases = moderationManager.getUserCases(message.guild.id, targetUser.id);
      const userNotes = moderationManager.getNotes(message.guild.id, targetUser.id);

      if (userCases.length === 0 && userNotes.length === 0) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.tick || "✅"} Clean Record ── ${targetUser.username}\n` +
            `-# *No moderation cases or notes found for this user.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      const caseLines = userCases.slice(0, 10).map((c) => {
        const ts = Math.floor(c.timestamp / 1000);
        return `> **Case #${c.caseId} [${c.action}]** ── <t:${ts}:R>\n` +
               `> - *Reason:* \`${c.reason}\`\n` +
               `> - *Moderator:* \`${c.moderatorTag}\``;
      });

      const noteLines = userNotes.slice(0, 5).map((n) => {
        const ts = Math.floor(n.timestamp / 1000);
        return `> • Note #${n.id}: "${n.content}" (${n.moderator} • <t:${ts}:R>)`;
      });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📂 **Crimefile & History** ── ${targetUser.username}\n` +
            `-# *Total Cases: \`${userCases.length}\` | Active Notes: \`${userNotes.length}\`*\n\n` +
            (caseLines.length > 0 ? `**Recent Cases:**\n${caseLines.join("\n\n")}\n\n` : "") +
            (noteLines.length > 0 ? `**Moderator Notes:**\n${noteLines.join("\n")}\n\n` : "") +
            `-# *Tip: Use \`.reason <caseId> <new_reason>\` to update case details.*`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# Powered by Astrix Moderation Engine`)
        );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // Server-wide Cases Overview with Interactive Filter Menu
    const allCases = moderationManager.getGuildCases(message.guild.id, "all");

    if (allCases.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Server Clean Record\n` +
          `-# *No moderation cases have been recorded in this server yet.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("crimefile_filter")
      .setPlaceholder("Filter cases by action type...")
      .addOptions([
        { label: "All Cases", value: "all", description: `View all (${allCases.length} total)`, emoji: "📂" },
        { label: "Bans & Tempbans", value: "ban", description: "Filter ban cases", emoji: "🔨" },
        { label: "Mutes & Timeouts", value: "mute", description: "Filter mute cases", emoji: "🔇" },
        { label: "Kicks", value: "kick", description: "Filter kick cases", emoji: "👢" },
        { label: "Warnings", value: "warn", description: "Filter warning cases", emoji: "⚠️" },
      ]);

    const menuRow = new ActionRowBuilder().addComponents(selectMenu);

    const renderCasesContainer = (filter = "all") => {
      const filtered = moderationManager.getGuildCases(message.guild.id, filter);
      const lines = filtered.slice(-10).reverse().map((c) => {
        const ts = Math.floor(c.timestamp / 1000);
        return `> **Case #${c.caseId} [${c.action}]** <@${c.targetId}> ── <t:${ts}:R>\n` +
               `> - *Reason:* \`${c.reason}\` • *Mod:* \`${c.moderatorTag}\``;
      });

      return new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📂 **Server Moderation Cases** (${filter.toUpperCase()})\n` +
            `-# *Showing ${lines.length} of ${filtered.length} total recorded cases*\n\n` +
            (lines.length > 0 ? lines.join("\n\n") : "*No cases found for this filter.*") +
            `\n\n-# *Tip: Use \`.crimefile @user\` to inspect a specific member.*`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addActionRowComponents(menuRow);
    };

    const replyMsg = await message.reply({
      components: [renderCasesContainer("all")],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== message.author.id) {
        return i.reply({ content: "You cannot interact with this menu.", ephemeral: true });
      }
      const selected = i.values[0];
      await i.update({
        components: [renderCasesContainer(selected)],
        flags: MessageFlags.IsComponentsV2,
      });
    });
  },
};
