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
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const path = require("path");

module.exports = {
  name: "invite",
  category: "Information",
  description: "Get the invite link for Astrix.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}`;

    const logoPath = path.join(__dirname, "../../assets/invite.png");
    const bannerAttachment = new AttachmentBuilder(logoPath, {
      name: "invite.png",
    });

    const mediaItem = new MediaGalleryItemBuilder().setURL(
      "attachment://invite.png",
    );
    const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

    const inviteButton = new ButtonBuilder()
      .setEmoji("➕")
      .setLabel("Invite")
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl);

    const supportButton = new ButtonBuilder()
      .setEmoji("💬")
      .setLabel("Support")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/FR9pXG2Mwb");

    const row = new ActionRowBuilder().addComponents(
      inviteButton,
      supportButton,
    );

    const description = `### <:invite:1539875370248052736> Invite Astrix to your server.`;

    const container = new ContainerBuilder()
      .addMediaGalleryComponents(mediaGallery)
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      // .addTextDisplayComponents(
      //   new TextDisplayBuilder().setContent(description),
      // )
      // .addSeparatorComponents(
      //   new SeparatorBuilder()
      //     .setSpacing(SeparatorSpacingSize.Small)
      //     .setDivider(true),
      // )
      .addActionRowComponents(row);

    await interaction.reply({
      components: [container],
      files: [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
