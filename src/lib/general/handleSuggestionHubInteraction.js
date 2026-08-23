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
    .setPlaceholder("🧭 Suggestion System Control Navigation...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Overview & Telemetry")
        .setValue("sug_nav_overview")
        .setDescription("View suggestion status, channel routing & system telemetry")
        .setEmoji("💡")
        .setDefault(activeId === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Channel Routing & Modes")
        .setValue("sug_nav_channels")
        .setDescription("Configure designated suggestion channel and AnyChannel mode")
        .setEmoji("📍")
        .setDefault(activeId === "channels"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Discussion Threads Engine")
        .setValue("sug_nav_threads")
        .setDescription("Configure automatic discussion threads for new suggestions")
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

  const chanStr = config.suggestChannelId ? `<#${config.suggestChannelId}>` : "*Not Configured*";
  const threadChanStr = config.suggestThreadChannelId ? `<#${config.suggestThreadChannelId}>` : "*Not Configured*";
  const anyChanStatus = config.suggestAllowAllChannels ? "🟢 `ENABLED (Any Channel)`" : "🔴 `DISABLED (Designated Only)`";
  const threadStatus = config.suggestThreadEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";

  const isSystemReady = Boolean(config.suggestChannelId || config.suggestThreadChannelId);

  const headerText =
    `### 💡 **Community Suggestions Control Suite**\n` +
    `-# *Manage automated suggestion cards, real-time voting & discussion threads for **${guild.name}***`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const statusHeadline = isSystemReady
    ? `### 🟢 **Status: Suggestions Engine Active**\n> Live community feedback listening with interactive 1-click voting.`
    : `### 🟡 **Status: Suggestion Channel Pending**\n> Select a destination channel from the menu below to activate suggestions.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusHeadline));

  const telemetryText =
    `**📊 System Configuration & Routing:**\n` +
    `> • 📍 **Suggestion Feed Channel:** ${chanStr}\n` +
    `> • 🌐 **Any-Channel Submission:** ${anyChanStatus}\n` +
    `> • 🧵 **Auto-Thread Discussions:** ${threadStatus} (Feed: ${threadChanStr})\n` +
    `> • 🗳️ **Voting Mechanism:** Dual Reactive Counters (Upvote / Downvote)\n\n` +
    `💡 *Use the navigation menu or quick buttons below to configure routing.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildSuggestionNavMenu("overview"));

  const toggleAnyBtn = new ButtonBuilder()
    .setCustomId("sug_btn_toggle_anychannel")
    .setLabel(config.suggestAllowAllChannels ? "AnyChannel: ON" : "AnyChannel: OFF")
    .setEmoji(config.suggestAllowAllChannels ? "🌐" : "🔒")
    .setStyle(config.suggestAllowAllChannels ? ButtonStyle.Success : ButtonStyle.Secondary);

  const toggleThreadBtn = new ButtonBuilder()
    .setCustomId("sug_btn_toggle_thread")
    .setLabel(config.suggestThreadEnabled ? "Threads: ON" : "Threads: OFF")
    .setEmoji("🧵")
    .setStyle(config.suggestThreadEnabled ? ButtonStyle.Success : ButtonStyle.Secondary);

  const clearBtn = new ButtonBuilder()
    .setCustomId("sug_btn_clear_all")
    .setLabel("Clear / Reset")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!isSystemReady);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("sug_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(toggleAnyBtn, toggleThreadBtn, clearBtn, refreshBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CHANNELS & ROUTING VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionChannelsView(guild, config) {
  const container = new ContainerBuilder();
  const chanStr = config.suggestChannelId ? `<#${config.suggestChannelId}>` : "*Not Configured*";

  const headerText =
    `### 📍 **Suggestion Channel Routing & Submission Modes**\n` +
    `-# Configure the dedicated channel where members' submitted suggestion cards will be posted.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**⚙️ Current Channel Status:**\n` +
    `> • 📍 **Active Suggestion Channel:** ${chanStr}\n` +
    `> • 🌐 **AnyChannel Mode:** ${config.suggestAllowAllChannels ? "🟢 \`Active\` (Members can run \`.suggest\` anywhere)" : "🔴 \`Strict\` (Members must post inside the suggestion channel)"}\n\n` +
    `💡 *Select a new channel from the menu below to update routing instantly.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const chanSelect = new ChannelSelectMenuBuilder()
    .setCustomId("sug_select_feed_channel")
    .setPlaceholder("📍 Select suggestion feed channel...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(chanSelect);

  const toggleAnyBtn = new ButtonBuilder()
    .setCustomId("sug_btn_toggle_anychannel")
    .setLabel(config.suggestAllowAllChannels ? "Toggle AnyChannel (Currently ON)" : "Toggle AnyChannel (Currently OFF)")
    .setEmoji("🌐")
    .setStyle(config.suggestAllowAllChannels ? ButtonStyle.Success : ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("sug_nav_overview")
    .setLabel("Control Center")
    .setEmoji("💡")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleAnyBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildSuggestionNavMenu("channels")));
  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DISCUSSION THREADS ENGINE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionThreadsView(guild, config) {
  const container = new ContainerBuilder();
  const threadChanStr = config.suggestThreadChannelId ? `<#${config.suggestThreadChannelId}>` : "*Not Configured*";

  const headerText =
    `### 🧵 **Suggestion Discussion Threads Engine**\n` +
    `-# Automatically spawn a dedicated Discord Public Thread for every new suggestion for in-depth community feedback.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**⚙️ Thread System Status:**\n` +
    `> • 🧵 **Auto-Thread Creation:** ${config.suggestThreadEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
    `> • 📍 **Thread Feed Channel:** ${threadChanStr}\n\n` +
    `**✨ Features:**\n` +
    `> • Creates a focused discussion thread named after the suggestion topic.\n` +
    `> • Prevents main suggestion channels from getting cluttered with chatter.\n` +
    `> • Keeps upvotes and downvotes pinned directly on the root suggestion card.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const chanSelect = new ChannelSelectMenuBuilder()
    .setCustomId("sug_select_thread_channel")
    .setPlaceholder("🧵 Select channel for suggestion threads...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(chanSelect);

  const toggleThreadBtn = new ButtonBuilder()
    .setCustomId("sug_btn_toggle_thread")
    .setLabel(config.suggestThreadEnabled ? "Disable Auto-Threads" : "Enable Auto-Threads")
    .setEmoji("🧵")
    .setStyle(config.suggestThreadEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const cpBtn = new ButtonBuilder()
    .setCustomId("sug_nav_overview")
    .setLabel("Control Center")
    .setEmoji("💡")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(toggleThreadBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildSuggestionNavMenu("threads")));
  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. COMMAND MANUAL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestionManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **Community Suggestions Reference Manual**\n` +
    `-# Complete syntax guide for submitting suggestions and administrator controls.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `💡 **Member Submission Syntax:**\n` +
    `> • \`.suggest <idea / feedback>\` — Quick submit a suggestion\n` +
    `> • \`.suggest <Title> | <Description> | <Reason>\` — Full structured suggestion card\n` +
    `> • \`.suggestthread <Title> | <Content>\` — Submit suggestion with automatic public thread\n\n` +
    `🛠️ **Staff & Admin Management:**\n` +
    `> • \`.suggest\` — Open interactive Control Center\n` +
    `> • \`.suggest channel <#channel>\` — Set suggestion destination channel\n` +
    `> • \`.suggest anychannel <on|off>\` — Allow suggestions from all channels\n` +
    `> • \`.suggestthread channel <#channel>\` — Set thread spawn channel\n` +
    `> • \`.suggest disable\` — Disable suggestion engine`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("sug_nav_overview")
    .setLabel("Control Center")
    .setEmoji("💡")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildSuggestionNavMenu("manual")));
  container.addActionRowComponents(btnRow);

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
    `-# *Submitted by <@${author.id}> (\`${author.tag || author.username}\`)*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let body = `**📌 Proposal:**\n> ${title}\n\n`;
  if (description) {
    body += `**📝 Details:**\n> ${description}\n\n`;
  }
  if (reason) {
    body += `**🎯 Expected Benefit & Value:**\n> ${reason}\n\n`;
  }
  body += `-# *Click the interactive buttons below to cast your vote.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

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

  // 7. Clear All
  if (customId === "sug_btn_clear_all") {
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

  // 8. Refresh
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
