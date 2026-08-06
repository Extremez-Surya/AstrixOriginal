const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  alias: ["gunpause", "gresume", "giveawayunpause"],
  category: "Giveaway",
  desc: "Resume/unpause a paused giveaway.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const messageId = args[0];

    if (!messageId) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Message ID\n` +
            `-# *Usage: \`.gunpause <message_id>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const res = await giveawayManager.unpauseGiveaway(client, messageId);
    if (!res) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Unable to Unpause\n` +
            `-# *Giveaway matching ID \`${messageId}\` was not found, is not paused, or has ended.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const endUnix = Math.floor(res.endTimestamp / 1000);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ▶️ Giveaway Resumed Successfully\n` +
          `-# *Resumed countdown timer for **${res.prize}** (\`${messageId}\`).*\n\n` +
          `> <:clock:1528312173275906088> **New End Time:** <t:${endUnix}:R>`,
      ),
    );

    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
