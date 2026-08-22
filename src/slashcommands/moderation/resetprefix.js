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
  name: "resetprefix",
  category: "Moderation",
  description: "Reset the server command prefix back to default (.).",
  type: ApplicationCommandType.ChatInput,
  options: [],

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    prefixManager.resetPrefix(interaction.guild.id);
    const defaultPrefix = prefixManager.getPrefix(interaction.guild.id);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:astrix:1539875362945900574> Server Prefix Reset\n` +
            `-# *Successfully restored default server command prefix (\`${defaultPrefix}\`) for **${interaction.guild.name}**.*\n\n` +
            `> - **Current Command Prefix:** \`${defaultPrefix}\`\n` +
            `> - **Example Usage:** \`${defaultPrefix}help\``,
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
