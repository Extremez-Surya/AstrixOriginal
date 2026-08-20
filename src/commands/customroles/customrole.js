const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const customRolesManager = require("../../lib/customRolesManager");

module.exports = {
  alias: ["customrole", "crole", "cr", "customroles"],
  category: "Custom Roles",
  description: "Configure and manage custom role shortcuts and alias triggers.",
  usage:
    ".customrole <alias> <role> (Toggle)\n" +
    ".customrole add <alias> <role>\n" +
    ".customrole remove <alias>\n" +
    ".customrole view\n" +
    ".customrole reqrole <role|off>",

  async execute(client, message, args) {
    const crConfig = customRolesManager.getGuildConfig(client, message.guild.id);
    const subcommand = args[0]?.toLowerCase();
    const isView =
      !subcommand || subcommand === "view" || subcommand === "list";

    const isAdminOrManager =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    // VIEW / LIST DASHBOARD
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
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
              `-# *You need ${reqStr} or Admin permission to view custom role configuration.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const container = customRolesManager.buildDashboardContainer(message.guild, crConfig);
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // Admin-only management check
    if (!isAdminOrManager) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# *You need **Manage Server** or **Administrator** permission to alter custom roles.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // REQUIRED ROLE (reqrole)
    if (subcommand === "reqrole" || subcommand === "requiredrole") {
      const input = args[1];

      if (!input) {
        const currentStr = crConfig.reqRole
          ? `<@&${crConfig.reqRole}>`
          : "`None` (Manage Roles default)";
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔒 Required Role Configuration\n` +
              `> - **Current ReqRole:** ${currentStr}\n\n` +
              `**Logic Rules:**\n` +
              `> • **When ReqRole is set:** Members require \`Admin\` OR \`Manage Server\` OR \`ReqRole\` to invoke aliases.\n` +
              `> • **When ReqRole is disabled:** Members require \`Admin\` OR \`Manage Server\` OR \`Manage Roles\`.\n\n` +
              `-# *Use \`.customrole reqrole <role|off>\` to change.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
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
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.tick || "✅"} ReqRole Disabled\n` +
              `-# *Custom role triggers now require standard **Manage Roles** permission.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const role = customRolesManager.findRole(message.guild, input, message);
      if (!role) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Invalid Role\n` +
              `-# *Could not find role matching \`${input}\`. Please mention a role, provide a role ID, or type role name.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      customRolesManager.updateGuildConfig(client, message.guild.id, (cfg) => {
        cfg.reqRole = role.id;
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} ReqRole Updated\n` +
            `-# *Members must now possess <@&${role.id}> (or Admin/Manage Server) to trigger role aliases.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // REMOVE ALIAS
    if (
      subcommand === "remove" ||
      subcommand === "del" ||
      subcommand === "delete"
    ) {
      const alias = args[1]?.toLowerCase();
      if (!alias) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Invalid Usage\n` +
              `-# *Syntax: \`.customrole remove <alias>\`*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      if (!crConfig.aliases || !crConfig.aliases[alias]) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Alias Not Found\n` +
              `-# *The custom role alias \`.${alias}\` does not exist.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      customRolesManager.updateGuildConfig(client, message.guild.id, (cfg) => {
        delete cfg.aliases[alias];
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Alias Removed\n` +
            `-# *Successfully deleted custom role shortcut \`.${alias}\`.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // ADD ALIAS
    if (subcommand === "add") {
      const alias = args[1]?.toLowerCase();
      const roleInput = args[2];

      if (!alias || !roleInput) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Invalid Usage\n` +
              `-# *Syntax: \`.customrole add <alias> <roleName|@role|roleID>\`*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      if (customRolesManager.RESERVED_SUBCOMMANDS.includes(alias)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Reserved Word\n` +
              `-# *\`${alias}\` is a reserved system subcommand name and cannot be used as an alias.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const role = customRolesManager.findRole(message.guild, roleInput, message);
      if (!role) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Invalid Role\n` +
              `-# *Could not find role matching \`${roleInput}\`. Please mention a role, provide a role ID, or type role name.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      // Security Check: Dangerous Perms
      if (customRolesManager.checkDangerousPermissions(role)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🛡️ Security Block: Unsafe Role\n` +
              `-# *You cannot create aliases for roles with dangerous permissions (e.g., Administrator, Manage Roles, Ban Members, etc).*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      // Hierarchy Check
      const me = message.guild.members.me;
      if (role.position >= me.roles.highest.position) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Hierarchy Error\n` +
              `-# *I cannot manage <@&${role.id}> because it is higher than or equal to my highest role.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      customRolesManager.updateGuildConfig(client, message.guild.id, (cfg) => {
        cfg.aliases = cfg.aliases || {};
        cfg.aliases[alias] = role.id;
        return cfg;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Custom Role Alias Created\n` +
            `-# *Created shortcut \`.${alias}\` ➔ <@&${role.id}>*\n\n` +
            `> -# **Usage:** \`.${alias} <@user>\` to toggle role.`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // FALLBACK HELP
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎭 Custom Role Help & Commands\n` +
          `> • \`.customrole add <alias> <role>\` - Create a custom role alias\n` +
          `> • \`.customrole remove <alias>\` - Delete an existing alias\n` +
          `> • \`.customrole view\` - View all configured aliases & dropdown menu\n` +
          `> • \`.customrole reqrole <role|off>\` - Set required permission role`
      )
    );
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
