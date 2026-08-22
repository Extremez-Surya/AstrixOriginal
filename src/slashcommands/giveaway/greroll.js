const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  name: "giveaway_reroll",
  category: "Giveaway",
  description: "Reroll new winner(s) for an ended giveaway.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "message_id",
      description: "Message ID of the ended giveaway.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const messageId = interaction.options.getString("message_id");

    const g = giveawayManager.getGiveaway(messageId);
    if (!g || g.guildId !== interaction.guild.id) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Giveaway Not Found\n` +
            `-# *No giveaway matching message ID \`${messageId}\` was found.*`,
        ),
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (!g.ended) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Giveaway Still Active\n` +
            `-# *You can only reroll giveaways that have already ended. Use \`/gend\` to end it first.*`,
        ),
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const res = await giveawayManager.rerollGiveaway(client, messageId);

    const winnerText =
      res.winners.length > 0
        ? res.winners.map((w) => `<@${w}>`).join(", ")
        : "No valid participants";

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <:tada2:1539875614440554597> Giveaway Rerolled Successfully\n` +
          `-# *New random winner(s) picked for **${res.prize}**.*\n\n` +
          `> <:Trophy:1539875620270641185> **New Winner(s):** ${winnerText}`,
      ),
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
