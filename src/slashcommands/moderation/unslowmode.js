const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "unslowmode",
  category: "Moderation",
  description: "Turn off slowmode for a channel.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "channel",
      description: "Target channel (defaults to current channel).",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
  ],

  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, interaction) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    if (channel.rateLimitPerUser === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Slowmode Already Off\n` +
          `-# *Slowmode is not active in <#${channel.id}>.*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    try {
      await channel.setRateLimitPerUser(0);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:online:1539875424144859239> Slowmode Disabled\n` +
          `-# *Channel slowmode has been turned off.*\n\n` +
          `> - **Target Channel:** <#${channel.id}>`
        )
      ).addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      ).addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *<:astrix:1539875362945900574> Channel Management • Powered by ASTRIXCODE™ • © 2026*`
        )
      );

      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:offline:1539875436690153474> Error\n` +
          `-# *Failed to disable slowmode.*\n\n` +
          `> - **Error:** \`${err.message}\``
        )
      );
      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }
  },
};
