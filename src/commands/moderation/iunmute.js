const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["iunmute", "imageunmute", "picunmute"],
  category: "Moderation",
  desc: "Restore image and embed permissions for a member in this channel.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: ["ModerateMembers", "ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!targetMember) {
      return message.reply("Usage: `.iunmute @user`");
    }

    try {
      await message.channel.permissionOverwrites.edit(targetMember.id, {
        AttachFiles: null,
        EmbedLinks: null,
      }, { reason: `Image unmute by ${message.author.tag}` });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🖼️ **Image Unmuted** ── ${targetMember.user.username}\n` +
          `-# *Image attachments and embeds restored in ${message.channel}.*`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to image unmute: \`${err.message}\``);
    }
  },
};
