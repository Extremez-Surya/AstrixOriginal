const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  name: "giveaway_end",
  category: "Giveaway",
  description: "Instantly end an active giveaway and pick winner(s).",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "message_id",
      description: "Message ID of the active giveaway to end.",
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
            `-# *No active giveaway matching message ID \`${messageId}\` was found.*`,
        ),
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (g.ended) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Giveaway Already Ended\n` +
            `-# *This giveaway has already concluded. Use \`/greroll\` to pick new winners.*`,
        ),
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const res = await giveawayManager.endGiveaway(client, messageId);

    const winnerText =
      res.winners.length > 0
        ? res.winners.map((w) => `<@${w}>`).join(", ")
        : "No valid participants";

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <:tada2:1539875614440554597> Giveaway Ended Successfully\n` +
          `-# *Ended giveaway for **${res.prize}**.*\n\n` +
          `> <:Trophy:1539875620270641185> **Winner(s):** ${winnerText}`,
      ),
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
