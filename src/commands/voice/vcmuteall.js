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
  alias: ["vcmuteall", "vmuteall", "voicemuteall"],
  category: "Voice",
  desc: "Server mute all human members connected to your voice channel.",
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

    const channel = message.member.voice.channel;
    if (!channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ You must be connected to a voice channel to use this command.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const targets = Array.from(channel.members.values()).filter(
      (m) => !m.user.bot && m.id !== message.author.id && !m.voice.serverMute
    );

    if (targets.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`ℹ️ No eligible unmuted human members found in **${channel.name}**.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    let successCount = 0;
    let failCount = 0;

    for (const member of targets) {
      if (
        message.author.id !== message.guild.ownerId &&
        member.id !== message.guild.ownerId &&
        message.member.roles.highest.position <= member.roles.highest.position
      ) {
        failCount++;
        continue;
      }
      try {
        await member.voice.setMute(true, `Mass muted by ${message.author.tag}`);
        successCount++;
      } catch (_) {
        failCount++;
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎙️ Mass Voice Mute Executed\n` +
          `-# *Server muted members in voice channel ${channel.name}.*\n\n` +
          `> - **Voice Channel:** <#${channel.id}>\n` +
          `> - **Members Muted:** \`${successCount}\` member(s)\n` +
          `> - **Skipped / Failed:** \`${failCount}\` member(s)\n` +
          `> - **Moderator:** <@${message.author.id}>`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
