const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["steal", "eadd", "stealemoji", "stealsticker"],
  category: "Moderation",
  desc: "Steal emojis or stickers from custom text or referenced messages and add them to this server.",
  botPermissions: ["ManageGuildExpressions"],
  userPermissions: ["ManageGuildExpressions"],
  devOnly: false,

  async execute(client, message, args) {
    const customEmojiRegex = /<(a)?:(\w+):(\d+)>/;
    const match = args[0]?.match(customEmojiRegex);

    if (match) {
      const isAnimated = Boolean(match[1]);
      const name = match[2];
      const id = match[3];
      const url = `https://cdn.discordapp.com/emojis/${id}.${isAnimated ? "gif" : "png"}`;

      const added = await message.guild.emojis.create({ attachment: url, name }).catch(() => null);

      if (!added) {
        return message.reply("Failed to add emoji. Ensure the bot has `Manage Emojis & Stickers` permission and free slots.");
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 😃 Emoji Stealed & Added!\n` +
          `-# *Successfully added to server emoji list.*\n\n` +
          `> - **Emoji:** ${added} (\`:${added.name}:\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 😃 Steal Emoji / Sticker\n` +
        `-# *Steal custom emojis from other servers.*\n\n` +
        `> - **Usage:** \`.steal <custom_emoji>\` or reply to a message containing emojis/stickers with \`.steal\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
