const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");

module.exports = {
  alias: ["serverbanner"],
  category: "Information",
  desc: "View the server's custom banners and splash images.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;

    const guildBanner = guild.bannerURL({ size: 2048 });
    const discoverySplash = guild.discoverySplashURL({ size: 2048 });
    const inviteSplash = guild.splashURL({ size: 2048 });

    if (!guildBanner && !discoverySplash && !inviteSplash) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:Servericon:1528415740196294776> Server Banners ── ${guild.name}\n` +
            `-# *No custom banners set for this server.*\n\n` +
            `> -# <:Warn_red:1528691439658078290> **Note** ─ This server does not have a custom banner, discovery splash, or invite splash.`,
        ),
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // Helper to build response page
    const buildBannerPage = (type, disableAll = false) => {
      let pngUrl, jpgUrl, webpUrl, typeTitle;

      if (type === "banner") {
        pngUrl = guild.bannerURL({ extension: "png", size: 2048 });
        jpgUrl = guild.bannerURL({ extension: "jpg", size: 2048 });
        webpUrl = guild.bannerURL({ extension: "webp", size: 2048 });
        typeTitle = "Server Banner";
      } else if (type === "discovery") {
        pngUrl = guild.discoverySplashURL({ extension: "png", size: 2048 });
        jpgUrl = guild.discoverySplashURL({ extension: "jpg", size: 2048 });
        webpUrl = guild.discoverySplashURL({ extension: "webp", size: 2048 });
        typeTitle = "Discovery Splash";
      } else if (type === "invite") {
        pngUrl = guild.splashURL({ extension: "png", size: 2048 });
        jpgUrl = guild.splashURL({ extension: "jpg", size: 2048 });
        webpUrl = guild.splashURL({ extension: "webp", size: 2048 });
        typeTitle = "Invite Splash";
      }

      const mediaItem = new MediaGalleryItemBuilder().setURL(webpUrl);
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      const mainContent =
        `### <:Servericon:1528415740196294776> ${typeTitle} ── ${guild.name}\n\n` +
        `> -# <:servers:1528311514065535007> **Guild** ─ \`${guild.name}\`\n` +
        `> -# <:prefix:1528309903972892772> **Type** ─ \`${typeTitle}\`\n` +
        `> -# <:list:1528313871889334382> **Links** ─ [PNG](${pngUrl}) • [JPG](${jpgUrl}) • [WEBP](${webpUrl})`;

      const requesterTag =
        message.author.discriminator && message.author.discriminator !== "0"
          ? `${message.author.username}#${message.author.discriminator}`
          : message.author.username;
      const footerContent = `-# Requested by ${requesterTag} • Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™`;

      // Buttons
      const bannerBtn = new ButtonBuilder()
        .setCustomId("banner")
        .setLabel("Server Banner")
        .setStyle(
          type === "banner" ? ButtonStyle.Primary : ButtonStyle.Secondary,
        )
        .setDisabled(disableAll || !guildBanner);

      const discoveryBtn = new ButtonBuilder()
        .setCustomId("discovery")
        .setLabel("Discovery Splash")
        .setStyle(
          type === "discovery" ? ButtonStyle.Primary : ButtonStyle.Secondary,
        )
        .setDisabled(disableAll || !discoverySplash);

      const inviteBtn = new ButtonBuilder()
        .setCustomId("invite")
        .setLabel("Invite Splash")
        .setStyle(
          type === "invite" ? ButtonStyle.Primary : ButtonStyle.Secondary,
        )
        .setDisabled(disableAll || !inviteSplash);

      const row = new ActionRowBuilder().addComponents(
        bannerBtn,
        discoveryBtn,
        inviteBtn,
      );

      return new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(mainContent),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addMediaGalleryComponents(mediaGallery)
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(footerContent),
        )
        .addActionRowComponents(row);
    };

    const initialView = guildBanner
      ? "banner"
      : discoverySplash
        ? "discovery"
        : "invite";
    const initialContainer = buildBannerPage(initialView);

    const replyMsg = await message.reply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const filter = (i) => i.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const updatedContainer = buildBannerPage(i.customId);
      await i.editReply({
        components: [updatedContainer],
        allowedMentions: { parse: [], repliedUser: false },
      });
    });

    collector.on("end", async (collected) => {
      try {
        const lastSelected = collected.last()?.customId || initialView;
        const finalContainer = buildBannerPage(lastSelected, true);
        await replyMsg.edit({
          components: [finalContainer],
          allowedMentions: { parse: [], repliedUser: false },
        });
      } catch (e) {}
    });
  },
};
