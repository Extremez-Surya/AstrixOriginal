const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["addsticker", "createsticker", "stickeradd"],
  category: "Miscellaneous",
  desc: "Upload and add a custom sticker to the server.",
  botPermissions: ["ManageGuildExpressions", "SendMessages"],
  userPermissions: ["ManageGuildExpressions"],
  devOnly: false,

  async execute(client, message, args) {
    let url = null;
    let name = null;
    let tags = "custom";

    if (message.attachments.size > 0) {
      url = message.attachments.first().url;
      name = args[0] || "custom_sticker";
      tags = args.slice(1).join(" ") || name;
    } else if (args[0]?.startsWith("http")) {
      url = args[0];
      name = args[1] || "custom_sticker";
      tags = args.slice(2).join(" ") || name;
    } else if (message.reference) {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (refMsg?.stickers?.size > 0) {
        const sticker = refMsg.stickers.first();
        url = sticker.url;
        name = args[0] || sticker.name;
        tags = sticker.tags || name;
      } else if (refMsg?.attachments?.size > 0) {
        url = refMsg.attachments.first().url;
        name = args[0] || "custom_sticker";
        tags = args.slice(1).join(" ") || name;
      }
    }

    if (!url || !name) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🏷️ **Add Custom Sticker**\n` +
          `-# *Upload stickers to your server with attachments or URLs*\n\n` +
          `> - **Usage:** \`.addsticker <image_url> <name> [tags]\`\n` +
          `> - **With Attachment:** Attach image and type \`.addsticker <name>\`\n` +
          `> - **From Reply:** Reply to a sticker message and type \`.addsticker [name]\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const cleanName = name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 30);
      const createdSticker = await message.guild.stickers.create({
        file: url,
        name: cleanName,
        tags: tags.slice(0, 50),
      });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} **Sticker Added Successfully**\n` +
            `-# *Custom sticker uploaded to server list*\n\n` +
            `> - **Name:** \`${createdSticker.name}\`\n` +
            `> - **Tags:** \`${createdSticker.tags}\`\n` +
            `> - **ID:** \`${createdSticker.id}\``
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to add sticker: \`${err.message}\` (Ensure image is under 512KB and valid PNG/APNG).`);
    }
  },
};
