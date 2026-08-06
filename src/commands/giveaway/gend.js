const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  alias: ["gend", "giveawayend", "gstop"],
  category: "Giveaway",
  desc: "Instantly end an active giveaway and pick winner(s).",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const messageId = args[0];

    if (!messageId) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Message ID\n` +
            `-# *Usage: \`.gend <message_id>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const g = giveawayManager.getGiveaway(messageId);
    if (!g || g.guildId !== message.guild.id) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Giveaway Not Found\n` +
            `-# *No active giveaway matching message ID \`${messageId}\` was found.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    if (g.ended) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Giveaway Already Ended\n` +
            `-# *This giveaway has already concluded. Use \`.greroll ${messageId}\` to pick new winners.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const res = await giveawayManager.endGiveaway(client, messageId);

    const winnerText =
      res.winners.length > 0
        ? res.winners.map((w) => `<@${w}>`).join(", ")
        : "No valid participants";

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <a:tada2:1530099488398508073> Giveaway Ended Successfully\n` +
          `-# *Ended giveaway for **${res.prize}**.*\n\n` +
          `> <a:Trophy:1530099764887289956> **Winner(s):** ${winnerText}`,
      ),
    );

    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
