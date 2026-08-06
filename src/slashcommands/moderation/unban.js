const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "unban",
  category: "Moderation",
  description: "Unban a user from the server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user_id",
      description: "The ID of the user to unban.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for the unban.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const userId = interaction.options.getString("user_id");
    const reason = interaction.options.getString("reason") || "No reason provided.";

    const targetUser = await client.users.fetch(userId).catch(() => null);
    if (!targetUser) {
      return interaction.editReply("Invalid user ID. I could not fetch this user.");
    }

    const bans = await interaction.guild.bans.fetch().catch(() => null);
    if (bans && !bans.has(targetUser.id)) {
      return interaction.editReply("This user is not currently banned in this server.");
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Unban",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await interaction.guild.members.unban(targetUser.id, reason);
      },
    });
  },
};
