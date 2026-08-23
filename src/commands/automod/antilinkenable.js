const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const automodManager = require("../../lib/automodManager");
const antilinkCmd = require("./antilink");

module.exports = {
  alias: ["antilinkenable", "antilink-on"],
  category: "Automod",
  desc: "Enable link and discord invite block filters.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure Anti-Link.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    return antilinkCmd.execute(client, message, ["enable"]);
  },
};
