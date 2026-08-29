const {
  MessageFlags,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require("discord.js");
const feedbackManager = require("../../lib/feedbackManager");

module.exports = {
  name: "feedback",
  alias: ["feedback", "bugreport", "reportbug", "idea", "suggeststaff"],
  category: "General",
  description: "Community feedback & bug reporting system with dedicated setup panel and clean user portal.",
  usage:
    ".feedback (Open Admin Setup Panel)\n" +
    ".feedback post / .feedback deploy (Deploy user portal to channel)\n" +
    ".feedback log <#channel> (Configure staff receiving channel)\n" +
    ".feedback <your detailed message>",

  async execute(client, message, args) {
    if (!message.guild) return;

    const guildId = message.guild.id;
    const sub1 = args[0]?.toLowerCase();
    const isAdmin =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    // 1. DEPLOY USER PORTAL TO CHANNEL (.feedback post / .feedback deploy / .feedback portal)
    if (sub1 === "post" || sub1 === "deploy" || sub1 === "portal" || sub1 === "send") {
      if (!isAdmin) {
        return message.reply({
          content: "❌ You need **Manage Server** or **Administrator** permission to deploy the feedback portal.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const targetChan = message.mentions.channels.first() || message.channel;
      const userPortal = feedbackManager.buildFeedbackUserPortal(message.guild);

      await targetChan.send({
        components: [userPortal],
        flags: MessageFlags.IsComponentsV2,
      }).catch((err) => {
        console.error("[FeedbackCommand] Failed to send user portal:", err);
      });

      feedbackManager.updateGuildFeedbackConfig(guildId, { portalChannelId: targetChan.id });

      if (targetChan.id !== message.channel.id) {
        return message.reply({
          content: `✅ Public Feedback Portal deployed to <#${targetChan.id}>!`,
        }).catch(() => null);
      }
      return message.delete().catch(() => null);
    }

    // 2. CONFIGURE LOG CHANNEL (.feedback log <#channel> or .feedback channel <#channel>)
    if (sub1 === "log" || sub1 === "channel" || sub1 === "staff") {
      if (!isAdmin) {
        return message.reply({
          content: "❌ You need **Manage Server** permission to configure staff routing.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!targetChannel || !targetChannel.isTextBased()) {
        return message.reply({
          content: "⚠️ **Invalid Channel.**\n*Usage:* `.feedback log #staff-feedback-logs`",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      feedbackManager.updateGuildFeedbackConfig(guildId, { staffChannelId: targetChannel.id });

      return message.reply({
        content: `✅ Staff feedback destination set to <#${targetChannel.id}>!`,
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 3. OPEN ADMIN SETUP (If Admin and no arguments)
    if (!args.length || sub1 === "setup" || sub1 === "panel" || sub1 === "admin") {
      if (isAdmin) {
        const adminPanel = feedbackManager.buildFeedbackAdminPanel(message.guild);
        return message.reply({
          components: [adminPanel],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      } else {
        // Regular user ran .feedback with no args -> Show the clean User Portal
        const userPortal = feedbackManager.buildFeedbackUserPortal(message.guild);
        return message.reply({
          components: [userPortal],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    // 4. DIRECT TEXT FEEDBACK SUBMISSION (.feedback <text>)
    const feedbackText = args.join(" ");
    feedbackManager.incrementFeedbackCount(guildId);

    // Build Staff Notification Card
    const staffCard = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📬 **New Community Feedback Received**\n` +
          `-# Submitted by <@${message.author.id}> (\`${message.author.tag}\`) in <#${message.channel.id}>\n\n` +
          `> **Message Content:**\n` +
          `> ${feedbackText.replace(/\n/g, "\n> ")}`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Staff Notification`));

    const cfg = feedbackManager.getGuildFeedbackConfig(guildId);
    let targetChannel = null;

    if (cfg.staffChannelId) {
      targetChannel = message.guild.channels.cache.get(cfg.staffChannelId);
    }

    if (!targetChannel) {
      targetChannel = message.guild.channels.cache.find(
        (c) =>
          c.isTextBased() &&
          (c.name.includes("feedback") ||
            c.name.includes("mod-log") ||
            c.name.includes("bot-log") ||
            c.name.includes("staff-chat"))
      );
    }

    if (targetChannel) {
      await targetChannel.send({
        components: [staffCard],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // User receipt
    const receiptContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📬 **Feedback Received!**\n` +
          `-# Thank you for helping improve **${message.guild.name}**\n\n` +
          `> • **Submitter:** <@${message.author.id}>\n` +
          `> • **Summary:** ${feedbackText.length > 80 ? feedbackText.slice(0, 77) + "..." : feedbackText}\n\n` +
          `-# Your feedback has been acknowledged and delivered to server staff.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community Feedback Engine`));

    await message.delete().catch(() => null);

    return message.channel.send({
      components: [receiptContainer],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
