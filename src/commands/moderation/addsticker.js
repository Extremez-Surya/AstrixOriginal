const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["addsticker", "createsticker"],
  category: "Moderation",
  desc: "Upload a custom sticker to the server.",

  botPermissions: ["ManageEmojisAndStickers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    let stickerUrl = null;
    let name = args[0];
    let tags = args[1] || "astrix";

    if (message.attachments.first()) {
      stickerUrl = message.attachments.first().url;
    } else if (args[0] && args[0].startsWith("http")) {
      stickerUrl = args[0];
      name = args[1] || "custom_sticker";
      tags = args[2] || "astrix";
    }

    if (!stickerUrl || !name) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Arguments\n` +
            `-# *Usage: Attach a PNG/APNG/GIF image with \`.addsticker <name> [tags]\` or \`.addsticker <image_url> <name> [tags]\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    try {
      const createdSticker = await message.guild.stickers.create({
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

      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Failed to Add Sticker\n` +
            `-# *${err.message || "An error occurred while creating the sticker."}*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
