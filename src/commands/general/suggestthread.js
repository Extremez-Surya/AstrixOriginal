const {
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const suggestionManager = require("../../lib/suggestionManager");
const {
  buildSuggestionContainer,
  buildSuggestionSubmissionCard,
} = require("../../lib/general/handleSuggestionHubInteraction");

module.exports = {
  name: "suggestthread",
  alias: ["suggestthread", "suggestthreads", "threadsuggestion"],
  category: "General",
  description: "Create suggestion threads or configure suggestion thread channels.",
  usage:
    ".suggestthread <Title> | <Content>\n" +
    ".suggestthread channel <#channel>\n" +
    ".suggestthread enable\n" +
    ".suggestthread disable",

  async execute(client, message, args) {
    if (!message.guild) return;

    const guildId = message.guild.id;
    const config = suggestionManager.getGuildConfig(client, guildId);
    const subcommand = args[0]?.toLowerCase();

    const isAdmin =
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.ManageGuild);

    // 1. OPEN THREAD CONFIGURATION DASHBOARD
    if (!args.length || subcommand === "config" || subcommand === "settings") {
      if (!isAdmin) {
        return message.reply({
          content: "💡 **How to submit a suggestion thread:**\n*Usage:* `.suggestthread <Title> | <Details / Proposal>`",
        }).catch(() => null);
      }

      const container = buildSuggestionContainer(message.guild, config, "threads");
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
          content: "❌ You need **Manage Server** or **Administrator** permission to configure suggestion thread channels.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const input = args[1];
      if (!input) {
        const container = buildSuggestionContainer(message.guild, config, "threads");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }

      if (input.toLowerCase() === "disable" || input.toLowerCase() === "off" || input.toLowerCase() === "none") {
        suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
          cfg.suggestThreadChannelId = null;
          cfg.suggestThreadEnabled = false;
          return cfg;
        });

        const freshConfig = suggestionManager.getGuildConfig(client, guildId);
        const container = buildSuggestionContainer(message.guild, freshConfig, "threads");
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
          content: "⚠️ Please mention a valid channel or provide a channel ID.",
        }).catch(() => null);
      }

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestThreadChannelId = channelMention.id;
        cfg.suggestThreadEnabled = true;
        return cfg;
      });

      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const container = buildSuggestionContainer(message.guild, freshConfig, "threads");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 3. SUBCOMMAND: enable / disable
    if (subcommand === "enable" || subcommand === "on") {
      if (!isAdmin) {
        return message.reply({
          content: "❌ You need **Manage Server** or **Administrator** permission.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestThreadEnabled = true;
        return cfg;
      });

      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const container = buildSuggestionContainer(message.guild, freshConfig, "threads");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "disable" || subcommand === "off") {
      if (!isAdmin) {
        return message.reply({
          content: "❌ You need **Manage Server** or **Administrator** permission.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestThreadEnabled = false;
        return cfg;
      });

      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const container = buildSuggestionContainer(message.guild, freshConfig, "threads");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 4. SUBMIT SUGGESTION WITH THREAD
    const targetChannelId = config.suggestThreadChannelId || config.suggestChannelId;
    if (!targetChannelId) {
      return message.reply({
        content: "⚠️ **Suggestion Threads Not Configured.** An admin must run `.suggestthread channel #channel` first.",
      }).catch(() => null);
    }

    const targetChannel = message.guild.channels.cache.get(targetChannelId);
    if (!targetChannel) {
      return message.reply({
        content: "⚠️ The configured suggestion channel no longer exists.",
      }).catch(() => null);
    }

    const fullText = args.join(" ");
    let title = "";
    let description = "";

    if (fullText.includes("|")) {
      const parts = fullText.split("|").map((p) => p.trim());
      title = parts[0];
      description = parts[1] || "";
    } else {
      title = fullText.slice(0, 50);
      description = fullText;
    }

    if (!title || !description) {
      return message.reply({
        content: "⚠️ **Invalid Format.**\n*Usage:* `.suggestthread <Title> | <Details / Proposal>`",
      }).catch(() => null);
    }

    const cardContainer = buildSuggestionSubmissionCard(message.author, title, description);

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
        content: "❌ Failed to create suggestion card in destination channel.",
      }).catch(() => null);
    }

    // Start thread
    const thread = await postedMsg.startThread({
      name: `💡 ${title.slice(0, 80)}`,
      autoArchiveDuration: 1440,
      reason: `Suggestion thread by ${message.author.tag}`,
    }).catch(() => null);

    if (thread) {
      await thread.send({
        content: `👋 Welcome to the discussion thread for **${title}** proposed by ${message.author}! Feel free to share your thoughts.`,
      }).catch(() => null);
    }

    if (message.channel.id !== targetChannel.id) {
      const confirmContainer = new ContainerBuilder();
      confirmContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧵 **Suggestion Discussion Thread Created!**\n` +
          `> • 📍 **Posted in:** <#${targetChannel.id}>\n` +
          `> • 🧵 **Thread:** ${thread ? `<#${thread.id}>` : `\`${title}\``}\n\n` +
          `-# *Members can now join the thread and vote on the card.*`
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
