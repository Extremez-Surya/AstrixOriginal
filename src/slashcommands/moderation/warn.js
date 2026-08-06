const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");
const { addWarn } = require("../../utils/warnManager.js");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "warn",
  category: "Moderation",
  description: "Warn a server member and log it persistently.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to warn.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for the warning.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["SendMessages"],
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

    await confirmAction({
      client,
      context: interaction,
      moderator: interaction.user,
      targetUser,
      actionName: "Warn Member",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        const history = addWarn(interaction.guild.id, targetUser.id, interaction.user.id, reason);
        const count = history.length;

        const dmContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:Warn_red:1528691439658078290> Disciplinary Notification: ${interaction.guild.name}\n` +
              `-# *You have received a formal warning in the server.*\n\n` +
              `> **Reason:** ${reason}\n` +
              `> **Moderator:** <@${interaction.user.id}>\n` +
              `> **Total Warning Count:** \`${count}\``
            )
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# *If you believe this was an error, please contact a server administrator.*`
            )
          );

        await targetUser.send({
          components: [dmContainer],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      },
    });
  },
};
