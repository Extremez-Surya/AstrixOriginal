const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["purgebot", "clearbot"],
  category: "Moderation",
  desc: "Purge bot messages in this channel.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const amount = parseInt(args[0], 10) || 50;
    if (isNaN(amount) || amount < 1 || amount > 100) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Invalid Message Amount\n` +
          `-# *Please specify a valid number of messages to scan (between 1 and 100).*\n\n` +
          `> - **Usage:** \`.purgebot [amount]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser: client.user,
      actionName: "Purge Bot Messages",
      detailsText: `Scanning the last ${amount} messages and purging only bot messages.`,
      onConfirm: async () => {
        await message.delete().catch(() => {});
        const fetched = await message.channel.messages.fetch({ limit: amount });
        const botMessages = fetched.filter((m) => m.author.bot);
        if (botMessages.size > 0) {
          await message.channel.bulkDelete(botMessages, true).catch(() => {});
        }
      },
    });
  },
};
