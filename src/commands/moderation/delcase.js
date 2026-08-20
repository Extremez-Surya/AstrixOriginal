const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["delcase", "casedelete", "removecase"],
  category: "Moderation",
  desc: "Delete a moderation case from the server records.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const caseId = args[0];

    if (!caseId) {
      return message.reply("Usage: `.delcase <caseId>`");
    }

    const deleted = moderationManager.deleteCase(message.guild.id, caseId);

    if (!deleted) {
      return message.reply(`❌ Case #${caseId} was not found in this server.`);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Case #${caseId} Deleted\n` +
        `-# *Successfully purged case record from server moderation history.*`
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
