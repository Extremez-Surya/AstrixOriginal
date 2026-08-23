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
    .setPlaceholder("🧭 Custom Roles Control Suite Navigation...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Control Center & Telemetry")
        .setValue("cr_nav_overview")
        .setDescription("Overview of role shortcuts, reqrole access & security status")
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
        .setLabel("Required Role (ReqRole) Security")
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
    `### 🎭 **Astrix Custom Roles Control Suite**\n` +
    `-# *Ultra-fast custom role shortcuts & interactive role management for **${guild.name}***`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const statusHeadline = `### 🟢 **Status: Custom Roles System Active**\n> Sub-0.1s role allocation engine with real-time privilege & hierarchy protection.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusHeadline));

  const telemetryText =
    `**📊 System Telemetry & Access Controls:**\n` +
    `> • 🔒 **Required Role (ReqRole):** ${reqStatus}\n` +
    `> • ⚡ **Configured Shortcuts:** \`${aliases.length}\` role aliases active\n` +
    `> • 🛡️ **Anti-Bypass Guard:** 🟢 \`ARMED\` (Dangerous permissions blocked)\n` +
    `> • 🚀 **Quick Invocation:** \`.<alias> @user\` *(Instantly grants or revokes role)*\n\n` +
    `💡 *Select a module from the dropdown below or use the quick action buttons to customize.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(telemetryText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let shortcutsText = "";
  if (aliases.length > 0) {
    const list = aliases.slice(0, 6).map(([alias, roleId]) => {
      const r = guild.roles.cache.get(roleId);
      return `> • **\` .${alias} \`** ➔ ${r ? `<@&${r.id}>` : `\`${roleId}\``}`;
    });
    shortcutsText = `**📋 Configured Shortcuts Preview:**\n${list.join("\n")}`;
    if (aliases.length > 6) shortcutsText += `\n> ... *and ${aliases.length - 6} more (see Matrix tab).*`;
  } else {
    shortcutsText = `*No custom role aliases configured yet. Click **Create Shortcut** below to bind one.*`;
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(shortcutsText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const navRow = new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("overview"));

  const createBtn = new ButtonBuilder()
    .setCustomId("cr_nav_create")
    .setLabel("Create Shortcut")
    .setEmoji("➕")
    .setStyle(ButtonStyle.Success);

  const matrixBtn = new ButtonBuilder()
    .setCustomId("cr_nav_matrix")
    .setLabel("Shortcuts Matrix")
    .setEmoji("⚡")
    .setStyle(ButtonStyle.Primary);

  const reqRoleBtn = new ButtonBuilder()
    .setCustomId("cr_nav_reqrole")
    .setLabel("ReqRole Config")
    .setEmoji("🔒")
    .setStyle(ButtonStyle.Secondary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("cr_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(createBtn, matrixBtn, reqRoleBtn, refreshBtn);

  container.addActionRowComponents(navRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACTIVE SHORTCUTS MATRIX VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesMatrixView(guild, crConfig) {
  const container = new ContainerBuilder();
  const aliases = Object.entries(crConfig.aliases || {});

  const headerText =
    `### ⚡ **Active Role Shortcuts Matrix**\n` +
    `-# All active trigger aliases mapped to server roles. Members can execute \`.<alias> @user\` to toggle.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let listStr = "";
  if (aliases.length > 0) {
    listStr = aliases.map(([alias, roleId], i) => {
      const r = guild.roles.cache.get(roleId);
      const rName = r ? `<@&${r.id}>` : `\`Deleted Role (${roleId})\``;
      const pos = r ? `#${r.position}` : "N/A";
      return `> \`${i + 1}.\` **Trigger:** \`.${alias}\` ➔ ${rName} • Position: \`${pos}\``;
    }).join("\n");
  } else {
    listStr = "> *No custom role aliases configured yet.*";
  }

  const content =
    `**📋 Configured Shortcuts (${aliases.length}):**\n${listStr}\n\n` +
    `💡 *Command Syntax:* \`.customrole add <alias> <role>\` • \`.customrole remove <alias>\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (aliases.length > 0) {
    const selectOptions = aliases.slice(0, 25).map(([alias, roleId]) => {
      const role = guild.roles.cache.get(roleId);
      return new StringSelectMenuOptionBuilder()
        .setLabel(`Inspect .${alias}`)
        .setValue(`cr_inspect_${alias}_${roleId}`)
        .setDescription(`Role: ${role ? role.name : roleId}`)
        .setEmoji("🎭");
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("customrole_alias_select")
      .setPlaceholder("🔍 Select an alias to inspect details...")
      .addOptions(selectOptions);

    container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));
  }

  const createBtn = new ButtonBuilder()
    .setCustomId("cr_nav_create")
    .setLabel("Create Shortcut")
    .setEmoji("➕")
    .setStyle(ButtonStyle.Success);

  const deleteBtn = new ButtonBuilder()
    .setCustomId("cr_btn_remove_menu")
    .setLabel("Delete Shortcut")
    .setEmoji("🗑️")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(aliases.length === 0);

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(createBtn, deleteBtn, cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("matrix")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CREATE / BIND SHORTCUT VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesCreateView(guild) {
  const container = new ContainerBuilder();

  const headerText =
    `### ➕ **Create & Bind New Role Shortcut**\n` +
    `-# Select a server role from the role picker below, then enter a custom trigger alias.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**🎯 Role Binding Instructions:**\n` +
    `> 1. Select the target server role from the **Role Picker** below.\n` +
    `> 2. Enter a short, easy-to-remember trigger name (e.g. \`vip\`, \`member\`, \`mod\`, \`friend\`).\n` +
    `> 3. Once bound, staff members can simply run \`.<alias> @user\` to grant or remove that role instantly!\n\n` +
    `🛡️ *Note: Roles with Administrator or dangerous permissions cannot be bound for security reasons.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const roleMenu = new RoleSelectMenuBuilder()
    .setCustomId("cr_bind_select_role")
    .setPlaceholder("🎭 Select a role to bind shortcut alias...");

  const menuRow = new ActionRowBuilder().addComponents(roleMenu);

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("create")));
  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. REQUIRED ROLE (REQROLE) VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesReqRoleView(guild, crConfig) {
  const container = new ContainerBuilder();

  let reqStatus = "*None (Manage Roles default)*";
  if (crConfig.reqRole) {
    const r = guild.roles.cache.get(crConfig.reqRole);
    reqStatus = r ? `<@&${r.id}>` : `\`${crConfig.reqRole}\``;
  }

  const headerText =
    `### 🔒 **Required Role (ReqRole) Security Configuration**\n` +
    `-# Define which staff role is authorized to execute custom role triggers and shortcuts.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**⚙️ Current ReqRole Status:**\n` +
    `> • 🔒 **Authorized Staff Role:** ${reqStatus}\n\n` +
    `**🛡️ Access Hierarchy Rules:**\n` +
    `> • **When ReqRole is configured:** Members require \`Administrator\`, \`Manage Server\`, OR the designated **ReqRole** to execute shortcuts.\n` +
    `> • **When ReqRole is disabled:** Standard Discord **Manage Roles** permission is required.\n\n` +
    `💡 *Select a new required role from the menu below or click Disable.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const roleMenu = new RoleSelectMenuBuilder()
    .setCustomId("cr_reqrole_select")
    .setPlaceholder("🔒 Select Required Role for Custom Roles...");

  const menuRow = new ActionRowBuilder().addComponents(roleMenu);

  const disableBtn = new ButtonBuilder()
    .setCustomId("cr_reqrole_disable")
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

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("reqrole")));
  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ANTI-BYPASS GUARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesSecurityView(guild, crConfig) {
  const container = new ContainerBuilder();

  const headerText =
    `### 🛡️ **Anti-Bypass Guard & Hierarchy Safeguards**\n` +
    `-# Real-time security layer preventing privilege escalation and malicious role abuse.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `**🛡️ Active Defense Mechanisms:**\n` +
    `> • ⛔ **Dangerous Permissions Block:** Roles granting \`Administrator\`, \`Manage Server\`, \`Manage Roles\`, \`Ban Members\`, etc., are strictly blocked from being bound to shortcuts.\n` +
    `> • 📊 **Role Hierarchy Enforcement:** The bot strictly respects role positions. It cannot grant roles above or equal to its own highest role.\n` +
    `> • 🚨 **Anti-Bypass Penalty:** Unauthorized spam attempts to invoke role aliases without permission result in automatic security timeouts.\n` +
    `> • ⚡ **Execution Speed:** All checks run in under **0.1 seconds** before granting.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("security")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMMAND MANUAL VIEW
// ─────────────────────────────────────────────────────────────────────────────
function buildCustomRolesCommandsManualView() {
  const container = new ContainerBuilder();

  const headerText =
    `### 📖 **Custom Roles Command Manual**\n` +
    `-# Complete reference guide for all Custom Role shortcut commands and management tools.`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const content =
    `🎭 **Custom Role Commands:**\n` +
    `> • \`.customrole\` / \`.customrole view\` — Open interactive Control Center\n` +
    `> • \`.customrole add <alias> <role>\` — Create a new role trigger shortcut\n` +
    `> • \`.customrole remove <alias>\` — Delete an existing role shortcut\n` +
    `> • \`.<alias> @user\` — Instantly toggle/assign role to member\n\n` +
    `🔒 **Access & Direct Management:**\n` +
    `> • \`.reqrole <@role|off>\` — Configure authorized staff role\n` +
    `> • \`.radd <@user> <@role>\` — Directly assign role to member\n` +
    `> • \`.rremove <@user> <@role>\` — Directly revoke role from member\n\n` +
    `> **Aliases:** \`customrole\`, \`crole\`, \`cr\` • \`reqrole\`, \`crreq\` • \`radd\`, \`grantrole\` • \`rremove\`, \`revokerole\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const cpBtn = new ButtonBuilder()
    .setCustomId("cr_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary);

  const btnRow = new ActionRowBuilder().addComponents(cpBtn);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buildCustomRolesNavMenu("commands")));
  container.addActionRowComponents(btnRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL CONTAINER DISPATCHER
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
// INTERACTION ROUTER FOR CUSTOM ROLES
// ─────────────────────────────────────────────────────────────────────────────
async function handleCustomRoleInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isRoleMenu = interaction.isRoleSelectMenu();
  const isModalSubmit = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isRoleMenu && !isModalSubmit) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("cr_") && !customId.startsWith("customrole_")) return false;

  const guild = interaction.guild;
  if (!guild) return false;

  if (!isAuthorized(client, interaction.member, guild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to configure custom roles.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guildId = guild.id;
  const crConfig = customRolesManager.getGuildConfig(client, guildId);

  // 1. Navigation Menu
  if (isMenu && customId === "cr_nav_menu") {
    const selected = interaction.values[0];
    const targetTab = selected.replace("cr_nav_", "");
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

  // 3. Inspect Alias from Dropdown
  if (isMenu && customId === "customrole_alias_select") {
    const selectedVal = interaction.values[0];
    if (selectedVal && selectedVal.startsWith("cr_inspect_")) {
      const parts = selectedVal.replace("cr_inspect_", "").split("_");
      const alias = parts[0];
      const roleId = parts[1];

      const role = guild.roles.cache.get(roleId);
      const reqStr = crConfig.reqRole ? `<@&${crConfig.reqRole}>` : "*None (Manage Roles)*";

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎭 **Custom Role Alias Inspector: \`.${alias}\`**\n\n` +
          `> • **Command Trigger:** \`.${alias} <@user>\`\n` +
          `> • **Target Role:** ${role ? `<@&${role.id}>` : `\`Deleted Role (${roleId})\``}\n` +
          `> • **Role ID:** \`${roleId}\`\n` +
          `> • **Role Position:** \`#${role ? role.position : 0}\`\n` +
          `> • **Required Role (ReqRole):** ${reqStr}\n\n` +
          `💡 *Execute \`.${alias} @user\` in chat to grant or revoke this role.*`
        )
      );

      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }
  }

  // 4. Remove Menu Button
  if (customId === "cr_btn_remove_menu") {
    const aliases = Object.entries(crConfig.aliases || {});
    if (aliases.length === 0) {
      await interaction.reply({
        content: "ℹ️ No custom role aliases configured to delete.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const selectOptions = aliases.slice(0, 25).map(([alias, roleId]) => {
      const role = guild.roles.cache.get(roleId);
      return new StringSelectMenuOptionBuilder()
        .setLabel(`Delete .${alias}`)
        .setValue(`cr_del_${alias}`)
        .setDescription(`Role: ${role ? role.name : roleId}`)
        .setEmoji("🗑️");
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("cr_remove_alias_select")
      .setPlaceholder("🗑️ Select an alias to delete...")
      .addOptions(selectOptions);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🗑️ **Delete Custom Role Alias**\n-# Select the alias you want to remove:`
      )
    ).addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  if (isMenu && customId === "cr_remove_alias_select") {
    const selectedVal = interaction.values[0];
    const alias = selectedVal.replace("cr_del_", "");

    customRolesManager.updateGuildConfig(client, guildId, (cfg) => {
      delete cfg.aliases[alias];
      return cfg;
    });

    await interaction.reply({
      content: `✅ Custom role shortcut \`.${alias}\` deleted successfully!`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 5. Bind Role Picker -> Modal for Alias Name
  if (isRoleMenu && customId === "cr_bind_select_role") {
    const roleId = interaction.values[0];
    const role = guild.roles.cache.get(roleId);

    if (!role) {
      await interaction.reply({ content: "❌ Invalid role selected.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    if (customRolesManager.checkDangerousPermissions(role)) {
      await interaction.reply({
        content: "🛡️ **Security Block:** Roles with dangerous permissions (e.g. Administrator, Manage Server, Manage Roles) cannot be bound to shortcuts.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const modal = new ModalBuilder()
      .setCustomId(`cr_modal_submit_bind_${roleId}`)
      .setTitle(`Bind Shortcut for @${role.name.slice(0, 30)}`);

    const input = new TextInputBuilder()
      .setCustomId("alias_name")
      .setLabel("Shortcut Alias Trigger (without dot)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. vip, friend, member, mod")
      .setRequired(true)
      .setMaxLength(30);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // 6. Modal Submission for Binding
  if (isModalSubmit && customId.startsWith("cr_modal_submit_bind_")) {
    const roleId = customId.replace("cr_modal_submit_bind_", "");
    const rawAlias = interaction.fields.getTextInputValue("alias_name")?.trim().toLowerCase().replace(/^\./, "");

    if (!rawAlias || customRolesManager.RESERVED_SUBCOMMANDS.includes(rawAlias)) {
      await interaction.reply({
        content: `❌ \`${rawAlias}\` is a reserved command name. Please choose another alias.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    customRolesManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.aliases[rawAlias] = roleId;
      return cfg;
    });

    await interaction.reply({
      content: `✅ Successfully created custom role shortcut \`.${rawAlias}\` ➔ <@&${roleId}>!`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 7. ReqRole Select Menu
  if (isRoleMenu && customId === "cr_reqrole_select") {
    const roleId = interaction.values[0];
    const role = guild.roles.cache.get(roleId);

    customRolesManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.reqRole = roleId;
      return cfg;
    });

    await interaction.reply({
      content: `✅ ReqRole updated: Members now require ${role ? `<@&${role.id}>` : `\`${roleId}\``} to invoke shortcuts.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  if (customId === "cr_reqrole_disable") {
    customRolesManager.updateGuildConfig(client, guildId, (cfg) => {
      cfg.reqRole = null;
      return cfg;
    });

    const freshConfig = customRolesManager.getGuildConfig(client, guildId);
    const updated = buildCustomRolesDashboard(guild, freshConfig, "reqrole");
    await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
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
