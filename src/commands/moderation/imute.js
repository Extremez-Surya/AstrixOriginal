const {
  ContainerBuilder,
  TextDisplayBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["imute", "imagemute", "picmute"],
  category: "Moderation",
  desc: "Mute a member from sending image attachments and embeds in the current channel or server.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: ["ModerateMembers", "ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(" ") || "Image mute by moderator";

    if (!targetMember) {
      return message.reply("Usage: `.imute @user [reason]`");
    }

    const check = moderationManager.canModerate(message.member, targetMember, message.guild.members.me);
    if (!check.allowed) {
      return message.reply(`❌ Action Denied: ${check.reason}`);
    }

    try {
      await message.channel.permissionOverwrites.edit(targetMember.id, {
        AttachFiles: false,
        EmbedLinks: false,
      }, { reason: `Image mute by ${message.author.tag}: ${reason}` });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🖼️ **Image Muted** ── ${targetMember.user.username}\n` +
          `-# *Member is now restricted from uploading attachments & embeds in ${message.channel}*\n\n` +
          `> - **Reason:** \`${reason}\`\n` +
          `> - **Moderator:** <@${message.author.id}>\n\n` +
          `-# *Tip: Use \`.iunmute @user\` to restore image permissions.*`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to image mute member: \`${err.message}\``);
    }
  },
};
