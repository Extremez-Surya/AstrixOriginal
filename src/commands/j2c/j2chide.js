const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");

module.exports = {
  alias: ["j2chide", "vchide", "roomhide"],
  category: "Join To Create",
  desc: "Hide your temp voice channel from the server channel list.",
  botPermissions: ["ManageChannels"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.member.voice.channel;
    if (!channel || !j2cManager.isTempChannel(message.guild.id, channel.id)) {
      return message.reply("❌ You must be connected to your temp voice channel to hide it.").catch(() => null);
    }

    const ownerId = j2cManager.getTempChannelOwner(message.guild.id, channel.id);
    if (message.author.id !== ownerId && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(`❌ Only the room owner (<@${ownerId || "None"}>) can hide this room.`).catch(() => null);
    }

    await channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: false }).catch(() => null);
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`👁️ **${channel.name}** is now hidden from the server channel list.`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
