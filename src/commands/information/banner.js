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
  alias: ["banner"],
  category: "Information",
  desc: "View a user's profile or server banner.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    let targetUser = message.mentions.users.first() || message.author;
    if (!message.mentions.users.first() && args[0]) {
      try {
        const fetched = await client.users.fetch(args[0]);
        if (fetched) targetUser = fetched;
      } catch (e) {}
    }

    let user;
    try {
      user = await client.users.fetch(targetUser.id, { force: true });
    } catch (e) {
      return message.reply("Could not retrieve user banner data.");
    }

    const member = await message.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    const globalBanner = user.bannerURL({ size: 2048 });
    const serverBanner = member ? member.bannerURL({ size: 2048 }) : null;

    if (!globalBanner && !serverBanner) {
      const userTag =
        user.discriminator && user.discriminator !== "0"
          ? `${user.username}#${user.discriminator}`
          : user.username;

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:members:1528311049726591006> Profile Banner ── ${user.username}\n` +
            `-# *No custom banner set for this user.*\n\n` +
            `> -# <:servers:1528311514065535007> **User** ─ \`${userTag}\`\n` +
            `> -# <:Warn_red:1528691439658078290> **Note** ─ This user does not have a custom profile or server banner.`,
        ),
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // Helper function to build the container based on type
    const buildBannerResponse = (type, disableAll = false) => {
      const isGlobal = type === "global";
      const pngUrl = isGlobal
        ? user.bannerURL({ extension: "png", size: 2048 })
        : member.bannerURL({ extension: "png", size: 2048 });
      const jpgUrl = isGlobal
        ? user.bannerURL({ extension: "jpg", size: 2048 })
        : member.bannerURL({ extension: "jpg", size: 2048 });
      const webpUrl = isGlobal
        ? user.bannerURL({ extension: "webp", size: 2048 })
        : member.bannerURL({ extension: "webp", size: 2048 });

      const mediaItem = new MediaGalleryItemBuilder().setURL(webpUrl);
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      const userTag =
        user.discriminator && user.discriminator !== "0"
          ? `${user.username}#${user.discriminator}`
          : user.username;

      const mainContent =
        `### <:members:1528311049726591006> ${isGlobal ? "Global Profile Banner" : "Server Profile Banner"} ── ${user.username}\n\n` +
        `> -# <:servers:1528311514065535007> **User** ─ \`${userTag}\`\n` +
        `> -# <:prefix:1528309903972892772> **Type** ─ \`${isGlobal ? "Global Profile Banner" : "Server Profile Banner"}\`\n` +
        `> -# <:list:1528313871889334382> **Links** ─ [PNG](${pngUrl}) • [JPG](${jpgUrl}) • [WEBP](${webpUrl})`;

      const requesterTag =
        message.author.discriminator && message.author.discriminator !== "0"
          ? `${message.author.username}#${message.author.discriminator}`
          : message.author.username;
      const footerContent = `-# Requested by ${requesterTag} • Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™`;

      // Interactive Buttons (both remain enabled/clickable when active)
      const globalBtn = new ButtonBuilder()
        .setCustomId("global")
        .setLabel("Global Banner")
        .setStyle(isGlobal ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disableAll || !globalBanner);

      const serverBtn = new ButtonBuilder()
        .setCustomId("server")
        .setLabel("Server Banner")
        .setStyle(!isGlobal ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disableAll || !serverBanner);

      const row = new ActionRowBuilder().addComponents(globalBtn, serverBtn);

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

    // Determine initial view (Global if exists, else server)
    const initialView = globalBanner ? "global" : "server";
    const initialContainer = buildBannerResponse(initialView);

    const replyMsg = await message.reply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    // Create interaction collector
    const filter = (i) => i.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const updatedContainer = buildBannerResponse(i.customId);
      await i.editReply({
        components: [updatedContainer],
      });
    });

    collector.on("end", async (collected) => {
      try {
        const lastSelected = collected.last()?.customId || initialView;
        const finalContainer = buildBannerResponse(lastSelected, true);
        await replyMsg.edit({
          components: [finalContainer],
        });
      } catch (e) {}
    });
  },
};
