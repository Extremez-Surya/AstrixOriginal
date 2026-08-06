const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const prefixManager = require("../../lib/prefixManager");

module.exports = {
  name: "setprefix",
  category: "Moderation",
  description: "Set a new custom command prefix for this server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "new_prefix",
      description: "New command prefix (e.g. $ or !).",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const newPrefix = interaction.options.getString("new_prefix");

    if (newPrefix.length > 5) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Prefix Too Long\n` +
            `-# *Command prefix must be 5 characters or less.*`,
        ),
      );
      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    prefixManager.setPrefix(interaction.guild.id, newPrefix);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:astrix:1527205612205903973> Server Prefix Updated\n` +
            `-# *Successfully set server command prefix to \`${newPrefix}\` for **${interaction.guild.name}**.*\n\n` +
            `> - **New Command Prefix:** \`${newPrefix}\`\n` +
            `> - **Example Usage:** \`${newPrefix}help\``,
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
