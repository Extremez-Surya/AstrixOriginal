const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  parseEmoji,
} = require("discord.js");

module.exports = {
  alias: ["addemoji", "stealemoji", "steal"],
  category: "Moderation",
  desc: "Add or steal a custom emoji into the server.",

  botPermissions: ["ManageEmojisAndStickers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    let emojiUrl = null;
    let name = args[1] || null;

    // Check attachment first
    if (message.attachments.first()) {
      emojiUrl = message.attachments.first().url;
      if (!name) name = args[0] || "custom_emoji";
    } else if (args[0]) {
      const parsed = parseEmoji(args[0]);
      if (parsed && parsed.id) {
        const ext = parsed.animated ? "gif" : "png";
        emojiUrl = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}`;
        if (!name) name = parsed.name;
      } else if (args[0].startsWith("http")) {
        emojiUrl = args[0];
        if (!name) name = args[1] || "custom_emoji";
      }
    }

    if (!emojiUrl || !name) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Arguments\n` +
            `-# *Usage: \`.addemoji <emoji | image_url> [name]\` or attach an image with \`.addemoji <name>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    try {
      const cleanName = name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
      const createdEmoji = await message.guild.emojis.create({
        attachment: emojiUrl,
        name: cleanName,
      });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:astrix:1527205612205903973> Emoji Added Successfully\n` +
              `-# *Successfully added ${createdEmoji} \`:${createdEmoji.name}:\` to the server.*\n\n` +
              `> - **Emoji Name:** \`${createdEmoji.name}\`\n` +
              `> - **Emoji ID:** \`${createdEmoji.id}\``,
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
          `### <a:red_star:1528688099436003419> Failed to Add Emoji\n` +
            `-# *${err.message || "An error occurred while creating the emoji."}*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
