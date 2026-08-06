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
  alias: ["warn", "addwarn", "warnuser"],
  category: "Moderation",
  desc: "Warn a member and log it persistently.",
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
          `### <a:red_star:1528688099436003419> Target User Required\n` +
            `-# *Please mention a user or provide a valid user ID to warn.*\n\n` +
            `> - **Usage:** \`.warn @user [reason]\``,
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
          `### <a:red_star:1528688099436003419> Member Not Found\n` +
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

    const reason = args.slice(1).join(" ") || "No reason provided.";

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: "Warn Member",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        const history = addWarn(
          message.guild.id,
          targetUser.id,
          message.author.id,
          reason,
        );
        const count = history.length;

        const dmContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:Warn_red:1528691439658078290> Disciplinary Notification: ${message.guild.name}\n` +
                `-# *You have received a formal warning in the server.*\n\n` +
                `> **Reason:** ${reason}\n` +
                `> **Moderator:** <@${message.author.id}>\n` +
                `> **Total Warning Count:** \`${count}\``,
            ),
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# *If you believe this was an error, please contact a server administrator.*`,
            ),
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
