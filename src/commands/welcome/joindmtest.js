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
  alias: ["joindmtest", "testjoindm", "dmwelcometest"],
  category: "Welcome",
  desc: "Send a live preview test of the Join DM message directly to your DMs.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const config = welcomeManager.getGuildWelcome(message.guild.id);
    const dmContent = welcomeManager.formatWelcomeText(
      config.joinDmText,
      message.member || message.author,
      message.guild
    );

    const sendFiles = [];
    let mediaGallery = null;

    if (config.canvasEnabled) {
      try {
        const cardBuffer = await welcomeCanvas.generateWelcomeCard(
          message.member || message.author,
          config
        );
        const canvasAttachment = new AttachmentBuilder(cardBuffer, {
          name: "welcome-card.png",
        });
        sendFiles.push(canvasAttachment);

        const mediaItem = new MediaGalleryItemBuilder().setURL(
          "attachment://welcome-card.png"
        );
        mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
      } catch (_) {
        const astrixPath = path.join(__dirname, "../../assets/astrix.png");
        const bannerAttachment = new AttachmentBuilder(astrixPath, {
          name: "astrix.png",
        });
        sendFiles.push(bannerAttachment);

        const mediaItem = new MediaGalleryItemBuilder().setURL(
          "attachment://astrix.png"
        );
        mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
      }
    } else {
      const astrixPath = path.join(__dirname, "../../assets/astrix.png");
      const bannerAttachment = new AttachmentBuilder(astrixPath, {
        name: "astrix.png",
      });
      sendFiles.push(bannerAttachment);

      const mediaItem = new MediaGalleryItemBuilder().setURL(
        "attachment://astrix.png"
      );
      mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
    }

    const websiteButton = new ButtonBuilder()
      .setEmoji("<:website:1539875380159184977>")
      .setLabel("Website")
      .setStyle(ButtonStyle.Link)
      .setURL("https://extremez.vercel.app/");

    const supportButton = new ButtonBuilder()
      .setEmoji("<:discord:1539875375981797596>")
      .setLabel("Support")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/FR9pXG2Mwb");

    const row = new ActionRowBuilder().addComponents(websiteButton, supportButton);

    const mainContent =
      `<:members:1539875392532512808> **Member Overview**\n` +
      `> -# <:prefix:1539875384080990228> **Member:** <@${message.author.id}>\n` +
      `> -# <:servers:1539875396546207795> **Username:** \`${message.author.username}\`\n` +
      `> -# <:list:1539875411780042802> **Member Count:** \`#${message.guild.memberCount.toLocaleString()}\`\n\n` +
      `> ${dmContent}`;

    const footerText = `-# Built with <:Red_heart:1539875406671388683> by ASTRIXCODE™ • Test Triggered By ${message.author.tag}`;

    const container = new ContainerBuilder();
    if (mediaGallery) {
      container.addMediaGalleryComponents(mediaGallery);
    }
    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText))
      .addActionRowComponents(row);

    try {
      await message.author.send({
        components: [container],
        files: sendFiles,
        flags: MessageFlags.IsComponentsV2,
      });

      const replyContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✉️ Join DM Test Sent!\n` +
          `-# *A live preview of your Join DM message has been sent to your Direct Messages.*`
        )
      );
      return message.reply({ components: [replyContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch (err) {
      return message.reply("❌ Unable to send Join DM test. Please check if your DMs are open!").catch(() => null);
    }
  },
};
