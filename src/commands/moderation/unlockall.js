const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["unlockall"],
  category: "Moderation",
  desc: "Unlock all text channels in the server.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;
    const everyoneRole = guild.roles.everyone;

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser: client.user,
      actionName: "Unlock All Channels",
      detailsText:
        "This will unlock all text channels in the server, resetting Send Messages permissions for @everyone.",
      onConfirm: async () => {
        const channels = guild.channels.cache.filter((c) => c.isTextBased());
        for (const [id, ch] of channels) {
          try {
            await ch.permissionOverwrites.edit(everyoneRole, {
              SendMessages: null,
            });
          } catch (e) {}
        }
      },
    });
  },
};
