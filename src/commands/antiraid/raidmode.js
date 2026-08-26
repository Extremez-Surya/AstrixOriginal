const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const antiraidManager = require("../../lib/antiraidManager");
const { buildAntiraidNavMenu } = require("../../lib/security/handleAntiRaidInteraction");
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
            `### 🚨 **Anti-Raid • Emergency Raid Lockdown Activated**\n` +
              `-# Server security lockdown is now enforced on all incoming joins\n\n` +
              `> **Shield Status:** 🚨 \`ACTIVE RAID LOCKDOWN\` • **Action:** Automatic Kick/Ban on incoming joins\n` +
              `> **Protection Scope:** Intercepts join floods and neutralizes raider waves instantly.\n\n` +
              `-# Select a page below or click 'Deactivate' to return to normal operation.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        );
    } else {
      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🟢 **Anti-Raid • Raid Mode Deactivated**\n` +
              `-# Server protection returned to standard automated checks\n\n` +
              `> **Shield Status:** 🟢 \`NORMAL OPERATING STATE\` • Automated checks active\n` +
              `> **Protection Scope:** Join gatekeeper & rate limits running in normal mode.\n\n` +
              `-# Select a page below or visit Control Center.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        );
    }

    const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("overview"));

    const toggleBtn = new ButtonBuilder()
      .setCustomId("antiraid_btn_toggle_raidmode")
      .setLabel(config.raidState ? "Deactivate Raid Mode" : "Raid Lockdown")
      .setEmoji(config.raidState ? "🟢" : "🚨")
      .setStyle(config.raidState ? ButtonStyle.Success : ButtonStyle.Danger);

    const cpBtn = new ButtonBuilder()
      .setCustomId("antiraid_nav_overview")
      .setLabel("Control Center")
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Primary);

    const refreshBtn = new ButtonBuilder()
      .setCustomId("antiraid_btn_refresh")
      .setLabel("Refresh")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary);

    const btnRow = new ActionRowBuilder().addComponents(toggleBtn, cpBtn, refreshBtn);

    container.addActionRowComponents(navRow);
    container.addActionRowComponents(btnRow);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Emergency Protocol`)
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
