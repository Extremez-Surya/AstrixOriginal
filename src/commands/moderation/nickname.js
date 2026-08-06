const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

module.exports = {
  alias: ["nickname", "nick"],
  category: "Moderation",
  desc: "Change or reset a member's nickname.",
  botPermissions: ["ManageNicknames"],
  userPermissions: ["ManageNicknames"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Target User Required\n` +
            `-# *Please mention a user or provide a valid user ID to change or reset their nickname.*\n\n` +
            `> - **Usage:** \`.nickname @user <new nickname | reset>\`\n` +
            `> - **Example Reset:** \`.nickname @user reset\``,
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

    const isSelf = member.id === client.user.id;
    if (!isSelf && !member.manageable) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Cannot Manage Nickname\n` +
            `-# *I cannot manage this member's nickname (they might have a higher role or permissions than the bot).*`,
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

    let rawNick = args.slice(1).join(" ").trim();
    const isReset = !rawNick || rawNick.toLowerCase() === "reset";
    const finalNick = isReset ? null : rawNick;
    const displayNick = finalNick
      ? `\`${finalNick}\``
      : "*Reset to default username*";

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: isReset ? "Reset Nickname" : "Nickname Update",
      detailsText: `Proposed Nickname: ${displayNick}`,
      onConfirm: async () => {
        await member.setNickname(finalNick);
      },
    });
  },
};
