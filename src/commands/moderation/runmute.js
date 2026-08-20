const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["runmute", "reactionunmute", "reactunmute"],
  category: "Moderation",
  desc: "Restore message reaction permissions for a member in this channel.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: ["ModerateMembers", "ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!targetMember) {
      return message.reply("Usage: `.runmute @user`");
    }

    try {
      await message.channel.permissionOverwrites.edit(targetMember.id, {
        AddReactions: null,
      }, { reason: `Reaction unmute by ${message.author.tag}` });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔘 **Reaction Unmuted** ── ${targetMember.user.username}\n` +
          `-# *Reaction permissions restored in ${message.channel}.*`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to reaction unmute: \`${err.message}\``);
    }
  },
};
