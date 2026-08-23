const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  UserSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require("discord.js");
const antinukeManager = require("../antinukeManager");
const EMOJIS = require("../emojis");

// Definitions for all 10 defense modules
const MODULE_METADATA = {
  channel: {
    label: "Channel Defense",
    emoji: "📁",
    desc: "Auto-reverts channel deletion/creation and neutralizes unauthorized creators/deleters.",
    actions: ["Channel Create", "Channel Delete", "Channel Permission Overwrites"],
  },
  role: {
    label: "Role Defense",
    emoji: "🎭",
    desc: "Guards against unauthorized role creation, deletion, or permission tampering.",
    actions: ["Role Create", "Role Delete", "Dangerous Permission Additions"],
  },
  ban: {
    label: "Anti-Ban Protection",
    emoji: "🚫",
    desc: "Monitors mass bans, instantly punishes rogue moderators, and unbans victims.",
    actions: ["Mass Member Bans", "Unauthorized Manual Bans", "Auto-Unban Reversion"],
  },
  kick: {
    label: "Anti-Kick Protection",
    emoji: "👢",
    desc: "Detects rapid/unauthorized member expulsions and strikes the perpetrator.",
    actions: ["Mass Member Kicks", "Unauthorized Single Kicks"],
  },
  botAdd: {
    label: "Rogue Bot Defense",
    emoji: "🤖",
    desc: "Instantly bans unauthorized bots added to the server and punishes the inviter.",
    actions: ["Unauthorized Bot Infiltration", "Bot Addition Quarantine"],
  },
  webhook: {
    label: "Webhook Defense",
    emoji: "🔗",
    desc: "Stops webhook spam vectors by banning rogue webhook creators and purging malicious hooks.",
    actions: ["Webhook Create", "Webhook Delete", "Webhook Token Exploits"],
  },
  guildUpdate: {
    label: "Server & Vanity Defense",
    emoji: "👑",
    desc: "Protects server vanity URL, name, icon, banner, and system settings from hijack.",
    actions: ["Vanity URL Hijack", "Server Name Modification", "Server Icon / Banner Alteration"],
  },
  emoji: {
    label: "Emoji & Sticker Defense",
    emoji: "😀",
    desc: "Prevents mass deletion or wiping of server emojis and stickers.",
    actions: ["Emoji Mass Delete", "Sticker Mass Delete", "Unauthorized Asset Wipes"],
  },
  permissions: {
    label: "Permission Escalation",
    emoji: "⚠️",
    desc: "Blocks unauthorized grants of Administrator or high-risk server management permissions.",
    actions: ["Administrator Grant", "Manage Server Escalation", "Mention Everyone Grant"],
  },
  prune: {
    label: "Prune Defense",
    emoji: "🧹",
    desc: "Intercepts dangerous mass server member prune attempts.",
    actions: ["Server Member Prune Execution"],
  },
};

/**
 * Main dispatcher to build the appropriate V2 container view
 */
