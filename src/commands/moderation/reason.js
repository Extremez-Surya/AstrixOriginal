const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["reason", "setreason", "casereason"],
  category: "Moderation",
  desc: "Update the recorded reason for a moderation case.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const caseId = args[0];
    const newReason = args.slice(1).join(" ");

    if (!caseId || !newReason) {
      return message.reply("Usage: `.reason <caseId> <new_reason>`");
    }

    const updated = moderationManager.updateCaseReason(
      message.guild.id,
      caseId,
      newReason,
      message.author.username
    );

    if (!updated) {
      return message.reply(`❌ Case #${caseId} was not found in this server.`);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Case #${caseId} Reason Updated\n` +
        `-# *Action: \`${updated.action}\` | Target: \`${updated.targetTag}\`*\n\n` +
        `> - **New Reason:** \`${updated.reason}\`\n` +
        `> - **Updated By:** \`${message.author.username}\``
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
