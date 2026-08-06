const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["ban", "banuser"],
  category: "Moderation",
  desc: "Ban a member from the server.",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Target User Required\n` +
          `-# *Please mention a user or provide a valid user ID to ban.*\n\n` +
          `> - **Usage:** \`.ban @user [reason]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const reason = args.slice(1).join(" ") || "No reason provided.";

    const member = await message.guild.members
      .fetch(targetUser.id)
      .catch(() => null);
    if (member) {
      if (!member.bannable) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Cannot Ban Member\n` +
            `-# *I cannot ban this user (they might have a higher role or permissions than the bot).*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }
    }

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: "Ban",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await message.guild.members.ban(targetUser.id, { reason });
      },
    });
  },
};
