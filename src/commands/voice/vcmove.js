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
  alias: ["vcmove", "vmove", "voicemove"],
  category: "Voice",
  desc: "Move a member to a specified voice channel.",
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

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const cleanId = args[0].replace(/\D/g, "");
      if (cleanId) targetMember = await message.guild.members.fetch(cleanId).catch(() => null);
    }

    if (!targetMember) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Please specify a valid member to move.\n\n**Usage:** \`.vcmove @user #targetChannel\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (!targetMember.voice.channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${targetMember.user.username}** is not connected to any voice channel.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    let targetChannel;
    if (message.mentions.channels.size > 0) {
      targetChannel = message.mentions.channels.filter((c) => c.isVoiceBased()).first();
    } else if (args[1]) {
      const channelId = args[1].replace(/\D/g, "");
      if (channelId) {
        const fetched = message.guild.channels.cache.get(channelId);
        if (fetched && fetched.isVoiceBased()) targetChannel = fetched;
      }
    }

    if (!targetChannel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Please specify a valid target voice channel.\n\n**Usage:** \`.vcmove @user #targetChannel\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (targetMember.voice.channel.id === targetChannel.id) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${targetMember.user.username}** is already in <#${targetChannel.id}>.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const previousChannelName = targetMember.voice.channel.name;

    try {
      await targetMember.voice.setChannel(targetChannel, `Moved by ${message.author.tag}`);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚚 Member Voice Moved\n` +
            `-# *Successfully relocated member to target voice channel.*\n\n` +
            `> - **Target:** <@${targetMember.id}> (\`${targetMember.id}\`)\n` +
            `> - **From:** \`${previousChannelName}\` ➡️ **To:** <#${targetChannel.id}>\n` +
            `> - **Moderator:** <@${message.author.id}>`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Failed to move member. Bot lacks permissions or channel is full.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
