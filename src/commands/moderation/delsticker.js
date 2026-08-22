const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["delsticker", "deletesticker", "removesticker"],
  category: "Moderation",
  desc: "Delete a custom sticker from the server.",

  botPermissions: ["ManageEmojisAndStickers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0]) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Missing Arguments\n` +
            `-# *Usage: \`.delsticker <sticker_name | sticker_id>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const input = args.join(" ");
    const stickers = await message.guild.stickers.fetch();
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
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
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

      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Failed to Delete Sticker\n` +
            `-# *${err.message || "An error occurred while deleting the sticker."}*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
