const {
  ApplicationCommandType,
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
  name: "serverbanner",
  category: "Information",
  description: "View the server's custom banners and splash images.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;

    const guildBanner = guild.bannerURL({ size: 2048 });
    const discoverySplash = guild.discoverySplashURL({ size: 2048 });
    const inviteSplash = guild.splashURL({ size: 2048 });

    if (!guildBanner && !discoverySplash && !inviteSplash) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:Servericon:1539875445166702592> Server Banners ── ${guild.name}\n` +
            `-# *No custom banners set for this server.*\n\n` +
            `> -# <:Warn_red:1539875499147399218> **Note** ─ This server does not have a custom banner, discovery splash, or invite splash.`,
        ),
      );

      return interaction.editReply({
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
        `### <:Servericon:1539875445166702592> ${typeTitle} ── ${guild.name}\n\n` +
        `> -# <:servers:1539875396546207795> **Guild** ─ \`${guild.name}\`\n` +
        `> -# <:prefix:1539875384080990228> **Type** ─ \`${typeTitle}\`\n` +
        `> -# <:list:1539875411780042802> **Links** ─ [PNG](${pngUrl}) • [JPG](${jpgUrl}) • [WEBP](${webpUrl})`;

      const requesterTag =
        interaction.user.discriminator && interaction.user.discriminator !== "0"
          ? `${interaction.user.username}#${interaction.user.discriminator}`
          : interaction.user.username;
      const footerContent = `-# Requested by ${requesterTag} • Built with <:Red_heart:1539875406671388683> by ASTRIXCODE™`;

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

    await interaction.editReply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const replyMsg = await interaction.fetchReply();

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const updatedContainer = buildBannerPage(i.customId);
      await interaction.editReply({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    });

    collector.on("end", async (collected) => {
      try {
        const lastSelected = collected.last()?.customId || initialView;
        const finalContainer = buildBannerPage(lastSelected, true);
        await interaction.editReply({
          components: [finalContainer],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      } catch (e) {}
    });
  },
};
