const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "role",
  category: "Moderation",
  description: "Add or remove a role from a member.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to add/remove role from.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "role",
      description: "The role to toggle.",
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ],

  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.editReply("This user is not currently in this server.");
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.editReply("I cannot manage this role because it is higher than or equal to my highest role.");
    }

    const hasRole = member.roles.cache.has(role.id);
    const action = hasRole ? "Remove" : "Add";

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
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
