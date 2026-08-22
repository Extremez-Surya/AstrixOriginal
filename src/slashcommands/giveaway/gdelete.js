const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  name: "giveaway_delete",
  category: "Giveaway",
  description:
    "Cancel and delete a giveaway completely without picking winners.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "message_id",
      description: "Message ID of the giveaway to delete.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const messageId = interaction.options.getString("message_id");

    const success = await giveawayManager.deleteGiveaway(client, messageId);
    if (!success) {
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

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🗑️ Giveaway Deleted Successfully\n` +
          `-# *Cancelled and deleted giveaway matching ID \`${messageId}\`.*`,
      ),
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
