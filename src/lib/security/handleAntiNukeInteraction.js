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
  RoleSelectMenuBuilder,
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
function buildAntinukeContainer(config, guild = null, view = "home", extra = {}) {
  switch (view) {
    case "home":
      return buildHomeContainer(config, guild);
    case "menu":
    case "help":
      return buildCommandDirectoryView(config, guild);
    case "modules":
      return buildModulesView(config, guild);
    case "mod_detail":
      return buildModuleDetailView(config, guild, extra.moduleKey || "channel");
    case "settings":
      return buildSettingsView(config, guild);
    case "trust":
      return buildTrustView(config, guild, extra.subTab || "main");
    case "wallroles":
      return buildWallRolesView(config, guild, extra.subTab || "main");
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
function buildGlobalNavMenu(currentView = "home") {
  return new StringSelectMenuBuilder()
    .setCustomId("antinuke_nav_select_menu")
    .setPlaceholder("🧭 Quick Navigation • Switch Anti-Nuke Dashboard...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Main Home Menu")
        .setValue("nav_home")
        .setDescription("Minimal security overview, system status & quick actions")
        .setEmoji("🏠")
        .setDefault(currentView === "home"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Control Center & Status")
        .setValue("nav_overview")
        .setDescription("Real-time telemetry, master shield status & vector matrix")
        .setEmoji("🛡️")
        .setDefault(currentView === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Help & Guide (Commands Manual)")
        .setValue("nav_help")
        .setDescription("View all antinuke commands, syntax & usage instructions")
        .setEmoji("📖")
        .setDefault(currentView === "help" || currentView === "menu"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Trust Directory & Whitelist")
        .setValue("nav_trust")
        .setDescription("Manage immune operators, whitelist & extra owners")
        .setEmoji("📋")
        .setDefault(currentView === "trust"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Security Wall Barrier Roles")
        .setValue("nav_wallroles")
        .setDescription("View and configure security barrier wall roles")
        .setEmoji("🧱")
        .setDefault(currentView === "wallroles"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Protection Modules Matrix")
        .setValue("nav_modules")
        .setDescription("Inspect & toggle channel, role, ban, kick, webhook & emoji defense")
        .setEmoji("🧩")
        .setDefault(currentView === "modules" || currentView === "mod_detail"),
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
        .setLabel("Deactivate Shield & Auto-Cleanup")
        .setValue("nav_cleanup")
        .setDescription("Deactivate antinuke and automatically purge created roles & channels")
        .setEmoji("🧹")
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. HOME VIEW (Minimal, Medium-Sized, Clean & Professional)
// ─────────────────────────────────────────────────────────────────────────────
function buildHomeContainer(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = Boolean(config.enabled);
  const wallRoles = config.wallRoles || (config.securityWallRole ? [config.securityWallRole] : []);
  const protocolCount = Object.keys(config.protocolUsers || {}).length;

  const content =
    `### 🛡️ **Astrix Anti-Nuke • Defense System**\n` +
    `-# Enterprise-grade real-time Discord server defense and anti-raid barrier.\n\n` +
    `> **Master Shield:** ${isEnabled ? "`🟢 Active & Enforced`" : "`🔴 Inactive (Standby)`"}\n` +
    `> **Protection Level:** \`Hardened Zero-Bypass (10 Modules)\`\n` +
    `> **Defense Wall:** \`${wallRoles.length > 0 ? `${wallRoles.length} Active Barrier Role(s)` : "Auto Setup Ready"}\`\n` +
    `> **Emergency Protocol:** \`${protocolCount > 0 ? `${protocolCount} Users Quarantined` : "Ready • Sub-0.1s Response"}\`\n\n` +
    `-# Click **Control Center** to access real-time telemetry, **Help & Guide** for command manual, or **Whitelist** to manage trusted staff.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("home"));

  const btnPanel = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnHelp = new ButtonBuilder()
    .setCustomId("antinuke_nav_help")
    .setLabel("Help & Guide")
    .setEmoji("📖")
    .setStyle(ButtonStyle.Secondary);

  const btnWhitelist = new ButtonBuilder()
    .setCustomId("antinuke_nav_trust")
    .setLabel("Whitelist")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(btnPanel, btnHelp, btnWhitelist);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Hardened Protection Engine`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 0.1 COMMAND DIRECTORY MENU VIEW (Help & Guide with Rich -# Formatting)
// ─────────────────────────────────────────────────────────────────────────────
function buildCommandDirectoryView(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = Boolean(config.enabled);

  const content =
    `### 🛡️ **Astrix Anti-Nuke • Command Manual & Guide**\n` +
    `-# Complete documentation, syntax guidelines, and module execution manual.\n\n` +
    `**🛡️ Core Commands**\n` +
    `> • \`.antinuke on\` / \`.antinuke off\` — *Toggle master shield on or off*\n` +
    `> • \`.antinuke list\` — *View real-time status and active modules overview*\n` +
    `> • \`.antinuke config\` — *Open interactive control dashboard*\n` +
    `-# Control master defense and view overall security telemetry.\n\n` +
    `**📋 Access & Permission Management**\n` +
    `> • \`.antinuke admin @user\` — *Toggle antinuke administrator*\n` +
    `> • \`.antinuke trustedadmin @user\` — *Toggle trusted admin (super-immune bypass)*\n` +
    `> • \`.antinuke extraowner @user\` — *Toggle extra owner (can manage antinuke)*\n` +
    `> • \`.antinuke whitelist @user\` — *Toggle whitelisted staff member*\n` +
    `-# Whitelisted users bypass security triggers and are protected from penalties.\n\n` +
    `**🧩 Module & Policy Configuration**\n` +
    `> • \`.antinuke <module> on/off\` — *Toggle specific module (\`ban\`, \`role\`, \`channel\`, etc.)*\n` +
    `> • \`.antinuke punishment <ban|kick|strip|timeout>\` — *Set default enforcement action*\n` +
    `> • \`.antinuke threshold <1-20>\` — *Set action strike threshold per 60s*\n` +
    `-# Customize action limits and default punitive measures for rogue actors.\n\n` +
    `**🚨 Emergency Protocol**\n` +
    `> • \`.antinuke protocol @user\` — *Emergency lockdown: strip all roles + 28d timeout*\n` +
    `> • \`.antinuke unprotocol @user\` — *Lift protocol: remove timeout and restore saved roles*\n` +
    `> • \`.antinuke protocol-list\` — *View all users currently under emergency protocol*\n` +
    `-# Instantly neutralize compromised accounts with one command.\n\n` +
    `**Available Modules:**\n` +
    `\`ban\` • \`kick\` • \`role\` • \`channel\` • \`webhook\` • \`emoji\` • \`botadd\` • \`vanity\` • \`prune\` • \`permissions\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("help"));

  const btnHome = new ButtonBuilder()
    .setCustomId("antinuke_nav_home")
    .setLabel("Main Menu")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Secondary);

  const btnPanel = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnWhitelist = new ButtonBuilder()
    .setCustomId("antinuke_nav_trust")
    .setLabel("Whitelist")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(btnHome, btnPanel, btnWhitelist);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Command Documentation`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW VIEW (Control Center - Simple & Noob-Friendly)
// ─────────────────────────────────────────────────────────────────────────────
function buildOverviewView(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = Boolean(config.enabled);

  // Header
  const headerText =
    `### 🛡️ **Astrix Anti-Nuke • Control Dashboard**\n` +
    `-# Real-time security telemetry & active defense monitoring for **${guild?.name || "Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const punishment = (config.punishment || "ban").toUpperCase();
  const revertBadge = config.autoRevert ? "`🟢 ENABLED`" : "`🔴 DISABLED`";
  const logChanText = config.logChannel ? `<#${config.logChannel}>` : "`#antinuke-logs`";
  const extraOwnersCount = (config.extraOwners || []).length;
  const whitelistCount = (config.whitelist || []).length;
  const wallRoles = config.wallRoles || (config.securityWallRole ? [config.securityWallRole] : []);
  const activeCount = Object.keys(MODULE_METADATA).filter((k) => isEnabled && config.modules?.[k]).length;
  const totalCount = Object.keys(MODULE_METADATA).length;

  const isModOn = (key) => (isEnabled && config.modules?.[key] ? "🟢" : "🔴");

  const inlineDashboard =
    `> **Master Defense:** ${isEnabled ? "`🟢 ARMED & ENFORCING`" : "`🔴 INACTIVE (STANDBY)`"} • **Speed:** \`< 0.1s\`\n` +
    `> **Punishment:** \`${punishment}\` • **Auto-Revert:** ${revertBadge} • **Strikes:** \`${config.threshold || 3} / 60s\`\n` +
    `> **Audit Logs:** ${logChanText} • **Barrier:** \`${wallRoles.length} Roles\` • **Staff:** \`${whitelistCount + extraOwnersCount} Immune\`\n\n` +
    `**🛡️ Protected Vector Matrix (${activeCount}/${totalCount}):**\n` +
    `> ${isModOn("channel")} \`Channels\` ${isModOn("role")} \`Roles\` ${isModOn("ban")} \`Bans\` ${isModOn("kick")} \`Kicks\` ${isModOn("botAdd")} \`Bots\`\n` +
    `> ${isModOn("webhook")} \`Webhooks\` ${isModOn("guildUpdate")} \`Vanity\` ${isModOn("emoji")} \`Emojis\` ${isModOn("permissions")} \`Perms\` ${isModOn("prune")} \`Pruning\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(inlineDashboard));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Global Navigation Dropdown (Replaces multiple rows of buttons)
  const selectRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("overview"));

  // Minimal Essential Control Actions Row (Clean 3-button layout)
  const toggleMasterBtn = new ButtonBuilder()
    .setCustomId(isEnabled ? "antinuke_confirm_disable_prompt" : "antinuke_toggle_master_direct")
    .setLabel(isEnabled ? "Turn Off" : "Turn On")
    .setEmoji(isEnabled ? "🔴" : "🟢")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("antinuke_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const homeBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_home")
    .setLabel("Main Menu")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Secondary);

  const controlRow = new ActionRowBuilder().addComponents(toggleMasterBtn, refreshBtn, homeBtn);

  container.addActionRowComponents(selectRow);
  container.addActionRowComponents(controlRow);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Active & Enforced`)
  );

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MODULES HUB VIEW (Simple & Clear Explanations)
// ─────────────────────────────────────────────────────────────────────────────
function buildModulesView(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = Boolean(config.enabled);

  const headerText =
    `### 🛡️ **Anti-Nuke • Protection Modules Matrix**\n` +
    `-# Real-time asset interception & active defense filters for **${guild?.name || "Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isModOn = (key) => (isEnabled && config.modules?.[key] ? "`🟢 ARMED`" : "`🔴 OFF`");
  const activeCount = Object.keys(MODULE_METADATA).filter((k) => isEnabled && config.modules?.[k]).length;
  const totalCount = Object.keys(MODULE_METADATA).length;

  const matrixGrid =
    `> **Master Armor:** ${activeCount === totalCount ? "`🟢 10/10 MODULES ARMED`" : `\`🟡 ${activeCount}/${totalCount} MODULES ARMED\``} • **Speed:** \`< 0.1s\`\n\n` +
    `**🛡️ Active Defense Vectors:**\n` +
    `> 📁 **Channels:** ${isModOn("channel")} • 🎭 **Roles:** ${isModOn("role")}\n` +
    `> 🚫 **Anti-Ban:** ${isModOn("ban")} • 👢 **Anti-Kick:** ${isModOn("kick")}\n` +
    `> 🤖 **Rogue Bots:** ${isModOn("botAdd")} • 🔗 **Webhooks:** ${isModOn("webhook")}\n` +
    `> 👑 **Vanity & Name:** ${isModOn("guildUpdate")} • 😃 **Emojis:** ${isModOn("emoji")}\n` +
    `> ⚠️ **Permissions:** ${isModOn("permissions")} • 🧹 **Pruning:** ${isModOn("prune")}\n\n` +
    `-# Select any module below to inspect or configure, or toggle all modules at once.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(matrixGrid));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 1. Module Selector & Batch Action Dropdown
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_mod_select")
    .setPlaceholder("🧩 Select a Module or Batch Action...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Turn On All Modules (Full Armor)")
        .setValue("mod_action_enable_all")
        .setDescription("Arm all 10 defense modules simultaneously")
        .setEmoji("🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Turn Off All Modules (Disarm)")
        .setValue("mod_action_disable_all")
        .setDescription("Disable all 10 defense modules")
        .setEmoji("🔴")
    );

  for (const [key, meta] of Object.entries(MODULE_METADATA)) {
    const isArmed = isEnabled && config.modules?.[key];
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(meta.label)
        .setValue(`antinuke_view_mod_${key}`)
        .setDescription(`${isArmed ? "[ARMED]" : "[OFF]"} ${meta.desc}`.slice(0, 100))
        .setEmoji(meta.emoji)
    );
  }

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);

  // 2. Global Navigation Dropdown
  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("modules"));

  // 3. Minimal Action Buttons (Just 2 buttons)
  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const homeBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_home")
    .setLabel("Main Menu")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(cpBtn, homeBtn);

  container.addActionRowComponents(selectRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(buttonRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Protection Matrix`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MODULE DETAIL VIEW (Clear & Simple)
// ─────────────────────────────────────────────────────────────────────────────
function buildModuleDetailView(config, guild, moduleKey) {
  const container = new ContainerBuilder();
  const meta = MODULE_METADATA[moduleKey] || MODULE_METADATA.channel;

  const isEnabled = Boolean(config.enabled && config.modules?.[moduleKey]);
  const statusBadge = isEnabled ? "`🟢 ENABLED & GUARDING`" : "`🔴 DISABLED`";
  const punishment = (config.punishment || "ban").toUpperCase();
  const autoRevert = config.autoRevert ? "`🟢 ENABLED`" : "`🔴 DISABLED`";

  const headerText = `### ${meta.emoji} **${meta.label} Protection**\n-# Security parameters for **${guild?.name || "Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const detailText =
    `> **Current Status:** ${statusBadge}\n` +
    `> **Punishment:** \`${punishment}\` • **Auto-Revert:** ${autoRevert}\n` +
    `> **Protection Scope:** *${meta.desc}*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(detailText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Global Navigation Dropdown
  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("modules"));

  // Action Buttons
  const toggleBtn = new ButtonBuilder()
    .setCustomId(`antinuke_toggle_mod_${moduleKey}`)
    .setLabel(isEnabled ? "Turn Off" : "Turn On")
    .setEmoji(isEnabled ? "🔴" : "🟢")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const backToModsBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_modules")
    .setLabel("Back to Modules")
    .setEmoji("🧩")
    .setStyle(ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleBtn, backToModsBtn, cpBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Module Detail`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SETTINGS HUB VIEW (Easy Select Menus & Clear Hints)
// ─────────────────────────────────────────────────────────────────────────────
function buildSettingsView(config, guild) {
  const container = new ContainerBuilder();

  const headerText = `### ⚙️ **Anti-Nuke • Security Policies & Settings**\n-# Configure attacker punishment actions, strike limits, and audit logs.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const punishment = (config.punishment || "ban").toUpperCase();
  const revertStatus = config.autoRevert ? "`🟢 ENABLED`" : "`🔴 DISABLED`";
  const logChan = config.logChannel ? `<#${config.logChannel}>` : "*None*";

  const settingsInfo =
    `> **⚖️ Attacker Punishment:** \`${punishment}\` (Enforced immediately)\n` +
    `> **🔄 Auto-Restore:** ${revertStatus} • **⚡ Strike Limit:** \`${config.threshold || 3} actions / 60s\`\n` +
    `> **📋 Audit Log Channel:** ${logChan}`;

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
        .setDescription("Punish on the very first unauthorized action")
        .setEmoji("⚡")
        .setDefault(currentThreshold === 1),
      new StringSelectMenuOptionBuilder()
        .setLabel("2 Actions — Strict (1 Warning Strike)")
        .setValue("2")
        .setDescription("Punishes on the 2nd action")
        .setEmoji("🛡️")
        .setDefault(currentThreshold === 2),
      new StringSelectMenuOptionBuilder()
        .setLabel("3 Actions — Balanced (Recommended)")
        .setValue("3")
        .setDescription("Punishes on 3 rapid actions within 60 seconds")
        .setEmoji("⚖️")
        .setDefault(currentThreshold === 3),
      new StringSelectMenuOptionBuilder()
        .setLabel("5 Actions — Relaxed")
        .setValue("5")
        .setDescription("Allows up to 5 actions before punishment")
        .setEmoji("📊")
        .setDefault(currentThreshold === 5)
    );

  const thresholdRow = new ActionRowBuilder().addComponents(thresholdMenu);

  // Global Navigation Dropdown
  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("settings"));

  // Control Buttons
  const toggleRevertBtn = new ButtonBuilder()
    .setCustomId("antinuke_toggle_revert_btn")
    .setLabel(config.autoRevert ? "Disable Restore" : "Enable Restore")
    .setEmoji("🔄")
    .setStyle(config.autoRevert ? ButtonStyle.Secondary : ButtonStyle.Success);

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

  const btnRow = new ActionRowBuilder().addComponents(toggleRevertBtn, resetBtn, cpBtn);

  container.addActionRowComponents(punishRow);
  container.addActionRowComponents(thresholdRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Policy Configuration`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TRUST DIRECTORY & WHITELIST VIEW (Clear Instructions)
// ─────────────────────────────────────────────────────────────────────────────
function buildTrustView(config, guild, subTab = "main") {
  const container = new ContainerBuilder();

  const headerText =
    `### 📋 **Anti-Nuke • Whitelist & Trust Directory**\n` +
    `-# Immune staff members bypass all defense triggers and are never punished`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const ownerMention = guild ? `<@${guild.ownerId}>` : "*Server Owner*";
  const extraOwners = config.extraOwners || [];
  const whitelist = config.whitelist || [];

  const eoFormatted = extraOwners.length > 0
    ? extraOwners.map((id) => `<@${id}>`).join(", ")
    : "*None*";

  const wlFormatted = whitelist.length > 0
    ? whitelist.map((id) => `<@${id}>`).join(", ")
    : "*No users whitelisted*";

  const inlineTrustBody =
    `> **👑 Server Owner:** ${ownerMention} \`[Root Immune]\`\n` +
    `> **🛡️ Extra Owners (${extraOwners.length}):** ${eoFormatted}\n` +
    `> **📋 Whitelisted Staff (${whitelist.length}):** ${wlFormatted}\n\n` +
    `-# Whitelisted staff can manage channels & roles freely without triggering anti-nuke.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(inlineTrustBody));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Sub-Tab User Select Menus
  if (subTab === "add_wl") {
    const addWlMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_add_wl_user")
      .setPlaceholder("➕ Select user to add to Whitelist (Make Immune)...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(addWlMenu));
  } else if (subTab === "remove_wl") {
    const removeWlMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_remove_wl_user")
      .setPlaceholder("➖ Select user to remove from Whitelist...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(removeWlMenu));
  } else if (subTab === "add_eo") {
    const addEoMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_add_eo_user")
      .setPlaceholder("👑 Select user to designate as Extra Owner...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(addEoMenu));
  } else if (subTab === "remove_eo") {
    const removeEoMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_remove_eo_user")
      .setPlaceholder("🚫 Select Extra Owner to remove...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(removeEoMenu));
  }

  // 1. Whitelist Action Select Dropdown (Replaces messy 6 buttons)
  const actionSelect = new StringSelectMenuBuilder()
    .setCustomId("antinuke_trust_select_action")
    .setPlaceholder("⚡ Whitelist Action (Add/Remove Staff or Extra Owner)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Add Staff to Whitelist")
        .setValue("action_add_wl")
        .setDescription("Select a staff member to make completely immune")
        .setEmoji("➕")
        .setDefault(subTab === "add_wl"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Remove Staff from Whitelist")
        .setValue("action_remove_wl")
        .setDescription("Revoke whitelist immunity from a user")
        .setEmoji("➖")
        .setDefault(subTab === "remove_wl"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Add Extra Owner")
        .setValue("action_add_eo")
        .setDescription("Authorize a trusted user to change Anti-Nuke settings")
        .setEmoji("👑")
        .setDefault(subTab === "add_eo"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Remove Extra Owner")
        .setValue("action_remove_eo")
        .setDescription("Remove extra owner authorization")
        .setEmoji("🚫")
        .setDefault(subTab === "remove_eo"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Clear All Whitelisted Staff")
        .setValue("action_clear_wl")
        .setDescription("Remove all whitelisted users at once")
        .setEmoji("🧹")
    );

  const actionSelectRow = new ActionRowBuilder().addComponents(actionSelect);

  // 2. Global Navigation Dropdown (For switching pages)
  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("trust"));

  // 3. Clean Essential Controls
  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const homeBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_home")
    .setLabel("Main Menu")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(cpBtn, homeBtn);

  container.addActionRowComponents(actionSelectRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(buttonRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Whitelist Manager`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SECURITY TELEMETRY & STATS VIEW (Simple & Clean)
// ─────────────────────────────────────────────────────────────────────────────
function buildSecurityView(config, guild) {
  const container = new ContainerBuilder();

  const headerText =
    `### 📊 **Anti-Nuke • Telemetry & Threat Analytics**\n` +
    `-# Real-time threat mitigation metrics for **${guild?.name || "Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const nukesIntercepted = config.stats?.nukesIntercepted || 0;
  const reversionsExecuted = config.stats?.reversionsExecuted || 0;
  const lastIncident = config.stats?.lastNukeTimestamp
    ? `<t:${Math.floor(config.stats.lastNukeTimestamp / 1000)}:R>`
    : "*No attacks detected yet*";

  const isEnabled = Boolean(config.enabled);
  const activeMods = Object.keys(MODULE_METADATA).filter((k) => isEnabled && config.modules?.[k]).length;
  const totalMods = Object.keys(MODULE_METADATA).length;

  const telemetryText =
    `> **🛡️ Defense State:** ${isEnabled ? "`🟢 ACTIVE & GUARDING 24/7`" : "`🔴 TURNED OFF`"} • **Speed:** \`< 0.1s\`\n` +
    `> **⚡ Attacks Blocked:** \`${nukesIntercepted} Neutralized\` • **🔄 Restorations:** \`${reversionsExecuted} Restored\`\n` +
    `> **🧩 Guarded Assets:** \`${activeMods}/${totalMods} Modules Active\` • **⏱️ Last Incident:** ${lastIncident}\n\n` +
    `-# Threat detection engine runs non-stop to protect roles, channels, and members.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 1. Global Navigation Dropdown (Connects to all other pages)
  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("security"));

  // 2. Minimal Essential Controls
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

  const homeBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_home")
    .setLabel("Main Menu")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(refreshBtn, cpBtn, homeBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Threat Analytics`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.5. SECURITY WALL ROLES VIEW (Minimal Embed Style)
// ─────────────────────────────────────────────────────────────────────────────
function buildWallRolesView(config, guild, subTab = "main") {
  const container = new ContainerBuilder();
  const guildId = guild.id;

  const rawWallRoles = config.wallRoles || (config.securityWallRole ? [config.securityWallRole] : []);
  const activeRoles = rawWallRoles.filter((id) => guild.roles.cache.has(id));

  // Auto-clean deleted roles if any were found
  if (activeRoles.length !== rawWallRoles.length) {
    config.wallRoles = activeRoles;
    antinukeManager.setGuildAntinuke(guildId, config);
  }

  const headerText =
    `### 🛡️ **Astrix Security • Wall Roles Matrix**\n` +
    `-# Barrier roles separating verified human members from untrusted accounts`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const formattedRoles =
    activeRoles.length > 0
      ? activeRoles.map((id) => `<@&${id}>`).join(", ")
      : "*No security wall roles registered*";

  const content =
    `> **🛡️ Active Security Barrier (${activeRoles.length}):** ${formattedRoles}\n` +
    `> **🔒 Protection Scope:** Strips dangerous administrative permissions from untrusted roles below the barrier.\n\n` +
    `-# Roles registered as Security Walls create a protected permission ceiling across the server.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (subTab === "add") {
    const roleMenu = new RoleSelectMenuBuilder()
      .setCustomId("antinuke_wallroles_do_add_role")
      .setPlaceholder("➕ Select a role to add to Security Wall barrier...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(roleMenu));
  } else if (subTab === "remove" && activeRoles.length > 0) {
    const roleSelect = new StringSelectMenuBuilder()
      .setCustomId("antinuke_wallroles_do_remove_role")
      .setPlaceholder("➖ Select a Security Wall role to remove...");

    for (const rId of activeRoles) {
      const r = guild.roles.cache.get(rId);
      if (r) {
        roleSelect.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(r.name.slice(0, 50))
            .setValue(r.id)
            .setDescription(`${r.members?.size || 0} members | Pos: ${r.position}`.slice(0, 100))
            .setEmoji("🛡️")
        );
      }
    }
    container.addActionRowComponents(new ActionRowBuilder().addComponents(roleSelect));
  }

  // 1. Whitelist Action Select Dropdown (Add / Remove / Clear)
  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_wallroles_select_action")
    .setPlaceholder("⚡ Security Wall Actions (Add / Remove / Reset)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Add Role to Security Wall")
        .setValue("action_add")
        .setDescription("Register a server role as a security barrier")
        .setEmoji("➕")
        .setDefault(subTab === "add"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Remove Role from Security Wall")
        .setValue("action_remove")
        .setDescription("Remove an existing role from the security barrier")
        .setEmoji("➖")
        .setDefault(subTab === "remove"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Reset All Security Wall Roles")
        .setValue("action_reset")
        .setDescription("Clear all registered security wall roles")
        .setEmoji("🧹")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);

  // 2. Global Navigation Dropdown
  const navRow = new ActionRowBuilder().addComponents(buildGlobalNavMenu("wallroles"));

  // 3. Clean 2-button Action Row
  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const homeBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_home")
    .setLabel("Main Menu")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, homeBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Barrier Management`));

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
  const isRoleMenu = interaction.isRoleSelectMenu ? interaction.isRoleSelectMenu() : false;

  if (!isBtn && !isStringMenu && !isUserMenu && !isChannelMenu && !isRoleMenu) return false;

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
    if (selected === "nav_home") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "home");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_help" || selected === "nav_menu") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "help");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "nav_overview") {
      if (!fresh.enabled) {
        const { buildEnableRecommendationContainer } = require("./handleAutoSetup");
        const promptContainer = buildEnableRecommendationContainer(interaction.guild, interaction.user);
        await interaction.update({ components: [promptContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        return true;
      }
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
    if (selected === "nav_wallroles") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "wallroles", { subTab: "main" });
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

  if (customId === "antinuke_nav_home") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "home");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_nav_help" || customId === "antinuke_nav_menu") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "help");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antinuke_nav_overview" || customId === "antinuke_refresh") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    if (!fresh.enabled) {
      const { buildEnableRecommendationContainer } = require("./handleAutoSetup");
      const promptContainer = buildEnableRecommendationContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [promptContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
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
    const { buildEnableRecommendationContainer } = require("./handleAutoSetup");
    const promptContainer = buildEnableRecommendationContainer(interaction.guild, interaction.user);
    await interaction.update({ components: [promptContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
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
    const { executeAutoSetup } = require("./handleAutoSetup");
    await executeAutoSetup(interaction.guild, interaction.user, "create_new_wall", interaction);
    return true;
  }

  if (customId === "antinuke_enable_prompt_cancel" || customId === "antinuke_autosetup_cancel") {
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "home");
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
    const selected = interaction.values[0];
    if (selected === "mod_action_enable_all") {
      antinukeManager.enableMaster(guildId);
      const fresh = antinukeManager.getGuildAntinuke(guildId);
      const view = buildAntinukeContainer(fresh, interaction.guild, "modules");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "mod_action_disable_all") {
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

  if (isChannelMenu && customId === "antinuke_set_log_channel_select") {
    const channelId = interaction.values[0];
    antinukeManager.setAntinukeLogs(guildId, channelId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildAntinukeContainer(fresh, interaction.guild, "settings");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isChannelMenu && customId === "antinuke_set_modlog_channel_select") {
    const channelId = interaction.values[0];
    antinukeManager.setModLogs(guildId, channelId);
    const fresh = antinukeManager.getGuildAntinuke(guildId);
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
  if (isStringMenu && customId === "antinuke_trust_select_action") {
    const act = interaction.values[0];
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    if (act === "action_add_wl") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "add_wl" });
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (act === "action_remove_wl") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "remove_wl" });
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (act === "action_add_eo") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "add_eo" });
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (act === "action_remove_eo") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "trust", { subTab: "remove_eo" });
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (act === "action_clear_wl") {
      const view = buildAntinukeContainer(fresh, interaction.guild, "confirm", { actionType: "clear_whitelist" });
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

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

  // ---------------------------------------------------------------------------
  // F. SECURITY WALL ROLES INTERACTION ROUTER
  // ---------------------------------------------------------------------------
  if (isStringMenu && customId === "antinuke_wallroles_select_action") {
    const val = interaction.values[0];
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    if (val === "action_add") {
      const view = buildWallRolesView(fresh, interaction.guild, "add");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val === "action_remove") {
      const view = buildWallRolesView(fresh, interaction.guild, "remove");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val === "action_reset") {
      antinukeManager.clearWallRoles(guildId);
      const updated = antinukeManager.getGuildAntinuke(guildId);
      const view = buildWallRolesView(updated, interaction.guild, "main");
      await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  if (isRoleMenu && customId === "antinuke_wallroles_do_add_role") {
    const roleId = interaction.values[0];
    if (roleId) {
      antinukeManager.addWallRole(guildId, roleId);
    }
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildWallRolesView(fresh, interaction.guild, "main");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isStringMenu && customId === "antinuke_wallroles_do_remove_role") {
    const roleId = interaction.values[0];
    if (roleId) {
      antinukeManager.removeWallRole(guildId, roleId);
    }
    const fresh = antinukeManager.getGuildAntinuke(guildId);
    const view = buildWallRolesView(fresh, interaction.guild, "main");
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildAntinukeContainer,
  buildWallRolesView,
  handleAntiNukeInteraction,
  MODULE_METADATA,
};
