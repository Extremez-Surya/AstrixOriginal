const {
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const automodManager = require("../../lib/automodManager");
const { buildAntilinkContainer } = require("../../lib/security/handleAutomodInteraction");

module.exports = {
  alias: ["antilink", "antiinvites", "linkblock"],
  category: "Automod",
  desc: "Block unauthorized web links and Discord invite URLs in text channels.",
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

    const guildId = message.guild.id;
    let config = automodManager.getGuildAutomod(guildId);
    const option = args[0]?.toLowerCase();

    if (option === "enable" || option === "on") {
      if (!config.modules.antilink) config.modules.antilink = { enabled: true, punishments: ["delete"] };
      if (!config.modules.antiinvite) config.modules.antiinvite = { enabled: true, punishments: ["delete"] };
      config.modules.antilink.enabled = true;
      config.modules.antiinvite.enabled = true;
      config.enabled = true;
      automodManager.setGuildAutomod(guildId, config);
    } else if (option === "disable" || option === "off") {
      if (config.modules.antilink) config.modules.antilink.enabled = false;
      if (config.modules.antiinvite) config.modules.antiinvite.enabled = false;
      automodManager.setGuildAutomod(guildId, config);
    }

    config = automodManager.getGuildAutomod(guildId);
    const container = buildAntilinkContainer(config, message.guild);

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
