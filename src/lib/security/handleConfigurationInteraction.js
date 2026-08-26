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
const configManager = require("../configManager");
const prefixManager = require("../prefixManager");
const noprefixManager = require("../noprefixManager");

function isAuthorized(client, member, guild) {
  if (!member || !guild) return false;
  if (member.id === guild.ownerId) return true;
  if (noprefixManager.isOwner(member.id, client)) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL CONFIGURATION NAVIGATION DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigNavMenu(activeId = "overview") {
  return new StringSelectMenuBuilder()
    .setCustomId("config_nav_menu")
    .setPlaceholder("🧭 Server Configuration Navigation Hub...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Configuration Control Center")
        .setValue("config_nav_overview")
        .setDescription("Main server settings, statistics, and active modules")
        .setEmoji("⚙️")
        .setDefault(activeId === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Auto-Responders Hub (Triggers)")
        .setValue("config_nav_triggers")
        .setDescription("Custom keyword phrases and automated response cards")
        .setEmoji("🤖")
        .setDefault(activeId === "triggers"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Auto-Reactions & Emojis")
        .setValue("config_nav_reactions")
        .setDescription("Keyword auto-emojis and channel-wide auto-reactors")
        .setEmoji("😀")
        .setDefault(activeId === "reactions"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Sticky Messages Engine")
        .setValue("config_nav_sticky")
        .setDescription("Dynamic announcements pinned automatically at bottom of chat")
        .setEmoji("📌")
        .setDefault(activeId === "sticky"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Server Prefix Settings")
        .setValue("config_nav_prefix")
        .setDescription("Configure custom command execution prefix for this server")
        .setEmoji("⚡")
        .setDefault(activeId === "prefix"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Placeholders")
        .setValue("config_nav_commands")
        .setDescription("Complete syntax reference and placeholder variables")
        .setEmoji("📖")
        .setDefault(activeId === "commands")
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MAIN OVERVIEW VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigOverviewView(guild) {
  const container = new ContainerBuilder();
  const config = configManager.getGuildConfig(guild.id);
  const currentPrefix = prefixManager.getPrefix(guild.id);

  const triggerCount = config.triggers?.length || 0;
  const reactCount = config.reactionTriggers?.length || 0;
  const channelReactCount = config.channelReactions?.length || 0;
  const stickyCount = config.stickyMessages?.length || 0;

  const headerText =
    `### ⚙️ **Astrix Server Configuration • Control Center**\n` +
    `-# Manage automated triggers, smart auto-reactions, sticky notices & server settings for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const telemetryText =
    `> **Triggers & Responders:** \`${triggerCount}\` active phrases • **Command Prefix:** \`${currentPrefix}\`\n` +
    `> **Auto-Reactions:** \`${reactCount}\` keyword triggers • \`${channelReactCount}\` channel auto-reactors\n` +
    `> **Sticky Notices:** \`${stickyCount}\` dynamic pinned messages\n\n` +
    `-# Select an action below or switch dashboard using the navigation menu.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 1. Quick Action Dropdown
  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("config_overview_select_action")
    .setPlaceholder("⚡ Server Configuration Actions & Hubs...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Auto-Responders Hub (Triggers)")
        .setValue("nav_triggers")
        .setDescription("Create or edit automated keyword response triggers")
        .setEmoji("🤖"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Auto-Reactions & Emojis")
        .setValue("nav_reactions")
        .setDescription("Configure keyword reactions & channel auto-emojis")
        .setEmoji("😀"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Sticky Messages Engine")
        .setValue("nav_sticky")
        .setDescription("Configure dynamic pinned notices at the bottom of chats")
        .setEmoji("📌"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Server Prefix Settings")
        .setValue("nav_prefix")
        .setDescription("Change or reset the command execution prefix")
        .setEmoji("⚡"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Placeholders")
        .setValue("nav_commands")
        .setDescription("View trigger syntax and dynamic variable tokens")
        .setEmoji("📖")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);

  // 2. Global Navigation Dropdown
  const navRow = new ActionRowBuilder().addComponents(buildConfigNavMenu("overview"));

  // 3. Minimal 3-button control row
  const refreshBtn = new ButtonBuilder()
    .setCustomId("config_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(refreshBtn, cpBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Server Configuration`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUTO-RESPONDERS (TRIGGERS) VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigTriggersView(guild) {
  const container = new ContainerBuilder();
  const config = configManager.getGuildConfig(guild.id);
  const triggers = config.triggers || [];

  const headerText =
    `### 🤖 **Server Config • Auto-Responders Hub**\n` +
    `-# Custom auto-responses that trigger strictly when the full message matches the keyword for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const formattedTriggers =
    triggers.length > 0
      ? triggers.slice(0, 5).map((t) => `\`${t.trigger}\` ➔ ${t.response.length > 35 ? t.response.slice(0, 32) + "..." : t.response}`).join("\n> • ")
      : "*No auto-responder triggers configured yet*";

  const content =
    `> **Active Triggers (${triggers.length}):**\n> • ${formattedTriggers}\n\n` +
    `-# Select an action below or create triggers via \`trigger add <phrase> | <response>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("config_triggers_select_action")
    .setPlaceholder("🤖 Trigger Actions (Create / Edit / Delete / Clear)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Create New Trigger")
        .setValue("action_add")
        .setDescription("Open modal to create a keyword response trigger")
        .setEmoji("➕"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Edit Existing Trigger")
        .setValue("action_edit")
        .setDescription("Open modal to modify a trigger's response")
        .setEmoji("✏️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Delete Specific Trigger")
        .setValue("action_delete")
        .setDescription("Open modal to remove a single trigger phrase")
        .setEmoji("🗑️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Clear All Triggers")
        .setValue("action_clear")
        .setDescription("Delete all active auto-responder triggers")
        .setEmoji("🧹")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildConfigNavMenu("triggers"));

  const customPrefixBtn = new ButtonBuilder()
    .setCustomId("config_btn_set_custom_prefix")
    .setLabel("Set Custom Prefix")
    .setEmoji("✏️")
    .setStyle(ButtonStyle.Primary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Secondary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("config_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(customPrefixBtn, cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Auto-Responders`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUTO-REACTIONS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigReactionsView(guild) {
  const container = new ContainerBuilder();
  const config = configManager.getGuildConfig(guild.id);
  const reactTriggers = config.reactionTriggers || [];
  const channelReactions = config.channelReactions || [];

  const headerText =
    `### 😀 **Server Config • Auto-Reactions Directory**\n` +
    `-# Automatically react with emojis upon matching keywords or on every message in designated channels`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const kwFormatted =
    reactTriggers.length > 0
      ? reactTriggers.slice(0, 5).map((rt) => `${rt.emoji} ➔ \`${rt.trigger}\``).join(", ")
      : "*None configured*";

  const chFormatted =
    channelReactions.length > 0
      ? channelReactions.map((cr) => `<#${cr.channelId}> ➔ ${cr.emojis?.join(" ")}`).join(", ")
      : "*None configured*";

  const content =
    `> **Keyword Auto-Reactors (${reactTriggers.length}):** ${kwFormatted}\n` +
    `> **Channel Auto-Reactors (${channelReactions.length}):** ${chFormatted}\n\n` +
    `-# Select an action below or use \`reaction add <emoji> <phrase>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("config_reactions_select_action")
    .setPlaceholder("😀 Auto-Reaction Actions (Add / Delete / Clear)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Add Keyword Reaction")
        .setValue("action_add_kw")
        .setDescription("Open modal to create a keyword auto-reactor")
        .setEmoji("➕"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Delete Keyword Reaction")
        .setValue("action_delete_kw")
        .setDescription("Open modal to delete a single keyword auto-reactor")
        .setEmoji("🗑️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Clear All Reactions")
        .setValue("action_clear")
        .setDescription("Delete all keyword and channel auto-reactors")
        .setEmoji("🧹")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildConfigNavMenu("reactions"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("config_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Auto-Reactions`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. STICKY MESSAGES HUB VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigStickyView(guild) {
  const container = new ContainerBuilder();
  const config = configManager.getGuildConfig(guild.id);
  const stickyList = config.stickyMessages || [];

  const headerText =
    `### 📌 **Server Config • Sticky Messages Engine**\n` +
    `-# Dynamic announcements or guidelines automatically pinned at the bottom of designated channels`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const stickyFormatted =
    stickyList.length > 0
      ? stickyList.map((s) => `<#${s.channelId}>: ${s.content.length > 35 ? s.content.slice(0, 32) + "..." : s.content}`).join("\n> • ")
      : "*No sticky messages active*";

  const content =
    `> **Active Sticky Notices (${stickyList.length}):**\n> • ${stickyFormatted}\n\n` +
    `-# Select a text channel below to configure or manage sticky messages.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("config_sticky_channel_select")
    .setPlaceholder("📌 Select channel to set or remove sticky message...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("config_sticky_select_action")
    .setPlaceholder("📌 Sticky Actions (Clear / Manage)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Clear All Sticky Messages")
        .setValue("action_clear_all")
        .setDescription("Remove sticky notices across all channels")
        .setEmoji("🧹")
    );

  const menuRow = new ActionRowBuilder().addComponents(channelMenu);
  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildConfigNavMenu("sticky"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("config_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Sticky Messages`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SERVER PREFIX SETTINGS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigPrefixView(guild) {
  const container = new ContainerBuilder();
  const currentPrefix = prefixManager.getPrefix(guild.id);

  const headerText =
    `### ⚡ **Server Config • Prefix Settings**\n` +
    `-# Set a customized prefix for invoking text commands in **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Current Prefix:** \`${currentPrefix}\` • **Default Bot Prefix:** \`.\`\n` +
    `> **Sample Commands:** \`${currentPrefix}help\` • \`${currentPrefix}antinuke\` • \`${currentPrefix}automod\`\n\n` +
    `-# Select a prefix preset below or apply custom prefix via \`.setprefix <prefix>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const prefixMenu = new StringSelectMenuBuilder()
    .setCustomId("config_prefix_select_action")
    .setPlaceholder("⚡ Select Prefix Preset or Set Custom...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Prefix to: . (Default)")
        .setValue("prefix_set_.")
        .setDescription("Standard dot command prefix")
        .setEmoji("📌"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Prefix to: !")
        .setValue("prefix_set_!")
        .setDescription("Exclamation command prefix")
        .setEmoji("⚡"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Prefix to: ?")
        .setValue("prefix_set_?")
        .setDescription("Question mark command prefix")
        .setEmoji("❓"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Prefix to: $")
        .setValue("prefix_set_$")
        .setDescription("Dollar symbol command prefix")
        .setEmoji("💵"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Prefix to: --")
        .setValue("prefix_set_--")
        .setDescription("Double dash command prefix")
        .setEmoji("➖"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Custom Prefix (Modal)")
        .setValue("prefix_custom_modal")
        .setDescription("Type a custom prefix up to 5 characters")
        .setEmoji("✏️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Reset to Bot Default")
        .setValue("prefix_reset")
        .setDescription("Clear custom prefix and use standard default")
        .setEmoji("🔄")
    );

  const menuRow = new ActionRowBuilder().addComponents(prefixMenu);
  const navRow = new ActionRowBuilder().addComponents(buildConfigNavMenu("prefix"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("config_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Prefix Config`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. COMMAND MANUAL & PLACEHOLDERS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigCommandsManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **Server Config • Command Manual & Variables**\n` +
    `-# Full command reference, syntax guides, and dynamic placeholder variables for triggers`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**🤖 Auto-Responders & Triggers**\n` +
    `> • \`trigger add <phrase> | <response>\` — Register auto-responder\n` +
    `> • \`trigger edit <phrase> | <new-resp>\` — Update auto-responder\n` +
    `> • \`trigger remove <phrase>\` — Delete auto-responder\n\n` +
    `**😀 Auto-Reactions & Emojis**\n` +
    `> • \`reaction add <emoji> <phrase>\` — Auto-react on keyword\n` +
    `> • \`reaction messages <#channel> <emojis...>\` — Auto-react in channel\n\n` +
    `**📌 Sticky Messages & Prefix**\n` +
    `> • \`sticky add <#channel> <message>\` — Pin dynamic announcement\n` +
    `> • \`setprefix <prefix>\` — Change server command prefix\n\n` +
    `**⚡ Dynamic Variables:** \`{user}\`, \`{user.name}\`, \`{server}\`, \`{membercount}\`, \`{channel}\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const navRow = new ActionRowBuilder().addComponents(buildConfigNavMenu("commands"));
  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Documentation`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. COMMAND MANUAL & PLACEHOLDERS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigCommandsManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **Server Configuration Manual & Variables**\n` +
    `-# Full command reference, syntax guides, and dynamic placeholder variables for triggers.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `🤖 **Auto-Responder Commands:**\n` +
    `> • \`.trigger add <phrase> | <response>\` — Add a new auto-responder\n` +
    `> • \`.trigger remove <phrase>\` — Remove an auto-responder\n` +
    `> • \`.trigger list\` — View all active triggers\n` +
    `> • \`.trigger clear\` — Clear all triggers\n\n` +
    `😀 **Auto-Reaction Commands:**\n` +
    `> • \`.reaction add <emoji> <phrase>\` — Add keyword auto-react\n` +
    `> • \`.reaction remove <phrase>\` — Remove keyword auto-react\n` +
    `> • \`.reaction messages <#channel> <emojis...>\` — Bind channel auto-emojis\n\n` +
    `📌 **Sticky Messages Commands:**\n` +
    `> • \`.sticky add <#channel> <message>\` — Pin dynamic sticky notice in channel\n` +
    `> • \`.sticky remove <#channel>\` — Remove sticky notice from channel\n` +
    `> • \`.sticky list\` — List all active sticky channels\n\n` +
    `✨ **Dynamic Placeholder Variables:**\n` +
    `> • \`{user}\` — <@user> mention • \`{user_name}\` — User username\n` +
    `> • \`{user_id}\` — User snowflake ID • \`{user_avatar}\` — Avatar URL\n` +
    `> • \`{server}\` — Server name • \`{server_members}\` — Total member count\n` +
    `> • \`{channel}\` — Channel mention • \`{time}\` / \`{date}\` / \`{timestamp}\`\n` +
    `> • \`{random:1,100}\` — Random number generator`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildConfigNavMenu("commands")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL CONTAINER DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigurationContainer(guild, activeTab = "overview") {
  switch (activeTab) {
    case "triggers":
      return buildConfigTriggersView(guild);
    case "reactions":
      return buildConfigReactionsView(guild);
    case "sticky":
      return buildConfigStickyView(guild);
    case "prefix":
      return buildConfigPrefixView(guild);
    case "commands":
      return buildConfigCommandsManualView();
    case "overview":
    default:
      return buildConfigOverviewView(guild);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION ROUTER FOR CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
async function handleConfigurationInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isChanMenu = interaction.isChannelSelectMenu();
  const isModalSubmit = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isChanMenu && !isModalSubmit) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("config_")) return false;

  if (!interaction.guild) return false;

  if (!isAuthorized(client, interaction.member, interaction.guild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** or **Administrator** permissions to configure server settings.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guild = interaction.guild;
  const guildId = guild.id;
  let config = configManager.getGuildConfig(guildId);

  // 1. Navigation Menu
  if (isMenu && customId === "config_nav_menu") {
    const selected = interaction.values[0];
    const targetTab = selected.replace("config_nav_", "");
    const updated = buildConfigurationContainer(guild, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.1 Overview Action Select
  if (isMenu && customId === "config_overview_select_action") {
    const targetTab = interaction.values[0].replace("nav_", "");
    const updated = buildConfigurationContainer(guild, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.2 Triggers Action Select
  if (isMenu && customId === "config_triggers_select_action") {
    const val = interaction.values[0];
    if (val === "action_add") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_submit_add_trigger")
        .setTitle("Create Auto-Responder Trigger");

      const phraseInput = new TextInputBuilder()
        .setCustomId("trig_phrase")
        .setLabel("Trigger Phrase (Exact Match)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. vanity, support, website, ip")
        .setRequired(true)
        .setMaxLength(100);

      const responseInput = new TextInputBuilder()
        .setCustomId("trig_response")
        .setLabel("Response Text (Placeholders supported)")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("e.g. Join discord.gg/astrix for cool perks!")
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(phraseInput),
        new ActionRowBuilder().addComponents(responseInput)
      );

      await interaction.showModal(modal).catch(() => null);
      return true;
    } else if (val === "action_edit") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_submit_edit_trigger")
        .setTitle("Edit Auto-Responder Trigger");

      const phraseInput = new TextInputBuilder()
        .setCustomId("trig_edit_phrase")
        .setLabel("Existing Trigger Phrase to Modify")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. vanity, support")
        .setRequired(true)
        .setMaxLength(100);

      const responseInput = new TextInputBuilder()
        .setCustomId("trig_edit_response")
        .setLabel("New Response Text")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Enter new updated response message...")
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(phraseInput),
        new ActionRowBuilder().addComponents(responseInput)
      );

      await interaction.showModal(modal).catch(() => null);
      return true;
    } else if (val === "action_delete") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_submit_delete_trigger")
        .setTitle("Delete Auto-Responder Trigger");

      const phraseInput = new TextInputBuilder()
        .setCustomId("trig_delete_phrase")
        .setLabel("Trigger Phrase to Remove")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. vanity, support")
        .setRequired(true)
        .setMaxLength(100);

      modal.addComponents(new ActionRowBuilder().addComponents(phraseInput));
      await interaction.showModal(modal).catch(() => null);
      return true;
    } else if (val === "action_clear") {
      config.triggers = [];
      configManager.setGuildConfig(guildId, config);
      const updated = buildConfigurationContainer(guild, "triggers");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // 1.3 Reactions Action Select
  if (isMenu && customId === "config_reactions_select_action") {
    const val = interaction.values[0];
    if (val === "action_add_kw") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_submit_add_reaction")
        .setTitle("Add Keyword Reaction");

      const emojiInput = new TextInputBuilder()
        .setCustomId("react_emoji")
        .setLabel("Emoji (Unicode or custom <:name:id>)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. 👍, ❤️, 🔥")
        .setRequired(true)
        .setMaxLength(50);

      const phraseInput = new TextInputBuilder()
        .setCustomId("react_phrase")
        .setLabel("Trigger Phrase")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. gg, welcome, astrix")
        .setRequired(true)
        .setMaxLength(100);

      modal.addComponents(
        new ActionRowBuilder().addComponents(emojiInput),
        new ActionRowBuilder().addComponents(phraseInput)
      );

      await interaction.showModal(modal).catch(() => null);
      return true;
    } else if (val === "action_delete_kw") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_submit_delete_reaction")
        .setTitle("Delete Keyword Reaction");

      const phraseInput = new TextInputBuilder()
        .setCustomId("react_delete_phrase")
        .setLabel("Keyword Phrase to Remove")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. gg, welcome")
        .setRequired(true)
        .setMaxLength(100);

      modal.addComponents(new ActionRowBuilder().addComponents(phraseInput));
      await interaction.showModal(modal).catch(() => null);
      return true;
    } else if (val === "action_clear") {
      config.reactionTriggers = [];
      config.channelReactions = [];
      configManager.setGuildConfig(guildId, config);
      const updated = buildConfigurationContainer(guild, "reactions");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // 1.4 Sticky Action Select
  if (isMenu && customId === "config_sticky_select_action") {
    const val = interaction.values[0];
    if (val === "action_clear_all") {
      configManager.clearStickyMessages(guildId);
      const updated = buildConfigurationContainer(guild, "sticky");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // 1.5 Prefix Action Select
  if (isMenu && customId === "config_prefix_select_action") {
    const val = interaction.values[0];
    if (val === "prefix_custom_modal") {
      const modal = new ModalBuilder()
        .setCustomId("config_modal_submit_custom_prefix")
        .setTitle("Set Custom Server Prefix");

      const prefixInput = new TextInputBuilder()
        .setCustomId("custom_prefix_text")
        .setLabel("Enter New Server Prefix (1-5 chars)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. +, ~, >>, *, !, $, .")
        .setRequired(true)
        .setMaxLength(5);

      modal.addComponents(new ActionRowBuilder().addComponents(prefixInput));
      await interaction.showModal(modal).catch(() => null);
      return true;
    } else if (val === "prefix_reset") {
      prefixManager.resetPrefix(guildId);
    } else if (val.startsWith("prefix_set_")) {
      const p = val.replace("prefix_set_", "");
      prefixManager.setPrefix(guildId, p);
    }
    const updated = buildConfigurationContainer(guild, "prefix");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 2. Direct Navigation Buttons
  if (isBtn && customId.startsWith("config_nav_")) {
    const targetTab = customId.replace("config_nav_", "");
    const updated = buildConfigurationContainer(guild, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 3. Clear Buttons
  if (customId === "config_clear_triggers") {
    config.triggers = [];
    configManager.setGuildConfig(guildId, config);
    const updated = buildConfigurationContainer(guild, "triggers");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "config_clear_reactions") {
    config.reactionTriggers = [];
    config.channelReactions = [];
    configManager.setGuildConfig(guildId, config);
    const updated = buildConfigurationContainer(guild, "reactions");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "config_clear_sticky") {
    configManager.clearStickyMessages(guildId);
    const updated = buildConfigurationContainer(guild, "sticky");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 4. Prefix Buttons
  if (isBtn && customId.startsWith("config_prefix_set_")) {
    const newP = customId.replace("config_prefix_set_", "");
    prefixManager.setPrefix(guildId, newP);
    const updated = buildConfigurationContainer(guild, "prefix");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "config_prefix_reset") {
    prefixManager.resetPrefix(guildId);
    const updated = buildConfigurationContainer(guild, "prefix");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 5. Channel Select for Sticky Messages
  if (isChanMenu && customId === "config_sticky_channel_select") {
    const targetChanId = interaction.values[0];
    const existing = (config.stickyMessages || []).find((s) => s.channelId === targetChanId);

    if (existing) {
      configManager.removeStickyMessage(guildId, targetChanId);
      const updated = buildConfigurationContainer(guild, "sticky");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    } else {
      // Show modal to enter sticky message content
      const modal = new ModalBuilder()
        .setCustomId(`config_modal_submit_sticky_${targetChanId}`)
        .setTitle("Set Sticky Message");

      const input = new TextInputBuilder()
        .setCustomId("sticky_text")
        .setLabel("Sticky Message Content")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Enter rules, guidelines, or notice to pin in this channel...")
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }
  }

  // 6. Modal Submissions
  if (isModalSubmit && customId.startsWith("config_modal_submit_sticky_")) {
    const targetChanId = customId.replace("config_modal_submit_sticky_", "");
    const text = interaction.fields.getTextInputValue("sticky_text");
    if (text) {
      configManager.setStickyMessage(guildId, targetChanId, text);
    }
    const updated = buildConfigurationContainer(guild, "sticky");
    await interaction.reply({
      content: `✅ Sticky message configured for <#${targetChanId}>!`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 7. Modals: Add Trigger
  if (customId === "config_modal_add_trigger") {
    const modal = new ModalBuilder()
      .setCustomId("config_modal_submit_add_trigger")
      .setTitle("Create Auto-Responder Trigger");

    const phraseInput = new TextInputBuilder()
      .setCustomId("trig_phrase")
      .setLabel("Trigger Phrase (Exact Match)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. vanity, support, website, ip")
      .setRequired(true)
      .setMaxLength(100);

    const responseInput = new TextInputBuilder()
      .setCustomId("trig_response")
      .setLabel("Response Text (Placeholders supported)")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("e.g. Join discord.gg/astrix for cool perks!")
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(phraseInput),
      new ActionRowBuilder().addComponents(responseInput)
    );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isModalSubmit && customId === "config_modal_submit_add_trigger") {
    const phrase = interaction.fields.getTextInputValue("trig_phrase")?.trim();
    const response = interaction.fields.getTextInputValue("trig_response")?.trim();

    if (phrase && response) {
      const existingIdx = config.triggers.findIndex(
        (t) => (t.trigger || "").toLowerCase() === phrase.toLowerCase()
      );

      if (existingIdx !== -1) {
        config.triggers[existingIdx].response = response;
        config.triggers[existingIdx].matchMode = "exact";
      } else {
        config.triggers.push({
          id: `trig_${Date.now()}`,
          trigger: phrase,
          response,
          matchMode: "exact",
          enabled: true,
          useComponentsV2: true,
        });
      }
      configManager.setGuildConfig(guildId, config);
    }

    await interaction.reply({
      content: `✅ Auto-responder trigger created for \`${phrase}\` *(Exact Match)*!`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 7b. Modals: Edit Trigger
  if (customId === "config_modal_edit_trigger") {
    const modal = new ModalBuilder()
      .setCustomId("config_modal_submit_edit_trigger")
      .setTitle("Edit Auto-Responder Trigger");

    const phraseInput = new TextInputBuilder()
      .setCustomId("trig_edit_phrase")
      .setLabel("Existing Trigger Phrase to Modify")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. vanity, support")
      .setRequired(true)
      .setMaxLength(100);

    const responseInput = new TextInputBuilder()
      .setCustomId("trig_edit_response")
      .setLabel("New Response Text")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Enter new updated response message...")
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(phraseInput),
      new ActionRowBuilder().addComponents(responseInput)
    );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isModalSubmit && customId === "config_modal_submit_edit_trigger") {
    const phrase = interaction.fields.getTextInputValue("trig_edit_phrase")?.trim();
    const response = interaction.fields.getTextInputValue("trig_edit_response")?.trim();

    if (phrase && response) {
      const edited = configManager.editTrigger(guildId, phrase, response, "exact");
      if (edited) {
        await interaction.reply({
          content: `✅ Auto-responder trigger \`${phrase}\` updated successfully!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: `⚠️ Trigger \`${phrase}\` was not found in active triggers list.`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
    }
    return true;
  }

  // 7c. Modals: Delete Trigger
  if (isModalSubmit && customId === "config_modal_submit_delete_trigger") {
    const phrase = interaction.fields.getTextInputValue("trig_delete_phrase")?.trim();
    if (phrase) {
      const removed = configManager.removeTrigger(guildId, phrase);
      if (removed) {
        await interaction.reply({
          content: `🗑️ Auto-responder trigger \`${phrase}\` deleted successfully!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: `⚠️ Trigger \`${phrase}\` was not found in active triggers list.`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
    }
    return true;
  }

  // 8. Modals: Add Keyword Reaction
  if (customId === "config_modal_add_reaction") {
    const modal = new ModalBuilder()
      .setCustomId("config_modal_submit_add_reaction")
      .setTitle("Add Keyword Reaction");

    const emojiInput = new TextInputBuilder()
      .setCustomId("react_emoji")
      .setLabel("Emoji (Unicode or custom <:name:id>)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. 👍, ❤️, 🔥")
      .setRequired(true)
      .setMaxLength(50);

    const phraseInput = new TextInputBuilder()
      .setCustomId("react_phrase")
      .setLabel("Trigger Phrase")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. gg, welcome, astrix")
      .setRequired(true)
      .setMaxLength(100);

    modal.addComponents(
      new ActionRowBuilder().addComponents(emojiInput),
      new ActionRowBuilder().addComponents(phraseInput)
    );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isModalSubmit && customId === "config_modal_submit_add_reaction") {
    const emoji = interaction.fields.getTextInputValue("react_emoji")?.trim();
    const phrase = interaction.fields.getTextInputValue("react_phrase")?.trim();

    if (emoji && phrase) {
      config.reactionTriggers.push({
        id: `react_${Date.now()}`,
        emoji,
        trigger: phrase,
        matchMode: "includes",
      });
      configManager.setGuildConfig(guildId, config);
    }

    await interaction.reply({
      content: `✅ Auto-reaction created: ${emoji} for \`${phrase}\`!`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 8b. Modals: Delete Keyword Reaction
  if (isModalSubmit && customId === "config_modal_submit_delete_reaction") {
    const phrase = interaction.fields.getTextInputValue("react_delete_phrase")?.trim();
    if (phrase) {
      const prevLen = config.reactionTriggers?.length || 0;
      config.reactionTriggers = (config.reactionTriggers || []).filter(
        (rt) => (rt.trigger || "").toLowerCase() !== phrase.toLowerCase()
      );
      if (config.reactionTriggers.length < prevLen) {
        configManager.setGuildConfig(guildId, config);
        await interaction.reply({
          content: `🗑️ Auto-reaction for \`${phrase}\` deleted successfully!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: `⚠️ Reaction trigger for \`${phrase}\` was not found.`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
    }
    return true;
  }

  // 9. Modals: Custom Prefix Submission
  if (isModalSubmit && customId === "config_modal_submit_custom_prefix") {
    const newPrefix = interaction.fields.getTextInputValue("custom_prefix_text")?.trim();
    if (newPrefix && newPrefix.length <= 5 && !newPrefix.includes(" ")) {
      prefixManager.setPrefix(guildId, newPrefix);
      await interaction.reply({
        content: `✅ Server command prefix updated to **\`${newPrefix}\`**!\n> Try running: \`${newPrefix}help\` or \`${newPrefix}configuration\``,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    } else {
      await interaction.reply({
        content: `❌ Invalid prefix. Prefix must be between 1-5 characters and cannot contain spaces.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }
    return true;
  }

  // 9b. Modals: Edit Keyword Reaction Submission
  if (isModalSubmit && customId === "config_modal_submit_edit_reaction") {
    const phrase = interaction.fields.getTextInputValue("react_edit_phrase")?.trim().toLowerCase();
    const newEmoji = interaction.fields.getTextInputValue("react_new_emoji")?.trim();

    if (phrase && newEmoji) {
      const currentConfig = configManager.getGuildConfig(guildId);
      const targetItem = (currentConfig.reactionTriggers || []).find(
        (r) => (r.trigger || "").trim().toLowerCase() === phrase
      );

      if (targetItem) {
        targetItem.emoji = newEmoji;
        configManager.setGuildConfig(guildId, currentConfig);
        await interaction.reply({
          content: `✅ Auto-reaction for keyword **\`${phrase}\`** updated to ${newEmoji}!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: `⚠️ No active auto-reaction found matching keyword **\`${phrase}\`**.`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
    }
    return true;
  }

  // 10. Refresh Button
  if (customId === "config_btn_refresh") {
    const updated = buildConfigurationContainer(guild, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildConfigNavMenu,
  buildConfigOverviewView,
  buildConfigTriggersView,
  buildConfigReactionsView,
  buildConfigStickyView,
  buildConfigPrefixView,
  buildConfigCommandsManualView,
  buildConfigurationContainer,
  handleConfigurationInteraction,
};
