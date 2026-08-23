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
    `### ⚙️ **Astrix Server Configuration Control Center**\n` +
    `-# *Manage automated triggers, smart auto-reactions, sticky notices & server settings for **${guild.name}***`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const telemetryText =
    `**📊 Active Configuration Telemetry:**\n` +
    `> • 🤖 **Auto-Responders (Triggers):** \`${triggerCount}\` active phrases\n` +
    `> • 😀 **Reaction Triggers:** \`${reactCount}\` keyword auto-reactors\n` +
    `> • 📸 **Channel Auto-Reactions:** \`${channelReactCount}\` channels bound\n` +
    `> • 📌 **Sticky Messages:** \`${stickyCount}\` active dynamic notices\n` +
    `> • ⚡ **Server Command Prefix:** \`${currentPrefix}\`\n\n` +
    `💡 *Select a module from the dropdown below or use the quick action buttons to customize.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildConfigNavMenu("overview"));

  const triggersBtn = new ButtonBuilder()
    .setCustomId("config_nav_triggers")
    .setLabel("Triggers Hub")
    .setEmoji("🤖")
    .setStyle(ButtonStyle.Primary);

  const reactBtn = new ButtonBuilder()
    .setCustomId("config_nav_reactions")
    .setLabel("Reactions Hub")
    .setEmoji("😀")
    .setStyle(ButtonStyle.Primary);

  const stickyBtn = new ButtonBuilder()
    .setCustomId("config_nav_sticky")
    .setLabel("Sticky Hub")
    .setEmoji("📌")
    .setStyle(ButtonStyle.Primary);

  const prefixBtn = new ButtonBuilder()
    .setCustomId("config_nav_prefix")
    .setLabel("Prefix")
    .setEmoji("⚡")
    .setStyle(ButtonStyle.Secondary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("config_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(triggersBtn, reactBtn, stickyBtn, prefixBtn, refreshBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);

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
    `### 🤖 **Auto-Responders Matrix (Triggers)**\n` +
    `-# Custom auto-responses that trigger strictly when the full message matches the specified keyword.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let listStr = "";
  if (triggers.length > 0) {
    triggers.slice(0, 10).forEach((t, i) => {
      const respSnippet = t.response.length > 60 ? t.response.slice(0, 57) + "..." : t.response;
      listStr += `> \`${i + 1}.\` **Phrase:** \`${t.trigger}\` • **Match:** \`EXACT (Single Word/Phrase)\`\n>    ↳ *Response:* ${respSnippet}\n`;
    });
    if (triggers.length > 10) {
      listStr += `> ... *and ${triggers.length - 10} more triggers.*`;
    }
  } else {
    listStr = "> *No auto-responder triggers configured yet.*";
  }

  const content =
    `**📋 Active Triggers (${triggers.length}):**\n${listStr}\n\n` +
    `🔒 *Exact Mode: \`"vanity"\` will trigger only on \`vanity\` and NOT on \`it is the vanity\`.*\n` +
    `💡 *Command Syntax:* \`.trigger add <phrase> | <response>\` • \`.trigger edit <phrase> | <new response>\` • \`.trigger remove <phrase>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const addBtn = new ButtonBuilder()
    .setCustomId("config_modal_add_trigger")
    .setLabel("Create Trigger")
    .setEmoji("➕")
    .setStyle(ButtonStyle.Success);

  const editBtn = new ButtonBuilder()
    .setCustomId("config_modal_edit_trigger")
    .setLabel("Edit Trigger")
    .setEmoji("✏️")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(triggers.length === 0);

  const clearBtn = new ButtonBuilder()
    .setCustomId("config_clear_triggers")
    .setLabel("Clear All Triggers")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(triggers.length === 0);

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(addBtn, editBtn, clearBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildConfigNavMenu("triggers")));
  container.addActionRowComponents(btnRow);

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
    `### 😀 **Auto-Reactions & Emojis Directory**\n` +
    `-# Automatically react with emojis upon matching keywords or on every message in designated channels.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let kwStr = "";
  if (reactTriggers.length > 0) {
    reactTriggers.slice(0, 8).forEach((rt, i) => {
      kwStr += `> \`${i + 1}.\` ${rt.emoji} ➔ \`${rt.trigger}\`\n`;
    });
    if (reactTriggers.length > 8) kwStr += `> ... *and ${reactTriggers.length - 8} more.*`;
  } else {
    kwStr = "> *No keyword reactions configured.*";
  }

  let chStr = "";
  if (channelReactions.length > 0) {
    channelReactions.forEach((cr, i) => {
      chStr += `> \`${i + 1}.\` <#${cr.channelId}> ➔ ${cr.emojis?.join(" ") || "None"}\n`;
    });
  } else {
    chStr = "> *No channel auto-reactors configured.*";
  }

  const content =
    `**😀 Keyword Auto-Reactors (${reactTriggers.length}):**\n${kwStr}\n\n` +
    `**📸 Channel Auto-Reactors (${channelReactions.length}):**\n${chStr}\n\n` +
    `💡 *Command Syntax:* \`.reaction add <emoji> <phrase>\` • \`.reaction messages <#channel> <emojis...>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const addKwBtn = new ButtonBuilder()
    .setCustomId("config_modal_add_reaction")
    .setLabel("Add Keyword React")
    .setEmoji("➕")
    .setStyle(ButtonStyle.Success);

  const clearBtn = new ButtonBuilder()
    .setCustomId("config_clear_reactions")
    .setLabel("Clear All Reactions")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(reactTriggers.length === 0 && channelReactions.length === 0);

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(addKwBtn, clearBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildConfigNavMenu("reactions")));
  container.addActionRowComponents(btnRow);

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
    `### 📌 **Sticky Messages Engine**\n` +
    `-# Dynamic announcements, rules, or guidelines automatically pinned at the bottom of designated channels.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let listStr = "";
  if (stickyList.length > 0) {
    stickyList.forEach((s, i) => {
      const snippet = s.content.length > 60 ? s.content.slice(0, 57) + "..." : s.content;
      listStr += `> \`${i + 1}.\` <#${s.channelId}> ➔ ${snippet}\n`;
    });
  } else {
    listStr = "> *No sticky messages active. Use the channel menu below or `.sticky add <#channel> <message>`.*";
  }

  const content =
    `**📌 Active Sticky Notices (${stickyList.length}):**\n${listStr}\n\n` +
    `💡 *Whenever members send messages in a sticky-enabled channel, the bot reposts the sticky card at the bottom.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("config_sticky_channel_select")
    .setPlaceholder("📌 Select channel to set or remove sticky message...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const menuRow = new ActionRowBuilder().addComponents(channelMenu);

  const clearBtn = new ButtonBuilder()
    .setCustomId("config_clear_sticky")
    .setLabel("Clear All Sticky")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(stickyList.length === 0);

  const cpBtn = new ButtonBuilder()
    .setCustomId("config_nav_overview")
    .setLabel("Control Center")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(clearBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildConfigNavMenu("sticky")));
  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SERVER PREFIX SETTINGS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildConfigPrefixView(guild) {
  const container = new ContainerBuilder();
  const currentPrefix = prefixManager.getPrefix(guild.id);

  const headerText =
    `### ⚡ **Server Prefix Settings**\n` +
    `-# Set a customized prefix for invoking text commands in **${guild.name}**.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**⚙️ Current Server Prefix:** \`${currentPrefix}\`\n\n` +
    `> • **Default Bot Prefix:** \`.\`\n` +
    `> • **Current Guild Prefix:** \`${currentPrefix}\`\n` +
    `> • **Example Command:** \`${currentPrefix}help\` • \`${currentPrefix}stats\`\n\n` +
    `💡 *Click any 1-click preset button below to switch prefix instantly, or use \`.setprefix <prefix>\`.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const pDot = new ButtonBuilder()
    .setCustomId("config_prefix_set_.")
    .setLabel("Prefix: .")
    .setStyle(currentPrefix === "." ? ButtonStyle.Success : ButtonStyle.Secondary);

  const pEx = new ButtonBuilder()
    .setCustomId("config_prefix_set_!")
    .setLabel("Prefix: !")
    .setStyle(currentPrefix === "!" ? ButtonStyle.Success : ButtonStyle.Secondary);

  const pQues = new ButtonBuilder()
    .setCustomId("config_prefix_set_?")
    .setLabel("Prefix: ?")
    .setStyle(currentPrefix === "?" ? ButtonStyle.Success : ButtonStyle.Secondary);

  const pDollar = new ButtonBuilder()
    .setCustomId("config_prefix_set_$")
    .setLabel("Prefix: $")
    .setStyle(currentPrefix === "$" ? ButtonStyle.Success : ButtonStyle.Secondary);

  const pReset = new ButtonBuilder()
    .setCustomId("config_prefix_reset")
    .setLabel("Reset Default")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Danger);

  const btnRow = new ActionRowBuilder().addComponents(pDot, pEx, pQues, pDollar, pReset);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildConfigNavMenu("prefix")));
  container.addActionRowComponents(btnRow);

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

  // 9. Refresh Button
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
