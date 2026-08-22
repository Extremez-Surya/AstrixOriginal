const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["role"],
  category: "Moderation",
  desc: "Add or remove a role from a member.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Target User Required\n` +
          `-# *Please mention a user or provide a valid user ID.*\n\n` +
          `> - **Usage:** \`.role @user <role>\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const member = await message.guild.members
      .fetch(targetUser.id)
      .catch(() => null);
    if (!member) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Member Not Found\n` +
          `-# *This user is not currently in this server.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const roleArg = args.slice(1).join(" ");
    if (!roleArg) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Role Parameter Missing\n` +
          `-# *Please specify a role to add or remove.*`
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
          `### <:red_star:1539875482680696834> Role Not Found\n` +
          `-# *Could not find the specified role in this server.*`
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
          `### <:red_star:1539875482680696834> Hierarchy Check Failed\n` +
          `-# *I cannot manage this role because it is higher than or equal to my highest role.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const hasRole = member.roles.cache.has(role.id);
    const action = hasRole ? "Remove" : "Add";

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: `${action} Role`,
      detailsText: `Role: <@&${role.id}> (${role.name})`,
      onConfirm: async () => {
        if (hasRole) {
          await member.roles.remove(role);
        } else {
          await member.roles.add(role);
        }
      },
    });
  },
};
