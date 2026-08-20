const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["rmute", "reactionmute", "reactmute"],
  category: "Moderation",
  desc: "Mute a member from adding message reactions in the current channel.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: ["ModerateMembers", "ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(" ") || "Reaction mute by moderator";

    if (!targetMember) {
      return message.reply("Usage: `.rmute @user [reason]`");
    }

    const check = moderationManager.canModerate(message.member, targetMember, message.guild.members.me);
    if (!check.allowed) {
      return message.reply(`❌ Action Denied: ${check.reason}`);
    }

    try {
      await message.channel.permissionOverwrites.edit(targetMember.id, {
        AddReactions: false,
      }, { reason: `Reaction mute by ${message.author.tag}: ${reason}` });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔘 **Reaction Muted** ── ${targetMember.user.username}\n` +
          `-# *Member is restricted from adding reactions in ${message.channel}*\n\n` +
          `> - **Reason:** \`${reason}\`\n` +
          `> - **Moderator:** <@${message.author.id}>\n\n` +
          `-# *Tip: Use \`.runmute @user\` to restore reaction permissions.*`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to reaction mute member: \`${err.message}\``);
    }
  },
};
