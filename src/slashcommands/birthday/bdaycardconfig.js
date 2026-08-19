const { ApplicationCommandType, PermissionFlagsBits } = require("discord.js");
const { buildBdayCardConfigPayload } = require("../../lib/security/handleBirthdayCanvasInteraction");

module.exports = {
  name: "bdaycardconfig",
  category: "Birthday",
  description: "Interactive Birthday Canvas Studio — customize templates, avatar shapes & text colors.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ You need **Manage Server** permission to use Birthday Card Studio.", ephemeral: true }).catch(() => null);
    }

    try {
      const payload = await buildBdayCardConfigPayload(interaction.member);
      return interaction.reply(payload).catch((err) => {
        console.error("[slash bdaycardconfig] Reply error:", err);
      });
    } catch (err) {
      console.error("[slash bdaycardconfig] Execution error:", err);
      return interaction.reply({ content: "❌ Failed to render birthday card configuration studio.", ephemeral: true }).catch(() => null);
    }
  },
};