function buildAntinukeContainer(config, guild = null, view = "overview", extra = {}) {
  switch (view) {
    case "menu":
      return buildCommandDirectoryView(config, guild);
    case "modules":
      return buildModulesView(config, guild);
    case "mod_detail":
      return buildModuleDetailView(config, guild, extra.moduleKey || "channel");
    case "settings":
      return buildSettingsView(config, guild);
    case "trust":
      return buildTrustView(config, guild, extra.subTab || "main");
    case "security":
      return buildSecurityView(config, guild);
    case "confirm":
      return buildConfirmView(config, guild, extra.actionType, extra.meta);
    case "overview":
    default:
      return buildOverviewView(config, guild);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL NAVIGATION SELECT MENU BUILDER (Terminal Style)
// ─────────────────────────────────────────────────────────────────────────────
function buildGlobalNavMenu(currentView = "overview") {
  return new StringSelectMenuBuilder()
    .setCustomId("antinuke_nav_select_menu")
    .setPlaceholder("🧭 Quick Navigation • Switch Anti-Nuke Dashboard...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Control Center & Status")
        .setValue("nav_overview")
        .setDescription("Real-time telemetry, master shield status & vector matrix")
        .setEmoji("🛡️")
        .setDefault(currentView === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("1-Click Auto Setup (Hardening)")
        .setValue("nav_autosetup")
        .setDescription("Auto-create security wall, quarantine roles & log channels")
        .setEmoji("🚀")
        .setDefault(currentView === "autosetup"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Protection Modules Matrix")
        .setValue("nav_modules")
        .setDescription("Inspect & toggle channel, role, ban, kick, webhook & emoji defense")
        .setEmoji("🧩")
        .setDefault(currentView === "modules" || currentView === "mod_detail"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Trust Directory & Whitelist")
        .setValue("nav_trust")
        .setDescription("Manage immune operators, whitelist & extra owners")
        .setEmoji("📋")
        .setDefault(currentView === "trust"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Security Policies & Punishments")
        .setValue("nav_settings")
        .setDescription("Configure ban/kick/strip punishments, strike thresholds & auto-revert")
        .setEmoji("⚙️")
        .setDefault(currentView === "settings"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Threat Telemetry & Analytics")
        .setValue("nav_security")
        .setDescription("Inspect real-time intercepted attacks & reversion metrics")
        .setEmoji("📊")
        .setDefault(currentView === "security"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Syntax")
        .setValue("nav_menu")
        .setDescription("View all antinuke commands, syntax & alias directory")
        .setEmoji("📜")
        .setDefault(currentView === "menu"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Deactivate Shield & Auto-Cleanup")
        .setValue("nav_cleanup")
        .setDescription("Deactivate antinuke and automatically purge created roles & channels")
        .setEmoji("🧹")
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. COMMAND DIRECTORY MENU VIEW (Beginner-Friendly & Intuitive)
// ─────────────────────────────────────────────────────────────────────────────
function buildCommandDirectoryView(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = Boolean(config.enabled);

  const content =
    `### 🛡️ **Astrix Anti-Nuke • Help & Guide**\n` +
    `-# Protect your Discord server against mass deletions, unauthorized bots, and raids.\n\n` +
    `**⚡ Quick Start Commands:**\n` +
    `> • \`antinuke\` (or \`an\`) — Open the interactive Control Center\n` +
    `> • \`autosetup\` — 1-Click complete server hardening & security setup\n` +
    `> • \`antinuke enable\` — Turn on server protection\n` +
    `> • \`antinuke disable\` — Turn off server protection\n\n` +
    `**📋 Whitelist Commands (Add Trusted Admins):**\n` +
    `> • \`antinuke whitelist add @user\` — Add trusted user (immune from punishments)\n` +
    `> • \`antinuke whitelist remove @user\` — Remove user from whitelist\n` +
    `> • \`antinuke whitelist show\` — View all whitelisted staff members\n` +
    `> • \`antinuke whitelist reset\` — Clear all whitelisted users\n\n` +
    `**⚙️ Logs & Security Wall:**\n` +
    `> • \`setantinukelogs #channel\` — Set where attack alerts are sent\n` +
    `> • \`wallroles\` — View and configure Security Wall barrier roles\n\n` +
    `💡 *Tip: Use the buttons or dropdown below to manage everything without typing commands!*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("menu"));

  const btnPanel = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnAutoSetup = new ButtonBuilder()
    .setCustomId("antinuke_nav_autosetup")
    .setLabel("1-Click Auto Setup")
    .setEmoji("🚀")
    .setStyle(ButtonStyle.Success);

  const btnWhitelist = new ButtonBuilder()
    .setCustomId("antinuke_nav_trust")
    .setLabel("Whitelist Staff")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const btnSettings = new ButtonBuilder()
    .setCustomId("antinuke_nav_settings")
    .setLabel("Settings")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(btnPanel, btnAutoSetup, btnWhitelist, btnSettings);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW VIEW (Control Center - Simple & Noob-Friendly)
// ─────────────────────────────────────────────────────────────────────────────
function buildOverviewView(config, guild) {
  const container = new ContainerBuilder();

  // Header
  const headerText = `### 🛡️ **Astrix Anti-Nuke Control Center**\n-# Complete 24/7 Security for **${guild?.name || "Your Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Status Banner
  const isEnabled = Boolean(config.enabled);
  const statusHeadline = isEnabled
    ? `### 🟢 **Status: Protected & Active**\n> Your server is safe! Any unauthorized attacker will be instantly punished and changes will be reverted.`
    : `### 🔴 **Status: Not Protected**\n> Protection is currently turned off. Click **[ 🚀 1-Click Auto Setup ]** below to secure your server immediately.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusHeadline));

  // Security Summary (Clean & Easy to Read)
  const punishment = (config.punishment || "ban").toUpperCase();
  const revertStatus = config.autoRevert ? "🟢 `Enabled (Auto-Restores Deleted Assets)`" : "🔴 `Disabled`";
  const logChanText = config.logChannel ? `<#${config.logChannel}>` : "*Not set (Click Settings to configure)*";
  const extraOwnersCount = (config.extraOwners || []).length;
  const whitelistCount = (config.whitelist || []).length;

  const activeModulesCount = Object.keys(MODULE_METADATA).filter(
    (key) => isEnabled && config.modules?.[key]
  ).length;
  const totalModulesCount = Object.keys(MODULE_METADATA).length;

  const summaryText =
    `**📊 Current Security Setup:**\n` +
    `> • 🛡️ **Active Protections:** \`${activeModulesCount}/${totalModulesCount}\` Modules Guarding\n` +
    `> • ⚖️ **Attacker Punishment:** \`${punishment}\` (Inflicted immediately)\n` +
    `> • 🔄 **Auto-Restore Deletions:** ${revertStatus}\n` +
    `> • 📋 **Alert Log Channel:** ${logChanText}\n` +
    `> • 👥 **Trusted Staff:** \`${whitelistCount}\` Whitelisted • \`${extraOwnersCount}\` Extra Owners`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(summaryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // What is protected (Visual Emojis)
  const isModOn = (key) => (isEnabled && config.modules?.[key] ? "🟢" : "🔴");
  const matrixText =
    `**🛡️ Protected Server Assets:**\n` +
    `> ${isModOn("channel")} Channels • ${isModOn("role")} Roles • ${isModOn("ban")} Bans • ${isModOn("kick")} Kicks\n` +
    `> ${isModOn("botAdd")} Bots • ${isModOn("webhook")} Webhooks • ${isModOn("guildUpdate")} Server Vanity • ${isModOn("emoji")} Emojis\n` +
    `> ${isModOn("permissions")} Admin Permissions • ${isModOn("prune")} Member Pruning`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(matrixText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Global Navigation Dropdown
  const selectRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("overview"));

  // Quick Action Buttons Row 1 (Navigation)
  const btnModules = new ButtonBuilder()
    .setCustomId("antinuke_nav_modules")
    .setLabel("Protection Modules")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnWhitelist = new ButtonBuilder()
    .setCustomId("antinuke_nav_trust")
    .setLabel("Whitelist Staff")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const btnSettings = new ButtonBuilder()
    .setCustomId("antinuke_nav_settings")
    .setLabel("Settings")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Secondary);

  const btnSecurity = new ButtonBuilder()
    .setCustomId("antinuke_nav_security")
    .setLabel("Activity & Stats")
    .setEmoji("📊")
    .setStyle(ButtonStyle.Secondary);

  const navRow = new ActionRowBuilder().addComponents(btnModules, btnWhitelist, btnSettings, btnSecurity);

  // Controls Row 2 (Primary Actions)
  const toggleMasterBtn = new ButtonBuilder()
    .setCustomId(isEnabled ? "antinuke_confirm_disable_prompt" : "antinuke_toggle_master_direct")
    .setLabel(isEnabled ? "Turn Off Protection" : "Turn On Protection")
    .setEmoji(isEnabled ? "🔴" : "🟢")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const btnAutoSetup = new ButtonBuilder()
    .setCustomId("antinuke_nav_autosetup")
    .setLabel("1-Click Auto Setup")
    .setEmoji("🚀")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("antinuke_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnBackToMenu = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Help & Guide")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const controlRow = new ActionRowBuilder().addComponents(toggleMasterBtn, btnAutoSetup, refreshBtn, btnBackToMenu);

  container.addActionRowComponents(selectRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(controlRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MODULES HUB VIEW (Simple & Clear Explanations)
// ─────────────────────────────────────────────────────────────────────────────
function buildModulesView(config, guild) {
  const container = new ContainerBuilder();

  const headerText =
    `### 🛡️ **Anti-Nuke Protection Modules**\n` +
    `-# Customize which parts of your server are guarded by Anti-Nuke.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isEnabled = Boolean(config.enabled);

  // Module List with Simple Explanations
  let summaryLines = "";
  for (const [key, meta] of Object.entries(MODULE_METADATA)) {
    const status = isEnabled && config.modules?.[key] ? "🟢 `ACTIVE`" : "🔴 `OFF`";
    summaryLines += `> ${meta.emoji} **${meta.label}:** ${status} — *${meta.desc}*\n`;
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`**Current Protection Statuses:**\n${summaryLines}`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Module Select Dropdown
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_mod_select")
    .setPlaceholder("🛡️ Select a module to customize or view details...");

  for (const [key, meta] of Object.entries(MODULE_METADATA)) {
    const isModOn = isEnabled && config.modules?.[key];
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(meta.label)
        .setValue(`antinuke_view_mod_${key}`)
        .setDescription(`${isModOn ? "[ON]" : "[OFF]"} ${meta.desc}`.slice(0, 100))
        .setEmoji(meta.emoji)
    );
  }

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  // Action Buttons
  const enableAllBtn = new ButtonBuilder()
    .setCustomId("antinuke_mod_enable_all")
    .setLabel("Turn On All")
    .setEmoji("🟢")
    .setStyle(ButtonStyle.Success);

  const disableAllBtn = new ButtonBuilder()
    .setCustomId("antinuke_mod_disable_all")
    .setLabel("Turn Off All")
    .setEmoji("🔴")
    .setStyle(ButtonStyle.Danger);

  const backBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const menuBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Help & Guide")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(enableAllBtn, disableAllBtn, backBtn, menuBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MODULE DETAIL VIEW (Clear & Simple)
// ─────────────────────────────────────────────────────────────────────────────
function buildModuleDetailView(config, guild, moduleKey) {
  const container = new ContainerBuilder();
  const meta = MODULE_METADATA[moduleKey] || MODULE_METADATA.channel;

  const isEnabled = Boolean(config.enabled && config.modules?.[moduleKey]);
  const statusBadge = isEnabled ? "🟢 `ENABLED & GUARDING`" : "🔴 `DISABLED`";
  const punishment = (config.punishment || "ban").toUpperCase();
  const autoRevert = config.autoRevert ? "🟢 `ENABLED (Will restore deletions)`" : "🔴 `DISABLED`";

  const headerText = `### ${meta.emoji} **${meta.label} Protection**\n-# Module Settings for **${guild?.name || "Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const detailText =
    `**Status:** ${statusBadge}\n` +
    `> **What it does:** ${meta.desc}\n\n` +
    `**Actions Protected Against:**\n` +
    meta.actions.map((act) => `> • ${act}`).join("\n") +
    `\n\n` +
    `**Punishment on Unauthorized Attack:**\n` +
    `> • **Punishment:** \`${punishment}\` attacker immediately\n` +
    `> • **Auto-Restore Changes:** ${autoRevert}`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(detailText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Action Buttons
  const toggleBtn = new ButtonBuilder()
    .setCustomId(`antinuke_toggle_mod_${moduleKey}`)
    .setLabel(isEnabled ? "Turn Off Module" : "Turn On Module")
    .setEmoji(isEnabled ? "🔴" : "🟢")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const settingsBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_settings")
    .setLabel("Change Punishment")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const backToModsBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_modules")
    .setLabel("Back to Modules")
    .setEmoji("◀")
    .setStyle(ButtonStyle.Secondary);

  const menuBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Help & Guide")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(toggleBtn, settingsBtn, backToModsBtn, menuBtn);

  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SETTINGS HUB VIEW (Easy Select Menus & Clear Hints)
// ─────────────────────────────────────────────────────────────────────────────
function buildSettingsView(config, guild) {
  const container = new ContainerBuilder();

  const headerText = `### ⚙️ **Anti-Nuke Settings**\n-# Easily change punishments, strike limits, and log channels.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const punishment = (config.punishment || "ban").toUpperCase();
  const revertStatus = config.autoRevert ? "🟢 `Enabled (Auto-restores deleted channels & roles)`" : "🔴 `Disabled`";
  const logChan = config.logChannel ? `<#${config.logChannel}>` : "*None (Select one below)*";

  const settingsInfo =
    `**Current Configurations:**\n` +
    `> • ⚖️ **Attacker Punishment:** \`${punishment}\`\n` +
    `> • 🔄 **Auto-Restore Deletions:** ${revertStatus}\n` +
    `> • 📋 **Alert Log Channel:** ${logChan}\n` +
    `> • ⚡ **Strike Limit:** \`${config.threshold || 3} actions in 60s (Triggers punishment)\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(settingsInfo));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Punishment Select Dropdown
  const punishMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_set_punishment_select")
    .setPlaceholder(`⚖️ Select Attacker Punishment (Currently: ${punishment})`)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Ban Attacker (Recommended)")
        .setValue("ban")
        .setDescription("Permanently ban attacker from the server immediately")
        .setEmoji("🔨")
        .setDefault(config.punishment === "ban"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Kick Attacker")
        .setValue("kick")
        .setDescription("Expel attacker from the server immediately")
        .setEmoji("👢")
        .setDefault(config.punishment === "kick"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Strip Dangerous Roles")
        .setValue("strip")
        .setDescription("Remove all Admin and Mod roles from attacker")
        .setEmoji("🎭")
        .setDefault(config.punishment === "strip"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Timeout Attacker (28 Days)")
        .setValue("timeout")
        .setDescription("Mute/Timeout attacker for the maximum duration")
        .setEmoji("⏳")
        .setDefault(config.punishment === "timeout")
    );

  const punishRow = new ActionRowBuilder().addComponents(punishMenu);

  // Threat Action Threshold Dropdown
  const currentThreshold = config.threshold || 3;
  const thresholdMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_set_threshold_select")
    .setPlaceholder(`⚡ Strike Limit (Currently: ${currentThreshold} Action${currentThreshold > 1 ? "s" : ""})`)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("1 Action — Instant Punishment (Strict)")
        .setValue("1")
        .setDescription("Punish on the very first unauthorized deletion/action")
        .setEmoji("⚡")
        .setDefault(currentThreshold === 1),
      new StringSelectMenuOptionBuilder()
        .setLabel("2 Actions — Strict (1 Warning Strike)")
        .setValue("2")
        .setDescription("Allows 1 mistake before punishing on the 2nd action")
        .setEmoji("🛡️")
        .setDefault(currentThreshold === 2),
      new StringSelectMenuOptionBuilder()
        .setLabel("3 Actions — Balanced (Recommended for Active Staff)")
        .setValue("3")
        .setDescription("Punishes on 3 rapid actions within 60 seconds")
        .setEmoji("⚖️")
        .setDefault(currentThreshold === 3),
      new StringSelectMenuOptionBuilder()
        .setLabel("5 Actions — Relaxed")
        .setValue("5")
        .setDescription("Best for large servers with busy admins")
        .setEmoji("📊")
        .setDefault(currentThreshold === 5)
    );

  const thresholdRow = new ActionRowBuilder().addComponents(thresholdMenu);

  // Native Channel Select Menu for Audit Logging
  const logMenu = new ChannelSelectMenuBuilder()
    .setCustomId("antinuke_set_log_channel_select")
    .setPlaceholder("📋 Select channel where security alerts will be sent...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const logRow = new ActionRowBuilder().addComponents(logMenu);

  // Control Buttons
  const toggleRevertBtn = new ButtonBuilder()
    .setCustomId("antinuke_toggle_revert_btn")
    .setLabel(config.autoRevert ? "Disable Auto-Restore" : "Enable Auto-Restore")
    .setEmoji("🔄")
    .setStyle(config.autoRevert ? ButtonStyle.Secondary : ButtonStyle.Success);

  const disableLogBtn = new ButtonBuilder()
    .setCustomId("antinuke_disable_log_channel")
    .setLabel("Disable Log Channel")
    .setEmoji("🔕")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(!config.logChannel);

  const resetBtn = new ButtonBuilder()
    .setCustomId("antinuke_confirm_reset_prompt")
    .setLabel("Reset Settings")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleRevertBtn, disableLogBtn, resetBtn, cpBtn);

  container.addActionRowComponents(punishRow);
  container.addActionRowComponents(thresholdRow);
  container.addActionRowComponents(logRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TRUST DIRECTORY & WHITELIST VIEW (Clear Instructions)
// ─────────────────────────────────────────────────────────────────────────────
function buildTrustView(config, guild, subTab = "main") {
  const container = new ContainerBuilder();

  const headerText =
    `### 📋 **Anti-Nuke Whitelist & Trusted Staff**\n` +
    `-# Whitelisted users are trusted admins who will **never** be punished by Anti-Nuke.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const ownerMention = guild ? `<@${guild.ownerId}>` : "*Server Owner*";
  const extraOwners = config.extraOwners || [];
  const whitelist = config.whitelist || [];

  const eoText =
    extraOwners.length > 0
      ? extraOwners.map((id, i) => `> \`${i + 1}.\` <@${id}>`).join("\n")
      : "> *No extra owners designated.*";

  const wlText =
    whitelist.length > 0
      ? whitelist.map((id, i) => `> \`${i + 1}.\` <@${id}>`).join("\n")
      : "> *No users whitelisted yet. Click [ Add Whitelist ] below!*";

  const trustBody =
    `👑 **Server Owner (Full Control & Immune):**\n> ${ownerMention}\n\n` +
    `🛡️ **Extra Owners (Can Change Anti-Nuke Settings):**\n${eoText}\n\n` +
    `📋 **Whitelisted Staff (${whitelist.length} Trusted Admins):**\n${wlText}\n\n` +
    `💡 *Tip: Only whitelist trusted admins who create/delete channels and roles regularly.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(trustBody));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Sub-Tab view controls / User Select Menus
  if (subTab === "add_wl") {
    const addWlMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_add_wl_user")
      .setPlaceholder("➕ Select a user to add to Whitelist (Make Immune)...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(addWlMenu));
  } else if (subTab === "remove_wl") {
    const removeWlMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_remove_wl_user")
      .setPlaceholder("➖ Select a user to remove from Whitelist...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(removeWlMenu));
  } else if (subTab === "add_eo") {
    const addEoMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_add_eo_user")
      .setPlaceholder("👑 Select a user to add as Extra Owner...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(addEoMenu));
  } else if (subTab === "remove_eo") {
    const removeEoMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_remove_eo_user")
      .setPlaceholder("👑 Select an Extra Owner to remove...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(removeEoMenu));
  }

  // Action Buttons
  const addWlBtn = new ButtonBuilder()
    .setCustomId("antinuke_trust_tab_add_wl")
    .setLabel("Add Whitelist")
    .setEmoji("➕")
    .setStyle(subTab === "add_wl" ? ButtonStyle.Primary : ButtonStyle.Success);

  const removeWlBtn = new ButtonBuilder()
    .setCustomId("antinuke_trust_tab_remove_wl")
    .setLabel("Remove Whitelist")
    .setEmoji("➖")
    .setStyle(subTab === "remove_wl" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(whitelist.length === 0);

  const addEoBtn = new ButtonBuilder()
    .setCustomId("antinuke_trust_tab_add_eo")
    .setLabel("Add Extra Owner")
    .setEmoji("👑")
    .setStyle(subTab === "add_eo" ? ButtonStyle.Primary : ButtonStyle.Secondary);

  const removeEoBtn = new ButtonBuilder()
    .setCustomId("antinuke_trust_tab_remove_eo")
    .setLabel("Remove Extra Owner")
    .setStyle(subTab === "remove_eo" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(extraOwners.length === 0);

  const clearWlBtn = new ButtonBuilder()
    .setCustomId("antinuke_confirm_clear_wl_prompt")
    .setLabel("Clear All Whitelist")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(whitelist.length === 0);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const row1 = new ActionRowBuilder().addComponents(addWlBtn, removeWlBtn, addEoBtn, removeEoBtn);
  const row2 = new ActionRowBuilder().addComponents(clearWlBtn, cpBtn);

  container.addActionRowComponents(row1);
  container.addActionRowComponents(row2);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SECURITY TELEMETRY & STATS VIEW (Simple & Clean)
// ─────────────────────────────────────────────────────────────────────────────
function buildSecurityView(config, guild) {
  const container = new ContainerBuilder();

  const headerText =
    `### 📊 **Security Activity & Statistics**\n` +
    `-# View real-time protection statistics for **${guild?.name || "Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const nukesIntercepted = config.stats?.nukesIntercepted || 0;
  const reversionsExecuted = config.stats?.reversionsExecuted || 0;
  const lastIncident = config.stats?.lastNukeTimestamp
    ? `<t:${Math.floor(config.stats.lastNukeTimestamp / 1000)}:R>`
    : "*No attacks detected yet. Your server is completely safe!*";

  const isEnabled = Boolean(config.enabled);
  const activeMods = Object.keys(MODULE_METADATA).filter((k) => isEnabled && config.modules?.[k]).length;
  const totalMods = Object.keys(MODULE_METADATA).length;

  const telemetryText =
    `**Attack Mitigation Statistics:**\n` +
    `> ⚡ **Attacks Blocked:** \`${nukesIntercepted}\` Attacks Neutralized\n` +
    `> 🔄 **Auto-Restorations:** \`${reversionsExecuted}\` Deleted Assets Restored\n` +
    `> ⏱️ **Last Attack Attempt:** ${lastIncident}\n\n` +
    `**Protection Health:**\n` +
    `> • **Current State:** ${isEnabled ? "🟢 `Active & Guarding 24/7`" : "🔴 `Turned Off`"}\n` +
    `> • **Guarded Assets:** \`${activeMods}/${totalMods} Protection Modules Active\`\n` +
    `> • **Reaction Speed:** \`< 0.1 seconds (Instant Attack Interception)\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const refreshBtn = new ButtonBuilder()
    .setCustomId("antinuke_refresh_security")
    .setLabel("Refresh Stats")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Primary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Secondary);

  const menuBtn4 = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Help & Guide")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(refreshBtn, cpBtn, menuBtn4);

  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CONFIRMATION VIEW (DANGER ACTIONS)
// ─────────────────────────────────────────────────────────────────────────────
function buildConfirmView(config, guild, actionType, meta = {}) {
  const container = new ContainerBuilder();

  let title = "Confirm Action";
  let description = "Are you sure you want to proceed with this action?";
  let confirmCustomId = "antinuke_do_confirm";
  let confirmLabel = "Confirm Action";
  let returnViewCustomId = "antinuke_nav_overview";

  if (actionType === "disable_master") {
    title = "⚠️ Turn Off Anti-Nuke Protection?";
    description =
      `**Warning:** Turning off Anti-Nuke will disable all 24/7 protection modules on **${guild?.name || "this server"}**.\n\n` +
      `> • Channel and role deletions will not be blocked or restored.\n` +
      `> • Rogue bot invites and unauthorized bans will not be prevented.\n` +
      `> • Created security roles and log channels will be cleaned up.\n\n` +
      `Are you sure you want to turn off Anti-Nuke?`;
    confirmCustomId = "antinuke_do_confirm_disable_master";
    confirmLabel = "⚠️ Turn Off Anti-Nuke";
    returnViewCustomId = "antinuke_nav_overview";
  } else if (actionType === "reset_config") {
    title = "⚠️ Reset All Settings to Default?";
    description =
      `**Warning:** This will reset all Anti-Nuke settings, punishment policies, extra owners, and whitelisted staff back to factory defaults.\n\n` +
      `Are you sure you want to reset all settings?`;
    confirmCustomId = "antinuke_do_confirm_reset_config";
    confirmLabel = "⚠️ Reset Settings";
    returnViewCustomId = "antinuke_nav_settings";
  } else if (actionType === "clear_whitelist") {
    title = "⚠️ Clear All Whitelisted Staff?";
    description =
      `**Warning:** This will remove all **${(config.whitelist || []).length}** trusted users from the whitelist.\n\n` +
      `Are you sure you want to clear the whitelist?`;
    confirmCustomId = "antinuke_do_confirm_clear_whitelist";
    confirmLabel = "⚠️ Clear Whitelist";
    returnViewCustomId = "antinuke_nav_trust";
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ${title}`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(description)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const confirmBtn = new ButtonBuilder()
    .setCustomId(confirmCustomId)
    .setLabel(confirmLabel)
    .setStyle(ButtonStyle.Danger);

  const cancelBtn = new ButtonBuilder()
    .setCustomId(returnViewCustomId)
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);
  container.addActionRowComponents(row);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. INTERACTION ROUTING & HANDLER
// ─────────────────────────────────────────────────────────────────────────────
async function handleAntiNukeInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isStringMenu = interaction.isStringSelectMenu();
  const isUserMenu = interaction.isUserSelectMenu();
  const isChannelMenu = interaction.isChannelSelectMenu();

  if (!isBtn && !isStringMenu && !isUserMenu && !isChannelMenu) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("antinuke_")) return false;

  if (!interaction.guild) return false;

  const guildId = interaction.guild.id;

  // Strict Security Authorization Check
  const isOwner = interaction.guild.ownerId === interaction.user.id;
  const config = antinukeManager.getGuildAntinuke(guildId);
  const isExtraOwner = (config.extraOwners || []).includes(interaction.user.id);
  const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(interaction.user.id);

  if (!isOwner && !isExtraOwner && !isDev) {
    await interaction
      .reply({
        content: "❌ Access Denied: Only the **Guild Owner** or designated **Extra Owners** can configure Anti-Nuke settings.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  // ---------------------------------------------------------------------------
  // A. MAIN NAVIGATION BUTTONS & DROPDOWN SELECT
  // ---------------------------------------------------------------------------
  if (isStringMenu && customId === "antinuke_nav_select_menu") {
    const selected = interaction.values[0];
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    if (selected === "nav_menu") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "menu");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_overview") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "overview");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_autosetup") {
      const { buildAutoSetupWallSelectionContainer } = require("./handleAutoSetup");
      const view = buildAutoSetupWallSelectionContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_modules") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "modules");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_trust") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "main" });
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_settings") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "settings");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_security") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "security");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_cleanup") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "confirm", { actionType: "disable_master" });
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  if (customId === "antinuke_nav_menu") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "menu");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_nav_overview" || customId === "antinuke_refresh") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "overview");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_nav_modules") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "modules");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_nav_settings") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "settings");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_nav_trust") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "main" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_nav_security" || customId === "antinuke_refresh_security") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "security");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // ---------------------------------------------------------------------------
  // B. MASTER TOGGLE & DIRECT ACTIONS & AUTOSETUP PROMPTS
  // ---------------------------------------------------------------------------
  if (customId === "antinuke_toggle_master_direct") {
    antinukeManager.enableMaster(guildId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "overview");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_confirm_disable_prompt") {
    const view = buildAntinukeContainer(config, interaction.guild, "confirm", { actionType: "disable_master" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_do_confirm_disable_master") {
    const { executeAutoCleanup } = require("./handleAutoSetup");
    await executeAutoCleanup(interaction.guild, interaction.user, interaction);
    return true;
  }

  if (customId === "antinuke_enable_prompt_continue") {
    antinukeManager.enableMaster(guildId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "overview");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_enable_prompt_cancel" || customId === "antinuke_autosetup_cancel") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "overview");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_nav_autosetup") {
    const { buildAutoSetupWallSelectionContainer } = require("./handleAutoSetup");
    const view = buildAutoSetupWallSelectionContainer(interaction.guild, interaction.user);
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isStringMenu && customId === "antinuke_autosetup_select_role") {
    const { executeAutoSetup } = require("./handleAutoSetup");
    const val = interaction.values[0];
    const roleId = val.startsWith("role_") ? val.replace("role_", "") : "create_new_wall";
    await executeAutoSetup(interaction.guild, interaction.user, roleId, interaction);
    return true;
  }

  if (customId === "antinuke_autosetup_new_wall") {
    const { executeAutoSetup } = require("./handleAutoSetup");
    await executeAutoSetup(interaction.guild, interaction.user, "create_new_wall", interaction);
    return true;
  }

  if (customId === "antinuke_autosetup_current_wall") {
    const { executeAutoSetup } = require("./handleAutoSetup");
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    let targetRole = fresh.securityWallRole;
    if (!targetRole) {
      const found = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase().includes("security wall") || r.name.toLowerCase().includes("astrix wall")
      );
      if (found) targetRole = found.id;
    }
    await executeAutoSetup(interaction.guild, interaction.user, targetRole || "create_new_wall", interaction);
    return true;
  }

  // ---------------------------------------------------------------------------
  // C. MODULES MANAGEMENT
  // ---------------------------------------------------------------------------
  if (isStringMenu && customId === "antinuke_mod_select") {
    const selected = interaction.values[0]; // e.g. "antinuke_view_mod_channel"
    const modKey = selected.replace("antinuke_view_mod_", "");
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "mod_detail", { moduleKey: modKey });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId.startsWith("antinuke_toggle_mod_")) {
    const modKey = customId.replace("antinuke_toggle_mod_", "");
    antinukeManager.toggleModule(guildId, modKey);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "mod_detail", { moduleKey: modKey });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_mod_enable_all") {
    antinukeManager.enableMaster(guildId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "modules");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_mod_disable_all") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    for (const k of Object.keys(MODULE_METADATA)) {
      if (fresh.modules) fresh.modules[k] = false;
    }
    fresh.enabled = false;
    antinukeManager.setGuildAntinuke(guildId, fresh);
    const view = buildAntinukeContainer(fresh, interaction.guild, "modules");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // ---------------------------------------------------------------------------
  // D. SETTINGS & PUNISHMENTS
  // ---------------------------------------------------------------------------
  if (isStringMenu && customId === "antinuke_set_punishment_select") {
    const chosenPunishment = interaction.values[0];
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    fresh.punishment = chosenPunishment;
    antinukeManager.setGuildAntinuke(guildId, fresh);
    const view = buildAntinukeContainer(fresh, interaction.guild, "settings");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isStringMenu && customId === "antinuke_set_threshold_select") {
    const chosenThreshold = parseInt(interaction.values[0], 10) || 1;
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    fresh.threshold = chosenThreshold;
    antinukeManager.setGuildAntinuke(guildId, fresh);
    const view = buildAntinukeContainer(fresh, interaction.guild, "settings");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_toggle_revert_btn") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    fresh.autoRevert = !fresh.autoRevert;
    antinukeManager.setGuildAntinuke(guildId, fresh);
    const view = buildAntinukeContainer(fresh, interaction.guild, "settings");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isChannelMenu && customId === "antinuke_set_log_channel_select") {
    const selectedChanId = interaction.values[0];
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    fresh.logChannel = selectedChanId;
    antinukeManager.setGuildAntinuke(guildId, fresh);
    const view = buildAntinukeContainer(fresh, interaction.guild, "settings");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_disable_log_channel") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    fresh.logChannel = null;
    antinukeManager.setGuildAntinuke(guildId, fresh);
    const view = buildAntinukeContainer(fresh, interaction.guild, "settings");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_confirm_reset_prompt") {
    const view = buildAntinukeContainer(config, interaction.guild, "confirm", { actionType: "reset_config" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_do_confirm_reset_config") {
    const { executeAutoCleanup } = require("./handleAutoSetup");
    await executeAutoCleanup(interaction.guild, interaction.user, interaction);
    return true;
  }

  // ---------------------------------------------------------------------------
  // E. TRUST DIRECTORY & WHITELIST / EXTRA OWNERS
  // ---------------------------------------------------------------------------
  if (customId === "antinuke_trust_tab_add_wl") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "add_wl" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_trust_tab_remove_wl") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "remove_wl" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_trust_tab_add_eo") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "add_eo" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_trust_tab_remove_eo") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "remove_eo" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isUserMenu && customId === "antinuke_do_add_wl_user") {
    const targetUserId = interaction.values[0];
    antinukeManager.addWhitelist(guildId, targetUserId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "main" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isUserMenu && customId === "antinuke_do_remove_wl_user") {
    const targetUserId = interaction.values[0];
    antinukeManager.removeWhitelist(guildId, targetUserId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "main" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isUserMenu && customId === "antinuke_do_add_eo_user") {
    const targetUserId = interaction.values[0];
    antinukeManager.addExtraOwner(guildId, targetUserId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "main" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isUserMenu && customId === "antinuke_do_remove_eo_user") {
    const targetUserId = interaction.values[0];
    antinukeManager.removeExtraOwner(guildId, targetUserId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "main" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_confirm_clear_wl_prompt") {
    const view = buildAntinukeContainer(config, interaction.guild, "confirm", { actionType: "clear_whitelist" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_do_confirm_clear_whitelist") {
    antinukeManager.clearWhitelist(guildId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "main" });
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildAntinukeContainer,
  handleAntiNukeInteraction,
  MODULE_METADATA,
};
