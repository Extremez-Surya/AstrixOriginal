const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "roleall",
  category: "Moderation",
  description: "Add or remove a role for all members in the server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "action",
      description: "Whether to add or remove the role.",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Add", value: "add" },
        { name: "Remove", value: "remove" },
      ],
    },
    {
      name: "role",
      description: "The role to assign/remove.",
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
    {
      name: "target",
      description: "Select which server members are targeted.",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "Everyone", value: "all" },
        { name: "Humans Only", value: "humans" },
        { name: "Bots Only", value: "bots" },
      ],
    },
  ],

  botPermissions: ["ManageRoles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const action = interaction.options.getString("action");
    const role = interaction.options.getRole("role");
    const targetType = interaction.options.getString("target") || "all";

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.editReply("I cannot manage this role because it is higher than or equal to my highest role.");
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser: client.user,
      actionName: `RoleAll (${action.toUpperCase()})`,
      detailsText: `Role: <@&${role.id}> (${role.name}) | Target: ${targetType.toUpperCase()}`,
      onConfirm: async () => {
        let members = await interaction.guild.members.fetch();
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
