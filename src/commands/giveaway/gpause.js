const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  alias: ["gpause", "giveawaypause"],
  category: "Giveaway",
  desc: "Pause the countdown timer of an active giveaway.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const messageId = args[0];

    if (!messageId) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Message ID\n` +
            `-# *Usage: \`.gpause <message_id>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const res = await giveawayManager.pauseGiveaway(client, messageId);
    if (!res) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Unable to Pause\n` +
            `-# *Giveaway matching ID \`${messageId}\` was not found, is already paused, or has ended.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏸️ Giveaway Paused Successfully\n` +
          `-# *Paused countdown timer for **${res.prize}** (\`${messageId}\`). Use \`.gunpause ${messageId}\` to resume.*`,
      ),
    );

    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
