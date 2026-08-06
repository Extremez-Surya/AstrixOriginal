const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "kick",
  category: "Moderation",
  description: "Kick a member from the server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to kick.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for the kick.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["KickMembers"],
  userPermissions: ["KickMembers"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided.";

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.editReply("This user is not currently in this server.");
    }

    if (!member.kickable) {
      return interaction.editReply("I cannot kick this member (they might have a higher role or permissions).");
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Kick",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await member.kick(reason);
      },
    });
  },
};
