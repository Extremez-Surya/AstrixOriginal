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
  PermissionFlagsBits,
} = require("discord.js");
const antinukeManager = require("../antinukeManager");
const antiraidManager = require("../antiraidManager");
const automodManager = require("../automodManager");
const noprefixManager = require("../noprefixManager");

function isAuthorized(client, member, guild) {
  if (!member || !guild) return false;
  if (member.id === guild.ownerId) return true;
  if (noprefixManager.isOwner(member.id, client)) return true;
  if (antinukeManager.isExtraOwner(guild.id, member.id)) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TARGET USER WHITELIST MODAL / CARD
// ─────────────────────────────────────────────────────────────────────────────
function buildUnifiedWhitelistTargetCard(guild, targetUser) {
  const container = new ContainerBuilder();
  const guildId = guild.id;
  const targetId = targetUser.id;

  const anConfig = antinukeManager.getGuildAntinuke(guildId);
  const isAnWl = (anConfig.whitelist || []).includes(targetId);

  const arConfig = antiraidManager.getGuildAntiraid(guildId);
  const isArWl = (arConfig.whitelist || []).includes(targetId);

  const isAmWl = automodManager.isWhitelistedUser(guildId, targetId);

  const allWl = isAnWl && isArWl && isAmWl;
  const noneWl = !isAnWl && !isArWl && !isAmWl;

  const headerText =
    `### 📋 **Astrix Whitelist Manager • Target Configuration**\n` +
    `-# Configure security bypass permissions for <@${targetId}> (\`${targetUser.tag || targetUser.username || targetId}\`)`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const statusText =
    `👤 **Target User:** <@${targetId}> (\`${targetId}\`)\n\n` +
    `**⚙️ Current Whitelist Status:**\n` +
    `> • 🔒 **Anti-Nuke Protection:** ${isAnWl ? "🟢 `WHITELISTED`" : "🔴 `NOT WHITELISTED`"}\n` +
    `> • 🛡️ **Anti-Raid Join Defense:** ${isArWl ? "🟢 `WHITELISTED`" : "🔴 `NOT WHITELISTED`"}\n` +
    `> • 🤖 **AutoMod Chat Filters:** ${isAmWl ? "🟢 `WHITELISTED`" : "🔴 `NOT WHITELISTED`"}\n\n` +
    `💡 *Select from the dropdown below or use the quick buttons to toggle whitelist systems.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Multi-System Selection Dropdown
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`wl_select_systems_${targetId}`)
    .setPlaceholder("⚡ Choose which system(s) to whitelist this user in...")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Universal Whitelist (All Systems)")
        .setValue("all")
        .setDescription("Whitelist in Anti-Nuke, Anti-Raid & AutoMod simultaneously")
        .setEmoji("⚡")
        .setDefault(allWl),
      new StringSelectMenuOptionBuilder()
        .setLabel("Anti-Nuke Protection Only")
        .setValue("antinuke")
        .setDescription("Bypasses channel/role delete, kick, ban & webhook triggers")
        .setEmoji("🔒")
        .setDefault(isAnWl && !allWl),
      new StringSelectMenuOptionBuilder()
        .setLabel("Anti-Raid Join Defense Only")
        .setValue("antiraid")
        .setDescription("Bypasses default avatar, account age & join rate gates")
        .setEmoji("🛡️")
        .setDefault(isArWl && !allWl),
      new StringSelectMenuOptionBuilder()
        .setLabel("AutoMod Chat Filters Only")
        .setValue("automod")
        .setDescription("Bypasses anti-spam, links, mass mentions & caps filters")
        .setEmoji("🤖")
        .setDefault(isAmWl && !allWl),
      new StringSelectMenuOptionBuilder()
        .setLabel("Remove from All Systems (Unwhitelist)")
        .setValue("none")
        .setDescription("Revoke all whitelist permissions from this user")
        .setEmoji("❌")
        .setDefault(noneWl)
    );

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  // Quick Action Buttons
  const btnAll = new ButtonBuilder()
    .setCustomId(`wl_btn_all_${targetId}`)
    .setLabel("Whitelist All")
    .setEmoji("⚡")
    .setStyle(allWl ? ButtonStyle.Secondary : ButtonStyle.Success);

  const btnAn = new ButtonBuilder()
    .setCustomId(`wl_btn_an_${targetId}`)
    .setLabel(isAnWl ? "Anti-Nuke: ON" : "Anti-Nuke: OFF")
    .setEmoji("🔒")
    .setStyle(isAnWl ? ButtonStyle.Success : ButtonStyle.Secondary);

  const btnAr = new ButtonBuilder()
    .setCustomId(`wl_btn_ar_${targetId}`)
    .setLabel(isArWl ? "Anti-Raid: ON" : "Anti-Raid: OFF")
    .setEmoji("🛡️")
    .setStyle(isArWl ? ButtonStyle.Success : ButtonStyle.Secondary);

  const btnAm = new ButtonBuilder()
    .setCustomId(`wl_btn_am_${targetId}`)
    .setLabel(isAmWl ? "AutoMod: ON" : "AutoMod: OFF")
    .setEmoji("🤖")
    .setStyle(isAmWl ? ButtonStyle.Success : ButtonStyle.Secondary);

  const btnNone = new ButtonBuilder()
    .setCustomId(`wl_btn_none_${targetId}`)
    .setLabel("Remove All")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(noneWl);

  const btnRow = new ActionRowBuilder().addComponents(btnAll, btnAn, btnAr, btnAm, btnNone);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FULL SERVER WHITELIST DIRECTORY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildUnifiedWhitelistOverviewCard(guild, subTab = "main") {
  const container = new ContainerBuilder();
  const guildId = guild.id;

  const anConfig = antinukeManager.getGuildAntinuke(guildId);
  const anWl = anConfig.whitelist || [];

  const arConfig = antiraidManager.getGuildAntiraid(guildId);
  const arWl = arConfig.whitelist || [];

  const amConfig = automodManager.getGuildAutomod(guildId);
  const amWl = amConfig.ignore?.users || [];

  const formatList = (list) =>
    list.length > 0
      ? list.map((id, i) => `> \`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n")
      : "> *No users whitelisted.*";

  const headerText =
    `### 📋 **Astrix Security • Universal Whitelist Directory**\n` +
    `-# Overview of all whitelisted and trusted operators across security modules for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `🔒 **Anti-Nuke Whitelist (${anWl.length}):**\n${formatList(anWl)}\n\n` +
    `🛡️ **Anti-Raid Whitelist (${arWl.length}):**\n${formatList(arWl)}\n\n` +
    `🤖 **AutoMod Whitelist (${amWl.length}):**\n${formatList(amWl)}\n\n` +
    `💡 *Use \`.whitelist add @user\` to configure multi-system permissions for any user.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (subTab === "add") {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId("wl_overview_do_add_user")
      .setPlaceholder("➕ Select a user to configure whitelist systems...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(userMenu));
  } else if (subTab === "remove") {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId("wl_overview_do_remove_user")
      .setPlaceholder("➖ Select a user to remove from all whitelists...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(userMenu));
  }

  const addBtn = new ButtonBuilder()
    .setCustomId("wl_tab_add")
    .setLabel("Add User")
    .setEmoji("➕")
    .setStyle(subTab === "add" ? ButtonStyle.Primary : ButtonStyle.Success);

  const removeBtn = new ButtonBuilder()
    .setCustomId("wl_tab_remove")
    .setLabel("Remove User")
    .setEmoji("➖")
    .setStyle(subTab === "remove" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(anWl.length === 0 && arWl.length === 0 && amWl.length === 0);

  const clearBtn = new ButtonBuilder()
    .setCustomId("wl_clear_all_systems")
    .setLabel("Reset All Whitelists")
    .setEmoji("🧹")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(anWl.length === 0 && arWl.length === 0 && amWl.length === 0);

  const btnRow = new ActionRowBuilder().addComponents(addBtn, removeBtn, clearBtn);

  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERACTION ROUTER FOR UNIFIED WHITELIST
// ─────────────────────────────────────────────────────────────────────────────
async function handleUnifiedWhitelistInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isUserMenu = interaction.isUserSelectMenu();

  if (!isBtn && !isMenu && !isUserMenu) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("wl_")) return false;

  if (!interaction.guild) return false;

  if (!isAuthorized(client, interaction.member, interaction.guild)) {
    await interaction
      .reply({
        content: "❌ You need **Administrator** or **Manage Server** permissions to manage security whitelists.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guild = interaction.guild;
  const guildId = guild.id;

  // 1. Dropdown Selection for Target User
  if (isMenu && customId.startsWith("wl_select_systems_")) {
    const targetUserId = customId.replace("wl_select_systems_", "");
    const choice = interaction.values[0];

    if (choice === "all") {
      antinukeManager.addWhitelist(guildId, targetUserId);
      antiraidManager.addWhitelist(guildId, targetUserId);
      automodManager.addWhitelistedUser(guildId, targetUserId);
    } else if (choice === "antinuke") {
      antinukeManager.addWhitelist(guildId, targetUserId);
    } else if (choice === "antiraid") {
      antiraidManager.addWhitelist(guildId, targetUserId);
    } else if (choice === "automod") {
      automodManager.addWhitelistedUser(guildId, targetUserId);
    } else if (choice === "none") {
      antinukeManager.removeWhitelist(guildId, targetUserId);
      antiraidManager.removeWhitelist(guildId, targetUserId);
      automodManager.removeWhitelistedUser(guildId, targetUserId);
    }

    const targetUser = await client.users.fetch(targetUserId).catch(() => ({ id: targetUserId, username: targetUserId }));
    const updated = buildUnifiedWhitelistTargetCard(guild, targetUser);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 2. Buttons on Target User Card
  if (isBtn && customId.startsWith("wl_btn_all_")) {
    const targetUserId = customId.replace("wl_btn_all_", "");
    antinukeManager.addWhitelist(guildId, targetUserId);
    antiraidManager.addWhitelist(guildId, targetUserId);
    automodManager.addWhitelistedUser(guildId, targetUserId);

    const targetUser = await client.users.fetch(targetUserId).catch(() => ({ id: targetUserId, username: targetUserId }));
    const updated = buildUnifiedWhitelistTargetCard(guild, targetUser);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isBtn && customId.startsWith("wl_btn_an_")) {
    const targetUserId = customId.replace("wl_btn_an_", "");
    const anConfig = antinukeManager.getGuildAntinuke(guildId);
    if ((anConfig.whitelist || []).includes(targetUserId)) {
      antinukeManager.removeWhitelist(guildId, targetUserId);
    } else {
      antinukeManager.addWhitelist(guildId, targetUserId);
    }

    const targetUser = await client.users.fetch(targetUserId).catch(() => ({ id: targetUserId, username: targetUserId }));
    const updated = buildUnifiedWhitelistTargetCard(guild, targetUser);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isBtn && customId.startsWith("wl_btn_ar_")) {
    const targetUserId = customId.replace("wl_btn_ar_", "");
    const arConfig = antiraidManager.getGuildAntiraid(guildId);
    if ((arConfig.whitelist || []).includes(targetUserId)) {
      antiraidManager.removeWhitelist(guildId, targetUserId);
    } else {
      antiraidManager.addWhitelist(guildId, targetUserId);
    }

    const targetUser = await client.users.fetch(targetUserId).catch(() => ({ id: targetUserId, username: targetUserId }));
    const updated = buildUnifiedWhitelistTargetCard(guild, targetUser);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isBtn && customId.startsWith("wl_btn_am_")) {
    const targetUserId = customId.replace("wl_btn_am_", "");
    if (automodManager.isWhitelistedUser(guildId, targetUserId)) {
      automodManager.removeWhitelistedUser(guildId, targetUserId);
    } else {
      automodManager.addWhitelistedUser(guildId, targetUserId);
    }

    const targetUser = await client.users.fetch(targetUserId).catch(() => ({ id: targetUserId, username: targetUserId }));
    const updated = buildUnifiedWhitelistTargetCard(guild, targetUser);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isBtn && customId.startsWith("wl_btn_none_")) {
    const targetUserId = customId.replace("wl_btn_none_", "");
    antinukeManager.removeWhitelist(guildId, targetUserId);
    antiraidManager.removeWhitelist(guildId, targetUserId);
    automodManager.removeWhitelistedUser(guildId, targetUserId);

    const targetUser = await client.users.fetch(targetUserId).catch(() => ({ id: targetUserId, username: targetUserId }));
    const updated = buildUnifiedWhitelistTargetCard(guild, targetUser);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 3. Overview Directory Tabs & Sub-Actions
  if (customId === "wl_tab_add") {
    const updated = buildUnifiedWhitelistOverviewCard(guild, "add");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "wl_tab_remove") {
    const updated = buildUnifiedWhitelistOverviewCard(guild, "remove");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (isUserMenu && customId === "wl_overview_do_add_user") {
    const targetUserId = interaction.values[0];
    if (targetUserId) {
      const targetUser = await client.users.fetch(targetUserId).catch(() => ({ id: targetUserId, username: targetUserId }));
      const card = buildUnifiedWhitelistTargetCard(guild, targetUser);
      await interaction.update({ components: [card], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  if (isUserMenu && customId === "wl_overview_do_remove_user") {
    const targetUserId = interaction.values[0];
    if (targetUserId) {
      antinukeManager.removeWhitelist(guildId, targetUserId);
      antiraidManager.removeWhitelist(guildId, targetUserId);
      automodManager.removeWhitelistedUser(guildId, targetUserId);
    }
    const updated = buildUnifiedWhitelistOverviewCard(guild, "main");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (customId === "wl_clear_all_systems") {
    antinukeManager.clearWhitelist(guildId);
    antiraidManager.clearWhitelist(guildId);
    automodManager.clearWhitelistedUsers(guildId);

    const updated = buildUnifiedWhitelistOverviewCard(guild, "main");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildUnifiedWhitelistTargetCard,
  buildUnifiedWhitelistOverviewCard,
  handleUnifiedWhitelistInteraction,
};
