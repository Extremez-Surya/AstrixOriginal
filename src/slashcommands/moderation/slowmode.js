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
  name: "slowmode",
  category: "Moderation",
  description: "Set slowmode duration for a channel.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "seconds",
      description: "Slowmode duration in seconds (0 to disable).",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
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
    const seconds = interaction.options.getInteger("seconds");
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    if (seconds < 0 || seconds > 21600) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Invalid Duration\n` +
          `-# *Slowmode duration out of bounds.*\n\n` +
          `> - **Allowed Range:** \`0\` to \`21600\` seconds (up to 6 hours).`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    try {
      await channel.setRateLimitPerUser(seconds);
      const statusText = seconds === 0 ? "Disabled" : `${seconds} seconds`;
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:online:1539875424144859239> Slowmode Updated\n` +
          `-# *Channel rate limit has been updated successfully.*\n\n` +
          `> - **Target Channel:** <#${channel.id}>\n` +
          `> - **Slowmode Duration:** \`${statusText}\``
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
          `### <:offline:1539875436690153474> Slowmode Error\n` +
          `-# *Failed to update slowmode duration.*\n\n` +
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
