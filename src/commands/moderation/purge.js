const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["purge", "clear"],
  category: "Moderation",
  desc: "Purge a specified amount of messages in this channel.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    let amount = parseInt(args[0], 10);

    if (args[0] && args[0].toLowerCase() === "all") {
      amount = 100;
    }

    if (isNaN(amount) || amount < 1 || amount > 100) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Invalid Purge Amount\n` +
            `-# *Please specify a valid number of messages to purge (between 1 and 100) or use \`.purge all\`.*\n\n` +
            `> - **Usage:** \`.purge <1-100>\` or \`.purge all\``,
        ),
      );
      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser: client.user,
      actionName: "Purge Messages",
      detailsText: `Target: ${amount} messages in this channel.`,
      onConfirm: async () => {
        // Delete the user's command message first
        await message.delete().catch(() => {});
        await message.channel.bulkDelete(amount, true).catch(() => {});
      },
    });
  },
};
