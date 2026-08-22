const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const prefixManager = require("../../lib/prefixManager");

module.exports = {
  name: "prefix",
  category: "Moderation",
  description: "Show the current active command prefix for this server.",
  type: ApplicationCommandType.ChatInput,
  options: [],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const currentPrefix = prefixManager.getPrefix(interaction.guild.id);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:astrix:1539875362945900574> Server Prefix Telemetry\n` +
            `-# *Active command prefix configuration for **${interaction.guild.name}**.*\n\n` +
            `> - **Current Prefix:** \`${currentPrefix}\`\n` +
            `> - **Set New Prefix:** \`/setprefix new_prefix:<new_prefix>\`\n` +
            `> - **Reset to Default:** \`/resetprefix\``,
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

    return interaction
      .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
