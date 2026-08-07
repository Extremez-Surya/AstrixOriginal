const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");

module.exports = {
  alias: ["j2cunhide", "vcunhide", "roomunhide"],
  category: "Join To Create",
  desc: "Unhide your temp voice channel to make it visible.",
  botPermissions: ["ManageChannels"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.member.voice.channel;
    if (!channel || !j2cManager.isTempChannel(message.guild.id, channel.id)) {
      return message.reply("❌ You must be connected to your temp voice channel to unhide it.").catch(() => null);
    }

    const ownerId = j2cManager.getTempChannelOwner(message.guild.id, channel.id);
    if (message.author.id !== ownerId && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(`❌ Only the room owner (<@${ownerId || "None"}>) can unhide this room.`).catch(() => null);
    }

    await channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: null }).catch(() => null);
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`🌐 **${channel.name}** is now visible to everyone.`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
