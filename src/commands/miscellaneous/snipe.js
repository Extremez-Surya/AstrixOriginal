const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const snipeManager = require("../../lib/snipeManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["snipe", "s"],
  category: "Miscellaneous",
  desc: "Inspect recently deleted messages in the current channel.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const deletedMsgs = snipeManager.getDeletedMessages(message.guild.id, message.channel.id);

    if (!deletedMsgs.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Nothing to Snipe\n` +
          `-# *No recently deleted messages recorded in this channel.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    let index = 0;
    if (args[0]) {
      const parsed = parseInt(args[0], 10) - 1;
      if (!isNaN(parsed) && parsed >= 0 && parsed < deletedMsgs.length) {
        index = parsed;
      }
    }

    const snipe = deletedMsgs[index];
    const deleteTs = Math.floor(snipe.timestamp / 1000);
    const author = snipe.author;

    const contentLines = [
      `### 🗑️ **Sniped Message** ── ${author?.username || "Unknown Member"} (Index ${index + 1}/${deletedMsgs.length})`,
      `-# *Deleted <t:${deleteTs}:R> (<t:${deleteTs}:T>)*\n`,
      `> - **Author:** <@${author.id}> (\`${author.id}\`)`,
    ];

    if (snipe.content) {
      contentLines.push(`\n**Message Content:**\n>>> ${snipe.content}`);
    } else {
      contentLines.push(`\n*No text content (Attachment/Media only)*`);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(contentLines.join("\n"))
    );

    if (snipe.attachments?.length > 0) {
      const gallery = new MediaGalleryBuilder();
      for (const att of snipe.attachments) {
        if (att.url.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
          gallery.addItems(new MediaGalleryItemBuilder().setURL(att.url));
        }
      }
      container.addMediaGalleryComponents(gallery);
    }

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    if (deletedMsgs.length > 1) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Showing ${index + 1} of ${deletedMsgs.length} • Use \`.snipe [1-${deletedMsgs.length}]\` to view earlier deletions`
        )
      );
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Powered by Astrix Miscellaneous Engine`)
      );
    }

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
