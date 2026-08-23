const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const automodManager = require("../../lib/automodManager");
const { buildAutomodContainer } = require("../../lib/security/handleAutomodInteraction");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["automoddisable", "amdisable"],
  category: "Automod",
  desc: "Shortcut to disable master AutoMod message protection.",
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to disable AutoMod.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    automodManager.disableMaster(message.guild.id);
    const freshConfig = automodManager.getGuildAutomod(message.guild.id);
    const panel = buildAutomodContainer(freshConfig, message.guild, "overview");

    return message.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
