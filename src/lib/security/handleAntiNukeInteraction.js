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
// 0. COMMAND DIRECTORY MENU VIEW (Matches Image 1 / Screenshot 3)
// ─────────────────────────────────────────────────────────────────────────────
function buildCommandDirectoryView(config, guild) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### 🛡️ **Antinuke Commands**\n\n` +
      `🛡️ **Core Antinuke**\n` +
      `\`antinuke\` , \`antinuke enable\` , \`antinuke disable\` , \`antinuke info\` , \`antinuke settings\` , \`autosetup\` , \`setantinukelogs\` , \`setmodlogs\` , \`wallroles\` , \`wallrole_add\` , \`wallrole_remove\` , \`verify_permissions\`\n\n` +
      `> \`antinuke\` **aliases -** \`an\`\n\n` +
      `🚀 **Whitelist**\n` +
      `\`antinuke whitelist add <user>\` , \`antinuke whitelist remove <user>\` , \`antinuke whitelist reset <user>\` , \`antinuke whitelist show\`\n\n` +
      `> \`antinuke\` **aliases -** \`an\`\n` +
      `> \`whitelist\` **aliases -** \`wl\`\n\n` +
      `• \`Note:\` \`Both antinuke and superantinuke have their own separate whitelist systems.\`\n\n` +
      `Use the commands above to manage all antinuke features.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const btnPanel = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnAutoSetup = new ButtonBuilder()
    .setCustomId("antinuke_nav_autosetup")
    .setLabel("Auto Setup")
    .setEmoji("🚀")
    .setStyle(ButtonStyle.Success);

  const btnWhitelist = new ButtonBuilder()
    .setCustomId("antinuke_nav_trust")
    .setLabel("Whitelist")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const btnSettings = new ButtonBuilder()
    .setCustomId("antinuke_nav_settings")
    .setLabel("Settings")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(btnPanel, btnAutoSetup, btnWhitelist, btnSettings);
  container.addActionRowComponents(row);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW VIEW (Control Center)
// ─────────────────────────────────────────────────────────────────────────────
function buildOverviewView(config, guild) {
  const container = new ContainerBuilder();

  // Premium Header
  const headerText = `### ${EMOJIS.rshield || "🛡️"} **Astrix Anti-Nuke Control Center**\n-# *Advanced Zero-Bypass Server Protection Engine*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Status Banner
  const isEnabled = Boolean(config.enabled);
  const statusHeadline = isEnabled
    ? `**🟢 Protection Enabled**\n> Your server is actively shielded by Astrix Anti-Nuke with sub-0.1s threat interception.`
    : `**🔴 Protection Disabled**\n> Anti-Nuke defense is currently inactive. Server assets are unprotected.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusHeadline));

  // Security Stats & Core Specs
  const punishment = (config.punishment || "ban").toUpperCase();
  const reversions = config.autoRevert ? "🟢 ON" : "🔴 OFF";
  const logChanText = config.logChannel ? `<#${config.logChannel}>` : "`Disabled`";
  const extraOwnersCount = (config.extraOwners || []).length;
  const whitelistCount = (config.whitelist || []).length;

  const activeModulesCount = Object.keys(MODULE_METADATA).filter(
    (key) => isEnabled && config.modules?.[key]
  ).length;
  const totalModulesCount = Object.keys(MODULE_METADATA).length;

  const statsText =
    `**System Telemetry & Policy:**\n` +
    `> ⚡ **Threats Intercepted:** \`${config.stats?.nukesIntercepted || 0}\` • 🔄 **Reversions:** \`${config.stats?.reversionsExecuted || 0}\`\n` +
    `> 🛡️ **Active Modules:** \`${activeModulesCount}/${totalModulesCount}\` • ⚖️ **Punishment:** \`${punishment}\`\n` +
    `> 🔄 **Auto-Revert:** ${reversions} • 📋 **Audit Log:** ${logChanText}\n` +
    `> 👥 **Trust Directory:** \`${extraOwnersCount}\` Extra Owners • \`${whitelistCount}\` Whitelisted`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statsText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Compact Module Matrix Summary
  const isModOn = (key) => (isEnabled && config.modules?.[key] ? "🟢" : "🔴");
  const matrixText =
    `**Protection Modules Matrix:**\n` +
    `> ${isModOn("channel")} \`Channel\` • ${isModOn("role")} \`Role\` • ${isModOn("ban")} \`Anti-Ban\` • ${isModOn("kick")} \`Anti-Kick\`\n` +
    `> ${isModOn("botAdd")} \`Rogue Bot\` • ${isModOn("webhook")} \`Webhook\` • ${isModOn("guildUpdate")} \`Server/Vanity\` • ${isModOn("emoji")} \`Emoji\`\n` +
    `> ${isModOn("permissions")} \`Perm Escalation\` • ${isModOn("prune")} \`Prune Defense\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(matrixText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Navigation Action Rows
  const btnModules = new ButtonBuilder()
    .setCustomId("antinuke_nav_modules")
    .setLabel("Modules")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnSettings = new ButtonBuilder()
    .setCustomId("antinuke_nav_settings")
    .setLabel("Settings")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Secondary);

  const btnTrust = new ButtonBuilder()
    .setCustomId("antinuke_nav_trust")
    .setLabel("Trust Directory")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const btnSecurity = new ButtonBuilder()
    .setCustomId("antinuke_nav_security")
    .setLabel("Security")
    .setEmoji("📊")
    .setStyle(ButtonStyle.Secondary);

  const navRow = new ActionRowBuilder().addComponents(btnModules, btnSettings, btnTrust, btnSecurity);

  const toggleMasterBtn = new ButtonBuilder()
    .setCustomId(isEnabled ? "antinuke_confirm_disable_prompt" : "antinuke_toggle_master_direct")
    .setLabel(isEnabled ? "Disable Shield" : "Enable Master Shield")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("antinuke_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnBackToMenu = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Commands Menu")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const controlRow = new ActionRowBuilder().addComponents(toggleMasterBtn, refreshBtn, btnBackToMenu);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(controlRow);

  const footerText = `-# ASTRIXCODE™ Security • Sub-0.1s Zero-Bypass Engine`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MODULES HUB VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildModulesView(config, guild) {
  const container = new ContainerBuilder();

  const headerText = `### ${EMOJIS.rshield || "🛡️"} **Anti-Nuke Protection Modules**\n-# *Select a defense module to inspect or customize its parameters.*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isEnabled = Boolean(config.enabled);

  // Module List Summary
  let summaryLines = "";
  for (const [key, meta] of Object.entries(MODULE_METADATA)) {
    const status = isEnabled && config.modules?.[key] ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
    summaryLines += `> ${meta.emoji} **${meta.label}:** ${status}\n`;
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`**Current Module Statuses:**\n${summaryLines}`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Module Select Dropdown
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_mod_select")
    .setPlaceholder("🛡️ Select a module to configure...");

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
    .setLabel("Enable All")
    .setEmoji("🟢")
    .setStyle(ButtonStyle.Success);

  const disableAllBtn = new ButtonBuilder()
    .setCustomId("antinuke_mod_disable_all")
    .setLabel("Disable All")
    .setEmoji("🔴")
    .setStyle(ButtonStyle.Danger);

  const backBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const menuBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Commands Menu")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(enableAllBtn, disableAllBtn, backBtn, menuBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MODULE DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildModuleDetailView(config, guild, moduleKey) {
  const container = new ContainerBuilder();
  const meta = MODULE_METADATA[moduleKey] || MODULE_METADATA.channel;

  const isEnabled = Boolean(config.enabled && config.modules?.[moduleKey]);
  const statusBadge = isEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const punishment = (config.punishment || "ban").toUpperCase();
  const autoRevert = config.autoRevert ? "🟢 `ACTIVE`" : "🔴 `INACTIVE`";

  const headerText = `### ${meta.emoji} **${meta.label}**\n-# *Anti-Nuke Defense Subsystem*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const detailText =
    `**Module Status:** ${statusBadge}\n` +
    `> ${meta.desc}\n\n` +
    `**Protected Actions & Triggers:**\n` +
    meta.actions.map((act) => `> • ${act}`).join("\n") +
    `\n\n` +
    `**Active Enforcement Rules:**\n` +
    `> • **Punishment on Violation:** \`${punishment}\`\n` +
    `> • **Automatic State Reversion:** ${autoRevert}\n` +
    `> • **Response Latency:** \`< 0.1s Zero-Bypass Engine\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(detailText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Action Buttons
  const toggleBtn = new ButtonBuilder()
    .setCustomId(`antinuke_toggle_mod_${moduleKey}`)
    .setLabel(isEnabled ? "Disable Module" : "Enable Module")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const settingsBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_settings")
    .setLabel("Configure Punishment")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const backToModsBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_modules")
    .setLabel("Back to Modules")
    .setEmoji("◀")
    .setStyle(ButtonStyle.Secondary);

  const menuBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Commands Menu")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(toggleBtn, settingsBtn, backToModsBtn, menuBtn);

  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SETTINGS HUB VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSettingsView(config, guild) {
  const container = new ContainerBuilder();

  const headerText = `### ${EMOJIS.settings || "⚙️"} **Anti-Nuke Engine Settings**\n-# *Configure enforcement policies, auto-reversion, and audit logging.*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const punishment = (config.punishment || "ban").toUpperCase();
  const revertStatus = config.autoRevert ? "🟢 `ENABLED` (Auto-rebuilds deleted assets)" : "🔴 `DISABLED`";
  const logChan = config.logChannel ? `<#${config.logChannel}>` : "`Disabled`";

  const settingsInfo =
    `**Active Policies & Parameters:**\n` +
    `> • **Punishment Action:** \`${punishment}\` (Inflicted immediately on attacker)\n` +
    `> • **Auto-Revert Engine:** ${revertStatus}\n` +
    `> • **Audit Log Channel:** ${logChan}\n` +
    `> • **Threat Threshold:** \`${config.threshold || 1} strike (Instant Interception)\`\n` +
    `> • **Detection Window:** \`${(config.windowMs || 60000) / 1000} seconds\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(settingsInfo));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Punishment Select Dropdown
  const punishMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_set_punishment_select")
    .setPlaceholder(`⚖️ Change Punishment Policy (Currently: ${punishment})`)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Ban Attacker (Recommended)")
        .setValue("ban")
        .setDescription("Permanently ban and unban victims (Zero Tolerance)")
        .setEmoji("🔨")
        .setDefault(config.punishment === "ban"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Kick Attacker")
        .setValue("kick")
        .setDescription("Instantly expel the attacker from the server")
        .setEmoji("👢")
        .setDefault(config.punishment === "kick"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Strip Dangerous Roles")
        .setValue("strip")
        .setDescription("Strip all administrative & moderation roles from attacker")
        .setEmoji("🎭")
        .setDefault(config.punishment === "strip"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Timeout Attacker (28 Days)")
        .setValue("timeout")
        .setDescription("Apply maximum Discord communication timeout")
        .setEmoji("⏳")
        .setDefault(config.punishment === "timeout")
    );

  const punishRow = new ActionRowBuilder().addComponents(punishMenu);

  // Native Channel Select Menu for Audit Logging
  const logMenu = new ChannelSelectMenuBuilder()
    .setCustomId("antinuke_set_log_channel_select")
    .setPlaceholder("📋 Select Audit Alert Logging Channel...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const logRow = new ActionRowBuilder().addComponents(logMenu);

  // Threat Action Threshold Dropdown
  const currentThreshold = config.threshold || 1;
  const thresholdMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_set_threshold_select")
    .setPlaceholder(`⚡ Strike Threshold Limit (Currently: ${currentThreshold} Action${currentThreshold > 1 ? "s" : ""})`)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("1 Action — Instant Zero-Tolerance (Sub-0.1s)")
        .setValue("1")
        .setDescription("Immediate interception and punishment on the very first unauthorized destructive action")
        .setEmoji("⚡")
        .setDefault(currentThreshold === 1),
      new StringSelectMenuOptionBuilder()
        .setLabel("2 Actions — Strict Protection")
        .setValue("2")
        .setDescription("Allows 1 warning strike before enforcing punishment on a 2nd action in 60s")
        .setEmoji("🛡️")
        .setDefault(currentThreshold === 2),
      new StringSelectMenuOptionBuilder()
        .setLabel("3 Actions — Balanced Protection (Recommended for Active Staff)")
        .setValue("3")
        .setDescription("Enforces punishment on 3 rapid actions in 60s, ideal for busy moderation teams")
        .setEmoji("⚖️")
        .setDefault(currentThreshold === 3),
      new StringSelectMenuOptionBuilder()
        .setLabel("5 Actions — Relaxed Multi-Action Threshold")
        .setValue("5")
        .setDescription("High threshold for large servers with rapid bot/admin workflows")
        .setEmoji("📊")
        .setDefault(currentThreshold === 5)
    );

  const thresholdRow = new ActionRowBuilder().addComponents(thresholdMenu);

  // Control Buttons
  const toggleRevertBtn = new ButtonBuilder()
    .setCustomId("antinuke_toggle_revert_btn")
    .setLabel(config.autoRevert ? "Disable Auto-Revert" : "Enable Auto-Revert")
    .setStyle(config.autoRevert ? ButtonStyle.Secondary : ButtonStyle.Primary);

  const disableLogBtn = new ButtonBuilder()
    .setCustomId("antinuke_disable_log_channel")
    .setLabel("Disable Log Channel")
    .setEmoji("🔕")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(!config.logChannel);

  const resetBtn = new ButtonBuilder()
    .setCustomId("antinuke_confirm_reset_prompt")
    .setLabel("Reset Config")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const menuBtn2 = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Commands Menu")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(toggleRevertBtn, disableLogBtn, resetBtn, cpBtn, menuBtn2);

  container.addActionRowComponents(punishRow);
  container.addActionRowComponents(thresholdRow);
  container.addActionRowComponents(logRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TRUST DIRECTORY & WHITELIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildTrustView(config, guild, subTab = "main") {
  const container = new ContainerBuilder();

  const headerText = `### ${EMOJIS.list || "📋"} **Anti-Nuke Trust Directory**\n-# *Manage immune server operators, extra owners, and whitelisted members.*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const ownerMention = guild ? `<@${guild.ownerId}> (\`${guild.ownerId}\`)` : "*Guild Owner*";
  const extraOwners = config.extraOwners || [];
  const whitelist = config.whitelist || [];

  const eoText =
    extraOwners.length > 0
      ? extraOwners.map((id, i) => `> \`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n")
      : "> *No extra owners designated.*";

  const wlText =
    whitelist.length > 0
      ? whitelist.map((id, i) => `> \`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n")
      : "> *No whitelisted users configured.*";

  const trustBody =
    `👑 **Guild Owner (Root Immune):**\n> ${ownerMention}\n\n` +
    `🛡️ **Designated Extra Owners (${extraOwners.length}):**\n${eoText}\n\n` +
    `📋 **Whitelisted Immune Users (${whitelist.length}):**\n${wlText}\n\n` +
    `-# *Extra Owners can configure Anti-Nuke settings. Whitelisted users are immune to trigger punishments.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(trustBody));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Sub-Tab view controls / User Select Menus
  if (subTab === "add_wl") {
    const addWlMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_add_wl_user")
      .setPlaceholder("➕ Select a user to whitelist (immune)...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(addWlMenu));
  } else if (subTab === "remove_wl") {
    const removeWlMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_remove_wl_user")
      .setPlaceholder("➖ Select a user to remove from whitelist...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(removeWlMenu));
  } else if (subTab === "add_eo") {
    const addEoMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_add_eo_user")
      .setPlaceholder("👑 Select a user to designate as Extra Owner...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(addEoMenu));
  } else if (subTab === "remove_eo") {
    const removeEoMenu = new UserSelectMenuBuilder()
      .setCustomId("antinuke_do_remove_eo_user")
      .setPlaceholder("👑 Select an Extra Owner to revoke...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(removeEoMenu));
  }

  // Action Buttons
  const addWlBtn = new ButtonBuilder()
    .setCustomId("antinuke_trust_tab_add_wl")
    .setLabel("Add Whitelist")
    .setEmoji("➕")
    .setStyle(subTab === "add_wl" ? ButtonStyle.Primary : ButtonStyle.Secondary);

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
    .setLabel("Clear All")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(whitelist.length === 0);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const menuBtn3 = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Commands Menu")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder().addComponents(addWlBtn, removeWlBtn, addEoBtn, removeEoBtn);
  const row2 = new ActionRowBuilder().addComponents(clearWlBtn, cpBtn, menuBtn3);

  container.addActionRowComponents(row1);
  container.addActionRowComponents(row2);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SECURITY TELEMETRY & STATS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSecurityView(config, guild) {
  const container = new ContainerBuilder();

  const headerText = `### ${EMOJIS.stats || "📊"} **Security Activity & Telemetry**\n-# *Real-time anti-nuke threat detection and mitigation metrics.*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const nukesIntercepted = config.stats?.nukesIntercepted || 0;
  const reversionsExecuted = config.stats?.reversionsExecuted || 0;
  const lastIncident = config.stats?.lastNukeTimestamp
    ? `<t:${Math.floor(config.stats.lastNukeTimestamp / 1000)}:F> (<t:${Math.floor(config.stats.lastNukeTimestamp / 1000)}:R>)`
    : "*No incidents recorded.*";

  const isEnabled = Boolean(config.enabled);
  const activeMods = Object.keys(MODULE_METADATA).filter((k) => isEnabled && config.modules?.[k]).length;
  const totalMods = Object.keys(MODULE_METADATA).length;

  const telemetryText =
    `**Threat Mitigation Activity:**\n` +
    `> ⚡ **Nuke Attempts Intercepted:** \`${nukesIntercepted}\`\n` +
    `> 🔄 **Automated Reversions Executed:** \`${reversionsExecuted}\`\n` +
    `> ⏱️ **Last Threat Detected:** ${lastIncident}\n\n` +
    `**Engine Health & Status:**\n` +
    `> • **Engine State:** ${isEnabled ? "🟢 `ONLINE (ACTIVE DEFENSE)`" : "🔴 `OFFLINE`"}\n` +
    `> • **Active Module Coverage:** \`${activeMods}/${totalMods} (${Math.round((activeMods / totalMods) * 100)}%)\`\n` +
    `> • **Detection Latency:** \`< 100ms (Immediate)\`\n` +
    `> • **Trigger Threshold:** \`${config.threshold || 1} strike / ${(config.windowMs || 60000) / 1000}s\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const refreshBtn = new ButtonBuilder()
    .setCustomId("antinuke_refresh_security")
    .setLabel("Refresh Telemetry")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Primary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Secondary);

  const menuBtn4 = new ButtonBuilder()
    .setCustomId("antinuke_nav_menu")
    .setLabel("Commands Menu")
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

  let title = "Confirm Security Action";
  let description = "Are you sure you want to proceed with this action?";
  let confirmCustomId = "antinuke_do_confirm";
  let confirmLabel = "Confirm Action";
  let returnViewCustomId = "antinuke_nav_overview";

  if (actionType === "disable_master") {
    title = "⚠️ Disable Anti-Nuke Master Shield?";
    description =
      `**Warning:** Disabling the Master Shield will completely deactivate all sub-0.1s protection modules on **${guild?.name || "this server"}**.\n\n` +
      `> • Channel, role, ban, kick, webhook, and rogue bot defense will cease immediately.\n` +
      `> • Auto-reversion will be disabled.\n\n` +
      `Are you sure you want to disable Anti-Nuke?`;
    confirmCustomId = "antinuke_do_confirm_disable_master";
    confirmLabel = "⚠️ Disable Anti-Nuke";
    returnViewCustomId = "antinuke_nav_overview";
  } else if (actionType === "reset_config") {
    title = "⚠️ Reset Anti-Nuke to Factory Defaults?";
    description =
      `**Warning:** This will reset all Anti-Nuke settings, punishment policies, extra owners, and whitelisted users to factory defaults.\n\n` +
      `Are you sure you want to reset configuration?`;
    confirmCustomId = "antinuke_do_confirm_reset_config";
    confirmLabel = "⚠️ Reset All Settings";
    returnViewCustomId = "antinuke_nav_settings";
  } else if (actionType === "clear_whitelist") {
    title = "⚠️ Clear Anti-Nuke Whitelist?";
    description =
      `**Warning:** This will remove all **${(config.whitelist || []).length}** users from the bypass whitelist.\n\n` +
      `Are you sure you want to clear the entire whitelist directory?`;
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
  // A. MAIN NAVIGATION BUTTONS
  // ---------------------------------------------------------------------------
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
