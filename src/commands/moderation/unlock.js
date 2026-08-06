const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["unlock"],
  category: "Moderation",
  desc: "Unlock the current channel or a specified channel.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const everyoneRole = message.guild.roles.everyone;

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser: client.user,
      actionName: `Unlock Channel`,
      detailsText: `Target Channel: <#${channel.id}> (This will reset/allow Send Messages permission for @everyone)`,
      onConfirm: async () => {
        await channel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: null,
        });
      },
    });
  },
};
