const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  name: "antinukedisable",
  category: "Anti Nuke",
  description: "Shortcut to disable master Anti-Nuke server protection.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const config = antinukeManager.getGuildAntinuke(interaction.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(interaction.user.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(interaction.user.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Access Denied\n` +
            `-# Only the **Guild Owner** or designated **Extra Owners** can disable Anti-Nuke.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    antinukeManager.disableMaster(interaction.guild.id);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "⚠️"} Anti-Nuke System Deactivated\n` +
            `-# Master anti-nuke protection system is now **DISABLED**.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Protection paused • ASTRIXCODE™ System`)
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
