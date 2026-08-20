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
  alias: ["reactionhistory", "rhistory", "rh"],
  category: "Miscellaneous",
  desc: "View the reaction add and remove history for a message.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMsgId =
      args[0] ||
      message.reference?.messageId ||
      message.channel.lastMessageId;

    if (!targetMsgId) {
      return message.reply("Please provide a message ID or reply to a message: `.reactionhistory <message_id>`");
    }

    const history = snipeManager.getReactionHistory(targetMsgId);

    if (!history.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} No Reaction History\n` +
          `-# *No reaction activity has been recorded for message ID:* \`${targetMsgId}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const lines = history.slice(0, 15).map((entry) => {
      const action = entry.action === "add" ? "🟢 Added" : "🔴 Removed";
      const ts = Math.floor(entry.timestamp / 1000);
      return `> ${entry.emoji} **${action}** by <@${entry.user.id}> ── <t:${ts}:R>`;
    });

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔘 **Reaction History** ── Message \`${targetMsgId}\`\n` +
          `-# *Logged reaction activity timeline (${history.length} entries)*\n\n` +
          lines.join("\n")
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Powered by Astrix Miscellaneous Engine`
        )
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
