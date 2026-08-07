const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");

module.exports = {
  alias: ["j2cclaim", "vcclaim", "roomclaim"],
  category: "Join To Create",
  desc: "Claim ownership of the temp voice channel if the current owner is absent.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.member.voice.channel;
    if (!channel || !j2cManager.isTempChannel(message.guild.id, channel.id)) {
      return message.reply("❌ You must be connected to a temporary voice channel to claim ownership.").catch(() => null);
    }

    const currentOwnerId = j2cManager.getTempChannelOwner(message.guild.id, channel.id);
    if (currentOwnerId === message.author.id) {
      return message.reply("ℹ️ You are already the owner of this voice channel.").catch(() => null);
    }

    const isOwnerInVC = channel.members.has(currentOwnerId);
    if (isOwnerInVC) {
      return message.reply(`❌ The current owner (<@${currentOwnerId}>) is still connected to the voice channel!`).catch(() => null);
    }

    j2cManager.setTempChannelOwner(message.guild.id, channel.id, message.author.id);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `👑 **${message.author.username}** (<@${message.author.id}>) has claimed ownership of **${channel.name}**!`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
