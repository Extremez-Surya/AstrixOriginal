const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  name: "giveaway_pause",
  category: "Giveaway",
  description: "Pause the countdown timer of an active giveaway.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "message_id",
      description: "Message ID of the active giveaway to pause.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const messageId = interaction.options.getString("message_id");

    const res = await giveawayManager.pauseGiveaway(client, messageId);
    if (!res) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Unable to Pause\n` +
            `-# *Giveaway matching ID \`${messageId}\` was not found, is already paused, or has ended.*`,
        ),
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏸️ Giveaway Paused Successfully\n` +
          `-# *Paused countdown timer for **${res.prize}** (\`${messageId}\`). Use \`/gunpause\` to resume.*`,
      ),
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
