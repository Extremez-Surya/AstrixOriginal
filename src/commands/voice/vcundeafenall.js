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
  alias: ["vcundeafenall", "vundeafenall", "voiceundeafenall"],
  category: "Voice",
  desc: "Server undeafen all human members connected to your voice channel.",
  botPermissions: ["DeafenMembers"],
  userPermissions: ["DeafenMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!hasPerms(message.member, PermissionFlagsBits.DeafenMembers)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ You need **Deafen Members** permission to use this command.`)
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
      (m) => !m.user.bot && m.voice.serverDeaf
    );

    if (targets.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`ℹ️ No server-deafened human members found in **${channel.name}**.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    let successCount = 0;
    let failCount = 0;

    for (const member of targets) {
      try {
        await member.voice.setDeaf(false, `Mass undeafened by ${message.author.tag}`);
        successCount++;
      } catch (_) {
        failCount++;
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔊 Mass Voice Undeafen Executed\n` +
          `-# *Server undeafened members in voice channel ${channel.name}.*\n\n` +
          `> - **Voice Channel:** <#${channel.id}>\n` +
          `> - **Members Undeafened:** \`${successCount}\` member(s)\n` +
          `> - **Failed:** \`${failCount}\` member(s)\n` +
          `> - **Moderator:** <@${message.author.id}>`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
