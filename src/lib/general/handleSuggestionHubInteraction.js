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
const suggestionManager = require("../suggestionManager");
const noprefixManager = require("../noprefixManager");
const EMOJIS = require("../emojis");

function isAuthorized(client, member, guild) {
  if (!member || !guild) return false;
  if (member.id === guild.ownerId) return true;
  if (noprefixManager.isOwner(member.id, client)) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NAVIGATION DROPDOWN MENU
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionNavMenu(activeId = "overview") {
  return new StringSelectMenuBuilder()
    .setCustomId("sug_nav_menu")
    .setPlaceholder("🧭 Suggestion System Hub Navigation...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Control Center & Telemetry")
        .setValue("sug_nav_overview")
        .setDescription("Overview of suggestion routing, feed channels & status")
        .setEmoji("💡")
        .setDefault(activeId === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Channel Routing & Modes")
        .setValue("sug_nav_channels")
        .setDescription("Configure designated suggestion feed channel & any-channel mode")
        .setEmoji("📍")
        .setDefault(activeId === "channels"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Discussion Threads Engine")
        .setValue("sug_nav_threads")
        .setDescription("Configure automatic discussion threads for suggestions")
        .setEmoji("🧵")
        .setDefault(activeId === "threads"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Guide")
        .setValue("sug_nav_manual")
        .setDescription("Syntax and examples for .suggest and .suggestthread")
        .setEmoji("📖")
        .setDefault(activeId === "manual")
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OVERVIEW VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionOverviewView(guild, config) {
  const container = new ContainerBuilder();

  const chanStr = config.suggestChannelId ? `<#${config.suggestChannelId}>` : "*None (Not Configured)*";
  const threadChanStr = config.suggestThreadChannelId ? `<#${config.suggestThreadChannelId}>` : "*None (Not Configured)*";
  const anyChanStatus = config.suggestAllowAllChannels ? "🟢 `ENABLED (Any Channel)`" : "🔴 `STRICT (Designated Only)`";
  const threadStatus = config.suggestThreadEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const isSystemReady = Boolean(config.suggestChannelId || config.suggestThreadChannelId);

  const headerText =
    `### 💡 **Community Suggestions • Control Hub**\n` +
    `-# Automated community feedback cards, real-time voting & discussion threads for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const telemetryText =
    `> **System Status:** ${isSystemReady ? "🟢 `ARMED & ACTIVE`" : "🟡 `CHANNEL PENDING`"} • **Voting Engine:** 🟢 \`ONLINE\`\n` +
    `> **Suggestion Feed:** ${chanStr} • **Any-Channel Mode:** ${anyChanStatus}\n` +
    `> **Auto-Threads:** ${threadStatus} (Feed: ${threadChanStr})\n\n` +
    `-# Select an action below to update suggestion channel routing or toggle modes.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 1. Action Select Dropdown
  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("sug_overview_select_action")
    .setPlaceholder("⚡ Suggestion System Actions (Configure / Toggle)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Configure Channel Routing")
        .setValue("nav_channels")
        .setDescription("Set suggestion feed channel and any-channel toggle")
        .setEmoji("📍"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Discussion Threads Settings")
        .setValue("nav_threads")
        .setDescription("Configure auto-thread spawning on suggestions")
        .setEmoji("🧵"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Toggle Any-Channel Mode")
        .setValue("action_toggle_anychannel")
        .setDescription(config.suggestAllowAllChannels ? "Disable Any-Channel mode" : "Enable Any-Channel mode")
        .setEmoji("🌐"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Toggle Auto-Threads")
        .setValue("action_toggle_threads")
        .setDescription(config.suggestThreadEnabled ? "Disable auto discussion threads" : "Enable auto discussion threads")
        .setEmoji("🧵"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Reset / Clear All Configuration")
        .setValue("action_reset_all")
        .setDescription("Reset all suggestion channels and settings to default")
        .setEmoji("🧹"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Guide")
        .setValue("nav_manual")
        .setDescription("View full command syntax reference")
        .setEmoji("📖")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildSuggestionNavMenu("overview"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("sug_nav_overview")
    .setLabel("Control Center")
    .setEmoji("💡")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("sug_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community • Suggestions Engine`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CHANNELS & ROUTING VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionChannelsView(guild, config) {
  const container = new ContainerBuilder();
  const chanStr = config.suggestChannelId ? `<#${config.suggestChannelId}>` : "*Not Configured*";

  const headerText =
    `### 📍 **Suggestions • Channel Routing & Modes**\n` +
    `-# Configure the dedicated channel where members' submitted suggestion cards will be posted`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Active Suggestion Feed:** ${chanStr}\n` +
    `> **Any-Channel Mode:** ${config.suggestAllowAllChannels ? "🟢 `ENABLED` (Members can suggest from any channel)" : "🔴 `STRICT` (Members must post inside the suggestion channel)"}\n\n` +
    `-# Select a channel below to set or change your server's suggestion feed.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const chanSelect = new ChannelSelectMenuBuilder()
    .setCustomId("sug_select_feed_channel")
    .setPlaceholder("📍 Select suggestion feed channel...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(chanSelect);
  const navRow = new ActionRowBuilder().addComponents(buildSuggestionNavMenu("channels"));

  const toggleAnyBtn = new ButtonBuilder()
    .setCustomId("sug_btn_toggle_anychannel")
    .setLabel(config.suggestAllowAllChannels ? "AnyChannel: ON" : "AnyChannel: OFF")
    .setEmoji("🌐")
    .setStyle(config.suggestAllowAllChannels ? ButtonStyle.Success : ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("sug_nav_overview")
    .setLabel("Control Center")
    .setEmoji("💡")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleAnyBtn, cpBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community • Routing Settings`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DISCUSSION THREADS ENGINE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionThreadsView(guild, config) {
  const container = new ContainerBuilder();
  const threadChanStr = config.suggestThreadChannelId ? `<#${config.suggestThreadChannelId}>` : "*Not Configured*";

  const headerText =
    `### 🧵 **Suggestions • Discussion Threads Engine**\n` +
    `-# Automatically spawn a dedicated Discord Public Thread for every new suggestion`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Auto-Thread Creation:** ${config.suggestThreadEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
    `> **Thread Feed Channel:** ${threadChanStr}\n\n` +
    `-# Keeps discussions inside clean public threads without cluttering main channels.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const chanSelect = new ChannelSelectMenuBuilder()
    .setCustomId("sug_select_thread_channel")
    .setPlaceholder("🧵 Select channel for suggestion threads...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(chanSelect);
  const navRow = new ActionRowBuilder().addComponents(buildSuggestionNavMenu("threads"));

  const toggleThreadBtn = new ButtonBuilder()
    .setCustomId("sug_btn_toggle_thread")
    .setLabel(config.suggestThreadEnabled ? "Threads: ON" : "Threads: OFF")
    .setEmoji("🧵")
    .setStyle(config.suggestThreadEnabled ? ButtonStyle.Success : ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("sug_nav_overview")
    .setLabel("Control Center")
    .setEmoji("💡")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleThreadBtn, cpBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community • Thread Engine`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. COMMAND MANUAL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **Community Suggestions • Command Reference Manual**\n` +
    `-# Complete syntax guide for submitting suggestions and administrator controls`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**💡 Member Submission Syntax**\n` +
    `> • \`.suggest <idea / feedback>\` — Submit quick proposal card\n` +
    `> • \`.suggest <Title> | <Description> | <Reason>\` — Full structured suggestion card\n` +
    `> • \`.suggestthread <Title> | <Content>\` — Submit suggestion with automatic public thread\n\n` +
    `**🛠️ Staff & Administrator Controls**\n` +
    `> • \`.suggest\` — Open interactive Control Center\n` +
    `> • \`.suggest channel <#channel>\` — Set suggestion destination channel\n` +
    `> • \`.suggest anychannel <on|off>\` — Allow submissions from all channels\n` +
    `> • \`.suggestthread channel <#channel>\` — Set thread spawn channel\n` +
    `> • \`.suggest disable\` — Disable suggestion engine`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildSuggestionNavMenu("manual"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("sug_nav_overview")
    .setLabel("Control Center")
    .setEmoji("💡")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community • Documentation`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL CONTAINER DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionContainer(guild, config, activeTab = "overview") {
  switch (activeTab) {
    case "channels":
      return buildSuggestionChannelsView(guild, config);
    case "threads":
      return buildSuggestionThreadsView(guild, config);
    case "manual":
      return buildSuggestionManualView();
    case "overview":
    default:
      return buildSuggestionOverviewView(guild, config);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SUGGESTION CARD GENERATOR (FOR MEMBERS)
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionSubmissionCard(author, title, description, reason = null) {
  const container = new ContainerBuilder();

  const headerText =
    `### 💡 **Community Suggestion**\n` +
    `-# Submitted by <@${author.id}> (\`${author.tag || author.username}\`) • **Status:** 🟡 \`UNDER REVIEW\``;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let body = `> **📌 Proposal:**\n> ${title}\n\n`;
  if (description) {
    body += `> **📝 Details / Context:**\n> ${description}\n\n`;
  }
  if (reason) {
    body += `> **🎯 Expected Value:**\n> ${reason}\n\n`;
  }
  body += `-# Click the reaction buttons below to vote on this suggestion.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Community Suggestion Engine`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION ROUTER FOR SUGGESTION HUB
// ─────────────────────────────────────────────────────────────────────────────
async function handleSuggestionHubInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isChanMenu = interaction.isChannelSelectMenu();

  if (!isBtn && !isMenu && !isChanMenu) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("sug_")) return false;

  const guild = interaction.guild;
  if (!guild) return false;

  if (!isAuthorized(client, interaction.member, guild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to configure suggestions.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guildId = guild.id;
  let config = suggestionManager.getGuildConfig(client, guildId);

  // 1. Navigation Menu
  if (isMenu && customId === "sug_nav_menu") {
    const selected = interaction.values[0];
    const targetTab = selected.replace("sug_nav_", "");
    const updated = buildSuggestionContainer(guild, config, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.2 Overview Action Select
  if (isMenu && customId === "sug_overview_select_action") {
    const selected = interaction.values[0];
    if (selected.startsWith("nav_")) {
      const targetTab = selected.replace("nav_", "");
      const updated = buildSuggestionContainer(guild, config, targetTab);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "action_toggle_anychannel") {
      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestAllowAllChannels = !cfg.suggestAllowAllChannels;
        return cfg;
      });
      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const updated = buildSuggestionContainer(guild, freshConfig, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "action_toggle_threads") {
      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestThreadEnabled = !cfg.suggestThreadEnabled;
        return cfg;
      });
      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const updated = buildSuggestionContainer(guild, freshConfig, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
    if (selected === "action_reset_all") {
      suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
        cfg.suggestChannelId = null;
        cfg.suggestAllowAllChannels = false;
        cfg.suggestThreadChannelId = null;
        cfg.suggestThreadEnabled = false;
        return cfg;
      });
      const freshConfig = suggestionManager.getGuildConfig(client, guildId);
      const updated = buildSuggestionContainer(guild, freshConfig, "overview");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // 2. Direct Navigation Buttons
  if (isBtn && customId.startsWith("sug_nav_")) {
    const targetTab = customId.replace("sug_nav_", "");
    const updated = buildSuggestionContainer(guild, config, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 3. Channel Select: Suggestion Feed Channel
  if (isChanMenu && customId === "sug_select_feed_channel") {
    const selectedChanId = interaction.values[0];
    suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.suggestChannelId = selectedChanId;
      return cfg;
    });

    const freshConfig = suggestionManager.getGuildConfig(client, guildId);
    const updated = buildSuggestionContainer(guild, freshConfig, "channels");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 4. Channel Select: Suggestion Thread Feed Channel
  if (isChanMenu && customId === "sug_select_thread_channel") {
    const selectedChanId = interaction.values[0];
    suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.suggestThreadChannelId = selectedChanId;
      cfg.suggestThreadEnabled = true;
      return cfg;
    });

    const freshConfig = suggestionManager.getGuildConfig(client, guildId);
    const updated = buildSuggestionContainer(guild, freshConfig, "threads");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 5. Toggle AnyChannel Mode
  if (customId === "sug_btn_toggle_anychannel") {
    suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.suggestAllowAllChannels = !cfg.suggestAllowAllChannels;
      return cfg;
    });

    const freshConfig = suggestionManager.getGuildConfig(client, guildId);
    const updated = buildSuggestionContainer(guild, freshConfig, "channels");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 6. Toggle Thread Mode
  if (customId === "sug_btn_toggle_thread") {
    suggestionManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.suggestThreadEnabled = !cfg.suggestThreadEnabled;
      return cfg;
    });

    const freshConfig = suggestionManager.getGuildConfig(client, guildId);
    const updated = buildSuggestionContainer(guild, freshConfig, "threads");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 7. Refresh
  if (customId === "sug_btn_refresh") {
    const freshConfig = suggestionManager.getGuildConfig(client, guildId);
    const updated = buildSuggestionContainer(guild, freshConfig, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildSuggestionNavMenu,
  buildSuggestionOverviewView,
  buildSuggestionChannelsView,
  buildSuggestionThreadsView,
  buildSuggestionManualView,
  buildSuggestionContainer,
  buildSuggestionSubmissionCard,
  handleSuggestionHubInteraction,
};
