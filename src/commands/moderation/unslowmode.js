const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["unslowmode", "slowmodeoff"],
  category: "Moderation",
  desc: "Turn off slowmode for the current or specified channel.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    if (channel.rateLimitPerUser === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Slowmode Already Disabled\n` +
          `-# *Slowmode is not active in <#${channel.id}>.*`
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
      actionName: "Disable Slowmode",
      detailsText: `Channel: <#${channel.id}>`,
      onConfirm: async () => {
        await channel.setRateLimitPerUser(0);
      },
    });
  },
};
