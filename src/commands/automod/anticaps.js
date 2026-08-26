const {
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const automodManager = require("../../lib/automodManager");
const { buildAnticapsContainer } = require("../../lib/security/handleAutomodInteraction");

module.exports = {
  alias: ["anticaps", "capsfilter"],
  category: "Automod",
  desc: "Filter and auto-delete messages containing excessive capital letters.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure Anti-Caps.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    let config = automodManager.getGuildAutomod(guildId);
    const action = args[0]?.toLowerCase();

    if (action === "enable" || action === "on") {
      if (!config.modules.anticaps) config.modules.anticaps = { enabled: true, punishments: ["delete"], threshold: 70 };
      config.modules.anticaps.enabled = true;
      config.enabled = true;
      automodManager.setGuildAutomod(guildId, config);
    } else if (action === "disable" || action === "off") {
      if (config.modules.anticaps) config.modules.anticaps.enabled = false;
      automodManager.setGuildAutomod(guildId, config);
    }

    config = automodManager.getGuildAutomod(guildId);
    const container = buildAnticapsContainer(config, message.guild);

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
