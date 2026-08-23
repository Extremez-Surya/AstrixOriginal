const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const customRolesManager = require("../../lib/customRolesManager");
const { buildCustomRolesDashboard } = require("../../lib/customroles/handleCustomRoleInteraction");

module.exports = {
  alias: ["reqrole", "crreq", "crrequired"],
  category: "Custom Roles",
  description: "Configure or view the required role to trigger custom role shortcuts.",
  usage: ".reqrole <@role|off>",

  async execute(client, message, args) {
    if (!message.guild) return;

    const crConfig = customRolesManager.getGuildConfig(client, message.guild.id);
    const isAdminOrManager =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    const input = args[0];

    if (!input) {
      const container = buildCustomRolesDashboard(message.guild, crConfig, "reqrole");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (!isAdminOrManager) {
      return message.reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to change required roles.",
        flags: MessageFlags.Ephemeral,
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
  },
};
