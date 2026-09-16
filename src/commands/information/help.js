const { handlePrefixHelp } = require("../../utils/helpManager");

module.exports = {
  alias: ["help", "h", "commands", "cmds"],
  category: "Information",
  desc: "Show all available commands, categories, or details for a specific command.",
  usage: "help [command]",
  cooldown: 3,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    try {
      await handlePrefixHelp(client, message, args);
    } catch (err) {
      console.error("[Help Command Error]:", err);
    }
  },
};
