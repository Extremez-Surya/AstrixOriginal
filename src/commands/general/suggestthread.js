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
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const suggestionManager = require("../../lib/suggestionManager");

module.exports = {
  name: "suggestthread",
  alias: ["suggestthread", "suggestthreads", "threadsuggestion"],
  category: "General",
  description: "Create suggestion threads or configure suggestion thread channels.",
  usage:
    ".suggestthread <thread-name> | <content>\n" +
    ".suggestthread channel #channel\n" +
    ".suggestthread enable\n" +
    ".suggestthread disable",

  async execute(client, message, args) {
    const guildId = message.guild.id;
    const config = suggestionManager.getGuildConfig(client, guildId);
    const subcommand = args[0]?.toLowerCase();

    const isAdmin =
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.ManageGuild);

    // SUBCOMMAND: channel
    if (subcommand === "channel") {
      if (!isAdmin) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
              `-# *You need **Manage Server** or **Administrator** permission to configure suggestion thread channels.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const input = args[1];
      if (!input) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📌 Suggestion Thread Channel Usage\n` +
              `-# *Syntax: \`.suggestthread channel #channel\` or \`.suggestthread channel disable\`*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      if (input.toLowerCase() === "disable" || input.toLowerCase() === "off") {
        suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
          cfg.suggestThreadChannelId = null;
          cfg.suggestThreadEnabled = false;
          return cfg;
        });
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.tick || "✅"} Suggestion Thread Channel Cleared\n` +
              `-# *Suggestion threads have been disabled.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const channelMention = message.mentions.channels.first() || message.guild.channels.cache.get(input.replace(/\D/g, ""));
      if (!channelMention) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Invalid Channel\n` +
              `-# *Please mention a valid channel or provide a channel ID.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestThreadChannelId = channelMention.id;
        cfg.suggestThreadEnabled = true;
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Suggestion Thread Channel Set\n` +
            `-# *Suggestion threads will be created in <#${channelMention.id}>.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // SUBCOMMAND: enable / disable
    if (subcommand === "enable" || subcommand === "disable") {
      if (!isAdmin) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Permission Denied`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const enable = subcommand === "enable";
      if (enable && !config.suggestThreadChannelId) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Channel Missing\n` +
              `-# *Set a suggestion thread channel first using \`.suggestthread channel #channel\`.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestThreadEnabled = enable;
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Suggestion Threads ${enable ? "Enabled" : "Disabled"}\n` +
            `-# *Members ${enable ? "can now create suggestion discussion threads." : "can no longer create suggestion threads."}*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // CREATE SUGGESTION THREAD
    if (!config.suggestThreadEnabled || !config.suggestThreadChannelId) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Suggestion Threads Disabled\n` +
            `-# *An administrator must run \`.suggestthread channel #channel\` to set up suggestion threads.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const fullInput = args.join(" ");
    let threadName = "";
    let content = "";

    if (fullInput.includes("|")) {
      const parts = fullInput.split("|").map((p) => p.trim());
      threadName = parts[0];
      content = parts.slice(1).join("|");
    } else {
      threadName = args[0] || "New Suggestion";
      content = args.slice(1).join(" ");
    }

    if (!threadName || !content) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Invalid Usage\n` +
            `-# *Syntax: \`.suggestthread <thread-name> | <content>\`*\n\n` +
            `> **Example:** \`.suggestthread Dark Mode | Add dark mode UI for mobile users\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const channel = message.guild.channels.cache.get(config.suggestThreadChannelId);
    if (!channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Channel Missing\n` +
            `-# *The configured suggestion thread channel no longer exists.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    try {
      const thread = await channel.threads.create({
        name: threadName.slice(0, 100),
        autoArchiveDuration: 1440,
        reason: `Suggestion thread created by ${message.author.tag}`,
      });

      const starterContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# 🧵 Suggestion Thread: ${threadName}\n` +
            `-# *Submitted by <@${message.author.id}>*\n\n` +
            `**Suggestion Content:**\n${content}`
        )
      );

      await thread.send({
        components: [starterContainer],
        flags: MessageFlags.IsComponentsV2,
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Suggestion Thread Created\n` +
            `-# *Created thread <#${thread.id}> in <#${channel.id}>!*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    } catch (err) {
      console.error("Error creating suggestion thread:", err);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Thread Creation Failed\n` +
            `-# *Failed to create suggestion thread. Check bot permissions.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }
  },
};
