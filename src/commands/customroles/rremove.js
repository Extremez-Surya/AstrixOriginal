const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const customRolesManager = require("../../lib/customRolesManager");

module.exports = {
  alias: ["rremove", "revokerole", "takerole"],
  category: "Custom Roles",
  description: "Directly revoke a role from a target member.",
  usage: ".rremove <@user> <@role>",

  async execute(client, message, args) {
    if (!message.guild) return;

    const crConfig = customRolesManager.getGuildConfig(client, message.guild.id);
    const hasPerm = customRolesManager.hasCustomRolePermission(
      message.member,
      crConfig.reqRole
    );

    if (!hasPerm) {
      const reqStr = crConfig.reqRole
        ? `<@&${crConfig.reqRole}>`
        : "`Manage Roles`";
      return message.reply({
        content: `❌ You need ${reqStr} permission to revoke roles.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const userInput = args[0];
    const roleInput = args.slice(1).join(" ");

    if (!userInput || !roleInput) {
      return message.reply({
        content: "⚠️ **Invalid Usage.**\n*Syntax:* `.rremove <@user> <@role>`\n*Example:* `.rremove @user @VIP`",
      }).catch(() => null);
    }

    const targetId = userInput.replace(/\D/g, "");
    let targetMember = null;
    try {
      targetMember = await message.guild.members.fetch(targetId);
    } catch {}

    const role = await customRolesManager.findRole(message.guild, roleInput, message);

    if (!targetMember || !role) {
      return message.reply({
        content: "⚠️ Please specify a valid server member and role.",
      }).catch(() => null);
    }

    const me = message.guild.members.me;
    if (role.position >= me.roles.highest.position) {
      return message.reply({
        content: `❌ I cannot manage <@&${role.id}> because it is higher than or equal to my highest role.`,
      }).catch(() => null);
    }

    await targetMember.roles.remove(role, `Role revoked via .rremove by ${message.author.tag}`).catch(() => null);

    const container = new ContainerBuilder();

    const headerText =
      `### 🎭 **Role Revoked • Custom Role Action**\n` +
      `-# *Role has been successfully stripped from target member.*`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const details =
      `> • 👤 **Target Member:** <@${targetMember.id}> (\`${targetMember.user.tag}\`)\n` +
      `> • 🎭 **Role Revoked:** <@&${role.id}>\n` +
      `> • 🛡️ **Revoked By:** <@${message.author.id}>`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(details));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Custom Role Engine`)
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
  },
};
