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
  alias: ["masskick", "mkick"],
  category: "Moderation",
  desc: "Kick multiple members from the server in a single command.",
  botPermissions: ["KickMembers", "SendMessages"],
  userPermissions: ["KickMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0]) {
      return message.reply("Usage: `.masskick <@user1|id1> <@user2|id2> ... [reason]`");
    }

    const userIds = [];
    let reason = "Masskick executed by staff";

    for (let i = 0; i < args.length; i++) {
      const match = args[i].match(/^<@!?(\d+)>$/) || args[i].match(/^(\d{17,20})$/);
      if (match) {
        userIds.push(match[1]);
      } else {
        reason = args.slice(i).join(" ");
        break;
      }
    }

    if (userIds.length === 0) {
      return message.reply("❌ Please provide at least one valid user mention or user ID.");
    }

    if (userIds.length > 20) {
      return message.reply("❌ For safety, masskick is limited to a maximum of 20 users per execution.");
    }

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
        await targetMember.kick(`[Masskick] ${reason} (by ${message.author.tag})`);
        success.push(`<@${id}>`);
        moderationManager.addCase(message.guild.id, {
          action: "KICK",
          targetId: id,
          targetTag: targetMember.user.username,
          moderatorId: message.author.id,
          moderatorTag: message.author.username,
          reason,
        });
      } catch (err) {
        failed.push(`<@${id}> (${err.message})`);
      }
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 👢 **Mass Kick Execution Report**\n` +
          `-# *Processed ${userIds.length} targets*\n\n` +
          (success.length > 0 ? `**Successfully Kicked (${success.length}):**\n${success.join(", ")}\n\n` : "") +
          (failed.length > 0 ? `**Failed (${failed.length}):**\n${failed.join("\n")}\n\n` : "") +
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
