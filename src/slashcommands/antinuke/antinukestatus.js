const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const { buildAntinukeContainer } = require("../../lib/security/handleAntiNukeInteraction");

module.exports = {
  name: "antinukestatus",
  category: "Anti Nuke",
  description: "View current Anti-Nuke protection status, modules & stats.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const config = antinukeManager.getGuildAntinuke(interaction.guild.id);
    const panel = buildAntinukeContainer(config);

    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
