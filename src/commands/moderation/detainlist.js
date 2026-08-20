const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["detainlist", "quarantined", "detainedlist"],
  category: "Moderation",
  desc: "View all members currently detained/quarantined in the server.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ModerateMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const list = moderationManager.getAllDetained(message.guild.id);

    if (list.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} No Detained Members\n` +
          `-# *There are currently no members under quarantine in this server.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const lines = list.map((d) => {
      const ts = Math.floor(d.timestamp / 1000);
      return `> • <@${d.userId}> (\`${d.userId}\`)\n` +
             `> - *Reason:* \`${d.reason}\` • *Detained <t:${ts}:R>*`;
    });

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚨 **Active Detained Members** (${list.length})\n` +
          `-# *Currently quarantined members in ${message.guild.name}*\n\n` +
          lines.join("\n\n") +
          `\n\n-# *Tip: Use \`.release @user\` to lift detention.*`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
