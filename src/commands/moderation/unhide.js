const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["unhide"],
  category: "Moderation",
  desc: "Unhide the current channel or a specified channel.",
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
      actionName: `Unhide Channel`,
      detailsText: `Target Channel: <#${channel.id}> (This will reset/allow View Channel permission for @everyone)`,
      onConfirm: async () => {
        await channel.permissionOverwrites.edit(everyoneRole, {
          ViewChannel: null,
        });
      },
    });
  },
};
