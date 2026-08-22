const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["untimeout"],
  category: "Moderation",
  desc: "Remove timeout from a server member.",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Target User Required\n` +
          `-# *Please mention a user or provide a valid user ID to remove timeout.*\n\n` +
          `> - **Usage:** \`.untimeout @user [reason]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Member Not Found\n` +
          `-# *This user is not currently in this server.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (!member.communicationDisabledUntilTimestamp || member.communicationDisabledUntilTimestamp < Date.now()) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Member Not Timed Out\n` +
          `-# *<@${targetUser.id}> is not currently timed out.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const reason = args.slice(1).join(" ") || "No reason provided.";

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: "Remove Timeout",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await member.timeout(null, reason);
      },
    });
  },
};
