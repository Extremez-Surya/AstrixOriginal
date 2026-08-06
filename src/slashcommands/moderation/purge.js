const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "purge",
  category: "Moderation",
  description: "Purge a specified amount of messages in this channel.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "amount",
      description: "The number of messages to purge (1 to 100).",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],

  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const amount = interaction.options.getInteger("amount");

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser: client.user,
      actionName: "Purge Messages",
      detailsText: `Target: ${amount} messages in this channel.`,
      onConfirm: async () => {
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
      },
    });
  },
};
