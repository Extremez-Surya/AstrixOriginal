const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const customRolesManager = require("../../lib/customRolesManager");

module.exports = {
  alias: ["rremove", "revokerole", "takerole", "rrem"],
  category: "Custom Roles",
  description: "Directly remove a role from a target member.",
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
      const helpContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🎭 **Role Manager • Revoke Role**\n` +
            `-# Directly remove a server role from a target member\n\n` +
            `> **Command Syntax:** \`.rremove <@user> <@role>\`\n` +
            `> **Example:** \`.rremove @user @VIP\` or \`.rremove 123456789 987654321\`\n\n` +
            `-# Tip: Bind custom shortcuts via \`.customrole\` to toggle roles with 1-word commands!`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Custom Role Engine`)
        );

      return message.reply({
        components: [helpContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
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
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const me = message.guild.members.me;
    if (role.position >= me.roles.highest.position) {
      return message.reply({
        content: `❌ I cannot manage <@&${role.id}> because it is higher than or equal to my highest role.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    if (!targetMember.roles.cache.has(role.id)) {
      return message.reply({
        content: `⚠️ <@${targetMember.id}> does not have the <@&${role.id}> role.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    await targetMember.roles.remove(role, `Role revoked via .rremove by ${message.author.tag}`).catch(() => null);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎭 **Role Revoked • Custom Role Action**\n` +
          `-# Successfully removed role from target member\n\n` +
          `> • 👤 **Target Member:** <@${targetMember.id}> (\`${targetMember.user.tag}\`)\n` +
          `> • 🎭 **Role Revoked:** <@&${role.id}>\n` +
          `> • 🛡️ **Revoked By:** <@${message.author.id}>`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Custom Role Engine`)
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
