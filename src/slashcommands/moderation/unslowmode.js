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
          `### <a:red_star:1528688099436003419> Slowmode Already Off\n` +
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
          `### <:online:1528327584520081519> Slowmode Disabled\n` +
          `-# *Channel slowmode has been turned off.*\n\n` +
          `> - **Target Channel:** <#${channel.id}>`
        )
      ).addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      ).addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *<:astrix:1527205612205903973> Channel Management • Powered by ASTRIXCODE™ • © 2026*`
        )
      );

      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:offline:1528328082434424892> Error\n` +
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
