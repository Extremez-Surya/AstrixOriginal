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
    `### 🤖 **Astrix AutoMod Control Center**\n` +
    `-# *Real-time intelligent message filtering, rate-limiting & strike enforcement for **${guild?.name || "Your Server"}***`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const statusHeadline = isEnabled
    ? `### 🟢 **Status: AutoMod Active & Enforcing**\n> Sub-0.1s message analysis and automated strike punishment is active.`
    : `### 🔴 **Status: AutoMod Disabled**\n> Message moderation is offline. Click **[ 🟢 Enable System ]** below to arm defense.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusHeadline));

  const activePreset = config.activePreset
    ? `\`${config.activePreset.toUpperCase()}\``
    : "`CUSTOM`";

  const enabledCount = isEnabled
    ? Object.values(config.modules || {}).filter((m) => m.enabled).length
    : 0;
  const totalCount = Object.keys(automodManager.MODULES).length;

  const logChan = config.logChannel ? `<#${config.logChannel}>` : "*None (Select in Logs tab)*";
  const ign = config.ignore || { channels: [], roles: [], users: [] };

  const telemetryText =
    `**📊 System Telemetry:**\n` +
    `> • 🛡️ **Active Preset:** ${activePreset} • **Armed Filters:** \`${enabledCount}/${totalCount}\` Modules\n` +
    `> • ⚖️ **Strike Enforcement:** ${config.strikesEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"} (\`${config.strikeExpiry || 24}h\` strike decay)\n` +
    `> • 📜 **Audit Log Channel:** ${logChan}\n` +
    `> • 🚫 **Ignored Entities:** \`${ign.channels?.length || 0}\` Channels • \`${ign.roles?.length || 0}\` Roles • \`${ign.users?.length || 0}\` Users\n` +
    `> • 📈 **Intercepted Stats:** \`${config.stats?.violationsIntercepted || 0}\` blocked • \`${config.stats?.strikesIssued || 0}\` strikes • \`${config.stats?.messagesDeleted || 0}\` deleted`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isMod = (key) => (isEnabled && config.modules?.[key]?.enabled ? "🟢 `ACTIVE`" : "🔴 `OFF`");

  const modulesText =
    `**🛡️ Core Protection Filters:**\n` +
    `> • 📨 **Anti-Spam:** ${isMod("antispam")} • 🌐 **Anti-Link:** ${isMod("antilink")} • 🔗 **Anti-Invite:** ${isMod("antiinvite")}\n` +
    `> • 🔠 **Anti-Caps:** ${isMod("anticaps")} • 📢 **Anti-Mention:** ${isMod("antimention")} • 🤬 **Bad Words:** ${isMod("badwords")}\n` +
    `> • 📣 **Anti-Everyone:** ${isMod("antieveryone")} • 🎭 **Anti-Role:** ${isMod("antirole")} • 👾 **Anti-Zalgo:** ${isMod("antizalgo")}\n` +
    `> • 🧪 **AI Toxicity Check:** ${isMod("antiai")}`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(modulesText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildAutomodNavMenu("overview"));

  const toggleBtn = new ButtonBuilder()
    .setCustomId("automod_btn_toggle_master")
    .setLabel(isEnabled ? "Disable AutoMod" : "Enable AutoMod")
    .setEmoji(isEnabled ? "🔴" : "🟢")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const strictBtn = new ButtonBuilder()
    .setCustomId("automod_preset_strict")
    .setLabel("Strict Preset")
    .setEmoji("🔒")
    .setStyle(config.activePreset === "strict" ? ButtonStyle.Success : ButtonStyle.Secondary);

  const modBtn = new ButtonBuilder()
    .setCustomId("automod_preset_moderate")
    .setLabel("Moderate Preset")
    .setEmoji("⚖️")
    .setStyle(config.activePreset === "moderate" ? ButtonStyle.Success : ButtonStyle.Secondary);

  const modulesBtn = new ButtonBuilder()
    .setCustomId("automod_nav_modules")
    .setLabel("Module Toggles")
    .setEmoji("📦")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("automod_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(toggleBtn, strictBtn, modBtn, modulesBtn, refreshBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROTECTION MODULES MATRIX VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodModulesView(config, guild) {
  const container = new ContainerBuilder();
  const isMaster = Boolean(config.enabled);

  const headerText =
    `### 📦 **Protection Modules Matrix (14 Filters)**\n` +
    `-# Toggle individual filters or adjust punishment behaviors for specific violation types.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const modEntries = Object.entries(automodManager.MODULES);
  const rows = modEntries.map(([key, mod]) => {
    const isModEnabled = isMaster && config.modules?.[key]?.enabled;
    const punishment = (config.modules?.[key]?.punishments?.[0] || mod.defaultPunishment).toUpperCase();
    return `> • ${mod.emoji} **${mod.name}:** ${isModEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"} • \`${punishment}\``;
  });

  const content = `**⚙️ Current Modules Configuration:**\n${rows.join("\n")}\n\n💡 *Select any module from the dropdown below to toggle it instantly.*`;
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

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAutomodNavMenu("modules")));
  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SECURITY PRESETS HUB VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodPresetsView(config, guild) {
  const container = new ContainerBuilder();

  const headerText =
    `### ⚡ **AutoMod Security Presets Hub**\n` +
    `-# 1-click pre-configured rule matrices optimized for different community safety requirements.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const currentPreset = config.activePreset ? config.activePreset.toUpperCase() : "CUSTOM";

  const content =
    `**🛡️ Available AutoMod Presets:**\n\n` +
    `🔒 **Strict Preset (Maximum Defense)** ${currentPreset === "STRICT" ? "🟢 `[ACTIVE]`" : ""}\n` +
    `> • Enables **all 14 modules** with aggressive zero-tolerance filtering\n` +
    `> • Filters: Invites, Links, Spam, Caps, Mentions, Emojis, Bad Words, Zalgo, Toxicity\n\n` +
    `⚖️ **Moderate Preset (Recommended)** ${currentPreset === "MODERATE" ? "🟢 `[ACTIVE]`" : ""}\n` +
    `> • Balanced protection for active community servers without false positives\n` +
    `> • Filters: Invites, Links, Rapid Spam, Mass Mentions, Bad Words, @everyone\n\n` +
    `🪶 **Light Preset (Essential Only)** ${currentPreset === "LIGHT" ? "🟢 `[ACTIVE]`" : ""}\n` +
    `> • Minimal baseline protection keeping chat open and friendly\n` +
    `> • Filters: Discord Invites, @everyone Mentions, Extreme Message Spam\n\n` +
    `💡 *Click a button below to apply any preset immediately.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const strictBtn = new ButtonBuilder()
    .setCustomId("automod_preset_strict")
    .setLabel("Apply Strict Preset")
    .setEmoji("🔒")
    .setStyle(currentPreset === "STRICT" ? ButtonStyle.Success : ButtonStyle.Primary);

  const modBtn = new ButtonBuilder()
    .setCustomId("automod_preset_moderate")
    .setLabel("Apply Moderate Preset")
    .setEmoji("⚖️")
    .setStyle(currentPreset === "MODERATE" ? ButtonStyle.Success : ButtonStyle.Primary);

  const lightBtn = new ButtonBuilder()
    .setCustomId("automod_preset_light")
    .setLabel("Apply Light Preset")
    .setEmoji("🪶")
    .setStyle(currentPreset === "LIGHT" ? ButtonStyle.Success : ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(strictBtn, modBtn, lightBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAutomodNavMenu("presets")));
  container.addActionRowComponents(btnRow);

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
    `### 🤬 **Bad Words & Blacklist Directory**\n` +
    `-# Custom keyword & phrase blacklist automatically deleted upon message send.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const wordsList =
    words.length > 0
      ? words.map((w, i) => `> \`${i + 1}.\` ||${w}||`).join("\n")
      : "> *No custom banned words configured yet.*";

  const content =
    `**⚙️ Bad Words Filter Status:**\n` +
    `> • 🤬 **Module Status:** ${isEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
    `> • 📊 **Total Banned Words:** \`${words.length}\` words\n\n` +
    `**📋 Blacklist Directory:**\n${wordsList}\n\n` +
    `💡 *Command Syntax:* \`automod badwords add <word>\` • \`automod badwords remove <word>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const toggleBwBtn = new ButtonBuilder()
    .setCustomId("automod_toggle_badwords")
    .setLabel(isEnabled ? "Disable Filter" : "Enable Filter")
    .setEmoji("🤬")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const clearBwBtn = new ButtonBuilder()
    .setCustomId("automod_clear_badwords")
    .setLabel("Clear All Words")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(words.length === 0);

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleBwBtn, clearBwBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAutomodNavMenu("badwords")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. IGNORE RULES & WHITELIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodIgnoreView(config, guild) {
  const container = new ContainerBuilder();
  const ign = config.ignore || { channels: [], roles: [], users: [] };

  const headerText =
    `### 🚫 **AutoMod Ignore Rules & Bypasses**\n` +
    `-# Exclude designated text channels, staff roles, and users from AutoMod filtering.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const chansText = ign.channels?.length > 0 ? ign.channels.map((id) => `<#${id}>`).join(", ") : "*None*";
  const rolesText = ign.roles?.length > 0 ? ign.roles.map((id) => `<@&${id}>`).join(", ") : "*None*";
  const usersText = ign.users?.length > 0 ? ign.users.map((id) => `<@${id}>`).join(", ") : "*None*";

  const content =
    `**🚫 Current Bypass Rules:**\n` +
    `> • 📜 **Ignored Channels (${ign.channels?.length || 0}):** ${chansText}\n` +
    `> • 🎭 **Ignored Roles (${ign.roles?.length || 0}):** ${rolesText}\n` +
    `> • 👤 **Ignored Users (${ign.users?.length || 0}):** ${usersText}\n\n` +
    `💡 *To whitelist a user across all security systems, use \`.whitelist add @user\`.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAutomodNavMenu("ignore")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. AUDIT LOGGING CHANNEL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodLogsView(config, guild) {
  const container = new ContainerBuilder();
  const currentChan = config.logChannel ? `<#${config.logChannel}>` : "*None (Select below)*";

  const headerText =
    `### 📜 **AutoMod Audit Logging Channel**\n` +
    `-# Select the text channel where automated chat moderation violations and strike alerts are broadcast.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**📋 Logging Configuration:**\n` +
    `> • 📜 **Current Channel:** ${currentChan}\n` +
    `> • ⚡ **Alert Frequency:** Real-time (<0.1s message analysis)\n` +
    `> • 🚨 **Dispatched Events:** Message Deletions, Timeout Warnings, Strikes Issued`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("automod_logs_select_channel")
    .setPlaceholder("📜 Select channel for AutoMod alerts...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(channelMenu);

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

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAutomodNavMenu("logs")));
  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMMAND MANUAL & QUICK GUIDE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAutomodCommandsManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **AutoMod Command Manual**\n` +
    `-# Complete reference guide for all AutoMod commands, subcommands, and quick toggles.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `🤖 **Master Commands**\n` +
    `> • \`automod\` / \`automodstatus\` — Open interactive AutoMod Control Center\n` +
    `> • \`automodenable\` — Turn on master AutoMod protection system\n` +
    `> • \`automoddisable\` — Turn off master AutoMod protection system\n` +
    `> • \`automod preset <strict|moderate|light>\` — Apply safety preset\n\n` +
    `⚡ **Quick Filter Toggles**\n` +
    `> • \`antispam [enable|disable]\` / \`antispamenable\` / \`antispamdisable\` — Rapid message spam filter\n` +
    `> • \`antilink [enable|disable]\` / \`antilinkenable\` / \`antilinkdisable\` — Web link & URL block\n` +
    `> • \`anticaps [enable|disable]\` — Excessive uppercase capital letter filter\n\n` +
    `🤬 **Bad Words Management**\n` +
    `> • \`automod badwords add <word>\` — Add word to blacklist\n` +
    `> • \`automod badwords remove <word>\` — Remove word from blacklist\n` +
    `> • \`automod badwords list\` — Display all banned words\n\n` +
    `> **Aliases:** \`automod\`, \`am\` • \`antispam\`, \`spamfilter\` • \`antilink\`, \`linkblock\` • \`anticaps\`, \`capsfilter\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("automod_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAutomodNavMenu("commands")));
  container.addActionRowComponents(btnRow);

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
  buildAutomodContainer,
  handleAutomodInteraction,
};
