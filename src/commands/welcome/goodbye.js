const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const path = require("path");
const welcomeManager = require("../../lib/welcomeManager");
const welcomeCanvas = require("../../lib/welcomeCanvas");

module.exports = {
  alias: ["goodbye", "farewell", "leavemessage"],
  category: "Welcome",
  desc: "Configure and manage the server goodbye message system.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === "enable" || sub === "on") {
      const config = welcomeManager.updateGuildGoodbye(message.guild.id, { enabled: true });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Goodbye Module Activated\n` +
          `-# *Farewell messages for departing members are now ENABLED.*\n\n` +
          `> - **Goodbye Channel:** ${config.channelId ? `<#${config.channelId}>` : "`Not set`"}\n` +
          `> - **Tip:** Use \`.goodbye channel #channel\` to set where leave cards are sent.`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (sub === "disable" || sub === "off") {
      welcomeManager.updateGuildGoodbye(message.guild.id, { enabled: false });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ Goodbye Module Deactivated\n` +
          `-# *Member departure messages are currently DISABLED.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (sub === "channel") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) {
        return message.reply({
          content: "❌ Please mention a valid text channel for goodbye messages (e.g. `.goodbye channel #goodbye`).",
        }).catch(() => null);
      }
      welcomeManager.updateGuildGoodbye(message.guild.id, { channelId: channel.id, enabled: true });
      return message.reply({
        content: `✅ Goodbye channel set to ${channel}. Departure messages are enabled!`,
      }).catch(() => null);
    }

    if (sub === "message" || sub === "msg") {
      const text = args.slice(1).join(" ");
      if (!text) {
        return message.reply({
          content: "❌ Please provide a goodbye message template (e.g. `.goodbye message Goodbye {username}, we'll miss you!`).",
        }).catch(() => null);
      }
      welcomeManager.updateGuildGoodbye(message.guild.id, { messageText: text });
      return message.reply({
        content: `✅ Goodbye message template updated successfully!`,
      }).catch(() => null);
    }

    if (sub === "test") {
      const goodbyeConfig = welcomeManager.getGuildGoodbye(message.guild.id);
      if (!goodbyeConfig.channelId) {
        return message.reply({
          content: "❌ No goodbye channel configured yet. Use `.goodbye channel #channel` first.",
        }).catch(() => null);
      }

      const channel = message.guild.channels.cache.get(goodbyeConfig.channelId);
      if (!channel) {
        return message.reply({
          content: "❌ Configured goodbye channel not found.",
        }).catch(() => null);
      }

      const goodbyeText = welcomeManager.formatWelcomeText(
        goodbyeConfig.messageText,
        message.member,
        message.guild
      );

      const sendFiles = [];
      let mediaGallery = null;

      if (goodbyeConfig.canvasEnabled) {
        try {
          const cardBuffer = await welcomeCanvas.generateGoodbyeCard(message.member, {
            bgUrl: goodbyeConfig.canvasBgUrl,
          });
          const canvasAttachment = new AttachmentBuilder(cardBuffer, {
            name: "goodbye-card.png",
          });
          sendFiles.push(canvasAttachment);

          const mediaItem = new MediaGalleryItemBuilder().setURL(
            "attachment://goodbye-card.png",
          );
          mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
        } catch (_) {}
      }

      const container = new ContainerBuilder();
      if (mediaGallery) {
        container.addMediaGalleryComponents(mediaGallery);
      }

      container
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# <:astrix:1527205612205903973> [TEST] Farewell from ${message.guild.name}\n` +
          `> ${goodbyeText}`
        ));

      await channel.send({
        components: [container],
        files: sendFiles,
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      return message.reply({ content: `✅ Sent a live test goodbye card to ${channel}!` }).catch(() => null);
    }

    const config = welcomeManager.getGuildGoodbye(message.guild.id);
    const channelMention = config.channelId ? `<#${config.channelId}>` : "`None`";

    const astrixPath = path.join(__dirname, "../../assets/astrix.png");
    const bannerAttachment = new AttachmentBuilder(astrixPath, {
      name: "astrix.png",
    });

    const mediaItem = new MediaGalleryItemBuilder().setURL(
      "attachment://astrix.png",
    );
    const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

    const mainContent =
      `# <:astrix:1527205612205903973> Goodbye Engine Dashboard\n` +
      `-# *Configure automatic member departure cards and leave greetings.*\n\n` +
      `<:list:1528313871889334382> **Configuration Overview**\n` +
      `> -# <:prefix:1528309903972892772> **Status:** \`${config.enabled ? "ENABLED" : "DISABLED"}\`\n` +
      `> -# <:servers:1528311514065535007> **Goodbye Channel:** ${channelMention}\n` +
      `> -# <:members:1528311049726591006> **Canvas Card:** \`${config.canvasEnabled ? "ENABLED" : "DISABLED"}\`\n\n` +
      `> **Subcommands:**\n` +
      `> - \`.goodbye enable / disable\` — Toggle goodbye system\n` +
      `> - \`.goodbye channel #channel\` — Set leave message channel\n` +
      `> - \`.goodbye message <text>\` — Set leave message template\n` +
      `> - \`.goodbye test\` — Send live test goodbye card`;

    const footerText = `-# ASTRIXCODE™ Goodbye Engine • © 2026 ASTRIXCODE`;

    const container = new ContainerBuilder()
      .addMediaGalleryComponents(mediaGallery)
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

    return message.reply({
      components: [container],
      files: [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
