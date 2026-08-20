const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");
const customRolesManager = require("../../lib/customRolesManager");

module.exports = {
  alias: ["rremove", "roleremove", "revokerole"],
  category: "Custom Roles",
  description: "Directly revoke a role from a target member.",
  usage: ".rremove <@user> <@role>",

  async execute(client, message, args) {
    const crConfig = customRolesManager.getGuildConfig(client, message.guild.id);
    const hasPerm = customRolesManager.hasCustomRolePermission(
      message.member,
      crConfig.reqRole
    );

    if (!hasPerm) {
      const reqStr = crConfig.reqRole
        ? `<@&${crConfig.reqRole}>`
        : "`Manage Roles`";
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# *You need ${reqStr} to revoke roles.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const userInput = args[0];
    const roleInput = args[1];

    if (!userInput || !roleInput) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Invalid Usage\n` +
            `-# *Syntax: \`.rremove <@user> <@role>\`*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const targetId = userInput.replace(/\D/g, "");
    const roleId = roleInput.replace(/\D/g, "");

    let targetMember = null;
    try {
      targetMember = await message.guild.members.fetch(targetId);
    } catch {}

    const role = message.guild.roles.cache.get(roleId);

    if (!targetMember || !role) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Invalid Member or Role\n` +
            `-# *Please specify a valid server member and role.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

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

    await targetMember.roles.remove(role, `Role revoked via .rremove by ${message.author.tag}`).catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Role Revoked\n` +
          `-# *Successfully revoked <@&${role.id}> from ${targetMember.user}.*`
      )
    );
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
