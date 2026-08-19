const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
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
  name: "raidmode",
  category: "Anti Raid",
  description: "Instant shortcut to enable or disable emergency raid mode for the server.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  options: [
    {
      name: "state",
      description: "Set raid mode state.",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "Enable Raid Mode", value: "enable" },
        { name: "Disable Raid Mode", value: "disable" },
        { name: "Toggle", value: "toggle" },
      ],
    },
  ],

  async execute(client, interaction) {
    if (!interaction.guild) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# You need **Manage Server** permissions to toggle raid mode.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const guildId = interaction.guild.id;
    const config = antiraidManager.getGuildAntiraid(guildId);
    const option = interaction.options.getString("state");

    if (option === "enable") {
      config.raidState = true;
    } else if (option === "disable") {
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
              `> - **Deactivate:** Run \`/raidmode state:disable\` or \`/antiraid raidmode\``
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# Enforcement active • ASTRIXCODE™ Security System`)
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
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# Protection active • ASTRIXCODE™ Security System`)
        );
    }

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
