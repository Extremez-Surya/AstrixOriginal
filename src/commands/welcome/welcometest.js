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
const welcomeManager = require("../../lib/welcomeManager");
const welcomeCanvas = require("../../lib/welcomeCanvas");

module.exports = {
  alias: ["welcometest", "testwelcome"],
  category: "Welcome",
  desc: "Send a live preview test of the modern welcome card in the current channel.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const permissions = message.channel.permissionsFor(message.guild.members.me);
    if (!permissions || !permissions.has("SendMessages") || !permissions.has("AttachFiles")) {
      return message.reply("❌ Missing permissions! Bot requires `Send Messages` and `Attach Files` permissions in this channel.").catch(() => null);
    }

    const config = welcomeManager.getGuildWelcome(message.guild.id);
    const welcomeText = welcomeManager.formatWelcomeText(
      config.messageText,
      message.member || message.author,
      message.guild
    );

    const sendFiles = [];
    let mediaGallery = null;

    try {
      // Pass full config so customized template, colors, shape & bgUrl are rendered!
      const cardBuffer = await welcomeCanvas.generateWelcomeCard(
        message.member || message.author,
        config
      );
      const canvasAttachment = new AttachmentBuilder(cardBuffer, {
        name: "welcome-card.png",
      });
      sendFiles.push(canvasAttachment);

      const mediaItem = new MediaGalleryItemBuilder().setURL(
        "attachment://welcome-card.png",
      );
      mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
    } catch (err) {
      console.error("[WelcomeTest] Error generating welcome card:", err);
    }

    const websiteButton = new ButtonBuilder()
      .setEmoji("🌐")
      .setLabel("Website")
      .setStyle(ButtonStyle.Link)
      .setURL("https://extremez.vercel.app/");

    const supportButton = new ButtonBuilder()
      .setEmoji("💬")
      .setLabel("Support")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/FR9pXG2Mwb");

    const row = new ActionRowBuilder().addComponents(websiteButton, supportButton);

    const mainContent =
      `<:members:1539875392532512808> **Member Overview**\n` +
      `> -# <:prefix:1539875384080990228> **Member:** <@${message.author.id}>\n` +
      `> -# <:servers:1539875396546207795> **Username:** \`${message.author.username}\`\n` +
      `> -# <:list:1539875411780042802> **Member Count:** \`#${message.guild.memberCount.toLocaleString()}\``;

    const footerText = `-# Built with <:Red_heart:1539875406671388683> by ASTRIXCODE™ • Test Triggered By ${message.author.tag}`;

    const container = new ContainerBuilder();
    if (mediaGallery) {
      container.addMediaGalleryComponents(mediaGallery);
    }
    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(mainContent),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(footerText),
      )
      .addActionRowComponents(row);

    return message.reply({
      components: [container],
      files: sendFiles,
      flags: MessageFlags.IsComponentsV2,
    }).catch((err) => {
      console.error("[WelcomeTest] Error sending reply:", err);
    });
  },
};
