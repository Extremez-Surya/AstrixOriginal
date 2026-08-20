const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const snipeManager = require("../../lib/snipeManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["editsnipe", "esnipe", "es"],
  category: "Miscellaneous",
  desc: "Inspect recently edited messages with before and after comparison.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const editedMsgs = snipeManager.getEditedMessages(message.guild.id, message.channel.id);

    if (!editedMsgs.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} No Edited Messages\n` +
          `-# *No recently edited messages recorded in this channel.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    let index = 0;
    if (args[0]) {
      const parsed = parseInt(args[0], 10) - 1;
      if (!isNaN(parsed) && parsed >= 0 && parsed < editedMsgs.length) {
        index = parsed;
      }
    }

    const item = editedMsgs[index];
    const editTs = Math.floor(item.timestamp / 1000);
    const author = item.author;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✏️ **Edited Message** ── ${author?.username || "Unknown Member"} (Index ${index + 1}/${editedMsgs.length})\n` +
          `-# *Edited <t:${editTs}:R> (<t:${editTs}:T>)*\n\n` +
          `> - **Author:** <@${author.id}> (\`${author.id}\`)\n` +
          (item.messageUrl ? `> - **Jump:** [Jump to Message](${item.messageUrl})\n\n` : "\n") +
          `**Before (Original):**\n>>> ${item.oldContent || "*(Empty / Media only)*"}\n\n` +
          `**After (Edited):**\n>>> ${item.newContent || "*(Empty)*"}`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    if (editedMsgs.length > 1) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Showing ${index + 1} of ${editedMsgs.length} • Use \`.editsnipe [1-${editedMsgs.length}]\` to view earlier edits`
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
