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
  alias: ["servericon"],
  category: "Information",
  desc: "View the server's custom icon.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;
    const iconUrl = guild.iconURL({ size: 2048 });

    if (!iconUrl) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:Servericon:1528415740196294776> Server Icon ── ${guild.name}\n` +
            `-# *No custom icon set for this server.*\n\n` +
            `> -# <:Warn_red:1528691439658078290> **Note** ─ This server does not have a custom icon.`,
        ),
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const isAnimated = guild.icon && guild.icon.startsWith("a_");

    // Helper to build response page
    const buildIconPage = (type, disableAll = false) => {
      const isStatic = type === "static";
      const format = isStatic ? "webp" : "gif";

      const pngUrl = guild.iconURL({ extension: "png", size: 2048 });
      const jpgUrl = guild.iconURL({ extension: "jpg", size: 2048 });
      const webpUrl = guild.iconURL({ extension: "webp", size: 2048 });
      const displayUrl = guild.iconURL({ extension: format, size: 2048 });

      const links = [
        `[PNG](${pngUrl})`,
        `[JPG](${jpgUrl})`,
        `[WEBP](${webpUrl})`,
      ];

      if (isAnimated) {
        const gifUrl = guild.iconURL({ extension: "gif", size: 2048 });
        links.push(`[GIF](${gifUrl})`);
      }

      const mediaItem = new MediaGalleryItemBuilder().setURL(displayUrl);
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      const typeTitle = isStatic
        ? "Static Server Icon"
        : "Animated Server Icon";

      const mainContent =
        `### <:Servericon:1528415740196294776> ${typeTitle} ── ${guild.name}\n\n` +
        `> -# <:servers:1528311514065535007> **Guild** ─ \`${guild.name}\`\n` +
        `> -# <:prefix:1528309903972892772> **Type** ─ \`${typeTitle}\`\n` +
        `> -# <:list:1528313871889334382> **Links** ─ ${links.join(" • ")}`;

      const requesterTag =
        message.author.discriminator && message.author.discriminator !== "0"
          ? `${message.author.username}#${message.author.discriminator}`
          : message.author.username;
      const footerContent = `-# Requested by ${requesterTag} • Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™`;

      // Buttons
      const staticBtn = new ButtonBuilder()
        .setCustomId("static")
        .setLabel("Static Icon")
        .setStyle(isStatic ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disableAll);

      const animatedBtn = new ButtonBuilder()
        .setCustomId("animated")
        .setLabel("Animated Icon")
        .setStyle(!isStatic ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disableAll || !isAnimated);

      const row = new ActionRowBuilder().addComponents(staticBtn, animatedBtn);

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

    const initialView = isAnimated ? "animated" : "static";
    const initialContainer = buildIconPage(initialView);

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
      const updatedContainer = buildIconPage(i.customId);
      await i.editReply({
        components: [updatedContainer],
        allowedMentions: { parse: [], repliedUser: false },
      });
    });

    collector.on("end", async (collected) => {
      try {
        const lastSelected = collected.last()?.customId || initialView;
        const finalContainer = buildIconPage(lastSelected, true);
        await replyMsg.edit({
          components: [finalContainer],
          allowedMentions: { parse: [], repliedUser: false },
        });
      } catch (e) {}
    });
  },
};
