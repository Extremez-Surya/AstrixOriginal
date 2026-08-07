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
  alias: ["vcpull", "vpull", "voicepull"],
  category: "Voice",
  desc: "Pull a member into your current voice channel.",
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

    const myChannel = message.member.voice.channel;
    if (!myChannel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ You must be connected to a voice channel to pull members.`)
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
        new TextDisplayBuilder().setContent(`❌ Please mention a valid member to pull into your channel.\n\n**Usage:** \`.vcpull @user\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (!targetMember.voice.channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${targetMember.user.username}** is not connected to any voice channel.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (targetMember.voice.channel.id === myChannel.id) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${targetMember.user.username}** is already in your voice channel.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const previousChannelName = targetMember.voice.channel.name;

    try {
      await targetMember.voice.setChannel(myChannel, `Pulled by ${message.author.tag}`);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧲 Member Pulled to Voice Channel\n` +
            `-# *Successfully pulled member into your voice channel.*\n\n` +
            `> - **Target:** <@${targetMember.id}> (\`${targetMember.id}\`)\n` +
            `> - **From:** \`${previousChannelName}\` ➡️ **To:** <#${myChannel.id}>\n` +
            `> - **Moderator:** <@${message.author.id}>`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Failed to pull member. Bot lacks required permissions or channel is full.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
