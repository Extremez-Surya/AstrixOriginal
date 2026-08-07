const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");

module.exports = {
  alias: ["j2creject", "vcreject", "roomreject", "j2cban"],
  category: "Join To Create",
  desc: "Reject, disconnect, and block a member from your temp voice channel.",
  botPermissions: ["ManageChannels", "MoveMembers"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.member.voice.channel;
    if (!channel || !j2cManager.isTempChannel(message.guild.id, channel.id)) {
      return message.reply("❌ You must be connected to your temp voice channel to reject members.").catch(() => null);
    }

    const ownerId = j2cManager.getTempChannelOwner(message.guild.id, channel.id);
    if (message.author.id !== ownerId && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(`❌ Only the room owner (<@${ownerId || "None"}>) can reject members.`).catch(() => null);
    }

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const cleanId = args[0].replace(/\D/g, "");
      if (cleanId) targetMember = await message.guild.members.fetch(cleanId).catch(() => null);
    }

    if (!targetMember) {
      return message.reply("❌ Please mention or specify a valid member! Example: `.j2creject @user`").catch(() => null);
    }

    if (targetMember.id === ownerId) {
      return message.reply("❌ You cannot reject the room owner.").catch(() => null);
    }

    await channel.permissionOverwrites.edit(targetMember.id, { Connect: false }).catch(() => null);

    if (targetMember.voice.channel && targetMember.voice.channel.id === channel.id) {
      await targetMember.voice.disconnect(`Rejected from temp VC by room owner ${message.author.tag}`).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`🚫 **${targetMember.user.username}** (<@${targetMember.id}>) has been rejected and blocked from **${channel.name}**.`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
