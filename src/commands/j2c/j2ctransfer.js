const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");

module.exports = {
  alias: ["j2ctransfer", "vctransfer", "roomtransfer"],
  category: "Join To Create",
  desc: "Transfer ownership of your temp voice channel to another member.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.member.voice.channel;
    if (!channel || !j2cManager.isTempChannel(message.guild.id, channel.id)) {
      return message.reply("❌ You must be connected to your temp voice channel to transfer ownership.").catch(() => null);
    }

    const ownerId = j2cManager.getTempChannelOwner(message.guild.id, channel.id);
    if (message.author.id !== ownerId && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(`❌ Only the room owner (<@${ownerId || "None"}>) can transfer ownership.`).catch(() => null);
    }

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const cleanId = args[0].replace(/\D/g, "");
      if (cleanId) targetMember = await message.guild.members.fetch(cleanId).catch(() => null);
    }

    if (!targetMember) {
      return message.reply("❌ Please mention or specify a valid member! Example: `.j2ctransfer @user`").catch(() => null);
    }

    if (!channel.members.has(targetMember.id)) {
      return message.reply(`❌ **${targetMember.user.username}** is not connected to **${channel.name}**.`).catch(() => null);
    }

    j2cManager.setTempChannelOwner(message.guild.id, channel.id, targetMember.id);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `👑 Ownership of **${channel.name}** has been transferred to **${targetMember.user.username}** (<@${targetMember.id}>)!`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
