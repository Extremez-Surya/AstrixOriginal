const {
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const customRolesManager = require("../../lib/customRolesManager");
const { buildCustomRolesDashboard } = require("../../lib/customroles/handleCustomRoleInteraction");

module.exports = {
  alias: ["customrole", "crole", "cr", "customroles"],
  category: "Custom Roles",
  description: "Configure and manage custom role shortcuts, alias triggers and staff security.",
  usage:
    ".customrole <alias> <role> (Toggle)\n" +
    ".customrole add <alias> <role>\n" +
    ".customrole remove <alias>\n" +
    ".customrole view\n" +
    ".customrole reqrole <role|off>",

  async execute(client, message, args) {
    if (!message.guild) return;

    const crConfig = customRolesManager.getGuildConfig(client, message.guild.id);
    const subcommand = args[0]?.toLowerCase();
    const isView =
      !subcommand || subcommand === "view" || subcommand === "list" || subcommand === "dashboard";

    const isAdminOrManager =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    // 1. VIEW / LIST DASHBOARD
    if (isView) {
      const hasViewPerms =
        isAdminOrManager ||
        customRolesManager.hasCustomRolePermission(
          message.member,
          crConfig.reqRole
        );

      if (!hasViewPerms) {
        const reqStr = crConfig.reqRole
          ? `<@&${crConfig.reqRole}>`
          : "`Manage Roles`";
        return message.reply({
          content: `❌ You need ${reqStr} or Admin permission to view custom role configuration.`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      let activeTab = "overview";
      if (subcommand === "matrix" || subcommand === "list") activeTab = "matrix";

      const container = buildCustomRolesDashboard(message.guild, crConfig, activeTab);
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // Admin-only management check
    if (!isAdminOrManager) {
      return message.reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to alter custom roles.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    // 2. REQUIRED ROLE (reqrole)
    if (subcommand === "reqrole" || subcommand === "requiredrole") {
      const input = args[1];

      if (!input) {
        const container = buildCustomRolesDashboard(message.guild, crConfig, "reqrole");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }

      if (
        input.toLowerCase() === "off" ||
        input.toLowerCase() === "disable" ||
        input.toLowerCase() === "none"
      ) {
        customRolesManager.updateGuildConfig(client, message.guild.id, (cfg) => {
          cfg.reqRole = null;
          return cfg;
        });

        const freshConfig = customRolesManager.getGuildConfig(client, message.guild.id);
        const container = buildCustomRolesDashboard(message.guild, freshConfig, "reqrole");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }

      const role = await customRolesManager.findRole(message.guild, input, message);
      if (!role) {
        return message.reply({
          content: "⚠️ Invalid role. Please mention a valid server role or provide a role ID.",
        }).catch(() => null);
      }

      customRolesManager.updateGuildConfig(client, message.guild.id, (cfg) => {
        cfg.reqRole = role.id;
        return cfg;
      });

      const freshConfig = customRolesManager.getGuildConfig(client, message.guild.id);
      const container = buildCustomRolesDashboard(message.guild, freshConfig, "reqrole");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 3. ADD SHORTCUT
    if (subcommand === "add" || subcommand === "create" || subcommand === "set") {
      const rawAlias = args[1]?.toLowerCase().replace(/^\./, "");
      const roleInput = args.slice(2).join(" ");

      if (!rawAlias || !roleInput) {
        return message.reply({
          content: "⚠️ **Invalid Format.**\n*Usage:* `.customrole add <alias> <role>`\n*Example:* `.customrole add vip @VIP`",
        }).catch(() => null);
      }

      if (customRolesManager.RESERVED_SUBCOMMANDS.includes(rawAlias)) {
        return message.reply({
          content: `❌ \`${rawAlias}\` is a reserved command name. Please choose another alias.`,
        }).catch(() => null);
      }

      const role = await customRolesManager.findRole(message.guild, roleInput, message);
      if (!role) {
        return message.reply({
          content: `⚠️ Could not find role matching \`${roleInput}\`.`,
        }).catch(() => null);
      }

      if (customRolesManager.checkDangerousPermissions(role)) {
        return message.reply({
          content: "🛡️ **Security Block:** Roles with dangerous permissions (e.g. Administrator, Manage Server, Manage Roles) cannot be bound to shortcuts.",
        }).catch(() => null);
      }

      const me = message.guild.members.me;
      if (role.position >= me.roles.highest.position) {
        return message.reply({
          content: `❌ I cannot manage <@&${role.id}> because it is higher than or equal to my highest role.`,
        }).catch(() => null);
      }

      customRolesManager.updateGuildConfig(client, message.guild.id, (cfg) => {
        cfg.aliases[rawAlias] = role.id;
        return cfg;
      });

      const freshConfig = customRolesManager.getGuildConfig(client, message.guild.id);
      const container = buildCustomRolesDashboard(message.guild, freshConfig, "matrix");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 4. REMOVE SHORTCUT
    if (subcommand === "remove" || subcommand === "delete" || subcommand === "del") {
      const rawAlias = args[1]?.toLowerCase().replace(/^\./, "");
      if (!rawAlias) {
        return message.reply({
          content: "⚠️ Please specify an alias to remove.\n*Usage:* `.customrole remove <alias>`",
        }).catch(() => null);
      }

      if (!crConfig.aliases || !crConfig.aliases[rawAlias]) {
        return message.reply({
          content: `⚠️ Alias \`.${rawAlias}\` is not configured on this server.`,
        }).catch(() => null);
      }

      customRolesManager.updateGuildConfig(client, message.guild.id, (cfg) => {
        delete cfg.aliases[rawAlias];
        return cfg;
      });

      const freshConfig = customRolesManager.getGuildConfig(client, message.guild.id);
      const container = buildCustomRolesDashboard(message.guild, freshConfig, "matrix");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 5. DIRECT ALIAS BINDING SHORTCUT: .customrole <alias> <role>
    const directAlias = subcommand.replace(/^\./, "");
    const directRoleInput = args.slice(1).join(" ");

    if (directAlias && directRoleInput && !customRolesManager.RESERVED_SUBCOMMANDS.includes(directAlias)) {
      const role = await customRolesManager.findRole(message.guild, directRoleInput, message);
      if (role) {
        if (customRolesManager.checkDangerousPermissions(role)) {
          return message.reply({
            content: "🛡️ **Security Block:** Roles with dangerous permissions cannot be bound to shortcuts.",
          }).catch(() => null);
        }

        customRolesManager.updateGuildConfig(client, message.guild.id, (cfg) => {
          cfg.aliases[directAlias] = role.id;
          return cfg;
        });

        const freshConfig = customRolesManager.getGuildConfig(client, message.guild.id);
        const container = buildCustomRolesDashboard(message.guild, freshConfig, "matrix");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }
    }

    // Default: Return dashboard
    const container = buildCustomRolesDashboard(message.guild, crConfig, "overview");
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
  },
};
