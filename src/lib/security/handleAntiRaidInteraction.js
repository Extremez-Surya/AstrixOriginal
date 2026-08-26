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
    `### 🛡️ **Astrix Anti-Raid • Defense Center**\n` +
    `-# Real-time network defense & join-flood quarantine for **${guild?.name || "Your Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const massjoinStatus = config.enabled && config.massjoin?.enabled ? "🟢 `ON`" : "🔴 `OFF`";
  const namefilterStatus = config.enabled && config.namefilter?.enabled ? "🟢 `ON`" : "🔴 `OFF`";
  const newaccStatus = config.enabled && config.newaccounts?.enabled ? "🟢 `ON`" : "🔴 `OFF`";
  const logChan = config.logChannel ? `<#${config.logChannel}>` : "*None*";
  const whitelistCount = (config.whitelist || []).length;

  const telemetryText =
    `> **Shield Status:** ${isEnabled ? "🟢 `ARMED & ACTIVE`" : "🔴 `OFFLINE & DISABLED`"} • **Raid Mode:** ${config.raidState ? "🚨 `LOCKDOWN`" : "🟢 `NORMAL`"}\n` +
    `> **Join Defense:** \`⚡ Mass Join\` ${massjoinStatus} • \`📛 Name Filter\` ${namefilterStatus} • \`👶 Age Gate\` ${newaccStatus}\n` +
    `> **Telemetry:** \`${config.stats?.blockedCount || 0}\` raiders blocked • \`${whitelistCount}\` whitelisted • Log: ${logChan}\n\n` +
    `-# Select an action below or switch dashboard using the navigation menu.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 1. Quick Actions Dropdown
  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("antiraid_overview_select_action")
    .setPlaceholder("⚡ Anti-Raid Actions & Fast Controls...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(isEnabled ? "Deactivate Anti-Raid Shield" : "Activate Anti-Raid Shield")
        .setValue("action_toggle_master")
        .setDescription(isEnabled ? "Disables real-time join interception" : "Enables real-time 24/7 join protection")
        .setEmoji(isEnabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel(config.raidState ? "Lift Emergency Raid Lockdown" : "Trigger Emergency Raid Lockdown")
        .setValue("action_toggle_raidmode")
        .setDescription(config.raidState ? "Restores normal server access" : "Immediately kicks/bans joining raiders")
        .setEmoji(config.raidState ? "🟢" : "🚨"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Mass Join & Velocity Limits")
        .setValue("nav_massjoin")
        .setDescription("Configure burst thresholds and auto-lockdown rules")
        .setEmoji("⚡"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Name & Username Pattern Filter")
        .setValue("nav_namefilter")
        .setDescription("Filter raid-bot usernames and spam patterns")
        .setEmoji("📛"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Avatar & Account Age Gate")
        .setValue("nav_filters")
        .setDescription("Filter default avatars and brand-new accounts")
        .setEmoji("🖼️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Whitelist Operators Directory")
        .setValue("nav_whitelist")
        .setDescription("Manage trusted users immune to join filters")
        .setEmoji("📋"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Audit Log Channel")
        .setValue("nav_logs")
        .setDescription("Configure log channel for raid alerts")
        .setEmoji("📜")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);

  // 2. Global Navigation Dropdown
  const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("overview"));

  // 3. Minimal 3-button control row
  const refreshBtn = new ButtonBuilder()
    .setCustomId("antiraid_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(refreshBtn, cpBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Anti-Raid Guard`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MASS JOIN & VELOCITY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidMassJoinView(config, guild) {
  const container = new ContainerBuilder();
  const mj = config.massjoin || { enabled: false, threshold: 5, action: "kick", lockChannels: false };

  const headerText =
    `### ⚡ **Anti-Raid • Mass Join Defense**\n` +
    `-# Intercepts rapid bot waves in rolling 10-second join windows for **${guild?.name || "Your Server"}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isEnabled = config.enabled && mj.enabled;
  const content =
    `> **Module Status:** ${isEnabled ? "🟢 `ARMED & ACTIVE`" : "🔴 `DISABLED`"} • **Threshold:** \`${mj.threshold || 5} joins / 10s\`\n` +
    `> **Enforcement Action:** \`${(mj.action || "kick").toUpperCase()}\` • **Auto-Lockdown:** ${mj.lockChannels ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n\n` +
    `-# Select an action below to toggle status, adjust punishment or auto-lockdown.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("antiraid_massjoin_select_action")
    .setPlaceholder("⚡ Mass Join Actions (Toggle / Action / Lockdown)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(mj.enabled ? "Disable Mass Join Defense" : "Enable Mass Join Defense")
        .setValue("action_toggle_mj")
        .setDescription("Toggles 10s burst join gatekeeper")
        .setEmoji(mj.enabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel(mj.lockChannels ? "Disable Auto-Channel Lockdown" : "Enable Auto-Channel Lockdown")
        .setValue("action_toggle_lock")
        .setDescription("Automatically locks text channels during sudden join waves")
        .setEmoji("🔒"),
      new StringSelectMenuOptionBuilder()
        .setLabel(`Switch Action to ${mj.action === "ban" ? "KICK" : "BAN"}`)
        .setValue("action_toggle_action")
        .setDescription(`Currently set to ${(mj.action || "kick").toUpperCase()}`)
        .setEmoji("⚖️")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("massjoin"));

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

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Join Velocity Defense`));

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
    `### 📛 **Anti-Raid • Name & Pattern Filter**\n` +
    `-# Scans usernames of joining members and executes instant punishment on matches`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const patternsFormatted =
    patterns.length > 0
      ? patterns.map((p) => `\`${p}\``).join(", ")
      : "*No patterns configured*";

  const isEnabled = config.enabled && nf.enabled;
  const content =
    `> **Module Status:** ${isEnabled ? "🟢 \`ARMED & ACTIVE\`" : "🔴 \`DISABLED\`"} • **Action:** \`${(nf.action || "ban").toUpperCase()}\`\n` +
    `> **Active Patterns (${patterns.length}):** ${patternsFormatted}\n\n` +
    `-# Add or remove custom patterns via \`antiraid namefilter --add <text>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("antiraid_namefilter_select_action")
    .setPlaceholder("📛 Name Filter Actions (Toggle / Action)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(nf.enabled ? "Disable Name Filter" : "Enable Name Filter")
        .setValue("action_toggle_nf")
        .setDescription("Toggles username pattern filtering on join")
        .setEmoji(nf.enabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel(`Switch Action to ${nf.action === "ban" ? "KICK" : "BAN"}`)
        .setValue("action_toggle_action")
        .setDescription(`Currently set to ${(nf.action || "ban").toUpperCase()}`)
        .setEmoji("⚖️")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("namefilter"));

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

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Name Pattern Filter`));

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
    `### 🖼️ **Anti-Raid • Avatar & Age Gate Filters**\n` +
    `-# Automatically weeds out fresh raid accounts and default discord avatars`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const isAvEnabled = config.enabled && av.enabled;
  const isNaEnabled = config.enabled && na.enabled;

  const content =
    `> **Default Avatar Filter:** ${isAvEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"} • Action: \`${(av.action || "kick").toUpperCase()}\`\n` +
    `> **Young Account Age Gate:** ${isNaEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"} • Threshold: \`< ${na.threshold || 7} Days\` (\`${(na.action || "kick").toUpperCase()}\`)\n\n` +
    `-# Select an action below to toggle avatar check or young account filter.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("antiraid_filters_select_action")
    .setPlaceholder("🖼️ Filter Actions (Avatar / Age Gate)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(av.enabled ? "Disable Default Avatar Filter" : "Enable Default Avatar Filter")
        .setValue("action_toggle_avatar")
        .setDescription("Filter joining users without custom avatars")
        .setEmoji("🖼️"),
      new StringSelectMenuOptionBuilder()
        .setLabel(na.enabled ? "Disable Account Age Gate" : "Enable Account Age Gate")
        .setValue("action_toggle_newacc")
        .setDescription("Filter accounts younger than configured threshold")
        .setEmoji("👶")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("filters"));

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

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Gate Filters`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. WHITELIST DIRECTORY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidWhitelistView(config, guild, subTab = "main") {
  const container = new ContainerBuilder();
  const wl = config.whitelist || [];

  const headerText =
    `### 📋 **Anti-Raid • Whitelist Hub**\n` +
    `-# Whitelisted users completely bypass avatar, account age, and name filters`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const formattedWl =
    wl.length > 0
      ? wl.map((id) => `<@${id}>`).join(", ")
      : "*No whitelisted users registered*";

  const content =
    `> **🛡️ Whitelisted Operators (${wl.length}):** ${formattedWl}\n` +
    `> **Immunity Scope:** Whitelisted users will never be kicked or banned by anti-raid join gates.\n\n` +
    `-# Select an action below to add, remove, or clear whitelisted operators.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (subTab === "add") {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId("antiraid_wl_do_add_user")
      .setPlaceholder("➕ Select a user to add to Anti-Raid Whitelist...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(userMenu));
  } else if (subTab === "remove" && wl.length > 0) {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId("antiraid_wl_do_remove_user")
      .setPlaceholder("➖ Select a user to remove from Anti-Raid Whitelist...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(userMenu));
  }

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("antiraid_wl_select_action")
    .setPlaceholder("⚡ Whitelist Actions (Add / Remove / Clear)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Add User to Whitelist")
        .setValue("action_add")
        .setDescription("Register a trusted user to bypass raid filters")
        .setEmoji("➕")
        .setDefault(subTab === "add"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Remove User from Whitelist")
        .setValue("action_remove")
        .setDescription("Revoke whitelist immunity from a user")
        .setEmoji("➖")
        .setDefault(subTab === "remove"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Reset All Anti-Raid Whitelists")
        .setValue("action_reset")
        .setDescription("Clear all registered whitelisted users")
        .setEmoji("🧹")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("whitelist"));

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

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Whitelist Hub`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. AUDIT LOGGING CHANNEL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidLogsView(config, guild) {
  const container = new ContainerBuilder();
  const currentChan = config.logChannel ? `<#${config.logChannel}>` : "*None configured*";

  const headerText =
    `### 📜 **Anti-Raid • Audit Logging Channel**\n` +
    `-# Channel where raid alerts, mass join triggers, and blocks are broadcast`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Current Log Channel:** ${currentChan}\n` +
    `> **Event Dispatch:** Real-time (<0.1s) alerts for Mass Joins, Raid Mode and Member Blocks.\n\n` +
    `-# Select a text channel below to configure or update logging.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("antiraid_logs_select_channel")
    .setPlaceholder("📜 Select text channel for Anti-Raid alerts...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(channelMenu);
  const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("logs"));

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

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Audit Logs`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMMAND MANUAL & QUICK GUIDE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildAntiraidCommandsManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **Anti-Raid • Command Manual**\n` +
    `-# Quick reference for all Anti-Raid commands, subcommands, and flags`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**🛡️ Core Commands**\n` +
    `> • \`antiraid\` — Open interactive Anti-Raid Control Center\n` +
    `> • \`antiraid enable / disable\` — Toggle master protection\n\n` +
    `**🚨 Emergency Lockdown**\n` +
    `> • \`raidmode on / off\` — Emergency join freeze (bans raiders)\n` +
    `> • \`raidlock / raidunlock\` — Global public channel lockdown\n` +
    `> • \`raidwipe <time> <ban|kick>\` — Mass purge recent raiders\n\n` +
    `**⚡ Module Settings & Whitelist**\n` +
    `> • \`antiraid massjoin on/off --limit <n> --do <ban|kick>\`\n` +
    `> • \`antiraid namefilter on/off --add <pattern> --do <ban|kick>\`\n` +
    `> • \`antiraid whitelist add/remove <@user>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("antiraid_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("commands"));
  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Documentation`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SERVER LOCKDOWN / UNLOCK VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildRaidLockContainer({ isLocked, count = 0, reason = "", executorTag = "" }) {
  const container = new ContainerBuilder();

  if (isLocked) {
    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔒 **Anti-Raid • Server Lockdown Executed**\n` +
            `-# Sending messages has been locked across public text channels for @everyone\n\n` +
            `> **Channels Locked:** \`${count}\` text channel(s)\n` +
            `> **Lockdown Reason:** \`${reason || "Emergency server lockdown"}\`\n\n` +
            `-# Click 'Unlock Server' below to restore normal channel communication.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      );

    const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("overview"));

    const unlockBtn = new ButtonBuilder()
      .setCustomId("antiraid_action_do_unlock")
      .setLabel("Unlock Server")
      .setEmoji("🔓")
      .setStyle(ButtonStyle.Success);

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

    const btnRow = new ActionRowBuilder().addComponents(unlockBtn, cpBtn, refreshBtn);

    container.addActionRowComponents(navRow);
    container.addActionRowComponents(btnRow);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${executorTag ? `Executed by ${executorTag} • ` : ""}ASTRIXCODE™ Security • Emergency Lockdown`)
    );
  } else {
    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔓 **Anti-Raid • Server Lockdown Lifted**\n` +
            `-# Sending messages permissions restored for @everyone across text channels\n\n` +
            `> **Channels Unlocked:** \`${count}\` text channel(s)\n` +
            `> **Server Status:** Normal public channel communication restored.\n\n` +
            `-# Click 'Lockdown Server' below to re-lock channels if a raid resumes.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      );

    const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("overview"));

    const lockBtn = new ButtonBuilder()
      .setCustomId("antiraid_action_do_lockdown")
      .setLabel("Lockdown Server")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger);

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

    const btnRow = new ActionRowBuilder().addComponents(lockBtn, cpBtn, refreshBtn);

    container.addActionRowComponents(navRow);
    container.addActionRowComponents(btnRow);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${executorTag ? `Executed by ${executorTag} • ` : ""}ASTRIXCODE™ Security • Emergency Lockdown`)
    );
  }

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SERVER LOCKDOWN / UNLOCK VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildRaidLockContainer({ isLocked, count = 0, reason = "", executorTag = "" }) {
  const container = new ContainerBuilder();

  if (isLocked) {
    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔒 **Anti-Raid • Server Lockdown Executed**\n` +
            `-# Sending messages has been locked across public text channels for @everyone\n\n` +
            `> **Channels Locked:** \`${count}\` text channel(s)\n` +
            `> **Lockdown Reason:** \`${reason || "Emergency server lockdown"}\`\n\n` +
            `-# Click 'Unlock Server' below to restore normal channel communication.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      );

    const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("overview"));

    const unlockBtn = new ButtonBuilder()
      .setCustomId("antiraid_action_do_unlock")
      .setLabel("Unlock Server")
      .setEmoji("🔓")
      .setStyle(ButtonStyle.Success);

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

    const btnRow = new ActionRowBuilder().addComponents(unlockBtn, cpBtn, refreshBtn);

    container.addActionRowComponents(navRow);
    container.addActionRowComponents(btnRow);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${executorTag ? `Executed by ${executorTag} • ` : ""}ASTRIXCODE™ Security • Emergency Lockdown`)
    );
  } else {
    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔓 **Anti-Raid • Server Lockdown Lifted**\n` +
            `-# Sending messages permissions restored for @everyone across text channels\n\n` +
            `> **Channels Unlocked:** \`${count}\` text channel(s)\n` +
            `> **Server Status:** Normal public channel communication restored.\n\n` +
            `-# Click 'Lockdown Server' below to re-lock channels if a raid resumes.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      );

    const navRow = new ActionRowBuilder().addComponents(buildAntiraidNavMenu("overview"));

    const lockBtn = new ButtonBuilder()
      .setCustomId("antiraid_action_do_lockdown")
      .setLabel("Lockdown Server")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger);

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

    const btnRow = new ActionRowBuilder().addComponents(lockBtn, cpBtn, refreshBtn);

    container.addActionRowComponents(navRow);
    container.addActionRowComponents(btnRow);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${executorTag ? `Executed by ${executorTag} • ` : ""}ASTRIXCODE™ Security • Emergency Protocol`)
    );
  }

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

  // 1.1 Overview Action Select Menu
  if (isMenu && customId === "antiraid_overview_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle_master") {
      antiraidManager.toggleMaster(guildId);
      const freshConfig = antiraidManager.getGuildAntiraid(guildId);
      const updated = buildAntiraidContainer(freshConfig, guild, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val === "action_toggle_raidmode") {
      config.raidState = !config.raidState;
      if (config.raidState) antiraidManager.incrementStats(guildId, "raidsDetected");
      antiraidManager.setGuildAntiraid(guildId, config);
      const updated = buildAntiraidContainer(config, guild, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val.startsWith("nav_")) {
      const targetTab = val.replace("nav_", "");
      const updated = buildAntiraidContainer(config, guild, targetTab);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // 1.2 Mass Join Action Select Menu
  if (isMenu && customId === "antiraid_massjoin_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle_mj") {
      antiraidManager.toggleSubmodule(guildId, "massjoin");
    } else if (val === "action_toggle_lock") {
      config.massjoin.lockChannels = !config.massjoin.lockChannels;
      antiraidManager.setGuildAntiraid(guildId, config);
    } else if (val === "action_toggle_action") {
      config.massjoin.action = config.massjoin.action === "ban" ? "kick" : "ban";
      antiraidManager.setGuildAntiraid(guildId, config);
    }
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "massjoin");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.3 Name Filter Action Select Menu
  if (isMenu && customId === "antiraid_namefilter_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle_nf") {
      antiraidManager.toggleSubmodule(guildId, "namefilter");
    } else if (val === "action_toggle_action") {
      if (!config.namefilter) config.namefilter = { enabled: false, action: "ban", patterns: [] };
      config.namefilter.action = config.namefilter.action === "ban" ? "kick" : "ban";
      antiraidManager.setGuildAntiraid(guildId, config);
    }
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "namefilter");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.4 Filters Action Select Menu
  if (isMenu && customId === "antiraid_filters_select_action") {
    const val = interaction.values[0];
    if (val === "action_toggle_avatar") {
      antiraidManager.toggleSubmodule(guildId, "avatar");
    } else if (val === "action_toggle_newacc") {
      antiraidManager.toggleSubmodule(guildId, "newaccounts");
    }
    const freshConfig = antiraidManager.getGuildAntiraid(guildId);
    const updated = buildAntiraidContainer(freshConfig, guild, "filters");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.5 Whitelist Action Select Menu
  if (isMenu && customId === "antiraid_wl_select_action") {
    const val = interaction.values[0];
    if (val === "action_add") {
      const updated = buildAntiraidContainer(config, guild, "whitelist", "add");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val === "action_remove") {
      const updated = buildAntiraidContainer(config, guild, "whitelist", "remove");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (val === "action_reset") {
      antiraidManager.clearWhitelist(guildId);
      const freshConfig = antiraidManager.getGuildAntiraid(guildId);
      const updated = buildAntiraidContainer(freshConfig, guild, "whitelist", "main");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
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

  if (isMenu && customId === "antiraid_raidwipe_select_preset") {
    const val = interaction.values[0];
    let durationMs = 5 * 60 * 1000;
    let action = "ban";
    if (val === "preset_1m_ban") { durationMs = 60 * 1000; action = "ban"; }
    else if (val === "preset_5m_ban") { durationMs = 5 * 60 * 1000; action = "ban"; }
    else if (val === "preset_10m_ban") { durationMs = 10 * 60 * 1000; action = "ban"; }
    else if (val === "preset_5m_kick") { durationMs = 5 * 60 * 1000; action = "kick"; }
    else if (val === "preset_15m_kick") { durationMs = 15 * 60 * 1000; action = "kick"; }

    const cutoff = Date.now() - durationMs;
    await interaction.guild.members.fetch().catch(() => null);
    const filtered = interaction.guild.members.cache.filter(
      (m) => m.joinedTimestamp && m.joinedTimestamp >= cutoff && m.id !== interaction.user.id && !m.user.bot
    );

    if (filtered.size === 0) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ℹ️ **No Matching Raiders Found**\n` +
            `-# No members joined within the selected time window.`
          )
        );
      await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    const sessionId = `raidwipe_confirm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (!client.raidwipeConfirmations) client.raidwipeConfirmations = new Map();
    client.raidwipeConfirmations.set(sessionId, {
      authorId: interaction.user.id,
      action,
      reason: `Rapid Raidwipe Preset by ${interaction.user.tag}`,
      toProcessIds: Array.from(filtered.keys()),
    });

    const confirmContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ **Confirm Rapid Raidwipe Purge**\n\n` +
          `> • **Target Count:** \`${filtered.size}\` member(s)\n` +
          `> • **Action:** \`${action.toUpperCase()}\` (Messages Cleared)\n\n` +
          `Are you sure you want to execute this mass purge?`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    const confirmBtn = new ButtonBuilder()
      .setCustomId(sessionId)
      .setLabel(`Confirm ${action.toUpperCase()}`)
      .setStyle(ButtonStyle.Danger);

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`raidwipe_cancel_${Date.now()}`)
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    confirmContainer.addActionRowComponents(new ActionRowBuilder().addComponents(confirmBtn, cancelBtn));
    await interaction.update({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_action_do_lockdown") {
    await interaction.deferUpdate().catch(() => null);

    const textChannels = interaction.guild.channels.cache.filter(
      (c) =>
        c.type === ChannelType.GuildText &&
        c.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.SendMessages)
    );

    let lockedCount = 0;
    const promises = [];
    for (const [, channel] of textChannels) {
      promises.push(
        channel.permissionOverwrites
          .edit(
            interaction.guild.roles.everyone,
            { SendMessages: false },
            { reason: `Emergency lockdown invoked by ${interaction.user.tag}` }
          )
          .then(() => lockedCount++)
          .catch(() => null)
      );
    }
    await Promise.allSettled(promises);

    const updated = buildRaidLockContainer({
      isLocked: true,
      count: lockedCount,
      reason: `Emergency lockdown invoked by ${interaction.user.tag}`,
      executorTag: interaction.user.tag,
    });
    await interaction.editReply({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "antiraid_action_do_unlock") {
    await interaction.deferUpdate().catch(() => null);

    const textChannels = interaction.guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText
    );

    let unlockedCount = 0;
    const promises = [];
    for (const [, channel] of textChannels) {
      promises.push(
        channel.permissionOverwrites
          .edit(
            interaction.guild.roles.everyone,
            { SendMessages: null },
            { reason: `Emergency unlock invoked by ${interaction.user.tag}` }
          )
          .then(() => unlockedCount++)
          .catch(() => null)
      );
    }
    await Promise.allSettled(promises);

    const updated = buildRaidLockContainer({
      isLocked: false,
      count: unlockedCount,
      reason: "Server unlocked",
      executorTag: interaction.user.tag,
    });
    await interaction.editReply({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
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
  buildRaidLockContainer,
  buildAntiraidContainer,
  handleAntiRaidInteraction,
};
