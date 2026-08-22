const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["hide"],
  category: "Moderation",
  desc: "Hide the current channel or a specified channel.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const everyoneRole = message.guild.roles.everyone;

    const currentOverwrites = channel.permissionOverwrites.cache.get(everyoneRole.id);
    if (currentOverwrites && currentOverwrites.deny.has("ViewChannel")) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Channel Already Hidden\n` +
          `-# *Channel <#${channel.id}> is already hidden from @everyone.*`
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
      actionName: `Hide Channel`,
      detailsText: `Target Channel: <#${channel.id}> (This will deny View Channel permission for @everyone)`,
      onConfirm: async () => {
        await channel.permissionOverwrites.edit(everyoneRole, { ViewChannel: false });
      },
    });
  },
};
