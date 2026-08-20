const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const loggingManager = require("../../lib/loggingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["softban", "sban"],
  category: "Moderation",
  desc: "Ban and immediately unban a member to purge their messages (7 days) and kick them.",
  botPermissions: ["BanMembers", "SendMessages"],
  userPermissions: ["BanMembers", "KickMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(" ") || "No reason provided.";

    if (!targetUser) {
      return message.reply("Usage: `.softban @user [reason]`");
    }

    const targetMember = message.guild.members.cache.get(targetUser.id);
    if (targetMember) {
      const check = moderationManager.canModerate(message.member, targetMember, message.guild.members.me);
      if (!check.allowed) {
        return message.reply(`❌ Action Denied: ${check.reason}`);
      }
    }

    try {
      // Ban and delete 7 days (604800 seconds) of messages
      await message.guild.bans.create(targetUser.id, {
        deleteMessageSeconds: 604800,
        reason: `[Softban] ${reason} (by ${message.author.tag})`,
      });

      // Immediately unban
      await message.guild.bans.remove(targetUser.id, `[Softban Complete] Unbanned after message purge.`);

      const caseData = moderationManager.addCase(message.guild.id, {
        action: "SOFTBAN",
        targetId: targetUser.id,
        targetTag: targetUser.username,
        moderatorId: message.author.id,
        moderatorTag: message.author.username,
        reason,
      });

      loggingManager.dispatchLog(
        client,
        message.guild.id,
        "memberBan",
        {
          target: targetUser,
          details: `Softbanned by <@${message.author.id}> (7 days of messages purged) • Case #${caseData.caseId}`,
          reason,
        },
        { author: message.author }
      ).catch(() => null);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧹 **Member Softbanned**\n` +
          `-# *Case #${caseData.caseId} recorded*\n\n` +
          `> - **Target:** \`${targetUser.username}\` (\`${targetUser.id}\`)\n` +
          `> - **Action:** Ban & Immediate Unban (Purged 7 Days of Messages)\n` +
          `> - **Reason:** \`${reason}\`\n` +
          `> - **Moderator:** <@${message.author.id}>`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to softban member: \`${err.message}\``);
    }
  },
};
