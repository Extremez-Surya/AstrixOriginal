const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");
const { getOrCreateMuteRole } = require("../../utils/muteHelper.js");

module.exports = {
  name: "mute",
  category: "Moderation",
  description: "Mute a member by assigning the Muted role.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to mute.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for the mute.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["ManageRoles", "MuteMembers"],
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

    if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.editReply("I cannot mute this member (their highest role is higher than or equal to mine).");
    }

    const guild = interaction.guild;
    let muteRole;
    try {
      muteRole = await getOrCreateMuteRole(guild);
    } catch (err) {
      return interaction.editReply("The 'Muted' role does not exist, and I could not create it. Ensure my role is high enough and I have Manage Roles permission.");
    }

    if (member.roles.cache.has(muteRole.id)) {
      return interaction.editReply("This member is already muted.");
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Mute",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await member.roles.add(muteRole, reason);
        if (member.voice.channel) {
          await member.voice.disconnect("User was muted").catch(() => {});
        }
      },
    });
  },
};
