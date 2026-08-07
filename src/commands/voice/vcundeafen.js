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
  alias: ["vcundeafen", "vundeafen", "voiceundeafen", "vcundeaf"],
  category: "Voice",
  desc: "Server undeafen a member in a voice channel.",
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

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const cleanId = args[0].replace(/\D/g, "");
      if (cleanId) targetMember = await message.guild.members.fetch(cleanId).catch(() => null);
    }

    if (!targetMember) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Please mention a valid member to server undeafen.\n\n**Usage:** \`.vcundeafen @user\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (!targetMember.voice.channel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${targetMember.user.username}** is not connected to a voice channel.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (!targetMember.voice.serverDeaf) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${targetMember.user.username}** is not server deafened.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    try {
      await targetMember.voice.setDeaf(false, `Server undeafened by ${message.author.tag}`);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔊 Member Voice Undeafened\n` +
            `-# *Successfully un-deafened member in voice channel.*\n\n` +
            `> - **Target:** <@${targetMember.id}> (\`${targetMember.id}\`)\n` +
            `> - **Voice Channel:** <#${targetMember.voice.channel.id}>\n` +
            `> - **Moderator:** <@${message.author.id}>`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Failed to server undeafen member. Bot lacks required permissions.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
