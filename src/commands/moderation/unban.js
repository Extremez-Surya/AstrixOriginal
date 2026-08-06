const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["unban"],
  category: "Moderation",
  desc: "Unban a user from the server.",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0]) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Target User ID Required\n` +
          `-# *Please provide a valid user ID to unban.*\n\n` +
          `> - **Usage:** \`.unban <user_id> [reason]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const targetUser = await client.users.fetch(args[0]).catch(() => null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Invalid User ID\n` +
          `-# *Invalid user ID. Could not fetch user data.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const bans = await message.guild.bans.fetch().catch(() => null);
    if (bans && !bans.has(targetUser.id)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> User Not Banned\n` +
          `-# *This user is not currently banned in this server.*`
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
      actionName: "Unban",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await message.guild.members.unban(targetUser.id, reason);
      },
    });
  },
};
