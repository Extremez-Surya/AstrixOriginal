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
  ChannelSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} = require("discord.js");
const automodManager = require("../automodManager");
const EMOJIS = require("../emojis");

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL AUTOMOD NAVIGATION DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodNavMenu(activeId = "overview") {
  return new StringSelectMenuBuilder()
    .setCustomId("automod_nav_menu")
    .setPlaceholder("🧭 AutoMod Navigation Hub...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Control Center & Telemetry")
        .setValue("automod_nav_overview")
        .setDescription("View real-time AutoMod telemetry, status, and summary")
        .setEmoji("🤖")
        .setDefault(activeId === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Protection Modules Matrix")
        .setValue("automod_nav_modules")
        .setDescription("Configure and toggle all 14 individual protection filters")
        .setEmoji("📦")
        .setDefault(activeId === "modules"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Security Presets Hub")
        .setValue("automod_nav_presets")
        .setDescription("Apply pre-configured Strict, Moderate, or Light security presets")
        .setEmoji("⚡")
        .setDefault(activeId === "presets"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Bad Words Blacklist Directory")
        .setValue("automod_nav_badwords")
        .setDescription("Manage custom banned words, phrases, and profanity list")
        .setEmoji("🤬")
        .setDefault(activeId === "badwords"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Ignore Rules & Whitelist")
        .setValue("automod_nav_ignore")
        .setDescription("Configure channels, roles, and users exempt from filters")
        .setEmoji("🚫")
        .setDefault(activeId === "ignore"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Audit Logging Channel")
        .setValue("automod_nav_logs")
        .setDescription("Configure text channel for AutoMod violation log alerts")
        .setEmoji("📜")
        .setDefault(activeId === "logs"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Syntax")
        .setValue("automod_nav_commands")
        .setDescription("Complete AutoMod command syntax, aliases, and quick guide")
        .setEmoji("📖")
        .setDefault(activeId === "commands")
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MAIN CONTROL CENTER VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodOverviewView(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = Boolean(config.enabled);

  const headerText =
    `### 🤖 **Astrix AutoMod • Control Center**\n` +
    `-# Real-time intelligent message filtering & strike enforcement for **${guild?.name || "Your Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const activePreset = config.activePreset
    ? `\`${config.activePreset.toUpperCase()}\``
    : "`CUSTOM`";

  const enabledCount = isEnabled
    ? Object.values(config.modules || {}).filter((m) => m.enabled).length
    : 0;
  const totalCount = Object.keys(automodManager.MODULES).length;
  const logChan = config.logChannel ? `<#${config.logChannel}>` : "*None*";

  const telemetryText =
    `> **Master Status:** ${isEnabled ? "🟢 `ARMED & ACTIVE`" : "🔴 `OFFLINE & DISABLED`"} • **Preset:** ${activePreset}\n` +
    `> **Filter Matrix:** \`${enabledCount}/${totalCount}\` filters active • **Strikes:** ${config.strikesEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
    `> **Telemetry:** \`${config.stats?.violationsIntercepted || 0}\` blocked • \`${config.stats?.messagesDeleted || 0}\` deleted • Log: ${logChan}\n\n` +
    `-# Select an action below or switch dashboard using the navigation menu.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 1. Quick Action Dropdown
  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("automod_overview_select_action")
    .setPlaceholder("⚡ AutoMod Actions & Quick Controls...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(isEnabled ? "Deactivate AutoMod Master Shield" : "Activate AutoMod Master Shield")
        .setValue("action_toggle_master")
        .setDescription(isEnabled ? "Disables all automated chat message moderation" : "Enables real-time 24/7 message filtering")
        .setEmoji(isEnabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Strict Preset (All 14 Modules)")
        .setValue("action_preset_strict")
        .setDescription("Maximum zero-tolerance chat safety matrix")
        .setEmoji("🔒"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Moderate Preset (Recommended)")
        .setValue("action_preset_moderate")
        .setDescription("Balanced protection for active community servers")
        .setEmoji("⚖️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Light Preset (Essential Only)")
        .setValue("action_preset_light")
        .setDescription("Basic protection against invites, spam and mass pings")
        .setEmoji("🪶"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Protection Modules Matrix (14 Filters)")
        .setValue("nav_modules")
        .setDescription("Toggle individual filters or customize behaviors")
        .setEmoji("📦"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Bad Words & Blacklist Directory")
        .setValue("nav_badwords")
        .setDescription("Manage custom banned words and profanity filter")
        .setEmoji("🤬"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Ignore Rules & Whitelist Bypasses")
        .setValue("nav_ignore")
        .setDescription("Configure channels, roles, and users exempt from filters")
        .setEmoji("🚫"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Audit Logging Channel")
        .setValue("nav_logs")
        .setDescription("Configure log channel for AutoMod violation alerts")
        .setEmoji("📜")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);

  // 2. Global Navigation Dropdown
  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("overview"));

  // 3. Minimal 3-button control row
  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(refreshBtn, cpBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • AutoMod Guard`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROTECTION MODULES MATRIX VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodModulesView(config, guild) {
  const container = new ContainerBuilder();
  const isMaster = Boolean(config.enabled);

  const headerText =
    `### 📦 **AutoMod • Protection Modules Matrix (14 Filters)**\n` +
    `-# Toggle individual filters or adjust punishment behaviors for **${guild?.name || "Your Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const modEntries = Object.entries(automodManager.MODULES);
  const activeCount = isMaster
    ? modEntries.filter(([k]) => config.modules?.[k]?.enabled).length
    : 0;

  const content =
    `> **Matrix Status:** ${isMaster ? "🟢 `ARMED & ACTIVE`" : "🔴 `OFFLINE`"} • **Active Filters:** \`${activeCount}/${modEntries.length}\`\n` +
    `> **Fast Control:** Select any module from the dropdown below to toggle it instantly.\n\n` +
    `-# Select a module below to toggle status or change views.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Dropdown to toggle any module
  const options = modEntries.map(([key, mod]) => {
    const isModEnabled = isMaster && config.modules?.[key]?.enabled;
    return new StringSelectMenuOptionBuilder()
      .setLabel(`${mod.name} (${isModEnabled ? "ON" : "OFF"})`)
      .setValue(`automod_mod_toggle_${key}`)
      .setDescription(mod.description)
      .setEmoji(mod.emoji);
  });

  const moduleSelect = new StringSelectMenuBuilder()
    .setCustomId("automod_module_toggle_select")
    .setPlaceholder("📦 Select a module to toggle ON / OFF...")
    .addOptions(options.slice(0, 14));

  const menuRow = new ActionRowBuilder().addComponents(moduleSelect);
  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("modules"));

  const enableAllBtn = new ButtonBuilder()
    .setCustomId("automod_preset_strict")
    .setLabel("Enable All (Strict)")
    .setEmoji("⚡")
    .setStyle(ButtonStyle.Success);

  const disableAllBtn = new ButtonBuilder()
    .setCustomId("automod_btn_disable_all")
    .setLabel("Disable All")
    .setEmoji("🔴")
    .setStyle(ButtonStyle.Danger);

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(enableAllBtn, disableAllBtn, cpBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Modules Matrix`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SECURITY PRESETS HUB VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodPresetsView(config, guild) {
  const container = new ContainerBuilder();

  const headerText =
    `### ⚡ **AutoMod • Security Presets Hub**\n` +
    `-# 1-click pre-configured rule matrices optimized for different community safety requirements`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const currentPreset = config.activePreset ? config.activePreset.toUpperCase() : "CUSTOM";

  const content =
    `> **Current Active Preset:** \`${currentPreset}\`\n` +
    `> • 🔒 **Strict:** All 14 modules armed with aggressive zero-tolerance filtering\n` +
    `> • ⚖️ **Moderate:** Balanced defense (Spam, Invites, Links, Bad Words, @everyone)\n` +
    `> • 🪶 **Light:** Essential baseline (Discord Invites, Mass Spam, @everyone)\n\n` +
    `-# Select a preset below to apply instantly.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const presetMenu = new StringSelectMenuBuilder()
    .setCustomId("automod_preset_select_action")
    .setPlaceholder("⚡ Select a preset to apply instantly...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Strict Preset (Maximum Defense)")
        .setValue("preset_strict")
        .setDescription("Enables all 14 protection modules with strict limits")
        .setEmoji("🔒"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Moderate Preset (Recommended)")
        .setValue("preset_moderate")
        .setDescription("Balanced protection for active community servers")
        .setEmoji("⚖️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply Light Preset (Basic Defense)")
        .setValue("preset_light")
        .setDescription("Standard safety filter for low-moderation servers")
        .setEmoji("🪶")
    );

  const menuRow = new ActionRowBuilder().addComponents(presetMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("presets"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Security Presets`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BAD WORDS BLACKLIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodBadWordsView(config, guild) {
  const container = new ContainerBuilder();
  const words = config.modules?.badwords?.words || [];
  const isEnabled = config.enabled && config.modules?.badwords?.enabled;

  const headerText =
    `### 🤬 **AutoMod • Bad Words & Blacklist Directory**\n` +
    `-# Auto-delete messages matching custom prohibited words or profanity phrases`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const wordsFormatted =
    words.length > 0
      ? words.slice(0, 10).map((w) => `||${w}||`).join(", ") + (words.length > 10 ? ` *(+${words.length - 10} more)*` : "")
      : "*No custom banned words configured*";

  const content =
    `> **Module Status:** ${isEnabled ? "🟢 `ARMED & ACTIVE`" : "🔴 `DISABLED`"} • **Banned Words:** \`${words.length}\`\n` +
    `> **Active Words:** ${wordsFormatted}\n\n` +
    `-# Select an action below or manage words via \`automod badwords add <word>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("automod_badwords_select_action")
    .setPlaceholder("🤬 Bad Words Actions (Add / Remove / Clear)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(isEnabled ? "Disable Bad Words Filter" : "Enable Bad Words Filter")
        .setValue("action_toggle_bw")
        .setDescription("Toggles profanity & custom bad words filter")
        .setEmoji(isEnabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Clear All Banned Words")
        .setValue("action_clear_bw")
        .setDescription("Reset custom banned words blacklist")
        .setEmoji("🧹")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("badwords"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Bad Words Hub`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. IGNORE RULES & WHITELIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodIgnoreView(config, guild) {
  const container = new ContainerBuilder();
  const ign = config.ignore || { channels: [], roles: [], users: [] };

  const headerText =
    `### 🚫 **AutoMod • Ignore Rules & Bypasses**\n` +
    `-# Exclude designated text channels, staff roles, and users from AutoMod filtering`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const chansText = ign.channels?.length > 0 ? ign.channels.map((id) => `<#${id}>`).join(", ") : "*None*";
  const rolesText = ign.roles?.length > 0 ? ign.roles.map((id) => `<@&${id}>`).join(", ") : "*None*";
  const usersText = ign.users?.length > 0 ? ign.users.map((id) => `<@${id}>`).join(", ") : "*None*";

  const content =
    `> **Ignored Channels (${ign.channels?.length || 0}):** ${chansText}\n` +
    `> **Ignored Roles (${ign.roles?.length || 0}):** ${rolesText}\n` +
    `> **Ignored Users (${ign.users?.length || 0}):** ${usersText}\n\n` +
    `-# To whitelist a user across all security systems, use \`.whitelist add @user\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("ignore"));
  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Ignore Directory`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. AUDIT LOGGING CHANNEL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodLogsView(config, guild) {
  const container = new ContainerBuilder();
  const currentChan = config.logChannel ? `<#${config.logChannel}>` : "*None configured*";

  const headerText =
    `### 📜 **AutoMod • Audit Logging Channel**\n` +
    `-# Channel where automated chat moderation violations and strike alerts are broadcast`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Current Log Channel:** ${currentChan}\n` +
    `> **Event Dispatch:** Real-time (<0.1s) alerts for Deletions, Timeout Warnings & Strikes.\n\n` +
    `-# Select a text channel below to configure or update logging.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("automod_logs_select_channel")
    .setPlaceholder("📜 Select channel for AutoMod alerts...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(channelMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("logs"));

  const disableBtn = new ButtonBuilder()
    .setCustomId("automod_logs_disable")
    .setLabel("Disable Log Channel")
    .setEmoji("🔕")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!config.logChannel);

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(disableBtn, cpBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Audit Logs`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMMAND MANUAL & QUICK GUIDE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodCommandsManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **AutoMod • Command Manual**\n` +
    `-# Quick reference for all AutoMod commands, subcommands, and quick toggles`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**🤖 Core Commands**\n` +
    `> • \`automod\` — Open interactive AutoMod Control Center\n` +
    `> • \`automodenable / automoddisable\` — Toggle master protection\n` +
    `> • \`automod preset <strict|moderate|light>\` — Apply safety preset\n\n` +
    `**⚡ Quick Filter Commands**\n` +
    `> • \`antispam [enable|disable]\` — Rapid message spam filter\n` +
    `> • \`antilink [enable|disable]\` — Web link & Discord invite block\n` +
    `> • \`anticaps [enable|disable]\` — Excessive uppercase letter filter\n\n` +
    `**🤬 Bad Words Management**\n` +
    `> • \`automod badwords add/remove/list <word>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("commands"));
  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Documentation`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SUBMODULE VIEWS (ANTICAPS, ANTILINK, ANTISPAM)
// ─────────────────────────────────────────────────────────────────────────────
function buildAnticapsContainer(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = config.enabled && config.modules?.anticaps?.enabled;
  const threshold = config.modules?.anticaps?.threshold || 70;

  const headerText =
    `### 🔠 **AutoMod • Anti-Caps Filter**\n` +
    `-# Automatically purges shouting messages containing excessive uppercase letters for **${guild?.name || "Your Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Module Status:** ${isEnabled ? "🟢 `ARMED & ACTIVE`" : "🔴 `DISABLED`"} • **Threshold:** \`>${threshold}% Caps (Min 8 chars)\`\n` +
    `> **Violation Action:** \`Instant Message Deletion + Strike Warning\`\n\n` +
    `-# Select an action below to toggle status or adjust caps percentage threshold.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("automod_anticaps_select_action")
    .setPlaceholder("🔠 Anti-Caps Actions (Toggle / Threshold)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(isEnabled ? "Disable Anti-Caps Filter" : "Enable Anti-Caps Filter")
        .setValue("action_toggle")
        .setDescription("Toggles uppercase shouting filter")
        .setEmoji(isEnabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Threshold: >60% Caps (Strict)")
        .setValue("threshold_60")
        .setDescription("Filters messages with over 60% capital letters")
        .setEmoji("📊"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Threshold: >70% Caps (Balanced)")
        .setValue("threshold_70")
        .setDescription("Filters messages with over 70% capital letters")
        .setEmoji("📊"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Threshold: >85% Caps (Relaxed)")
        .setValue("threshold_85")
        .setDescription("Filters messages with over 85% capital letters")
        .setEmoji("📊")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("modules"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Caps Filter`));

  return container;
}

function buildAntilinkContainer(config, guild) {
  const container = new ContainerBuilder();
  const isLinkEnabled = config.enabled && config.modules?.antilink?.enabled;
  const isInviteEnabled = config.enabled && config.modules?.antiinvite?.enabled;

  const headerText =
    `### 🌐 **AutoMod • Anti-Link & Anti-Invite Filter**\n` +
    `-# Automatically deletes unauthorized web links, IP grabbers, and Discord invite links for **${guild?.name || "Your Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Link Filter:** ${isLinkEnabled ? "🟢 `ARMED & ACTIVE`" : "🔴 `DISABLED`"} • **Invite Filter:** ${isInviteEnabled ? "🟢 `ARMED & ACTIVE`" : "🔴 `DISABLED`"}\n` +
    `> **Blocked URL Types:** \`http://\`, \`https://\`, \`discord.gg/\`, \`discord.com/invite/\`\n` +
    `> **Violation Action:** \`Instant Message Deletion + Strike Warning\`\n\n` +
    `-# Select an action below to toggle links or Discord invite filters.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("automod_antilink_select_action")
    .setPlaceholder("🌐 Anti-Link Actions (Toggle Links / Invites)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(isLinkEnabled ? "Disable Web Links Filter" : "Enable Web Links Filter")
        .setValue("action_toggle_links")
        .setDescription("Toggles http/https link blocking")
        .setEmoji(isLinkEnabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel(isInviteEnabled ? "Disable Discord Invites Filter" : "Enable Discord Invites Filter")
        .setValue("action_toggle_invites")
        .setDescription("Toggles discord.gg invite link blocking")
        .setEmoji(isInviteEnabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Enable Both (Links & Invites)")
        .setValue("action_enable_both")
        .setDescription("Arms full URL and invite protection")
        .setEmoji("🛡️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Disable Both")
        .setValue("action_disable_both")
        .setDescription("Turns off all link and invite filtering")
        .setEmoji("❌")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("modules"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Link Filter`));

  return container;
}

function buildAntispamContainer(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = config.enabled && config.modules?.antispam?.enabled;
  const threshold = config.modules?.antispam?.threshold || 5;
  const windowSec = config.modules?.antispam?.window || 5;

  const headerText =
    `### 📨 **AutoMod • Anti-Spam Filter**\n` +
    `-# Rate-limits rapid message flooding and punishes spam bots for **${guild?.name || "Your Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Module Status:** ${isEnabled ? "🟢 `ARMED & ACTIVE`" : "🔴 `DISABLED`"} • **Rate Limit:** \`${threshold} messages / ${windowSec} seconds\`\n` +
    `> **Violation Action:** \`Message Deletion + Auto-Timeout + Strike\`\n\n` +
    `-# Select an action below to toggle status or adjust spam burst thresholds.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("automod_antispam_select_action")
    .setPlaceholder("📨 Anti-Spam Actions (Toggle / Rate Limit)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(isEnabled ? "Disable Anti-Spam Filter" : "Enable Anti-Spam Filter")
        .setValue("action_toggle")
        .setDescription("Toggles chat rate-limiting protection")
        .setEmoji(isEnabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Strict: 3 msgs / 3 seconds")
        .setValue("rate_3_3")
        .setDescription("High sensitivity for fast raiding mitigation")
        .setEmoji("⚡"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Balanced: 5 msgs / 5 seconds (Recommended)")
        .setValue("rate_5_5")
        .setDescription("Standard anti-flood threshold for general chats")
        .setEmoji("⚖️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Relaxed: 8 msgs / 5 seconds")
        .setValue("rate_8_5")
        .setDescription("Permissive rate for high-traffic active chat channels")
        .setEmoji("🪶")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("modules"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Spam Defense`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE DISPATCHER FOR AUTOMOD DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodContainer(config, guild, activeTab = "overview") {
  switch (activeTab) {
    case "modules":
      return buildAutomodModulesView(config, guild);
    case "presets":
      return buildAutomodPresetsView(config, guild);
    case "badwords":
      return buildAutomodBadWordsView(config, guild);
    case "ignore":
      return buildAutomodIgnoreView(config, guild);
    case "logs":
      return buildAutomodLogsView(config, guild);
    case "commands":
      return buildAutomodCommandsManualView();
    case "overview":
    default:
      return buildAutomodOverviewView(config, guild);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION ROUTER FOR AUTOMOD
// ─────────────────────────────────────────────────────────────────────────────
async function handleAutomodInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isChanMenu = interaction.isChannelSelectMenu();

  if (!isBtn && !isMenu && !isChanMenu) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("automod_")) return false;

  if (!interaction.guild) return false;

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** permissions to interact with AutoMod controls.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guild = interaction.guild;
  const guildId = guild.id;
  let config = automodManager.getGuildAutomod(guildId);

  // 1. Navigation Menu Switch
  if (isMenu && customId === "automod_nav_menu") {
    const selected = interaction.values[0];
    const targetTab = selected.replace("automod_nav_", "");
    const updated = buildAutomodContainer(config, guild, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.1 Overview Action Select
  if (isMenu && customId === "automod_overview_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle_master") {
      automodManager.toggleMaster(guildId);
      const freshConfig = automodManager.getGuildAutomod(guildId);
      const updated = buildAutomodContainer(freshConfig, guild, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val === "action_preset_strict") {
      automodManager.applyPreset(guildId, "strict");
      const freshConfig = automodManager.getGuildAutomod(guildId);
      const updated = buildAutomodContainer(freshConfig, guild, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val === "action_preset_moderate") {
      automodManager.applyPreset(guildId, "moderate");
      const freshConfig = automodManager.getGuildAutomod(guildId);
      const updated = buildAutomodContainer(freshConfig, guild, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val === "action_preset_light") {
      automodManager.applyPreset(guildId, "light");
      const freshConfig = automodManager.getGuildAutomod(guildId);
      const updated = buildAutomodContainer(freshConfig, guild, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val.startsWith("nav_")) {
      const targetTab = val.replace("nav_", "");
      const updated = buildAutomodContainer(config, guild, targetTab);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // 1.2 Preset Action Select
  if (isMenu && customId === "automod_preset_select_action") {
    const val = interaction.values[0].replace("preset_", "");
    automodManager.applyPreset(guildId, val);
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "presets");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.3 Bad Words Action Select
  if (isMenu && customId === "automod_badwords_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle_bw") {
      automodManager.toggleModule(guildId, "badwords");
    } else if (val === "action_add_bw") {
      const modal = new ModalBuilder()
        .setCustomId("automod_modal_submit_add_badword")
        .setTitle("Add Banned Word to Blacklist");

      const wordInput = new TextInputBuilder()
        .setCustomId("bw_word")
        .setLabel("Prohibited Word or Phrase")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. scam, nsfw, hatephrase")
        .setRequired(true)
        .setMaxLength(100);

      modal.addComponents(new ActionRowBuilder().addComponents(wordInput));
      await interaction.showModal(modal).catch(() => null);
      return true;
    } else if (val === "action_delete_bw") {
      const modal = new ModalBuilder()
        .setCustomId("automod_modal_submit_delete_badword")
        .setTitle("Remove Banned Word from Blacklist");

      const wordInput = new TextInputBuilder()
        .setCustomId("bw_del_word")
        .setLabel("Word or Phrase to Unban")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. word to remove")
        .setRequired(true)
        .setMaxLength(100);

      modal.addComponents(new ActionRowBuilder().addComponents(wordInput));
      await interaction.showModal(modal).catch(() => null);
      return true;
    } else if (val === "action_clear_bw") {
      if (config.modules?.badwords) config.modules.badwords.words = [];
      automodManager.setGuildAutomod(guildId, config);
    }
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "badwords");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.3b Badwords Modals Submissions
  if (interaction.isModalSubmit && interaction.isModalSubmit()) {
    if (customId === "automod_modal_submit_add_badword") {
      const word = interaction.fields.getTextInputValue("bw_word")?.trim().toLowerCase();
      if (word) {
        if (!config.modules.badwords) config.modules.badwords = { enabled: true, words: [], punishments: ["delete"] };
        if (!config.modules.badwords.words) config.modules.badwords.words = [];
        if (!config.modules.badwords.words.includes(word)) {
          config.modules.badwords.words.push(word);
          automodManager.setGuildAutomod(guildId, config);
        }
      }
      await interaction.reply({
        content: `✅ Word \`${word}\` added to bad words blacklist!`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (customId === "automod_modal_submit_delete_badword") {
      const word = interaction.fields.getTextInputValue("bw_del_word")?.trim().toLowerCase();
      if (word && config.modules?.badwords?.words) {
        config.modules.badwords.words = config.modules.badwords.words.filter((w) => w.toLowerCase() !== word);
        automodManager.setGuildAutomod(guildId, config);
      }
      await interaction.reply({
        content: `🗑️ Word \`${word}\` removed from bad words blacklist!`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }
  }

  // 1.4 Anti-Caps Action Select
  if (isMenu && customId === "automod_anticaps_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle") {
      automodManager.toggleModule(guildId, "anticaps");
    } else if (val.startsWith("threshold_")) {
      const num = parseInt(val.replace("threshold_", ""), 10);
      if (!config.modules.anticaps) config.modules.anticaps = { enabled: true, punishments: ["delete"], threshold: 70 };
      config.modules.anticaps.threshold = num;
      automodManager.setGuildAutomod(guildId, config);
    }
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAnticapsContainer(freshConfig, guild);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.5 Anti-Link Action Select
  if (isMenu && customId === "automod_antilink_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle_links") {
      automodManager.toggleModule(guildId, "antilink");
    } else if (val === "action_toggle_invites") {
      automodManager.toggleModule(guildId, "antiinvite");
    } else if (val === "action_enable_both") {
      if (!config.modules.antilink) config.modules.antilink = { enabled: true, punishments: ["delete"] };
      if (!config.modules.antiinvite) config.modules.antiinvite = { enabled: true, punishments: ["delete"] };
      config.modules.antilink.enabled = true;
      config.modules.antiinvite.enabled = true;
      config.enabled = true;
      automodManager.setGuildAutomod(guildId, config);
    } else if (val === "action_disable_both") {
      if (config.modules.antilink) config.modules.antilink.enabled = false;
      if (config.modules.antiinvite) config.modules.antiinvite.enabled = false;
      automodManager.setGuildAutomod(guildId, config);
    }
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAntilinkContainer(freshConfig, guild);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.6 Anti-Spam Action Select
  if (isMenu && customId === "automod_antispam_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle") {
      automodManager.toggleModule(guildId, "antispam");
    } else if (val === "rate_3_3") {
      if (!config.modules.antispam) config.modules.antispam = { enabled: true, punishments: ["warn"] };
      config.modules.antispam.threshold = 3;
      config.modules.antispam.window = 3;
      automodManager.setGuildAutomod(guildId, config);
    } else if (val === "rate_5_5") {
      if (!config.modules.antispam) config.modules.antispam = { enabled: true, punishments: ["warn"] };
      config.modules.antispam.threshold = 5;
      config.modules.antispam.window = 5;
      automodManager.setGuildAutomod(guildId, config);
    } else if (val === "rate_8_5") {
      if (!config.modules.antispam) config.modules.antispam = { enabled: true, punishments: ["warn"] };
      config.modules.antispam.threshold = 8;
      config.modules.antispam.window = 5;
      automodManager.setGuildAutomod(guildId, config);
    }
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAntispamContainer(freshConfig, guild);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 2. Direct Navigation Buttons
  if (isBtn && customId.startsWith("automod_nav_")) {
    const targetTab = customId.replace("automod_nav_", "");
    const updated = buildAutomodContainer(config, guild, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 3. Master Toggle
  if (customId === "automod_btn_toggle_master" || customId === "automod_toggle") {
    automodManager.toggleMaster(guildId);
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 4. Presets
  if (customId === "automod_preset_strict") {
    automodManager.applyPreset(guildId, "strict");
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "presets");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "automod_preset_moderate") {
    automodManager.applyPreset(guildId, "moderate");
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "presets");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "automod_preset_light") {
    automodManager.applyPreset(guildId, "light");
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "presets");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 5. Module Toggles Dropdown & Buttons
  if (isMenu && customId === "automod_module_toggle_select") {
    const selectedVal = interaction.values[0];
    const modKey = selectedVal.replace("automod_mod_toggle_", "");

    automodManager.toggleModule(guildId, modKey);
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "modules");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isBtn && customId.startsWith("automod_mod_toggle_") && customId.endsWith("_btn")) {
    const modKey = customId.replace("automod_mod_toggle_", "").replace("_btn", "");
    if (modKey === "antilink") {
      const isL = config.enabled && config.modules?.antilink?.enabled;
      if (isL) {
        if (config.modules.antilink) config.modules.antilink.enabled = false;
        if (config.modules.antiinvite) config.modules.antiinvite.enabled = false;
      } else {
        if (!config.modules.antilink) config.modules.antilink = { enabled: true, punishments: ["delete"] };
        if (!config.modules.antiinvite) config.modules.antiinvite = { enabled: true, punishments: ["delete"] };
        config.modules.antilink.enabled = true;
        config.modules.antiinvite.enabled = true;
        config.enabled = true;
      }
      automodManager.setGuildAutomod(guildId, config);
    } else {
      automodManager.toggleModule(guildId, modKey);
    }

    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "automod_btn_disable_all") {
    automodManager.disableMaster(guildId);
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "modules");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 6. Badwords Actions
  if (customId === "automod_toggle_badwords") {
    automodManager.toggleModule(guildId, "badwords");
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "badwords");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "automod_clear_badwords") {
    automodManager.clearBadWords(guildId);
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "badwords");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 7. Log Channel Actions
  if (isChanMenu && customId === "automod_logs_select_channel") {
    const selectedChanId = interaction.values[0];
    if (selectedChanId) {
      config.logChannel = selectedChanId;
      automodManager.setGuildAutomod(guildId, config);
    }
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "logs");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "automod_logs_disable") {
    config.logChannel = null;
    automodManager.setGuildAutomod(guildId, config);
    const updated = buildAutomodContainer(config, guild, "logs");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 8. Refresh
  if (customId === "automod_btn_refresh" || customId === "automod_refresh") {
    const freshConfig = automodManager.getGuildAutomod(guildId);
    const updated = buildAutomodContainer(freshConfig, guild, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildAutomodNavMenu,
  buildAutomodOverviewView,
  buildAutomodModulesView,
  buildAutomodPresetsView,
  buildAutomodBadWordsView,
  buildAutomodIgnoreView,
  buildAutomodLogsView,
  buildAutomodCommandsManualView,
  buildAnticapsContainer,
  buildAntilinkContainer,
  buildAntispamContainer,
  buildAutomodContainer,
  handleAutomodInteraction,
};
