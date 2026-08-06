const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["roleall"],
  category: "Moderation",
  desc: "Add or remove a role for all members in the server.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    if (action !== "add" && action !== "remove") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Action Specified Required\n` +
          `-# *Please specify the action: \`add\` or \`remove\`.*\n\n` +
          `> - **Usage:** \`.roleall <add | remove> <role> [all | humans | bots]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const roleArg = args[1];
    if (!roleArg) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Role Specified Required\n` +
          `-# *Please specify the role to assign/remove.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(roleArg.replace(/[<@&>]/g, "")) ||
      message.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === roleArg.toLowerCase(),
      );

    if (!role) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Role Not Found\n` +
          `-# *Role not found in this server.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Hierarchy Check Failed\n` +
          `-# *I cannot manage this role because it is higher than or equal to my highest role.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const targetType = args[2]?.toLowerCase() || "all";
    if (
      targetType !== "all" &&
      targetType !== "humans" &&
      targetType !== "bots"
    ) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Invalid Target Type\n` +
          `-# *Invalid target type. Use: \`all\`, \`humans\`, or \`bots\`.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser: client.user,
      actionName: `RoleAll (${action.toUpperCase()})`,
      detailsText: `Role: <@&${role.id}> (${role.name}) | Target: ${targetType.toUpperCase()}`,
      onConfirm: async () => {
        let members = await message.guild.members.fetch();
        if (targetType === "humans") {
          members = members.filter((m) => !m.user.bot);
        } else if (targetType === "bots") {
          members = members.filter((m) => m.user.bot);
        }

        for (const [id, member] of members) {
          try {
            if (action === "add") {
              if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
              }
            } else {
              if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
              }
            }
          } catch (e) {}
        }
      },
    });
  },
};
