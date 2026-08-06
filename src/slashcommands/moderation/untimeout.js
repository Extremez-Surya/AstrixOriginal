const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "untimeout",
  category: "Moderation",
  description: "Remove timeout from a server member.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to remove timeout from.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for removing the timeout.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided.";

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.editReply("This user is not currently in this server.");
    }

    if (!member.communicationDisabledUntilTimestamp || member.communicationDisabledUntilTimestamp < Date.now()) {
      return interaction.editReply("This member is not timed out.");
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Remove Timeout",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await member.timeout(null, reason);
      },
    });
  },
};
