const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["massmute", "mmute", "masstimeout"],
  category: "Moderation",
  desc: "Mute/timeout multiple members in the server in a single command.",
  botPermissions: ["ModerateMembers", "SendMessages"],
  userPermissions: ["ModerateMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0]) {
      return message.reply("Usage: `.massmute <@user1|id1> <@user2|id2> ... [duration] [reason]`");
    }

    const userIds = [];
    let durationStr = "1h";
    let reason = "Massmute executed by staff";

    for (let i = 0; i < args.length; i++) {
      const match = args[i].match(/^<@!?(\d+)>$/) || args[i].match(/^(\d{17,20})$/);
      if (match) {
        userIds.push(match[1]);
      } else {
        const parsedMs = moderationManager.parseDuration(args[i]);
        if (parsedMs) {
          durationStr = args[i];
          reason = args.slice(i + 1).join(" ") || reason;
        } else {
          reason = args.slice(i).join(" ");
        }
        break;
      }
    }

    if (userIds.length === 0) {
      return message.reply("❌ Please provide at least one valid user mention or user ID.");
    }

    const durationMs = moderationManager.parseDuration(durationStr) || 3600000;
    const success = [];
    const failed = [];

    for (const id of userIds) {
      const targetMember = message.guild.members.cache.get(id);
      if (!targetMember) {
        failed.push(`<@${id}> (Member not in server)`);
        continue;
      }

      const check = moderationManager.canModerate(message.member, targetMember, message.guild.members.me);
      if (!check.allowed) {
        failed.push(`<@${id}> (${check.reason})`);
        continue;
      }

      try {
        await targetMember.timeout(durationMs, `[Massmute: ${durationStr}] ${reason} (by ${message.author.tag})`);
        success.push(`<@${id}>`);
        moderationManager.addCase(message.guild.id, {
          action: "MUTE",
          targetId: id,
          targetTag: targetMember.user.username,
          moderatorId: message.author.id,
          moderatorTag: message.author.username,
          duration: durationStr,
          reason,
        });
      } catch (err) {
        failed.push(`<@${id}> (${err.message})`);
      }
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔇 **Mass Mute Execution Report**\n` +
          `-# *Processed ${userIds.length} targets*\n\n` +
          (success.length > 0 ? `**Successfully Muted (${success.length}):**\n${success.join(", ")}\n\n` : "") +
          (failed.length > 0 ? `**Failed (${failed.length}):**\n${failed.join("\n")}\n\n` : "") +
          `> - **Duration:** \`${durationStr}\`\n` +
          `> - **Reason:** \`${reason}\`\n` +
          `> - **Moderator:** <@${message.author.id}>`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
