const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const { buildConfigurationContainer } = require("../../lib/security/handleConfigurationInteraction");

module.exports = {
  name: "configuration",
  description: "Server auto-responders, reaction triggers, channel auto-emojis & custom server configuration.",
  defaultMemberPermissions: PermissionFlagsBits.ManageGuild,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const isMemberPermitted = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    const isBotOwner = noprefixManager.isOwner(interaction.user.id, client);

    if (!isMemberPermitted && !isBotOwner) {
      return interaction.reply({
        content: "❌ Manage Server permission required to view or edit configuration.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const configContainer = buildConfigurationContainer(interaction.guild, interaction.user);

    return interaction.reply({
      components: [configContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
