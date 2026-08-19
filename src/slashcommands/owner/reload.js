const { ApplicationCommandType } = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  name: "reload",
  category: "Owner",
  description: "Reloads message commands & application systems (Bot Owner Only).",
  type: ApplicationCommandType.ChatInput,
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, interaction) {
    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      return interaction.reply({ content: "❌ Access Denied: Bot Owner command.", ephemeral: true }).catch(() => null);
    }

    try {
      const { applicationECSLoader } = require("../../lib/functions/application-ecs-loader");
      await applicationECSLoader(client);
      return interaction.reply({ content: "✅ Successfully reloaded message commands & application ECS systems!" }).catch(() => null);
    } catch (err) {
      console.error("[slash reload] Error reloading client:", err);
      return interaction.reply({ content: `❌ Failed to reload systems: ${err.message}`, ephemeral: true }).catch(() => null);
    }
  },
};
