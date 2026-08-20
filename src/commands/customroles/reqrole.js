const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const customRolesManager = require("../../lib/customRolesManager");

module.exports = {
  alias: ["reqrole", "crreq", "crrequired"],
  category: "Custom Roles",
  description: "Configure or view the required role to trigger custom role shortcuts.",
  usage: ".reqrole <@role|off>",

  async execute(client, message, args) {
    const crConfig = customRolesManager.getGuildConfig(client, message.guild.id);
    const isAdminOrManager =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    const input = args[0];

    if (!input) {
      const currentStr = crConfig.reqRole
        ? `<@&${crConfig.reqRole}>`
        : "`None` (Manage Roles default)";
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔒 Required Role Status\n` +
            `> - **Current ReqRole:** ${currentStr}\n\n` +
            `**Logic Rules:**\n` +
            `> • **With ReqRole:** Users need Admin, Manage Server, or <@&${crConfig.reqRole || "Role"}>.\n` +
            `> • **Without ReqRole:** Users need Admin, Manage Server, or Manage Roles permission.\n\n` +
            `-# *Syntax to change: \`.reqrole <@role|off>\`*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (!isAdminOrManager) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# *You need **Manage Server** or **Administrator** permission to change required roles.*`
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

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(input.replace(/\D/g, ""));
    if (!role) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Invalid Role\n` +
            `-# *Please mention a valid server role or provide a role ID.*`
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
          `-# *Members must now possess <@&${role.id}> (or Admin/Manage Server) to trigger custom role shortcuts.*`
      )
    );
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
