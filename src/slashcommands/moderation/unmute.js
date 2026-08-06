const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "unmute",
  category: "Moderation",
  description: "Unmute a muted member by removing the Muted role.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to unmute.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for the unmute.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided.";

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.editReply("This user is not currently in this server.");
    }

    const guild = interaction.guild;
    const muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === "muted");
    if (!muteRole || !member.roles.cache.has(muteRole.id)) {
      return interaction.editReply("This member is not muted.");
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Unmute",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await member.roles.remove(muteRole, reason);
      },
    });
  },
};
