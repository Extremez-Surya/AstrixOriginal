const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const automodManager = require("../../lib/automodManager");
const { buildAutomodContainer } = require("../../lib/security/handleAutomodInteraction");

module.exports = {
  name: "automodstatus",
  category: "Automod",
  description: "View current AutoMod protection status, modules & stats.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const config = automodManager.getGuildAutomod(interaction.guild.id);
    const panel = buildAutomodContainer(config);

    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
