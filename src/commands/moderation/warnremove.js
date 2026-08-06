const { confirmAction } = require("../../utils/confirm.js");
const { getWarns, removeWarnAtIndex } = require("../../utils/warnManager.js");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["warnremove", "removewarn"],
  category: "Moderation",
  desc: "Remove a specific warning of a user by index.",
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
            `-# *Please mention a user or provide a valid user ID.*\n\n` +
            `> - **Usage:** \`.warnremove @user <index>\``,
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

    const indexArg = args[1] ? parseInt(args[1], 10) : NaN;
    if (isNaN(indexArg) || indexArg < 1) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Invalid Warning Index\n` +
            `-# *Please specify a valid warning index number (e.g. 1, 2, 3...) to remove.*`,
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

    const warns = getWarns(message.guild.id, targetUser.id);
    if (warns.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> No Warnings Found\n` +
            `-# *This user has no warnings logged.*`,
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

    if (indexArg > warns.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Warning Index Out of Range\n` +
            `-# *This user only has \`${warns.length}\` warnings. Please provide an index between \`1\` and \`${warns.length}\`.*`,
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

    const targetIndex = indexArg - 1;
    const targetWarn = warns[targetIndex];

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: "Remove Warning",
      detailsText: `Proposed warning to delete: \`#${indexArg}\`\n**Reason:** ${targetWarn.reason}\n**Given By:** <@${targetWarn.moderatorId}>`,
      onConfirm: async () => {
        removeWarnAtIndex(message.guild.id, targetUser.id, targetIndex);
        const remaining = warns.length - 1;

        const dmContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <:rshield:1528681364340080713> Disciplinary Update: ${message.guild.name}\n` +
                `-# *One of your warnings has been removed.*\n\n` +
                `> **Removed Warning:** \`#${indexArg}\`\n` +
                `> **Original Reason:** ${targetWarn.reason}\n` +
                `> **Moderator:** <@${message.author.id}>\n` +
                `> **Remaining Warnings:** \`${remaining}\``,
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
