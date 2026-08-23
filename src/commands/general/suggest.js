const {
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const suggestionManager = require("../../lib/suggestionManager");
const {
  buildSuggestionContainer,
  buildSuggestionSubmissionCard,
} = require("../../lib/general/handleSuggestionHubInteraction");

module.exports = {
  name: "suggest",
  alias: ["suggest", "suggestion"],
  category: "General",
  description: "Submit server suggestions or configure suggestion channels & voting.",
  usage:
    ".suggest <idea / proposal>\n" +
    ".suggest <Title> | <Description> | <Reason>\n" +
    ".suggest channel <#channel>\n" +
    ".suggest anychannel <on|off>\n" +
    ".suggest disable",

  async execute(client, message, args) {
    if (!message.guild) return;

    const guildId = message.guild.id;
    const config = suggestionManager.getGuildConfig(client, guildId);
    const subcommand = args[0]?.toLowerCase();

    const isAdmin =
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.ManageGuild);

    // 1. OPEN CONFIGURATION DASHBOARD
    if (!args.length || subcommand === "config" || subcommand === "settings" || subcommand === "panel") {
      if (!isAdmin) {
        return message.reply({
          content: "💡 **How to submit a suggestion:**\n*Usage:* `.suggest <your idea / proposal>`\n*Or:* `.suggest Title | Description | Reason`",
        }).catch(() => null);
      }

      const container = buildSuggestionContainer(message.guild, config, "overview");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 2. SUBCOMMAND: channel
    if (subcommand === "channel") {
      if (!isAdmin) {
        return message.reply({
          content: "❌ You need **Manage Server** or **Administrator** permission to set suggestion channels.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const input = args[1];
      if (!input) {
        const container = buildSuggestionContainer(message.guild, config, "channels");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }

      if (input.toLowerCase() === "disable" || input.toLowerCase() === "off" || input.toLowerCase() === "none") {
        suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
          cfg.suggestChannelId = null;
          return cfg;
        });
        const freshConfig = suggestionManager.getGuildConfig(client, guildId);
        const container = buildSuggestionContainer(message.guild, freshConfig, "channels");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }

      const channelMention =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(input.replace(/\D/g, ""));

      if (!channelMention) {
        return message.reply({
          content: "⚠️ Please mention a valid text channel or provide a channel ID.",
        }).catch(() => null);
      }

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestChannelId = channelMention.id;
        return cfg;
      });

      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const container = buildSuggestionContainer(message.guild, freshConfig, "channels");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 3. SUBCOMMAND: anychannel
    if (subcommand === "anychannel") {
      if (!isAdmin) {
        return message.reply({
          content: "❌ You need **Manage Server** or **Administrator** permission to configure suggestion modes.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const state = args[1]?.toLowerCase();
      if (!state) {
        const container = buildSuggestionContainer(message.guild, config, "channels");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }

      const allowAll = state === "on" || state === "true" || state === "enable";
      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestAllowAllChannels = allowAll;
        return cfg;
      });

      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const container = buildSuggestionContainer(message.guild, freshConfig, "channels");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 4. SUBCOMMAND: disable
    if (subcommand === "disable") {
      if (!isAdmin) {
        return message.reply({
          content: "❌ You need **Manage Server** or **Administrator** permission to disable suggestions.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestChannelId = null;
        cfg.suggestAllowAllChannels = false;
        return cfg;
      });

      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const container = buildSuggestionContainer(message.guild, freshConfig, "overview");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 5. SUBMIT SUGGESTION
    if (!config.suggestChannelId) {
      return message.reply({
        content: "⚠️ **Suggestions Not Configured.** An administrator must run `.suggest channel #channel` to set up the suggestions feed.",
      }).catch(() => null);
    }

    const targetChannel = message.guild.channels.cache.get(config.suggestChannelId);
    if (!targetChannel) {
      return message.reply({
        content: "⚠️ The configured suggestion channel no longer exists. Please ask an admin to run `.suggest channel #channel`.",
      }).catch(() => null);
    }

    if (!config.suggestAllowAllChannels && message.channel.id !== targetChannel.id) {
      return message.reply({
        content: `⚠️ Suggestions can only be submitted inside <#${targetChannel.id}>. *(Or admins can enable \`.suggest anychannel on\`)*`,
      }).catch(() => null);
    }

    // Parse input
    const fullText = args.join(" ");
    let title = "";
    let description = "";
    let reason = null;

    if (fullText.includes("|")) {
      const parts = fullText.split("|").map((p) => p.trim());
      title = parts[0];
      description = parts[1] || "";
      reason = parts[2] || null;
    } else {
      title = fullText;
      description = null;
    }

    if (!title) {
      return message.reply({
        content: "⚠️ Suggestion content cannot be empty.",
      }).catch(() => null);
    }

    const cardContainer = buildSuggestionSubmissionCard(message.author, title, description, reason);

    const voteRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`suggest_upvote_${message.id}`)
        .setLabel("0")
        .setEmoji(EMOJIS.upvote || "👍")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`suggest_downvote_${message.id}`)
        .setLabel("0")
        .setEmoji(EMOJIS.downvote || "👎")
        .setStyle(ButtonStyle.Danger)
    );

    cardContainer.addActionRowComponents(voteRow);

    const postedMsg = await targetChannel.send({
      components: [cardContainer],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    if (!postedMsg) {
      return message.reply({
        content: "❌ Failed to send suggestion. Please ensure I have permissions to send messages and use components in the suggestion channel.",
      }).catch(() => null);
    }

    // Optional: Auto-create discussion thread if enabled
    if (config.suggestThreadEnabled) {
      const threadName = `💡 ${title.slice(0, 80)}`;
      await postedMsg.startThread({
        name: threadName,
        autoArchiveDuration: 1440,
        reason: `Suggestion thread by ${message.author.tag}`,
      }).catch(() => null);
    }

    // Confirmation
    if (message.channel.id !== targetChannel.id) {
      const confirmContainer = new ContainerBuilder();
      confirmContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 💡 **Suggestion Submitted Successfully!**\n` +
          `> • 📍 **Posted in:** <#${targetChannel.id}>\n` +
          `> • 📌 **Proposal:** ${title.slice(0, 100)}\n\n` +
          `-# *Members can now cast votes on your suggestion.*`
        )
      );

      await message.reply({
        components: [confirmContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } else {
      await message.delete().catch(() => null);
    }
  },
};
