const { ApplicationCommandType, MessageFlags } = require("discord.js");
const { buildOwnerContainer } = require("../../lib/security/handleOwnerInteraction");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  name: "owner",
  category: "Owner",
  description: "Bot Owner Control Center dashboard (Bot Owner Only).",
  type: ApplicationCommandType.ChatInput,
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, interaction) {
    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      return interaction.reply({ content: "❌ Access Denied: Only Bot Owners can access the Owner Control Center.", ephemeral: true }).catch(() => null);
    }

    const panel = buildOwnerContainer(client);

    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
