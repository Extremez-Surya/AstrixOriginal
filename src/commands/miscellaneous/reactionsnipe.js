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
  alias: ["reactionsnipe", "rsnipe", "rs"],
  category: "Miscellaneous",
  desc: "Inspect recently removed reactions in the current channel.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const reactions = snipeManager.getRemovedReactions(message.guild.id, message.channel.id);

    if (!reactions.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} No Removed Reactions\n` +
          `-# *No recently removed reactions recorded in this channel.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    let index = 0;
    if (args[0]) {
      const parsed = parseInt(args[0], 10) - 1;
      if (!isNaN(parsed) && parsed >= 0 && parsed < reactions.length) {
        index = parsed;
      }
    }

    const item = reactions[index];
    const ts = Math.floor(item.timestamp / 1000);
    const user = item.user;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔘 **Reaction Removed** ── ${user?.username || "Unknown Member"} (Index ${index + 1}/${reactions.length})\n` +
          `-# *Removed <t:${ts}:R> (<t:${ts}:T>)*\n\n` +
          `> - **User:** <@${user.id}> (\`${user.id}\`)\n` +
          `> - **Emoji:** ${item.emoji} (\`:${item.emojiName}:\`)\n` +
          (item.messageUrl ? `> - **Message:** [Jump to Message](${item.messageUrl})` : "")
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    if (reactions.length > 1) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Showing ${index + 1} of ${reactions.length} • Use \`.reactionsnipe [1-${reactions.length}]\` to view others`
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
