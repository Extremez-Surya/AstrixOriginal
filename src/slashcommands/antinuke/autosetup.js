const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { buildAutoSetupWallSelectionContainer } = require("../../lib/security/handleAutoSetup");
const antinukeManager = require("../../lib/antinukeManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autosetup")
    .setDescription("Automatically configure and harden server security, security wall roles, and logs.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: "Anti Nuke",

  async execute(client, interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const config = antinukeManager.getGuildAntinuke(interaction.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(interaction.user.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(interaction.user.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      return interaction.reply({
        content: "❌ Only the **Server Owner** or authorized **Extra Owners** can initiate Auto-Setup.",
        ephemeral: true,
      });
    }

    const view = buildAutoSetupWallSelectionContainer(interaction.guild, interaction.user);
    return interaction.reply({
      components: [view],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
