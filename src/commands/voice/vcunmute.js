const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");

function hasPerms(member, perm) {
  return (
    member.id === member.guild.ownerId ||
    member.permissions.has(perm) ||
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}

module.exports = {
  alias: ["vcunmute", "vunmute", "voiceunmute"],
  category: "Voice",
  desc: "Server unmute a member in a voice channel.",
  botPermissions: ["MuteMembers"],
  userPermissions: ["MuteMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!hasPerms(message.member, PermissionFlagsBits.MuteMembers)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ You need **Mute Members** permission to use this command.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const cleanId = args[0].replace(/\D/g, "");
      if (cleanId) targetMember = await message.guild.members.fetch(cleanId).catch(() => null);
    }

    if (!targetMember) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Please mention a valid member to server unmute.\n\n**Usage:** \`.vcunmute @user\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (!targetMember.voice.channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${targetMember.user.username}** is not connected to a voice channel.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (!targetMember.voice.serverMute) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${targetMember.user.username}** is not server muted.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    try {
      await targetMember.voice.setMute(false, `Server unmuted by ${message.author.tag}`);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔊 Member Voice Unmuted\n` +
            `-# *Successfully unmuted member in voice channel.*\n\n` +
            `> - **Target:** <@${targetMember.id}> (\`${targetMember.id}\`)\n` +
            `> - **Voice Channel:** <#${targetMember.voice.channel.id}>\n` +
            `> - **Moderator:** <@${message.author.id}>`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Failed to server unmute member. Bot lacks required permissions.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
