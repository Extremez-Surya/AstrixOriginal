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
  name: "suggest",
  alias: ["suggest", "suggestion"],
  category: "General",
  description: "Submit server suggestions or configure suggestion channels.",
  usage:
    ".suggest Title | Description | Reason\n" +
    ".suggest channel #channel\n" +
    ".suggest anychannel <on|off>\n" +
    ".suggest disable",

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
              `-# *You need **Manage Server** or **Administrator** permission to set suggestion channels.*`
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
            `### 📌 Suggest Channel Usage\n` +
              `-# *Syntax: \`.suggest channel #channel\` or \`.suggest channel disable\`*`
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
          cfg.suggestChannelId = null;
          return cfg;
        });
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.tick || "✅"} Suggestion Channel Cleared\n` +
              `-# *Suggestions have been disabled.*`
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
              `-# *Please mention a valid text channel or provide a channel ID.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestChannelId = channelMention.id;
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Suggestion Channel Updated\n` +
            `-# *Suggestions will now be posted in <#${channelMention.id}>.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // SUBCOMMAND: anychannel
    if (subcommand === "anychannel") {
      if (!isAdmin) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
              `-# *You need **Manage Server** or **Administrator** permission to configure suggestion modes.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const state = args[1]?.toLowerCase();
      if (state !== "on" && state !== "off" && state !== "true" && state !== "false") {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📌 AnyChannel Usage\n` +
              `-# *Syntax: \`.suggest anychannel <on|off>\`*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const allowAll = state === "on" || state === "true";
      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestAllowAllChannels = allowAll;
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} AnyChannel Mode Updated\n` +
            `-# *Members can ${allowAll ? "now submit suggestions from any channel." : "only submit suggestions inside the designated suggestion channel."}*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // SUBCOMMAND: disable
    if (subcommand === "disable") {
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

      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestChannelId = null;
        cfg.suggestAllowAllChannels = false;
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Suggestions Disabled\n` +
            `-# *Suggestion system has been disabled.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // SUBMIT SUGGESTION
    if (!config.suggestChannelId) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Suggestions Not Configured\n` +
            `-# *An administrator must run \`.suggest channel #channel\` to set up suggestions.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const suggestionChannel = message.guild.channels.cache.get(config.suggestChannelId);
    if (!suggestionChannel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Channel Missing\n` +
            `-# *The configured suggestion channel no longer exists. Please run \`.suggest channel #channel\`.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (!config.suggestAllowAllChannels && message.channel.id !== suggestionChannel.id) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Wrong Channel\n` +
            `-# *Please submit suggestions inside <#${suggestionChannel.id}>.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const fullText = args.join(" ");
    if (!fullText.includes("|")) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Invalid Format\n` +
            `-# *Please separate Title, Description, and Reason with \`|\`*\n\n` +
            `> **Usage:** \`.suggest Title | Description | Reason\`\n` +
            `> **Example:** \`.suggest Dark Theme | Add dark mode UI | Better for night reading\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const parts = fullText.split("|").map((p) => p.trim());
    if (parts.length < 2) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Invalid Format\n` +
            `-# *Provide at least Title and Description separated by \`|\`*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const title = parts[0];
    const description = parts[1];
    const reason = parts[2] || "N/A";

    const msgIdTemp = `sug_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const suggestionContainer = new ContainerBuilder();
    suggestionContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# 💡 New Suggestion from ${message.author.username}\n` +
          `-# *Submitted by <@${message.author.id}>*\n\n` +
          `### 📌 ${title}\n\n` +
          `**Description:**\n${description}\n\n` +
          `**Benefits / Reason:**\n${reason}`
      )
    );

    suggestionContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const upvoteButton = new ButtonBuilder()
      .setCustomId(`suggest_upvote_${msgIdTemp}`)
      .setLabel("0")
      .setEmoji(EMOJIS.upvote || "👍")
      .setStyle(ButtonStyle.Success);

    const downvoteButton = new ButtonBuilder()
      .setCustomId(`suggest_downvote_${msgIdTemp}`)
      .setLabel("0")
      .setEmoji(EMOJIS.downvote || "👎")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(upvoteButton, downvoteButton);
    suggestionContainer.addActionRowComponents(row);

    const postedMsg = await suggestionChannel.send({
      components: [suggestionContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    const responseContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Suggestion Submitted\n` +
          `-# *Your suggestion has been posted to <#${suggestionChannel.id}>!*`
      )
    );

    await message.reply({
      components: [responseContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    if (message.deletable) {
      await message.delete().catch(() => null);
    }
  },
};
