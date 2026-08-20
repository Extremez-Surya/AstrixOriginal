const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const loggingManager = require("../../lib/loggingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["tempban", "tban"],
  category: "Moderation",
  desc: "Temporarily ban a member with automated unban timer.",
  botPermissions: ["BanMembers", "SendMessages"],
  userPermissions: ["BanMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    const durationStr = args[1];
    const reason = args.slice(2).join(" ") || "No reason provided.";

    if (!targetUser || !durationStr) {
      return message.reply("Usage: `.tempban @user <duration: 10m|1h|7d> [reason]`");
    }

    const durationMs = moderationManager.parseDuration(durationStr);
    if (!durationMs || durationMs < 10000) {
      return message.reply("❌ Invalid duration format. Use e.g. `10m`, `2h`, `1d`, `7d` (min 10s).");
    }

    const targetMember = message.guild.members.cache.get(targetUser.id);
    if (targetMember) {
      const check = moderationManager.canModerate(message.member, targetMember, message.guild.members.me);
      if (!check.allowed) {
        return message.reply(`❌ Action Denied: ${check.reason}`);
      }
    }

    try {
      await message.guild.bans.create(targetUser.id, {
        reason: `[Tempban: ${durationStr}] ${reason} (by ${message.author.tag})`,
      });

      const expiresAt = Date.now() + durationMs;
      moderationManager.addTempban(client, message.guild.id, targetUser.id, expiresAt, reason, message.author.id);

      const caseData = moderationManager.addCase(message.guild.id, {
        action: "TEMPBAN",
        targetId: targetUser.id,
        targetTag: targetUser.username,
        moderatorId: message.author.id,
        moderatorTag: message.author.username,
        reason,
        duration: durationStr,
      });

      loggingManager.dispatchLog(
        client,
        message.guild.id,
        "memberBan",
        {
          target: targetUser,
          details: `Temporarily banned for \`${durationStr}\` by <@${message.author.id}> • Case #${caseData.caseId}`,
          reason,
        },
        { author: message.author }
      ).catch(() => null);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔨 **Member Temporarily Banned**\n` +
          `-# *Case #${caseData.caseId} recorded*\n\n` +
          `> - **Target:** \`${targetUser.username}\` (\`${targetUser.id}\`)\n` +
          `> - **Duration:** \`${durationStr}\` (Unbans <t:${Math.floor(expiresAt / 1000)}:R>)\n` +
          `> - **Reason:** \`${reason}\`\n` +
          `> - **Moderator:** <@${message.author.id}>`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to tempban member: \`${err.message}\``);
    }
  },
};
