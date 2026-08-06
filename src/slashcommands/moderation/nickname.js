const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  name: "nickname",
  category: "Moderation",
  description: "Change or reset a server member's nickname.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user whose nickname to change or reset.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "new_nickname",
      description: "The new nickname to apply (use 'reset' or leave empty to reset).",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["ManageNicknames"],
  userPermissions: ["ManageNicknames"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => null);
    const targetUser = interaction.options.getUser("user");
    const rawNick = interaction.options.getString("new_nickname")?.trim();

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

    const isReset = !rawNick || rawNick.toLowerCase() === "reset";
    const finalNick = isReset ? null : rawNick;
    const displayNick = finalNick ? `\`${finalNick}\`` : "*Reset to default username*";

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: isReset ? "Reset Nickname" : "Nickname Update",
      detailsText: `Proposed Nickname: ${displayNick}`,
      onConfirm: async () => {
        await member.setNickname(finalNick);
      },
    });
  },
};
