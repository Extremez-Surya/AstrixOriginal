const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["hideall"],
  category: "Moderation",
  desc: "Hide all text channels in the server.",
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
      actionName: "Hide All Channels",
      detailsText: "This will hide all text channels in the server, preventing @everyone from viewing them.",
      onConfirm: async () => {
        const channels = guild.channels.cache.filter((c) => c.isTextBased());
        for (const [id, ch] of channels) {
          try {
            await ch.permissionOverwrites.edit(everyoneRole, { ViewChannel: false });
          } catch (e) {}
        }
      },
    });
  },
};
