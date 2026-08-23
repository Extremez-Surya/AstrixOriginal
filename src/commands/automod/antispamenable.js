const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const automodManager = require("../../lib/automodManager");
const antispamCmd = require("./antispam");

module.exports = {
  alias: ["antispamenable", "antispam-on"],
  category: "Automod",
  desc: "Enable rapid message anti-spam detection.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure Anti-Spam.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    return antispamCmd.execute(client, message, ["enable"]);
  },
};
