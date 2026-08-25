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
const goodbyeManager = require("../../lib/goodbyeManager");
const welcomeCanvas = require("../../lib/welcomeCanvas");

module.exports = {
  alias: ["goodbyetest", "leavetest", "testgoodbye", "testleave"],
  category: "Goodbye",
  desc: "Send a live preview test of the departure card in the current channel.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const permissions = message.channel.permissionsFor(message.guild.members.me);
    if (!permissions || !permissions.has("SendMessages") || !permissions.has("AttachFiles")) {
      return message.reply("❌ Missing permissions! Bot requires `Send Messages` and `Attach Files` permissions in this channel.").catch(() => null);
    }

    const config = goodbyeManager.getGuildGoodbye(message.guild.id);
    const firstCh = config.channels && config.channels[0];
    const sampleDesc = firstCh?.description || "**{user.tag}** has left the server.";
    const goodbyeText = goodbyeManager.formatGoodbyeText(
      sampleDesc,
      message.member || message.author,
      message.guild
    );

    const sendFiles = [];
    let mediaGallery = null;

    try {
      const cardBuffer = await welcomeCanvas.generateGoodbyeCard(
        message.member || message.author,
        firstCh || {}
      );
      const canvasAttachment = new AttachmentBuilder(cardBuffer, {
        name: "goodbye-card.png",
      });
      sendFiles.push(canvasAttachment);

      const mediaItem = new MediaGalleryItemBuilder().setURL(
        "attachment://goodbye-card.png",
      );
      mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
    } catch (err) {
      console.error("[GoodbyeTest] Error generating goodbye card:", err);
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
      `<:members:1539875392532512808> **Member Departure Overview**\n` +
      `> -# <:prefix:1539875384080990228> **Member:** <@${message.author.id}>\n` +
      `> -# <:servers:1539875396546207795> **Username:** \`${message.author.username}\`\n` +
      `> -# <:list:1539875411780042802> **Remaining Members:** \`${message.guild.memberCount.toLocaleString()}\`\n\n` +
      `> ${goodbyeText}`;

    const footerText = `-# ASTRIXCODE™ Goodbye Engine • Test Triggered By ${message.author.tag}`;

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
    }).catch(() => null);
  },
};
