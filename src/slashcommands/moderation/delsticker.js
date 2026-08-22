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
  name: "delsticker",
  category: "Moderation",
  description: "Delete a custom sticker from the server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "sticker",
      description: "Sticker name or ID.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["ManageEmojisAndStickers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const input = interaction.options.getString("sticker");

    const stickers = await interaction.guild.stickers.fetch();
    const targetSticker =
      stickers.get(input) ||
      stickers.find((s) => s.name.toLowerCase() === input.toLowerCase());

    if (!targetSticker) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Sticker Not Found\n` +
            `-# *Could not find sticker \`${input}\` in this server.*`,
        ),
      );
      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    try {
      const stickerName = targetSticker.name;
      await targetSticker.delete();

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:astrix:1539875362945900574> Sticker Deleted Successfully\n` +
              `-# *Successfully removed custom sticker **${stickerName}** from the server.*`,
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
          `### <:red_star:1539875482680696834> Failed to Delete Sticker\n` +
            `-# *${err.message || "An error occurred while deleting the sticker."}*`,
        ),
      );
      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
