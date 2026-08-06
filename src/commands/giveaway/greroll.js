const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  alias: ["greroll", "giveawayreroll"],
  category: "Giveaway",
  desc: "Reroll new winner(s) for an ended giveaway.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const messageId = args[0];

    if (!messageId) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Message ID\n` +
            `-# *Usage: \`.greroll <message_id>\`*`,
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
            `-# *No giveaway matching message ID \`${messageId}\` was found.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    if (!g.ended) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Giveaway Still Active\n` +
            `-# *You can only reroll giveaways that have already ended. Use \`.gend ${messageId}\` to end it first.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const res = await giveawayManager.rerollGiveaway(client, messageId);

    const winnerText =
      res.winners.length > 0
        ? res.winners.map((w) => `<@${w}>`).join(", ")
        : "No valid participants";

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <a:tada2:1530099488398508073> Giveaway Rerolled Successfully\n` +
          `-# *New random winner(s) picked for **${res.prize}**.*\n\n` +
          `> <a:Trophy:1530099764887289956> **New Winner(s):** ${winnerText}`,
      ),
    );

    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
