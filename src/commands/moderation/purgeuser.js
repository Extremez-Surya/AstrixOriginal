const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["purgeuser", "clearuser"],
  category: "Moderation",
  desc: "Purge messages sent by a specific user in this channel.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Target User Required\n` +
          `-# *Please mention a user or provide a valid user ID to purge their messages.*\n\n` +
          `> - **Usage:** \`.purgeuser @user [amount]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const amount = parseInt(args[1], 10) || 50;

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: "Purge User Messages",
      detailsText: `Target User: <@${targetUser.id}> | Scan Depth: ${amount} messages`,
      onConfirm: async () => {
        await message.delete().catch(() => {});
        const messages = await message.channel.messages.fetch({
          limit: Math.min(amount, 100),
        });
        const userMessages = messages.filter(
          (m) => m.author.id === targetUser.id,
        );
        if (userMessages.size > 0) {
          await message.channel.bulkDelete(userMessages, true).catch(() => {});
        }
      },
    });
  },
};
