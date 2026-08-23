const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const { buildAntinukeContainer } = require("../../lib/security/handleAntiNukeInteraction");

module.exports = {
  alias: ["antinukestatus", "anstatus"],
  category: "Anti Nuke",
  desc: "View current Anti-Nuke protection status, modules & stats.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const panel = buildAntinukeContainer(config, message.guild);

    return message.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
