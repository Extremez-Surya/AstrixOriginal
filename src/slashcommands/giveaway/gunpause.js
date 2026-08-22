const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  name: "giveaway_unpause",
  category: "Giveaway",
  description: "Resume/unpause a paused giveaway.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "message_id",
      description: "Message ID of the paused giveaway to resume.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const messageId = interaction.options.getString("message_id");

    const res = await giveawayManager.unpauseGiveaway(client, messageId);
    if (!res) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Unable to Unpause\n` +
            `-# *Giveaway matching ID \`${messageId}\` was not found, is not paused, or has ended.*`,
        ),
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const endUnix = Math.floor(res.endTimestamp / 1000);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ▶️ Giveaway Resumed Successfully\n` +
          `-# *Resumed countdown timer for **${res.prize}** (\`${messageId}\`).*\n\n` +
          `> <:clock:1539875400975388713> **New End Time:** <t:${endUnix}:R>`,
      ),
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
