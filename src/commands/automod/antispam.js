const {
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const automodManager = require("../../lib/automodManager");
const { buildAntispamContainer } = require("../../lib/security/handleAutomodInteraction");

module.exports = {
  alias: ["antispam", "spamfilter"],
  category: "Automod",
  desc: "Configure anti-spam message rate-limiting and strike penalties.",
  botPermissions: ["ManageMessages", "ModerateMembers"],
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

    const guildId = message.guild.id;
    let config = automodManager.getGuildAutomod(guildId);
    const status = args[0]?.toLowerCase();

    if (status === "enable" || status === "on") {
      if (!config.modules.antispam) config.modules.antispam = { enabled: true, punishments: ["warn"] };
      config.modules.antispam.enabled = true;
      config.enabled = true;
      automodManager.setGuildAutomod(guildId, config);
    } else if (status === "disable" || status === "off") {
      if (config.modules.antispam) config.modules.antispam.enabled = false;
      automodManager.setGuildAutomod(guildId, config);
    }

    config = automodManager.getGuildAutomod(guildId);
    const container = buildAntispamContainer(config, message.guild);

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
