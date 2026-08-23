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
  PermissionFlagsBits,
} = require("discord.js");
const antiraidManager = require("../antiraidManager");
const EMOJIS = require("../emojis");

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ANTI-RAID NAVIGATION DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidNavMenu(activeId = "overview") {
  return new StringSelectMenuBuilder()
    .setCustomId("antiraid_nav_menu")
    .setPlaceholder("🧭 Anti-Raid Navigation Hub...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Control Center & Overview")
        .setValue("antiraid_nav_overview")
        .setDescription("View real-time anti-raid telemetry, status, and summary")
        .setEmoji("🛡️")
        .setDefault(activeId === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Mass Join & Velocity Limits")
        .setValue("antiraid_nav_massjoin")
        .setDescription("Configure join-burst thresholds and auto-lockdown rules")
        .setEmoji("⚡")
        .setDefault(activeId === "massjoin"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Name & Username Pattern Filter")
        .setValue("antiraid_nav_namefilter")
        .setDescription("Filter raid-bot usernames and spam patterns")
        .setEmoji("📛")
        .setDefault(activeId === "namefilter"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Avatar & Account Age Filters")
        .setValue("antiraid_nav_filters")
        .setDescription("Filter default avatars and brand-new accounts")
        .setEmoji("🖼️")
        .setDefault(activeId === "filters"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Anti-Raid Whitelist Hub")
        .setValue("antiraid_nav_whitelist")
        .setDescription("Manage trusted users immune to join filters")
        .setEmoji("📋")
        .setDefault(activeId === "whitelist"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Audit Logging Channel")
        .setValue("antiraid_nav_logs")
        .setDescription("Configure text channel for anti-raid alert logs")
        .setEmoji("📜")
        .setDefault(activeId === "logs"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Syntax")
        .setValue("antiraid_nav_commands")
        .setDescription("Complete Anti-Raid command syntax and quick guide")
        .setEmoji("📖")
        .setDefault(activeId === "commands")
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MAIN CONTROL CENTER VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidOverviewView(config, guild) {
  const container = new ContainerBuilder();
  const isEnabled = Boolean(config.enabled);

  const headerText =
    `### 🛡️ **Astrix Anti-Raid System**\n` +
    `-# *Real-time network defense, join-flood interception & raid quarantine for **${guild?.name || "Your Server"}***`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const statusHeadline = isEnabled
    ? `### 🟢 **Status: Anti-Raid Active & Enforcing**\n> Real-time join gatekeeper is actively filtering raiders and self-bot floods.`
    : `### 🔴 **Status: Anti-Raid Disabled**\n> Incoming join protection is offline. Click **[ 🟢 Enable System ]** below to arm defense.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusHeadline));

  const raidStateText = config.raidState
    ? "🚨 `EMERGENCY RAID LOCKDOWN ACTIVE`"
    : "🟢 `NORMAL OPERATION`";

  const massjoinStatus = config.enabled && config.massjoin?.enabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const massjoinThreshold = `${config.massjoin?.threshold || 5} joins in 10s`;
  const massjoinAction = (config.massjoin?.action || "kick").toUpperCase();
  const lockStatus = config.enabled && config.massjoin?.lockChannels ? "🟢 `ACTIVE`" : "🔴 `OFF`";

  const namefilterStatus = config.enabled && config.namefilter?.enabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const namePatternsCount = (config.namefilter?.patterns || []).length;
  const nameAction = (config.namefilter?.action || "ban").toUpperCase();

  const avatarStatus = config.enabled && config.avatar?.enabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const avatarAction = (config.avatar?.action || "kick").toUpperCase();

  const newaccStatus = config.enabled && config.newaccounts?.enabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const newaccThreshold = `< ${config.newaccounts?.threshold || 7} Days`;
  const newaccAction = (config.newaccounts?.action || "kick").toUpperCase();

  const logChan = config.logChannel ? `<#${config.logChannel}>` : "*None (Select in Logs tab)*";
  const whitelistCount = (config.whitelist || []).length;

  const telemetryText =
    `**📊 Defense Telemetry:**\n` +
    `> • 🚨 **Raid Mode:** ${raidStateText}\n` +
    `> • ⚡ **Mass Join Limit:** ${massjoinStatus} (${massjoinThreshold} • \`${massjoinAction}\`)\n` +
    `> • 🔒 **Auto-Channel Lockdown:** ${lockStatus}\n` +
    `> • 📛 **Name & Pattern Filter:** ${namefilterStatus} (\`${namePatternsCount}\` patterns • \`${nameAction}\`)\n` +
    `> • 🖼️ **Default Avatar Filter:** ${avatarStatus} (\`${avatarAction}\`)\n` +
    `> • 👶 **Account Age Gate:** ${newaccStatus} (${newaccThreshold} • \`${newaccAction}\`)\n` +
    `> • 📜 **Log Channel:** ${logChan}\n` +
    `> • 👥 **Whitelisted Users:** \`${whitelistCount}\` immune operators\n` +
    `> • 📈 **Intercepted Stats:** \`${config.stats?.blockedCount || 0}\` raiders blocked • \`${config.stats?.raidsDetected || 0}\` raids intercepted`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("overview"));

  const toggleBtn = new ButtonBuilder()
    .setCustomId("antiraid_btn_toggle_master")
    .setLabel(isEnabled ? "Disable System" : "Enable System")
    .setEmoji(isEnabled ? "🔴" : "🟢")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const raidmodeBtn = new ButtonBuilder()
    .setCustomId("antiraid_btn_toggle_raidmode")
    .setLabel(config.raidState ? "Deactivate Raid Mode" : "Raid Lockdown")
    .setEmoji(config.raidState ? "🟢" : "🚨")
    .setStyle(config.raidState ? ButtonStyle.Success : ButtonStyle.Danger);

  const wlBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_whitelist")
    .setLabel("Whitelist")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("antiraid_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(toggleBtn, raidmodeBtn, wlBtn, refreshBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MASS JOIN & VELOCITY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidMassJoinView(config, guild) {
  const container = new ContainerBuilder();
  const mj = config.massjoin || { enabled: false, threshold: 5, action: "kick", lockChannels: false };

  const headerText =
    `### ⚡ **Mass Join & Join Velocity Defense**\n` +
    `-# Detects and blocks bot waves joining in rapid bursts within a 10-second rolling window.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isEnabled = config.enabled && mj.enabled;
  const content =
    `**⚙️ Mass Join Configuration:**\n` +
    `> • ⚡ **Module Status:** ${isEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
    `> • ⏱️ **Burst Rate Limit:** \`${mj.threshold || 5} joins per 10 seconds\`\n` +
    `> • ⚖️ **Punishment Action:** \`${(mj.action || "kick").toUpperCase()}\`\n` +
    `> • 🔒 **Auto-Channel Lockdown:** ${mj.lockChannels ? "🟢 `ENABLED` (Locks SendMessages for @everyone)" : "🔴 `DISABLED`"}\n\n` +
    `💡 *Command Syntax:* \`antiraid massjoin on/off --limit 5 --do ban/kick --lock true/false\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const toggleMjBtn = new ButtonBuilder()
    .setCustomId("antiraid_toggle_massjoin")
    .setLabel(mj.enabled ? "Disable Mass Join" : "Enable Mass Join")
    .setEmoji(mj.enabled ? "🔴" : "🟢")
    .setStyle(mj.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const toggleLockBtn = new ButtonBuilder()
    .setCustomId("antiraid_toggle_lockdown")
    .setLabel(mj.lockChannels ? "Disable Auto-Lock" : "Enable Auto-Lock")
    .setEmoji("🔒")
    .setStyle(mj.lockChannels ? ButtonStyle.Secondary : ButtonStyle.Primary);

  const toggleActionBtn = new ButtonBuilder()
    .setCustomId("antiraid_toggle_massjoin_action")
    .setLabel(`Action: ${(mj.action || "kick").toUpperCase()}`)
    .setEmoji("⚖️")
    .setStyle(ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleMjBtn, toggleLockBtn, toggleActionBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAntiraidNavMenu("massjoin")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. NAME & USERNAME PATTERN FILTER VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidNameFilterView(config, guild) {
  const container = new ContainerBuilder();
  const nf = config.namefilter || { enabled: false, action: "ban", patterns: [] };
  const patterns = nf.patterns || [];

  const headerText =
    `### 📛 **Name & Pattern Filter**\n` +
    `-# Scans usernames of joining members and executes instant punishment on matches.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const patternsList =
    patterns.length > 0
      ? patterns.map((p, i) => `> \`${i + 1}.\` \`${p}\``).join("\n")
      : "> *No patterns configured. Add patterns using \`antiraid namefilter --add <text>\`*";

  const isEnabled = config.enabled && nf.enabled;
  const content =
    `**⚙️ Name Filter Status:**\n` +
    `> • 📛 **Module Status:** ${isEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
    `> • ⚖️ **Punishment Action:** \`${(nf.action || "ban").toUpperCase()}\`\n\n` +
    `**📋 Active Regex / Name Patterns (${patterns.length}):**\n${patternsList}\n\n` +
    `💡 *Command Syntax:* \`antiraid namefilter on/off --add <pattern> --remove <pattern> --do ban/kick\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const toggleNfBtn = new ButtonBuilder()
    .setCustomId("antiraid_toggle_namefilter")
    .setLabel(nf.enabled ? "Disable Name Filter" : "Enable Name Filter")
    .setEmoji(nf.enabled ? "🔴" : "🟢")
    .setStyle(nf.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const toggleActionBtn = new ButtonBuilder()
    .setCustomId("antiraid_toggle_namefilter_action")
    .setLabel(`Action: ${(nf.action || "ban").toUpperCase()}`)
    .setEmoji("⚖️")
    .setStyle(ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleNfBtn, toggleActionBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAntiraidNavMenu("namefilter")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AVATAR & ACCOUNT AGE GATES VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidFiltersView(config, guild) {
  const container = new ContainerBuilder();
  const av = config.avatar || { enabled: false, action: "kick" };
  const na = config.newaccounts || { enabled: false, threshold: 7, action: "kick" };

  const headerText =
    `### 🖼️ **Avatar & Account Age Gate Filters**\n` +
    `-# Automatically weed out fresh raid accounts and default discord avatars.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isAvEnabled = config.enabled && av.enabled;
  const isNaEnabled = config.enabled && na.enabled;

  const content =
    `**🖼️ Default Avatar Filter:**\n` +
    `> • Status: ${isAvEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
    `> • Action: \`${(av.action || "kick").toUpperCase()}\` on joining with default avatar\n\n` +
    `**👶 Young Account Age Gate:**\n` +
    `> • Status: ${isNaEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
    `> • Threshold: Younger than \`${na.threshold || 7} Days\`\n` +
    `> • Action: \`${(na.action || "kick").toUpperCase()}\`\n\n` +
    `💡 *Command Syntax:* \`antiraid avatar on/off --do kick/ban\` • \`antiraid newaccounts on/off --age 7 --do kick/ban\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const toggleAvBtn = new ButtonBuilder()
    .setCustomId("antiraid_toggle_avatar")
    .setLabel(av.enabled ? "Disable Avatar Filter" : "Enable Avatar Filter")
    .setEmoji("🖼️")
    .setStyle(av.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const toggleNaBtn = new ButtonBuilder()
    .setCustomId("antiraid_toggle_newaccounts")
    .setLabel(na.enabled ? "Disable Age Gate" : "Enable Age Gate")
    .setEmoji("👶")
    .setStyle(na.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleAvBtn, toggleNaBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAntiraidNavMenu("filters")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. WHITELIST DIRECTORY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidWhitelistView(config, guild, subTab = "main") {
  const container = new ContainerBuilder();
  const wl = config.whitelist || [];

  const headerText =
    `### 📋 **Anti-Raid Whitelist Hub**\n` +
    `-# Whitelisted users completely bypass avatar, account age, and name filters.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const wlList =
    wl.length > 0
      ? wl.map((id, i) => `> \`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n")
      : "> *No users in whitelist yet. Use the selector below to add operators.*";

  const content =
    `**📋 Whitelisted Operators (${wl.length}):**\n${wlList}\n\n` +
    `💡 *Note: Whitelisted users will never be kicked or banned by anti-raid join gates.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (subTab === "add") {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId("antiraid_wl_do_add_user")
      .setPlaceholder("➕ Select a user to add to Anti-Raid Whitelist...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(userMenu));
  } else if (subTab === "remove") {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId("antiraid_wl_do_remove_user")
      .setPlaceholder("➖ Select a user to remove from Anti-Raid Whitelist...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(userMenu));
  }

  const addBtn = new ButtonBuilder()
    .setCustomId("antiraid_wl_tab_add")
    .setLabel("Add User")
    .setEmoji("➕")
    .setStyle(subTab === "add" ? ButtonStyle.Primary : ButtonStyle.Success);

  const removeBtn = new ButtonBuilder()
    .setCustomId("antiraid_wl_tab_remove")
    .setLabel("Remove User")
    .setEmoji("➖")
    .setStyle(subTab === "remove" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(wl.length === 0);

  const clearBtn = new ButtonBuilder()
    .setCustomId("antiraid_wl_clear_all")
    .setLabel("Clear Whitelist")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(wl.length === 0);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(addBtn, removeBtn, clearBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAntiraidNavMenu("whitelist")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. AUDIT LOGGING CHANNEL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidLogsView(config, guild) {
  const container = new ContainerBuilder();
  const currentChan = config.logChannel ? `<#${config.logChannel}>` : "*None (Select below)*";

  const headerText =
    `### 📜 **Anti-Raid Audit Logging Channel**\n` +
    `-# Select the text channel where raid alerts, mass join triggers, and blocks are broadcast.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**📋 Logging Configuration:**\n` +
    `> • 📜 **Current Channel:** ${currentChan}\n` +
    `> • ⚡ **Alert Frequency:** Real-time (<0.1s trigger dispatch)\n` +
    `> • 🚨 **Dispatched Events:** Mass Join bursts, Raid Mode status, Raider Kicks/Bans`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("antiraid_logs_select_channel")
    .setPlaceholder("📜 Select channel for Anti-Raid alerts...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(channelMenu);

  const disableBtn = new ButtonBuilder()
    .setCustomId("antiraid_logs_disable")
    .setLabel("Disable Log Channel")
    .setEmoji("🔕")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!config.logChannel);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(disableBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAntiraidNavMenu("logs")));
  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMMAND MANUAL & QUICK GUIDE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidCommandsManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **Anti-Raid Command Manual**\n` +
    `-# Complete reference guide for all Anti-Raid commands, subcommands, and flags.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `🛡️ **Core Anti-Raid Commands**\n` +
    `> • \`antiraid\` — Open interactive Anti-Raid Control Center\n` +
    `> • \`antiraid enable\` — Turn on master Anti-Raid system\n` +
    `> • \`antiraid disable\` — Turn off master Anti-Raid system\n` +
    `> • \`antiraid config\` — View current configuration & stats\n\n` +
    `🚨 **Emergency Raid Lockdown**\n` +
    `> • \`raidmode on / off\` — Toggle emergency join freeze (Bans incoming raiders)\n` +
    `> • \`raidlock [reason]\` — Lock SendMessages in all public text channels\n` +
    `> • \`raidunlock [reason]\` — Unlock SendMessages across all channels\n` +
    `> • \`raidwipe <time> <ban|kick> [reason]\` — Mass purge recent raiders (e.g. \`raidwipe 5m ban\`)\n\n` +
    `⚡ **Module Configurations**\n` +
    `> • \`antiraid massjoin on/off --limit <num> --do <ban|kick> --lock <true|false>\`\n` +
    `> • \`antiraid namefilter on/off --add <pattern> --remove <pattern> --do <ban|kick>\`\n` +
    `> • \`antiraid avatar on/off --do <ban|kick>\`\n` +
    `> • \`antiraid newaccounts on/off --age <days> --do <ban|kick>\`\n` +
    `> • \`antiraid setchannel #channel\` — Configure alert logging channel\n\n` +
    `📋 **Whitelist Management**\n` +
    `> • \`antiraid whitelist add <@user>\` — Whitelist a user\n` +
    `> • \`antiraid whitelist remove <@user>\` — Remove user from whitelist\n` +
    `> • \`antiraid whitelist show\` — Display whitelist directory\n` +
    `> • \`antiraid whitelist reset\` — Clear all whitelisted users\n\n` +
    `> **Aliases:** \`antiraid\`, \`raiddefense\`, \`raidguard\` • \`whitelist\`, \`wl\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildAntiraidNavMenu("commands")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE DISPATCHER FOR DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidContainer(config, guild, activeTab = "overview", subTab = "main") {
  switch (activeTab) {
    case "massjoin":
      return buildAntiraidMassJoinView(config, guild);
    case "namefilter":
      return buildAntiraidNameFilterView(config, guild);
    case "filters":
      return buildAntiraidFiltersView(config, guild);
    case "whitelist":
      return buildAntiraidWhitelistView(config, guild, subTab);
    case "logs":
      return buildAntiraidLogsView(config, guild);
    case "commands":
      return buildAntiraidCommandsManualView();
    case "overview":
    default:
      return buildAntiraidOverviewView(config, guild);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION ROUTER FOR ANTI-RAID
// ─────────────────────────────────────────────────────────────────────────────
async function handleAntiRaidInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isUserMenu = interaction.isUserSelectMenu();
  const isChanMenu = interaction.isChannelSelectMenu();

  if (!isBtn && !isMenu && !isUserMenu && !isChanMenu) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("antiraid_") && !customId.startsWith("raidwipe_")) {
    return false;
  }

  if (!interaction.guild) return false;

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** permissions to interact with Anti-Raid controls.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guild = interaction.guild;
  const guildId = guild.id;
  let config = antiraidManager.getGuildAntiraid(guildId);

  // 1. Navigation Menu Change
  if (isMenu && customId === "antiraid_nav_menu") {
    const selected = interaction.values[0];
    const targetTab = selected.replace("antiraid_nav_", "");
    const updated = buildAntiraidContainer(config, guild, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 2. Direct Navigation Buttons
  if (isBtn && customId.startsWith("antiraid_nav_")) {
    const targetTab = customId.replace("antiraid_nav_", "");
    const updated = buildAntiraidContainer(config, guild, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 3. Master Switch Toggle
  if (customId === "antiraid_btn_toggle_master" || customId === "antiraid_toggle") {
    antiraidManager.toggleMaster(guildId);
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 4. Raid Mode Toggle
  if (customId === "antiraid_btn_toggle_raidmode" || customId === "antiraid_raidmode_toggle") {
    config.raidState = !config.raidState;
    if (config.raidState) antiraidManager.incrementStats(guildId, "raidsDetected");
    antiraidManager.setGuildAntiraid(guildId, config);
    const updated = buildAntiraidContainer(config, guild, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 5. Refresh Button
  if (customId === "antiraid_btn_refresh" || customId === "antiraid_refresh") {
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 6. Mass Join Module Toggles
  if (customId === "antiraid_toggle_massjoin") {
    antiraidManager.toggleSubmodule(guildId, "massjoin");
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "massjoin");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_toggle_lockdown") {
    config.massjoin.lockChannels = !config.massjoin.lockChannels;
    antiraidManager.setGuildAntiraid(guildId, config);
    const updated = buildAntiraidContainer(config, guild, "massjoin");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_toggle_massjoin_action") {
    config.massjoin.action = config.massjoin.action === "ban" ? "kick" : "ban";
    antiraidManager.setGuildAntiraid(guildId, config);
    const updated = buildAntiraidContainer(config, guild, "massjoin");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 7. Name Filter Module Toggles
  if (customId === "antiraid_toggle_namefilter") {
    antiraidManager.toggleSubmodule(guildId, "namefilter");
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "namefilter");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_toggle_namefilter_action") {
    if (!config.namefilter) config.namefilter = { enabled: false, action: "ban", patterns: [] };
    config.namefilter.action = config.namefilter.action === "ban" ? "kick" : "ban";
    antiraidManager.setGuildAntiraid(guildId, config);
    const updated = buildAntiraidContainer(config, guild, "namefilter");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 8. Filters Tab Toggles (Avatar & New Accounts)
  if (customId === "antiraid_toggle_avatar") {
    antiraidManager.toggleSubmodule(guildId, "avatar");
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "filters");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_toggle_newaccounts") {
    antiraidManager.toggleSubmodule(guildId, "newaccounts");
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "filters");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 9. Whitelist Hub Actions
  if (customId === "antiraid_wl_tab_add") {
    const updated = buildAntiraidContainer(config, guild, "whitelist", "add");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_wl_tab_remove") {
    const updated = buildAntiraidContainer(config, guild, "whitelist", "remove");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isUserMenu && customId === "antiraid_wl_do_add_user") {
    const targetUserId = interaction.values[0];
    if (targetUserId) {
      antiraidManager.addWhitelist(guildId, targetUserId);
    }
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "whitelist", "main");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isUserMenu && customId === "antiraid_wl_do_remove_user") {
    const targetUserId = interaction.values[0];
    if (targetUserId) {
      antiraidManager.removeWhitelist(guildId, targetUserId);
    }
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "whitelist", "main");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_wl_clear_all") {
    antiraidManager.clearWhitelist(guildId);
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "whitelist", "main");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 10. Log Channel Actions
  if (isChanMenu && customId === "antiraid_logs_select_channel") {
    const selectedChanId = interaction.values[0];
    if (selectedChanId) {
      antiraidManager.setLogChannel(guildId, selectedChanId);
    }
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "logs");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_logs_disable") {
    config.logChannel = null;
    antiraidManager.setGuildAntiraid(guildId, config);
    const updated = buildAntiraidContainer(config, guild, "logs");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 11. Raidwipe confirmation handlers
  if (customId.startsWith("raidwipe_confirm_")) {
    if (!client.raidwipeConfirmations || !client.raidwipeConfirmations.has(customId)) {
      await interaction
        .reply({
          content: "❌ Confirmation session expired or invalid.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    const session = client.raidwipeConfirmations.get(customId);
    if (interaction.user.id !== session.authorId) {
      await interaction
        .reply({
          content: "❌ Only the command invoker can confirm this action.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    client.raidwipeConfirmations.delete(customId);
    await interaction.deferUpdate().catch(() => null);

    const { action, reason, toProcessIds } = session;
    let successful = 0;
    let failed = 0;

    for (const memberId of toProcessIds) {
      try {
        const member = await guild.members.fetch(memberId).catch(() => null);
        if (!member) continue;

        if (action === "ban" && member.bannable) {
          await member.ban({ reason: `[RAIDWIPE HARDENED] ${reason}`, deleteMessageSeconds: 86400 });
          successful++;
        } else if (action === "kick" && member.kickable) {
          await member.kick(`[RAIDWIPE HARDENED] ${reason}`);
          successful++;
        } else {
          failed++;
        }
      } catch (_) {
        failed++;
      }
    }

    antiraidManager.incrementStats(guild.id, "blockedCount", successful);

    const summary = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.ticky_red || "✅"} **Raidwipe Mass Purge Complete**\n` +
            `> • **Action Executed:** \`${action.toUpperCase()}\` (Messages Cleared)\n` +
            `> • **Reason:** \`${reason}\` \n` +
            `> • **Members Intercepted:** \`${successful}\` member(s)\n` +
            `> • **Failed Removals:** \`${failed}\` member(s)`
        )
      );

    await interaction
      .editReply({
        components: [summary],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  if (customId.startsWith("raidwipe_cancel_")) {
    const cancelContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} **Raidwipe Aborted**\n` +
          `-# Mass member purge action was cancelled by the administrator.`
      )
    );
    await interaction
      .update({
        components: [cancelContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildAntiraidNavMenu,
  buildAntiraidOverviewView,
  buildAntiraidMassJoinView,
  buildAntiraidNameFilterView,
  buildAntiraidFiltersView,
  buildAntiraidWhitelistView,
  buildAntiraidLogsView,
  buildAntiraidCommandsManualView,
  buildAntiraidContainer,
  handleAntiRaidInteraction,
};
