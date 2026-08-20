const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  RoleSelectMenuBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const EMOJIS = require("../emojis");
const customRolesManager = require("../customRolesManager");

async function handleCustomRoleInteraction(client, interaction) {
  const guild = interaction.guild;
  if (!guild) return false;

  // 1. Inspect Alias from Dropdown Select Menu
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "customrole_alias_select"
  ) {
    const selectedVal = interaction.values[0];
    if (!selectedVal || !selectedVal.startsWith("cr_inspect_")) {
      return false;
    }

    const parts = selectedVal.replace("cr_inspect_", "").split("_");
    const alias = parts[0];
    const roleId = parts[1];

    const role = guild.roles.cache.get(roleId);
    const crConfig = customRolesManager.getGuildConfig(client, interaction.guildId);
    const reqStr = crConfig.reqRole ? `<@&${crConfig.reqRole}>` : "`None` (Manage Roles)";

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# 🎭 Custom Role Alias Inspector\n` +
          `-# *Detailed configuration for trigger \`.${alias}\`*\n\n` +
          `### 📌 Alias Metadata\n` +
          `> - **Command Trigger:** \`.${alias} <@user>\`\n` +
          `> - **Target Role:** ${role ? `<@&${role.id}>` : "`Deleted Role`"}\n` +
          `> - **Role ID:** \`${roleId}\`\n` +
          `> - **ReqRole Security:** ${reqStr}\n` +
          `> - **Role Position:** \`#${role ? role.position : 0}\` (Highest: \`#${guild.members.me.roles.highest.position}\`)`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# *To assign or remove this role from a member, run: \`.${alias} @user\`*`
      )
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);

    return true;
  }

  // Admin Permission Check for Buttons / Modals
  const isAdminOrManager =
    interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  // 2. Remove Alias Button Clicked -> Present Remove Dropdown
  if (interaction.isButton() && interaction.customId === "cr_btn_remove_menu") {
    if (!isAdminOrManager) {
      await interaction.reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to remove custom roles.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const crConfig = customRolesManager.getGuildConfig(client, interaction.guildId);
    const aliases = Object.entries(crConfig.aliases || {});

    if (aliases.length === 0) {
      await interaction.reply({
        content: "ℹ️ No custom role aliases configured to remove.",
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
        `### 🗑️ Select a Custom Role Alias to Delete\n` +
          `-# *Choosing an alias from the select menu below will remove it immediately.*`
      )
    ).addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);

    return true;
  }

  // 3. Process Alias Removal from Select Menu
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "cr_remove_alias_select"
  ) {
    if (!isAdminOrManager) {
      await interaction.reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to remove custom roles.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const selectedVal = interaction.values[0];
    const alias = selectedVal.replace("cr_del_", "");

    customRolesManager.updateGuildConfig(client, interaction.guildId, (cfg) => {
      delete cfg.aliases[alias];
      return cfg;
    });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Alias Deleted\n` +
          `-# *Successfully removed custom role shortcut \`.${alias}\`.*`
      )
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);

    return true;
  }

  // 4. ReqRole Config Button Clicked -> Present Role Select Menu
  if (interaction.isButton() && interaction.customId === "cr_btn_reqrole_menu") {
    if (!isAdminOrManager) {
      await interaction.reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to configure required roles.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId("cr_reqrole_select")
      .setPlaceholder("🔒 Select a required role (or select none to reset)...");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔒 Select Required Role for Custom Roles\n` +
          `-# *Members will require this role (or Admin/Manage Server) to invoke role shortcuts.*`
      )
    ).addActionRowComponents(new ActionRowBuilder().addComponents(roleSelect));

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);

    return true;
  }

  // 5. Process ReqRole Selection from Role Select Menu
  if (
    interaction.isRoleSelectMenu() &&
    interaction.customId === "cr_reqrole_select"
  ) {
    if (!isAdminOrManager) {
      await interaction.reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to configure required roles.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const roleId = interaction.values[0];
    const role = guild.roles.cache.get(roleId);

    customRolesManager.updateGuildConfig(client, interaction.guildId, (cfg) => {
      cfg.reqRole = roleId;
      return cfg;
    });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} ReqRole Updated\n` +
          `-# *Members must now possess ${role ? `<@&${role.id}>` : `\`${roleId}\``} (or Admin/Manage Server) to trigger role aliases.*`
      )
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);

    return true;
  }

  // 6. Refresh Button Clicked -> Re-render Dashboard
  if (interaction.isButton() && interaction.customId === "cr_btn_refresh") {
    const crConfig = customRolesManager.getGuildConfig(client, interaction.guildId);
    const container = customRolesManager.buildDashboardContainer(guild, crConfig);

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    return true;
  }

  return false;
}

module.exports = { handleCustomRoleInteraction };
