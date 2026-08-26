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
  RoleSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} = require("discord.js");
const customRolesManager = require("../customRolesManager");
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
// 1. GLOBAL NAVIGATION DROPDOWN MENU
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesNavMenu(activeId = "overview") {
  return new StringSelectMenuBuilder()
    .setCustomId("cr_nav_menu")
    .setPlaceholder("🧭 Custom Roles Hub Navigation...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Control Center & Telemetry")
        .setValue("cr_nav_overview")
        .setDescription("Overview of role shortcuts & staff access controls")
        .setEmoji("🎭")
        .setDefault(activeId === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Active Shortcuts Matrix")
        .setValue("cr_nav_matrix")
        .setDescription("View, inspect, and manage configured role trigger aliases")
        .setEmoji("⚡")
        .setDefault(activeId === "matrix"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Create / Bind Role Shortcut")
        .setValue("cr_nav_create")
        .setDescription("Bind an easy keyword trigger to any server role")
        .setEmoji("➕")
        .setDefault(activeId === "create"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Required Role (ReqRole) Access")
        .setValue("cr_nav_reqrole")
        .setDescription("Define which staff role is authorized to invoke shortcuts")
        .setEmoji("🔒")
        .setDefault(activeId === "reqrole"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Anti-Bypass Guard & Hierarchy")
        .setValue("cr_nav_security")
        .setDescription("View dangerous permission blocks and anti-abuse safeguards")
        .setEmoji("🛡️")
        .setDefault(activeId === "security"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Guide")
        .setValue("cr_nav_commands")
        .setDescription("Full command syntax for .customrole, .radd, .rremove, .reqrole")
        .setEmoji("📖")
        .setDefault(activeId === "commands")
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OVERVIEW / CONTROL CENTER VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesOverviewView(guild, crConfig) {
  const container = new ContainerBuilder();
  const aliases = Object.entries(crConfig.aliases || {});

  let reqStatus = "*None (Manage Roles default)*";
  if (crConfig.reqRole) {
    const r = guild.roles.cache.get(crConfig.reqRole);
    reqStatus = r ? `<@&${r.id}>` : `\`${crConfig.reqRole}\``;
  }

  const headerText =
    `### 🎭 **Custom Roles • Control Suite**\n` +
    `-# Ultra-fast custom role shortcuts & interactive role management for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let shortcutsPreview = "";
  if (aliases.length > 0) {
    const list = aliases.slice(0, 4).map(([alias, roleId]) => {
      const r = guild.roles.cache.get(roleId);
      return `> • **\`.${alias}\`** ➔ ${r ? `<@&${r.id}>` : `\`${roleId}\``}`;
    });
    shortcutsPreview = `\n\n**Active Shortcuts Preview (${aliases.length}):**\n${list.join("\n")}`;
    if (aliases.length > 4) shortcutsPreview += `\n> ... *and ${aliases.length - 4} more (see Shortcuts Matrix).*`;
  } else {
    shortcutsPreview = "\n\n*No custom role shortcuts bound yet. Select an action below to create one.*";
  }

  const content =
    `> **System Status:** 🟢 \`ARMED & ACTIVE\` • **Configured Shortcuts:** \`${aliases.length}\` active\n` +
    `> **Required Role (ReqRole):** ${reqStatus}\n` +
    `> **Anti-Bypass Guard:** 🟢 \`PROTECTED\` (Admin / Dangerous permissions blocked)` +
    shortcutsPreview;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 1. Action Select Dropdown
  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("cr_overview_select_action")
    .setPlaceholder("⚡ Custom Role Actions (Create / Manage / Settings)...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Create / Bind Shortcut")
        .setValue("nav_create")
        .setDescription("Bind a keyword trigger (e.g. .vip) to a server role")
        .setEmoji("➕"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Active Shortcuts Matrix")
        .setValue("nav_matrix")
        .setDescription("Inspect, test, or delete configured role aliases")
        .setEmoji("⚡"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Configure Required Staff Role")
        .setValue("nav_reqrole")
        .setDescription("Set or remove staff role authorization for shortcuts")
        .setEmoji("🔒"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Anti-Bypass & Hierarchy Guard")
        .setValue("nav_security")
        .setDescription("Inspect role hierarchy and permission safeguards")
        .setEmoji("🛡️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Command Manual & Guide")
        .setValue("nav_commands")
        .setDescription("View full syntax reference for all custom role commands")
        .setEmoji("📖")
    );

  const actionRow = new ActionRowBuilder().addComponents(actionMenu);
  const navRow = new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("overview"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("cr_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(actionRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Custom Roles Engine`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACTIVE SHORTCUTS MATRIX VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesMatrixView(guild, crConfig) {
  const container = new ContainerBuilder();
  const aliases = Object.entries(crConfig.aliases || {});

  const headerText =
    `### ⚡ **Custom Roles • Active Shortcuts Matrix**\n` +
    `-# All configured keyword aliases bound to roles in **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let matrixFormatted = "";
  if (aliases.length > 0) {
    const list = aliases.map(([alias, roleId]) => {
      const r = guild.roles.cache.get(roleId);
      return `> • **\`.${alias} @user\`** ➔ ${r ? `<@&${r.id}>` : `\`${roleId}\``}`;
    });
    matrixFormatted = list.join("\n");
  } else {
    matrixFormatted = "*No custom role shortcuts active. Use Create Shortcut to bind one.*";
  }

  const content =
    `> **Total Active Shortcuts:** \`${aliases.length} / 25\`\n\n` +
    `**Registered Aliases:**\n${matrixFormatted}\n\n` +
    `-# Invoking a shortcut grants the role if missing, or revokes it if already owned.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (aliases.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("cr_matrix_alias_select")
      .setPlaceholder("🗑️ Select an alias to delete from server...")
      .addOptions(
        aliases.slice(0, 25).map(([alias, roleId]) => {
          const r = guild.roles.cache.get(roleId);
          return new StringSelectMenuOptionBuilder()
            .setLabel(`Delete: .${alias}`)
            .setValue(`delete_${alias}`)
            .setDescription(`Unbind shortcut for role: ${r?.name || roleId}`)
            .setEmoji("🗑️");
        })
      );
    container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));
  }

  const navRow = new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("matrix"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("cr_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Shortcuts Matrix`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CREATE SHORTCUT WIZARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesCreateView(guild) {
  const container = new ContainerBuilder();

  const headerText =
    `### ➕ **Custom Roles • Bind New Role Shortcut**\n` +
    `-# Bind a custom trigger command (e.g. \`.vip @user\` or \`.friend @user\`) to a role`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Step 1:** Select the target server role from the menu below.\n` +
    `> **Step 2:** A popup box will appear asking for your desired command keyword.\n` +
    `> **Step 3:** The command will be instantly usable by authorized staff!\n\n` +
    `-# Note: Roles with Administrator or dangerous permissions cannot be bound.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const roleMenu = new RoleSelectMenuBuilder()
    .setCustomId("cr_create_role_select")
    .setPlaceholder("🎭 Select a role to bind shortcut alias...");

  const menuRow = new ActionRowBuilder().addComponents(roleMenu);
  const navRow = new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("create"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("cr_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Create Shortcut`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. REQUIRED ROLE (REQROLE) VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesReqRoleView(guild, crConfig) {
  const container = new ContainerBuilder();
  let reqStatus = "*None configured (Manage Roles default)*";
  if (crConfig.reqRole) {
    const r = guild.roles.cache.get(crConfig.reqRole);
    reqStatus = r ? `<@&${r.id}>` : `\`${crConfig.reqRole}\``;
  }

  const headerText =
    `### 🔒 **Custom Roles • Required Staff Role (ReqRole)**\n` +
    `-# Restrict custom role shortcuts to members holding a specific staff role`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **Current ReqRole:** ${reqStatus}\n` +
    `> **Permission Logic:** If set, only members with this role (or Administrators) can execute shortcuts.\n\n` +
    `-# Select a role below to set ReqRole, or click Disable to restore default.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const roleMenu = new RoleSelectMenuBuilder()
    .setCustomId("cr_reqrole_select")
    .setPlaceholder("🔒 Select Required Role for Custom Roles...");

  const menuRow = new ActionRowBuilder().addComponents(roleMenu);
  const navRow = new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("reqrole"));

  const disableBtn = new ButtonBuilder()
    .setCustomId("cr_btn_disable_reqrole")
    .setLabel("Disable ReqRole")
    .setEmoji("🔓")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!crConfig.reqRole);

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(disableBtn, cpBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • ReqRole Config`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SECURITY & ANTI-BYPASS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesSecurityView(guild, crConfig) {
  const container = new ContainerBuilder();

  const headerText =
    `### 🛡️ **Custom Roles • Anti-Bypass Guard & Hierarchy**\n` +
    `-# Automated security layers preventing privilege escalation and role abuse`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `> **🛡️ Dangerous Permission Filter:** 🟢 \`ARMED & ENFORCED\`\n` +
    `> • Roles with Administrator, Manage Server, Ban Members, or Manage Roles cannot be bound.\n\n` +
    `> **👑 Role Hierarchy Enforcer:** 🟢 \`ACTIVE\`\n` +
    `> • Bot strictly refuses to grant roles higher than or equal to its own highest role.\n\n` +
    `> **⚡ Anti-Loop Execution:** 🟢 \`PROTECTED\`\n` +
    `> • Commands execute under sub-0.1s transactional locks to prevent duplicate assignments.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("security"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("cr_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn, refreshBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Safeguards`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMMAND MANUAL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesCommandsManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **Custom Roles • Command Manual & Quick Syntax**\n` +
    `-# Full reference guide for custom role management commands and subcommands`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**🎭 Core Management Commands**\n` +
    `> • \`.customrole\` — Open interactive Control Center\n` +
    `> • \`.customrole add <alias> <role>\` — Create a new role shortcut\n` +
    `> • \`.customrole remove <alias>\` — Delete an existing role shortcut\n` +
    `> • \`.customrole reqrole <role|off>\` — Set or clear required staff role\n\n` +
    `**⚡ Direct Role Commands**\n` +
    `> • \`.<alias> @user\` — Toggle bound role on target member\n` +
    `> • \`.radd @user @role\` — Directly grant a role to member\n` +
    `> • \`.rremove @user @role\` — Directly revoke a role from member`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("commands"));

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Documentation`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. DASHBOARD DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesDashboard(guild, crConfig, activeTab = "overview") {
  switch (activeTab) {
    case "matrix":
      return buildCustomRolesMatrixView(guild, crConfig);
    case "create":
      return buildCustomRolesCreateView(guild);
    case "reqrole":
      return buildCustomRolesReqRoleView(guild, crConfig);
    case "security":
      return buildCustomRolesSecurityView(guild, crConfig);
    case "commands":
      return buildCustomRolesCommandsManualView();
    case "overview":
    default:
      return buildCustomRolesOverviewView(guild, crConfig);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. INTERACTION ROUTER
// ─────────────────────────────────────────────────────────────────────────────
async function handleCustomRoleInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isRoleMenu = interaction.isRoleSelectMenu();
  const isModalSubmit = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isRoleMenu && !isModalSubmit) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("cr_") && !customId.startsWith("customrole_")) return false;

  if (!interaction.guild) return false;

  if (!isAuthorized(client, interaction.member, interaction.guild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** or **Administrator** permissions to configure Custom Roles.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guild = interaction.guild;
  const guildId = guild.id;
  let crConfig = customRolesManager.getGuildConfig(client, guildId);

  // 1. Navigation Menu
  if (isMenu && customId === "cr_nav_menu") {
    const selected = interaction.values[0];
    const targetTab = selected.replace("cr_nav_", "");
    const updated = buildCustomRolesDashboard(guild, crConfig, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 1.2 Overview Action Select
  if (isMenu && customId === "cr_overview_select_action") {
    const selected = interaction.values[0];
    const targetTab = selected.replace("nav_", "");
    const updated = buildCustomRolesDashboard(guild, crConfig, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 2. Direct Navigation Buttons
  if (isBtn && customId.startsWith("cr_nav_")) {
    const targetTab = customId.replace("cr_nav_", "");
    const updated = buildCustomRolesDashboard(guild, crConfig, targetTab);
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 3. Matrix Alias Delete Select Menu
  if (isMenu && customId === "cr_matrix_alias_select") {
    const val = interaction.values[0];
    if (val.startsWith("delete_")) {
      const alias = val.replace("delete_", "");
      customRolesManager.updateGuildConfig(client, guildId, (cfg) => {
        if (cfg.aliases && cfg.aliases[alias]) {
          delete cfg.aliases[alias];
        }
        return cfg;
      });
      const freshConfig = customRolesManager.getGuildConfig(client, guildId);
      const updated = buildCustomRolesDashboard(guild, freshConfig, "matrix");
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // 4. Role Select for Shortcut Creation
  if (isRoleMenu && customId === "cr_create_role_select") {
    const selectedRoleId = interaction.values[0];
    const role = guild.roles.cache.get(selectedRoleId);

    if (!role) {
      await interaction.reply({ content: "❌ Invalid role selected.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    const me = guild.members.me;
    if (role.position >= me.roles.highest.position) {
      await interaction.reply({
        content: `❌ I cannot manage <@&${role.id}> because it is higher than or equal to my highest role in the server hierarchy.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const isGuildOwner = interaction.user.id === guild.ownerId;
    if (!isGuildOwner && customRolesManager.checkDangerousPermissions(role)) {
      await interaction.reply({
        content: "🛡️ **Security Alert:** Only the Server Owner can bind roles with Administrator / Dangerous permissions.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const modal = new ModalBuilder()
      .setCustomId(`cr_modal_submit_create_${role.id}`)
      .setTitle(`Bind Shortcut: @${role.name.slice(0, 20)}`);

    const aliasInput = new TextInputBuilder()
      .setCustomId("cr_alias_name")
      .setLabel("Shortcut Command Name (without dot)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. vip, friend, verified, member")
      .setRequired(true)
      .setMaxLength(30);

    modal.addComponents(new ActionRowBuilder().addComponents(aliasInput));
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // 5. Role Select for ReqRole
  if (isRoleMenu && customId === "cr_reqrole_select") {
    const selectedRoleId = interaction.values[0];
    customRolesManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.reqRole = selectedRoleId;
      return cfg;
    });

    const freshConfig = customRolesManager.getGuildConfig(client, guildId);
    const updated = buildCustomRolesDashboard(guild, freshConfig, "reqrole");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 6. Disable ReqRole Button
  if (customId === "cr_btn_disable_reqrole") {
    customRolesManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.reqRole = null;
      return cfg;
    });

    const freshConfig = customRolesManager.getGuildConfig(client, guildId);
    const updated = buildCustomRolesDashboard(guild, freshConfig, "reqrole");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // 7. Modal Submission for Shortcut Creation
  if (isModalSubmit && customId.startsWith("cr_modal_submit_create_")) {
    const roleId = customId.replace("cr_modal_submit_create_", "");
    const alias = interaction.fields.getTextInputValue("cr_alias_name")?.trim().toLowerCase();

    if (!alias || alias.includes(" ")) {
      await interaction.reply({
        content: "❌ Shortcut command name cannot contain spaces.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (customRolesManager.RESERVED_SUBCOMMANDS.includes(alias)) {
      await interaction.reply({
        content: `❌ Alias \`.${alias}\` is a reserved system command keyword.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    customRolesManager.updateGuildConfig(client, guildId, (cfg) => {
      if (!cfg.aliases) cfg.aliases = {};
      cfg.aliases[alias] = roleId;
      return cfg;
    });

    await interaction.reply({
      content: `✅ Custom role shortcut created!\n> You can now run **\`.${alias} @user\`** to instantly toggle <@&${roleId}> on members.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 8. Refresh Button
  if (customId === "cr_btn_refresh") {
    const freshConfig = customRolesManager.getGuildConfig(client, guildId);
    const updated = buildCustomRolesDashboard(guild, freshConfig, "overview");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildCustomRolesNavMenu,
  buildCustomRolesOverviewView,
  buildCustomRolesMatrixView,
  buildCustomRolesCreateView,
  buildCustomRolesReqRoleView,
  buildCustomRolesSecurityView,
  buildCustomRolesCommandsManualView,
  buildCustomRolesDashboard,
  handleCustomRoleInteraction,
};
