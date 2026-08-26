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
  if (client.developer && Array.isArray(client.developer) && client.developer.includes(member.id)) return true;
  if (noprefixManager && typeof noprefixManager.isOwner === "function" && noprefixManager.isOwner(member.id, client)) return true;
  if (antinukeManager && typeof antinukeManager.isExtraOwner === "function" && antinukeManager.isExtraOwner(guild.id, member.id)) return true;
  if (member.permissions && typeof member.permissions.has === "function") {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  }
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
    `### 📋 **Astrix Whitelist • Target Configuration**\n` +
    `-# Configure security bypass permissions for <@${targetId}>`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const statusText =
    `> **👤 Target Operator:** <@${targetId}> (\`${targetId}\`)\n` +
    `> 🔒 **Anti-Nuke:** ${isAnWl ? "`🟢 ARMED BYPASS`" : "`🔴 NO BYPASS`"} • 🛡️ **Anti-Raid:** ${isArWl ? "`🟢 ARMED BYPASS`" : "`🔴 NO BYPASS`"}\n` +
    `> 🤖 **AutoMod:** ${isAmWl ? "`🟢 ARMED BYPASS`" : "`🔴 NO BYPASS`"}\n\n` +
    `-# Select an option below to update security permissions for this user.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Multi-System Selection Dropdown
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`wl_select_systems_${targetId}`)
    .setPlaceholder("⚡ Choose Whitelist Configuration...")
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
  const backBtn = new ButtonBuilder()
    .setCustomId("wl_overview_back")
    .setLabel("Whitelist Directory")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(backBtn, cpBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Target Whitelist Manager`));

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

  const formatInline = (list) =>
    list.length > 0 ? list.map((id) => `<@${id}>`).join(", ") : "*None*";

  const headerText =
    `### 📋 **Astrix Security • Universal Whitelist Directory**\n` +
    `-# Centralized trusted operator directory across security engines for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> 🔒 **Anti-Nuke Whitelist (${anWl.length}):** ${formatInline(anWl)}\n` +
    `> 🛡️ **Anti-Raid Whitelist (${arWl.length}):** ${formatInline(arWl)}\n` +
    `> 🤖 **AutoMod Whitelist (${amWl.length}):** ${formatInline(amWl)}\n\n` +
    `-# Whitelisted operators bypass automated security bans, raid filters, and chat restrictions.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (subTab === "add") {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId("wl_overview_do_add_user")
      .setPlaceholder("➕ Select user to configure whitelist systems...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(userMenu));
  } else if (subTab === "remove") {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId("wl_overview_do_remove_user")
      .setPlaceholder("➖ Select user to remove from all whitelists...");
    container.addActionRowComponents(new ActionRowBuilder().addComponents(userMenu));
  }

  // 1. Whitelist Action Select Dropdown (Add / Remove / Clear)
  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("wl_overview_select_action")
    .setPlaceholder("⚡ Whitelist Directory Actions (Add / Remove / Reset)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Configure / Add User Whitelist")
        .setValue("action_add")
        .setDescription("Select a user to grant multi-system bypass permissions")
        .setEmoji("➕")
        .setDefault(subTab === "add"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Remove User from Whitelists")
        .setValue("action_remove")
        .setDescription("Select a user to revoke all bypass permissions")
        .setEmoji("➖")
        .setDefault(subTab === "remove"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Reset All Security Whitelists")
        .setValue("action_reset_all")
        .setDescription("Wipe all whitelisted users across Anti-Nuke, Anti-Raid & AutoMod")
        .setEmoji("🧹")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);

  // 2. Clean 2-button control row
  const refreshBtn = new ButtonBuilder()
    .setCustomId("wl_overview_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const cpBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(refreshBtn, cpBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Unified Trust Directory`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERACTION ROUTER FOR UNIFIED WHITELIST
// ─────────────────────────────────────────────────────────────────────────────
async function handleUnifiedWhitelistInteraction(client, interaction) {
  try {
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

    // Overview Action Selection Dropdown
    if (isMenu && customId === "wl_overview_select_action") {
      const val = interaction.values[0];
      if (val === "action_add") {
        const updated = buildUnifiedWhitelistOverviewCard(guild, "add");
        await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        return true;
      }
      if (val === "action_remove") {
        const updated = buildUnifiedWhitelistOverviewCard(guild, "remove");
        await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        return true;
      }
      if (val === "action_reset_all") {
        antinukeManager.clearWhitelist(guildId);
        antiraidManager.clearWhitelist(guildId);
        automodManager.clearWhitelistedUsers(guildId);
        const updated = buildUnifiedWhitelistOverviewCard(guild, "main");
        await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        return true;
      }
    }

    if (isBtn && (customId === "wl_overview_back" || customId === "wl_overview_refresh")) {
      const updated = buildUnifiedWhitelistOverviewCard(guild, "main");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

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

    // 2. Overview User Select Menus
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
  } catch (err) {
    console.error("[handleUnifiedWhitelistInteraction] Error:", err);
    return false;
  }
}

module.exports = {
  buildUnifiedWhitelistTargetCard,
  buildUnifiedWhitelistOverviewCard,
  handleUnifiedWhitelistInteraction,
};
