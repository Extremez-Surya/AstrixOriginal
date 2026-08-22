const { confirmAction } = require("../../utils/confirm.js");
const { clearWarns } = require("../../utils/warnManager.js");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["warnclear", "clearwarns"],
  category: "Moderation",
  desc: "Clear all warnings of a server member.",
  botPermissions: ["SendMessages"],
  userPermissions: ["KickMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Target User Required\n` +
            `-# *Please mention a user or provide a valid user ID to clear their warnings.*\n\n` +
            `> - **Usage:** \`.warnclear @user\``,
        ),
      );
      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    const member = await message.guild.members
      .fetch(targetUser.id)
      .catch(() => null);
    if (!member) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Member Not Found\n` +
            `-# *This user is not currently in this server.*`,
        ),
      );
      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: "Clear All Warnings",
      detailsText: `This will permanently delete all warning logs for <@${targetUser.id}>.`,
      onConfirm: async () => {
        clearWarns(message.guild.id, targetUser.id);

        const dmContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:rshield:1539875466939338773> Disciplinary Update: ${message.guild.name}\n` +
                `-# *All warnings on your record have been cleared.*\n\n` +
                `> **Action:** Warnings Cleared\n` +
                `> **Moderator:** <@${message.author.id}>`,
            ),
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true),
          );

        await targetUser
          .send({
            components: [dmContainer],
            flags: MessageFlags.IsComponentsV2,
          })
          .catch(() => {});
      },
    });
  },
};
