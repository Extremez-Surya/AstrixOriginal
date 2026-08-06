const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["clone", "nuke"],
  category: "Moderation",
  desc: "Clone the current channel with exact permissions and settings, deleting the old one.",

  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.channel;

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser: client.user,
      actionName: "Clone & Wipe Channel",
      detailsText: `Channel: #${channel.name} (${channel.id}). This will recreate the channel and delete all existing message history.`,
      onConfirm: async () => {
        const position = channel.position;
        const clonedChannel = await channel.clone({
          name: channel.name,
          reason: `Channel cloned by ${message.author.tag}`,
        });

        await clonedChannel.setPosition(position).catch(() => {});
        await channel.delete(`Cloned by ${message.author.tag}`).catch(() => {});

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:astrix:1527205612205903973> Channel Successfully Cloned\n` +
                `-# *This channel was cloned by ${message.author}. Message history has been wiped cleanly.*`,
            ),
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
            ),
          );

        await clonedChannel
          .send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          })
          .catch(() => null);
      },
    });
  },
};
