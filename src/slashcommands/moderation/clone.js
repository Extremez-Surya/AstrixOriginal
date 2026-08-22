const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "clone",
  category: "Moderation",
  description: "Clone the current channel with exact permissions and settings, deleting the old one.",
  type: ApplicationCommandType.ChatInput,
  options: [],

  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, interaction) {
    const channel = interaction.channel;

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser: client.user,
      actionName: "Clone & Wipe Channel",
      detailsText: `Channel: #${channel.name} (${channel.id}). This will recreate the channel and delete all existing message history.`,
      onConfirm: async () => {
        const position = channel.position;
        const clonedChannel = await channel.clone({
          name: channel.name,
          reason: `Channel cloned by ${interaction.user.tag}`,
        });

        await clonedChannel.setPosition(position).catch(() => {});
        await channel.delete(`Cloned by ${interaction.user.tag}`).catch(() => {});

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:astrix:1539875362945900574> Channel Successfully Cloned\n` +
                `-# *This channel was cloned by ${interaction.user}. Message history has been wiped cleanly.*`,
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
