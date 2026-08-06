const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");

function parseDuration(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return val * 1000;
    case "m":
      return val * 60 * 1000;
    case "h":
      return val * 60 * 60 * 1000;
    case "d":
      return val * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

module.exports = {
  alias: ["timeout"],
  category: "Moderation",
  desc: "Timeout a member for a specified duration.",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Target User Required\n` +
          `-# *Please mention a user or provide a valid user ID to timeout.*\n\n` +
          `> - **Usage:** \`.timeout @user [duration] [reason]\`\n` +
          `> - **Example:** \`.timeout @user 10m Spamming\``
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
          `### <a:red_star:1528688099436003419> Member Not Found\n` +
          `-# *This user is not currently in this server.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (!member.moderatable) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Cannot Timeout Member\n` +
          `-# *I cannot timeout this member (they might have higher roles or permissions than the bot).*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    let durationMs = parseDuration(args[1]);
    let reasonIndex = 2;
    let durationText = args[1];

    if (durationMs === null) {
      durationMs = 600000; // default 10 minutes
      reasonIndex = 1;
      durationText = "10m";
    }

    const reason = args.slice(reasonIndex).join(" ") || "No reason provided.";

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: "Timeout",
      detailsText: `**Duration:** ${durationText} | **Reason:** ${reason}`,
      onConfirm: async () => {
        await member.timeout(durationMs, reason);
      },
    });
  },
};
