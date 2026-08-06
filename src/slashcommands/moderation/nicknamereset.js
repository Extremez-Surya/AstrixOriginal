const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "nicknamereset",
  category: "Moderation",
  description: "Reset a server member's nickname to their default username.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user whose nickname to reset.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],

  botPermissions: ["ManageNicknames"],
  userPermissions: ["ManageNicknames"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => null);
    const targetUser = interaction.options.getUser("user");

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Member Not Found\n` +
          `-# *This user is not currently in this server.*`
        )
      );
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    const isSelf = member.id === client.user.id;
    if (!isSelf && !member.manageable) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Cannot Manage Nickname\n` +
          `-# *I cannot manage this member's nickname (they might have a higher role or permissions than the bot).*`
        )
      );
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Reset Nickname",
      detailsText: `Proposed Nickname: *Reset to default username*`,
      onConfirm: async () => {
        await member.setNickname(null);
      },
    });
  },
};
