const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
} = require("discord.js");
const { handleSlashHelp } = require("../../utils/helpManager");

module.exports = {
  name: "help",
  category: "Information",
  description:
    "Show all available commands, categories, or details for a specific command.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "command",
      description: "Specific command to view details for.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => null);
    try {
      await handleSlashHelp(client, interaction);
    } catch (err) {
      console.error("[Slash Help Error]:", err);
    }
  },
};
