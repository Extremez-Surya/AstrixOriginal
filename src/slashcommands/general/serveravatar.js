const {
  SlashCommandBuilder,
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
const EMOJIS = require("../../lib/emojis");

module.exports = {
  name: "serveravatar",
  description: "Displays the server icon (avatar) in high resolution.",
  category: "General",
  data: new SlashCommandBuilder()
    .setName("serveravatar")
    .setDescription("Displays the server icon (avatar) in high resolution."),

  async execute(interaction) {
    const guild = interaction.guild;
    const iconUrl = guild.iconURL({ size: 4096, extension: "png" });

    if (!iconUrl) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} No Icon Set\n` +
            `-# ***${guild.name}** currently does not have a server icon.*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# 🖼️ ${guild.name}'s Server Icon\n` +
          `-# *High Resolution Server Avatar Preview*`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const mediaItem = new MediaGalleryItemBuilder()
      .setURL(iconUrl)
      .setDescription(`${guild.name} Icon`);
    const gallery = new MediaGalleryBuilder().addItems(mediaItem);
    container.addMediaGalleryComponents(gallery);

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const buttons = [
      new ButtonBuilder()
        .setLabel("PNG")
        .setStyle(ButtonStyle.Link)
        .setURL(iconUrl),
      new ButtonBuilder()
        .setLabel("JPG")
        .setStyle(ButtonStyle.Link)
        .setURL(guild.iconURL({ size: 4096, extension: "jpg" })),
      new ButtonBuilder()
        .setLabel("WebP")
        .setStyle(ButtonStyle.Link)
        .setURL(guild.iconURL({ size: 4096, extension: "webp" })),
    ];

    if (guild.icon && guild.icon.startsWith("a_")) {
      buttons.push(
        new ButtonBuilder()
          .setLabel("GIF")
          .setStyle(ButtonStyle.Link)
          .setURL(guild.iconURL({ size: 4096, extension: "gif" }))
      );
    }

    const actionRow = new ActionRowBuilder().addComponents(...buttons);
    container.addActionRowComponents(actionRow);

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
