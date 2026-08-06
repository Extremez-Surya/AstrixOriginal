const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["roledelete", "deleterole", "delrole"],
  category: "Moderation",
  desc: "Delete a role from the server.",

  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const roleArg = args.join(" ");
    if (!roleArg) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Role Argument\n` +
            `-# *Usage: \`.roledelete <@role | role_id | role_name>\`*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
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
            `-# *Could not find role \`${roleArg}\` in this server.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Hierarchy Check Failed\n` +
            `-# *I cannot delete this role because it is higher than or equal to my highest role.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser: client.user,
      actionName: "Delete Role",
      detailsText: `Role: ${role.name} (${role.id})`,
      onConfirm: async () => {
        const roleName = role.name;
        await role.delete(`Deleted by ${message.author.tag}`).catch(() => {});

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:astrix:1527205612205903973> Role Deleted Successfully\n` +
                `-# *Successfully removed role **${roleName}** from the server.*`,
            ),
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
            ),
          );

        return message
          .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
          .catch(() => null);
      },
    });
  },
};
