const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "ban",
  category: "Moderation",
  description: "Ban a member from the server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to ban.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for the ban.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided.";

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (member) {
      if (!member.bannable) {
        return interaction.editReply("I cannot ban this user (they might have a higher role or permissions).");
      }
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Ban",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await interaction.guild.members.ban(targetUser.id, { reason });
      },
    });
  },
};
