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
  alias: ["vckickall", "vkickall", "vcdisconnectall", "voicedisconnectall"],
  category: "Voice",
  desc: "Disconnect all human members connected to your voice channel.",
  botPermissions: ["MoveMembers"],
  userPermissions: ["MoveMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!hasPerms(message.member, PermissionFlagsBits.MoveMembers)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ You need **Move Members** permission to use this command.`)
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
      (m) => !m.user.bot && m.id !== message.author.id
    );

    if (targets.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`ℹ️ No human members to disconnect in **${channel.name}**.`)
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
        await member.voice.disconnect(`Mass disconnected by ${message.author.tag}`);
        successCount++;
      } catch (_) {
        failCount++;
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🚪 Mass Voice Disconnect Executed\n` +
          `-# *Disconnected members from voice channel ${channel.name}.*\n\n` +
          `> - **Voice Channel:** <#${channel.id}>\n` +
          `> - **Members Disconnected:** \`${successCount}\` member(s)\n` +
          `> - **Skipped / Failed:** \`${failCount}\` member(s)\n` +
          `> - **Moderator:** <@${message.author.id}>`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
