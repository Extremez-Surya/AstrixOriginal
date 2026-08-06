const {
  PermissionFlagsBits,
  ChannelType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");
const welcomeCanvas = require("../../lib/welcomeCanvas");

module.exports = {
  name: "welcome",
  description: "Configure and manage the server welcome message system.",
  category: "Welcome",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  others: {
    options: [
      {
        name: "enable",
        description: "Enable the welcome greetings module",
        type: 1, // SUB_COMMAND
      },
      {
        name: "disable",
        description: "Disable the welcome greetings module",
        type: 1, // SUB_COMMAND
      },
      {
        name: "config",
        description: "View current welcome system configuration & live preview",
        type: 1, // SUB_COMMAND
      },
      {
        name: "reset",
        description: "Reset all welcome system settings to default configuration",
        type: 1, // SUB_COMMAND
      },
      {
        name: "edit",
        description: "Edit welcome system options in one command",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "channel",
            description: "The text channel to send welcome greetings in",
            type: 7, // CHANNEL
            channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: false,
          },
          {
            name: "message",
            description: "Welcome message template (supports {user}, {server}, {memberCount})",
            type: 3, // STRING
            required: false,
          },
          {
            name: "canvas_enabled",
            description: "Enable or disable canvas image card generation",
            type: 5, // BOOLEAN
            required: false,
          },
          {
            name: "canvas_bg_url",
            description: "Custom background image URL for welcome canvas card (or 'reset')",
            type: 3, // STRING
            required: false,
          },
          {
            name: "auto_role",
            description: "Role to assign to new members when they join",
            type: 8, // ROLE
            required: false,
          },
        ],
      },
      {
        name: "card",
        description: "Configure welcome canvas card image settings",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "enabled",
            description: "True to enable canvas card image, false to disable",
            type: 5, // BOOLEAN
            required: false,
          },
          {
            name: "bg_url",
            description: "Background image URL for card (or 'reset')",
            type: 3, // STRING
            required: false,
          },
        ],
      },
      {
        name: "cardconfig",
        description: "Open the interactive Welcome Card Studio to change templates, colors & shapes",
        type: 1, // SUB_COMMAND
      },
      {
        name: "channel",
        description: "Set the channel for welcome messages",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "target",
            description: "The text channel to send welcome cards in",
            type: 7, // CHANNEL
            channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: true,
          },
        ],
      },
      {
        name: "toggle",
        description: "Enable or disable welcome messages",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "state",
            description: "True to enable, false to disable",
            type: 5, // BOOLEAN
            required: true,
          },
        ],
      },
      {
        name: "message",
        description: "Set custom welcome message text",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "template",
            description: "Welcome message template (supports {user}, {server}, {memberCount})",
            type: 3, // STRING
            required: true,
          },
        ],
      },
      {
        name: "test",
        description: "Send a live test welcome card to the configured channel",
        type: 1, // SUB_COMMAND
      },
    ],
  },

  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();

    if (sub === "enable") {
      const config = welcomeManager.updateGuildWelcome(interaction.guildId, { enabled: true });
      const chText = config.channelId ? `<#${config.channelId}>` : "`Not set`";
      return interaction.editReply(`✅ Welcome greetings module is now **ENABLED**! Target Channel: ${chText}`);
    }

    if (sub === "disable") {
      welcomeManager.updateGuildWelcome(interaction.guildId, { enabled: false });
      return interaction.editReply(`⚠️ Welcome greetings module is now **DISABLED**.`);
    }

    if (sub === "config") {
      const config = welcomeManager.getGuildWelcome(interaction.guildId);
      const channelMention = config.channelId ? `<#${config.channelId}>` : "`Not Configured`";
      const roleMention = config.autoRoleId ? `<@&${config.autoRoleId}>` : "`None`";

      const previewText = welcomeManager.formatWelcomeText(
        config.messageText,
        interaction.member,
        interaction.guild
      );

      const mainContent =
        `# ⚙️ Welcome System Configuration Details\n` +
        `-# *Full overview of active welcome settings for ${interaction.guild.name}.*\n\n` +
        `### 📌 Status & Channels\n` +
        `> - **Module State:** \`${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
        `> - **Target Channel:** ${channelMention}\n` +
        `> - **Auto-Assign Role:** ${roleMention}\n\n` +
        `### 🖼️ Canvas Image Settings\n` +
        `> - **Canvas Card:** \`${config.canvasEnabled ? "ENABLED" : "DISABLED"}\`\n` +
        `> - **Background URL:** ${config.canvasBgUrl ? `[Custom Image](${config.canvasBgUrl})` : "`Default Dark Gradient`"}\n\n` +
        `### 📩 Join DM Settings\n` +
        `> - **Join DM State:** \`${config.joinDmEnabled ? "ENABLED" : "DISABLED"}\`\n` +
        `> - **DM Message:** \`${config.joinDmText}\`\n\n` +
        `### 💬 Channel Message Template\n` +
        `\`\`\`\n${config.messageText}\n\`\`\`\n` +
        `> **Formatted Live Output Preview:**\n` +
        `> ${previewText}`;

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(mainContent)
      );
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "cardconfig") {
      const { buildCardConfigPayload } = require("../../lib/welcome/handleWelcomeCanvasInteraction");
      const payload = await buildCardConfigPayload(interaction.member);
      return interaction.editReply(payload);
    }

    if (sub === "reset") {
      welcomeManager.resetGuildWelcome(interaction.guildId);
      return interaction.editReply(`🔄 All welcome system configuration parameters have been reset to factory defaults.`);
    }

    if (sub === "edit") {
      const updates = {};
      const channel = interaction.options.getChannel("channel");
      if (channel) updates.channelId = channel.id;

      const messageTemplate = interaction.options.getString("message");
      if (messageTemplate) updates.messageText = messageTemplate;

      const canvasEnabled = interaction.options.getBoolean("canvas_enabled");
      if (canvasEnabled !== null && canvasEnabled !== undefined) updates.canvasEnabled = canvasEnabled;

      const canvasBgUrl = interaction.options.getString("canvas_bg_url");
      if (canvasBgUrl) {
        if (canvasBgUrl.toLowerCase() === "reset" || canvasBgUrl.toLowerCase() === "none") {
          updates.canvasBgUrl = null;
        } else {
          updates.canvasBgUrl = canvasBgUrl;
        }
      }

      const autoRole = interaction.options.getRole("auto_role");
      if (autoRole) updates.autoRoleId = autoRole.id;

      if (Object.keys(updates).length === 0) {
        return interaction.editReply("ℹ️ No parameters were provided to edit. Specify channel, message, canvas_enabled, canvas_bg_url, or auto_role.");
      }

      welcomeManager.updateGuildWelcome(interaction.guildId, updates);
      return interaction.editReply(`🛠️ Welcome settings updated successfully! (${Object.keys(updates).join(", ")})`);
    }

    if (sub === "card") {
      const enabled = interaction.options.getBoolean("enabled");
      const bgUrl = interaction.options.getString("bg_url");
      const updates = {};

      if (enabled !== null && enabled !== undefined) updates.canvasEnabled = enabled;
      if (bgUrl) {
        if (bgUrl.toLowerCase() === "reset" || bgUrl.toLowerCase() === "none") {
          updates.canvasBgUrl = null;
        } else {
          updates.canvasBgUrl = bgUrl;
        }
      }

      if (Object.keys(updates).length === 0) {
        const config = welcomeManager.getGuildWelcome(interaction.guildId);
        return interaction.editReply(`ℹ️ Welcome Canvas Card is currently **${config.canvasEnabled ? "ENABLED" : "DISABLED"}**.`);
      }

      welcomeManager.updateGuildWelcome(interaction.guildId, updates);
      return interaction.editReply(`✅ Welcome card settings updated successfully!`);
    }

    if (sub === "channel") {
      const channel = interaction.options.getChannel("target");
      welcomeManager.updateGuildWelcome(interaction.guildId, { channelId: channel.id, enabled: true });
      return interaction.editReply(`✅ Welcome channel updated to ${channel}. Join greetings are active!`);
    }

    if (sub === "toggle") {
      const state = interaction.options.getBoolean("state");
      welcomeManager.updateGuildWelcome(interaction.guildId, { enabled: state });
      return interaction.editReply(`✅ Welcome greetings module is now **${state ? "ENABLED" : "DISABLED"}**.`);
    }

    if (sub === "message") {
      const template = interaction.options.getString("template");
      welcomeManager.updateGuildWelcome(interaction.guildId, { messageText: template });
      return interaction.editReply(`✅ Welcome message template updated successfully!`);
    }

    if (sub === "test") {
      const config = welcomeManager.getGuildWelcome(interaction.guildId);
      if (!config.channelId) {
        return interaction.editReply("❌ No welcome channel configured. Use `/welcome channel` first.");
      }

      const channel = interaction.guild.channels.cache.get(config.channelId);
      if (!channel) {
        return interaction.editReply("❌ Configured welcome channel no longer exists.");
      }

      const welcomeText = welcomeManager.formatWelcomeText(
        config.messageText,
        interaction.member,
        interaction.guild
      );

      const sendFiles = [];
      let mediaGallery = null;

      if (config.canvasEnabled) {
        try {
          const cardBuffer = await welcomeCanvas.generateWelcomeCard(interaction.member, config);
          const canvasAttachment = new AttachmentBuilder(cardBuffer, {
            name: "welcome-card.png",
          });
          sendFiles.push(canvasAttachment);

          const mediaItem = new MediaGalleryItemBuilder().setURL(
            "attachment://welcome-card.png",
          );
          mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
        } catch (_) {}
      }

      const mainContent =
        `# 🌙 Welcome to ${interaction.guild.name}, <@${interaction.user.id}>!\n` +
        `-# *We're glad you're here as member **#${interaction.guild.memberCount.toLocaleString()}**.*\n\n` +
        `<:members:1528311049726591006> **Member Overview**\n` +
        `> -# <:prefix:1528309903972892772> **Member:** <@${interaction.user.id}>\n` +
        `> -# <:servers:1528311514065535007> **Username:** \`${interaction.user.username}\`\n` +
        `> -# <:list:1528313871889334382> **Member Count:** \`#${interaction.guild.memberCount.toLocaleString()}\``;

      const footerText = `-# Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™ • Test Triggered By ${interaction.user.tag}`;

      const container = new ContainerBuilder();
      if (mediaGallery) container.addMediaGalleryComponents(mediaGallery);

      container
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

      await channel.send({
        components: [container],
        files: sendFiles,
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      return interaction.editReply(`✅ Sent a live test welcome card to ${channel}!`);
    }
  },
};
