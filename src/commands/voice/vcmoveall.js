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
  alias: ["vcmoveall", "vmoveall", "voicemoveall"],
  category: "Voice",
  desc: "Mass move all members from one voice channel to another.",
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

    const voiceChannels = message.mentions.channels.filter((c) => c.isVoiceBased());
    let fromChannel;
    let toChannel;

    if (voiceChannels.size >= 2) {
      const arr = Array.from(voiceChannels.values());
      fromChannel = arr[0];
      toChannel = arr[1];
    } else if (voiceChannels.size === 1) {
      if (message.member.voice.channel) {
        fromChannel = message.member.voice.channel;
        toChannel = voiceChannels.first();
      } else {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `❌ Mention both **from** and **to** voice channels or connect to a voice channel.\n\n` +
              `**Usage:** \`.vcmoveall #fromVC #toVC\` or \`.vcmoveall #toVC\` (from current VC)`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }
    } else {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `❌ Please mention target voice channels.\n\n` +
            `**Usage:** \`.vcmoveall #fromVC #toVC\` or \`.vcmoveall #toVC\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (fromChannel.id === toChannel.id) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Source and target voice channels cannot be the same.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const membersToMove = Array.from(fromChannel.members.values());
    if (membersToMove.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`ℹ️ No members currently connected to **${fromChannel.name}**.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    let successCount = 0;
    let failCount = 0;

    for (const member of membersToMove) {
      try {
        await member.voice.setChannel(toChannel, `Mass moved by ${message.author.tag}`);
        successCount++;
      } catch (_) {
        failCount++;
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🚚 Mass Voice Move Executed\n` +
          `-# *Relocated voice channel members in ${message.guild.name}.*\n\n` +
          `> - **From:** <#${fromChannel.id}> ➡️ **To:** <#${toChannel.id}>\n` +
          `> - **Members Moved:** \`${successCount}\` member(s)\n` +
          `> - **Failed:** \`${failCount}\` member(s)\n` +
          `> - **Moderator:** <@${message.author.id}>`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
