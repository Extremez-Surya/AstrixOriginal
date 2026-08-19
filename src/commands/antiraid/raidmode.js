const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const antiraidManager = require("../../lib/antiraidManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["raidmode", "emergencymode"],
  category: "Anti Raid",
  desc: "Instant shortcut to enable or disable emergency raid mode for the server.",
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# You need **Manage Server** permissions to toggle raid mode.`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    const config = antiraidManager.getGuildAntiraid(guildId);
    const option = args[0]?.toLowerCase();

    if (option === "on" || option === "enable") {
      config.raidState = true;
    } else if (option === "off" || option === "disable") {
      config.raidState = false;
    } else {
      config.raidState = !config.raidState;
    }

    if (config.raidState) {
      antiraidManager.incrementStats(guildId, "raidsDetected");
    }
    antiraidManager.setGuildAntiraid(guildId, config);

    const container = new ContainerBuilder();

    if (config.raidState) {
      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.Warn_red || "🚨"} EMERGENCY RAID MODE ACTIVATED\n` +
              `-# *Server security lockdown is now enforced on all incoming joins.*\n\n` +
              `> - **Status:** \`ACTIVE RAID MODE\`\n` +
              `> - **Action:** Automatic Kick/Ban of all new joining members\n` +
              `> - **Deactivate:** Run \`.raidmode off\` or \`.antiraid state\``
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Enforcement active • ASTRIXCODE™ Security System`
          )
        );
    } else {
      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.ticky_red || "✅"} Raid Mode Deactivated\n` +
              `-# *Server protection returned to standard automated checks.*\n\n` +
              `> - **Status:** \`NORMAL STATE\``
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Protection active • ASTRIXCODE™ Security System`
          )
        );
    }

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
