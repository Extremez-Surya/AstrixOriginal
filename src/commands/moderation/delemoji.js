const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  parseEmoji,
} = require("discord.js");

module.exports = {
  alias: ["delemoji", "deleteemoji", "removeemoji"],
  category: "Moderation",
  desc: "Delete a custom emoji from the server.",

  botPermissions: ["ManageEmojisAndStickers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0]) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Missing Arguments\n` +
            `-# *Usage: \`.delemoji <emoji_name | emoji_id | custom_emoji>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const input = args[0];
    const parsed = parseEmoji(input);
    const targetId = parsed?.id || input.replace(/[^0-9]/g, "");

    let targetEmoji =
      message.guild.emojis.cache.get(targetId) ||
      message.guild.emojis.cache.find(
        (e) => e.name.toLowerCase() === input.toLowerCase(),
      );

    if (!targetEmoji) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Emoji Not Found\n` +
            `-# *Could not find custom emoji \`${input}\` in this server.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    try {
      const emojiName = targetEmoji.name;
      await targetEmoji.delete();

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:astrix:1539875362945900574> Emoji Deleted Successfully\n` +
              `-# *Successfully removed custom emoji \`:${emojiName}:\` from the server.*`,
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
          `### <:red_star:1539875482680696834> Failed to Delete Emoji\n` +
            `-# *${err.message || "An error occurred while deleting the emoji."}*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
