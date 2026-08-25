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

module.exports = {
  alias: ["support"],
  category: "Information",
  desc: "Get the link to join the Astrix support server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const logoPath = path.join(__dirname, "../../assets/support.png");
    const bannerAttachment = new AttachmentBuilder(logoPath, {
      name: "support.png",
    });

    const mediaItem = new MediaGalleryItemBuilder().setURL(
      "attachment://support.png",
    );
    const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

    const supportBtn = new ButtonBuilder()
      .setEmoji("💬")
      .setLabel("Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/FR9pXG2Mwb");

    const row = new ActionRowBuilder().addComponents(supportBtn);

    const container = new ContainerBuilder()
      .addMediaGalleryComponents(mediaGallery)
      .addActionRowComponents(row);

    await message.reply({
      components: [container],
      files: [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
