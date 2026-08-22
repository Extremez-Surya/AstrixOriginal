const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["slowmode"],
  category: "Moderation",
  desc: "Set slowmode duration for the current channel.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0]) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Invalid Argument\n` +
            `-# *Slowmode duration parameter is missing.*\n\n` +
            `> - **Usage:** \`.slowmode <seconds | off> [#channel]\`\n` +
            `> - **Example:** \`.slowmode 5\` or \`.slowmode off\``,
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

    let seconds = 0;
    if (args[0].toLowerCase() !== "off") {
      seconds = parseInt(args[0], 10);
      if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Invalid Duration\n` +
              `-# *Slowmode duration out of bounds.*\n\n` +
              `> - **Allowed Range:** \`0\` to \`21600\` seconds (up to 6 hours).`,
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
    }

    const channel = message.mentions.channels.first() || message.channel;

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser: client.user,
      actionName: "Set Slowmode",
      detailsText: `Channel: <#${channel.id}> | Slowmode: ${seconds === 0 ? "Off" : `${seconds}s`}`,
      onConfirm: async () => {
        await channel.setRateLimitPerUser(seconds);
      },
    });
  },
};
