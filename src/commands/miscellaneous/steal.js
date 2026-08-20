const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  parseEmoji,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["steal", "addemoji", "eadd", "stealemoji", "stealsticker"],
  category: "Miscellaneous",
  desc: "Steal and upload emojis or stickers from messages and links into your server.",
  botPermissions: ["ManageGuildExpressions", "SendMessages"],
  userPermissions: ["ManageGuildExpressions"],
  devOnly: false,

  async execute(client, message, args) {
    // 1. Check if user replied to a message with stickers or emojis
    let targetContent = args.join(" ");
    let stickerToSteal = null;

    if (message.reference) {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (refMsg) {
        if (refMsg.stickers?.size > 0) {
          stickerToSteal = refMsg.stickers.first();
        }
        if (!targetContent) {
          targetContent = refMsg.content;
        }
      }
    }

    // 2. Handle Sticker Steal
    if (stickerToSteal) {
      try {
        const createdSticker = await message.guild.stickers.create({
          file: stickerToSteal.url,
          name: args[0] || stickerToSteal.name,
          tags: stickerToSteal.tags || "stolen",
        });

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} **Sticker Stolen & Added**\n` +
            `-# *Successfully added sticker to server*\n\n` +
            `> - **Name:** \`${createdSticker.name}\`\n` +
            `> - **ID:** \`${createdSticker.id}\``
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (e) {
        return message.reply(`❌ Failed to steal sticker: \`${e.message}\``);
      }
    }

    // 3. Handle Single Direct URL or Attachment
    if (message.attachments.size > 0 || (args[0]?.startsWith("http") && !args[0]?.includes("discordapp.com/emojis/"))) {
      const url = message.attachments.first()?.url || args[0];
      const name = (message.attachments.first() ? args[0] : args[1]) || "custom_emoji";
      const cleanName = name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);

      try {
        const added = await message.guild.emojis.create({ attachment: url, name: cleanName });
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} **Emoji Created**\n` +
            `-# *Successfully uploaded to server emojis*\n\n` +
            `> - **Emoji:** ${added} (\`:${added.name}:\`)`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (e) {
        return message.reply(`❌ Failed to upload emoji: \`${e.message}\``);
      }
    }

    // 4. Handle Custom Discord Emojis Extraction (supports multiple emojis)
    const customEmojiRegex = /<(a)?:(\w+):(\d+)>/g;
    const matches = [...targetContent.matchAll(customEmojiRegex)];

    if (!matches.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 😃 **Steal Emoji / Sticker Help**\n` +
          `-# *Easily add emojis and stickers from other servers*\n\n` +
          `> - **Steal Emojis:** \`.steal <emoji1> <emoji2> ...\`\n` +
          `> - **Steal from Link:** \`.steal <image_url> <name>\`\n` +
          `> - **Steal from Message:** Reply to any message with emojis/stickers and type \`.steal\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const addedList = [];
    const failedList = [];

    for (const match of matches.slice(0, 10)) {
      const isAnimated = Boolean(match[1]);
      const name = match[2];
      const id = match[3];
      const url = `https://cdn.discordapp.com/emojis/${id}.${isAnimated ? "gif" : "png"}`;

      try {
        const added = await message.guild.emojis.create({
          attachment: url,
          name: name.slice(0, 32),
        });
        addedList.push(`${added} (\`:${added.name}:\`)`);
      } catch (err) {
        failedList.push(`\`:${name}:\` (${err.message})`);
      }
    }

    const resultLines = [];
    if (addedList.length) {
      resultLines.push(`**Successfully Added (${addedList.length}):**\n` + addedList.map((e) => `> ${e}`).join("\n"));
    }
    if (failedList.length) {
      resultLines.push(`**Failed (${failedList.length}):**\n` + failedList.map((e) => `> ❌ ${e}`).join("\n"));
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 😃 **Emoji Steal Summary**\n` +
          `-# *Processed ${matches.length} emoji(s)*\n\n` +
          resultLines.join("\n\n")
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
