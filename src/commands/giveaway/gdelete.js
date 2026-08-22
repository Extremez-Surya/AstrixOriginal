const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  alias: ["gdelete", "gcancel", "giveawaydelete"],
  category: "Giveaway",
  desc: "Cancel and delete a giveaway completely without picking winners.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const messageId = args[0];

    if (!messageId) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Missing Message ID\n` +
            `-# *Usage: \`.gdelete <message_id>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const success = await giveawayManager.deleteGiveaway(client, messageId);
    if (!success) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Giveaway Not Found\n` +
            `-# *No giveaway matching message ID \`${messageId}\` was found.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🗑️ Giveaway Deleted Successfully\n` +
          `-# *Cancelled and deleted giveaway matching ID \`${messageId}\`.*`,
      ),
    );

    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
