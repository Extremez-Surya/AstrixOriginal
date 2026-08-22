const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["unmute"],
  category: "Moderation",
  desc: "Unmute a muted member by removing the Muted role.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Target User Required\n` +
          `-# *Please mention a user or provide a valid user ID to unmute.*\n\n` +
          `> - **Usage:** \`.unmute @user [reason]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const member = await message.guild.members
      .fetch(targetUser.id)
      .catch(() => null);
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

    const guild = message.guild;
    const muteRole = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === "muted",
    );
    if (!muteRole || !member.roles.cache.has(muteRole.id)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Member Not Muted\n` +
          `-# *<@${targetUser.id}> is not currently muted.*`
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
      actionName: "Unmute",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await member.roles.remove(muteRole, reason);
      },
    });
  },
};
