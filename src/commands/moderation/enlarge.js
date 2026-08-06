const {
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
  alias: ["enlarge", "e", "jumbo"],
  category: "Moderation",
  desc: "Enlarge a custom emoji or sticker to high resolution.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0] && message.stickers.size === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Target Emoji/Sticker\n` +
            `-# *Please specify a custom emoji or send/attach a sticker.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    let imageUrl = null;
    let title = "Enlarged Asset";

    if (message.stickers.size > 0) {
      const sticker = message.stickers.first();
      imageUrl = sticker.url;
      title = `Sticker ── ${sticker.name}`;
    } else if (args[0]) {
      const parsed = parseEmoji(args[0]);
      if (parsed && parsed.id) {
        const ext = parsed.animated ? "gif" : "png";
        imageUrl = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}?size=1024`;
        title = `Emoji ── :${parsed.name}:`;
      }
    }

    if (!imageUrl) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Invalid Custom Emoji\n` +
            `-# *Only custom server emojis and stickers can be enlarged.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

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
            `### <:astrix:1527205612205903973> ${title}\n` +
              `-# *High-resolution render of custom asset.*`,
          ),
        );

      container.addSectionComponents(section);
    } catch (e) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:astrix:1527205612205903973> ${title}\n` +
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

    return message
      .reply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
