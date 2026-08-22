const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  parseEmoji,
  AttachmentBuilder,
  SectionBuilder,
  ThumbnailBuilder,
} = require("discord.js");

module.exports = {
  name: "enlarge",
  category: "Moderation",
  description: "Enlarge a custom emoji to high resolution.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "emoji",
      description: "Custom emoji to enlarge.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const input = interaction.options.getString("emoji");
    const parsed = parseEmoji(input);

    if (!parsed || !parsed.id) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Invalid Custom Emoji\n` +
            `-# *Please specify a custom Discord emoji to enlarge.*`,
        ),
      );
      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const ext = parsed.animated ? "gif" : "png";
    const imageUrl = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}?size=1024`;
    const files = [];
    const container = new ContainerBuilder();

    try {
      const attachment = new AttachmentBuilder(imageUrl, {
        name: "enlarged_asset.png",
      });
      files.push(attachment);

      const section = new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL("attachment://enlarged_asset.png"),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:astrix:1539875362945900574> Emoji ── :${parsed.name}:\n` +
              `-# *High-resolution render of custom emoji.*`,
          ),
        );

      container.addSectionComponents(section);
    } catch (e) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:astrix:1539875362945900574> Emoji ── :${parsed.name}:\n` +
            `-# *Direct Link:* ${imageUrl}`,
        ),
      );
    }

    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
        ),
      );

    return interaction
      .editReply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
