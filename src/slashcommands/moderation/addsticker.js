const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "addsticker",
  category: "Moderation",
  description: "Upload a custom sticker to the server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "url",
      description: "Direct PNG/APNG image URL for sticker.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "name",
      description: "Sticker name.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "tags",
      description: "Tags associated with sticker.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["ManageEmojisAndStickers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const stickerUrl = interaction.options.getString("url");
    const name = interaction.options.getString("name");
    const tags = interaction.options.getString("tags") || "astrix";

    try {
      const createdSticker = await interaction.guild.stickers.create({
        file: stickerUrl,
        name: name,
        tags: tags,
      });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:astrix:1527205612205903973> Sticker Added Successfully\n` +
              `-# *Successfully created custom sticker **${createdSticker.name}** in the server.*\n\n` +
              `> - **Sticker Name:** \`${createdSticker.name}\`\n` +
              `> - **Sticker ID:** \`${createdSticker.id}\`\n` +
              `> - **Tags:** \`${createdSticker.tags}\``,
          ),
        )
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
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Failed to Add Sticker\n` +
            `-# *${err.message || "An error occurred while creating the sticker."}*`,
        ),
      );
      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
