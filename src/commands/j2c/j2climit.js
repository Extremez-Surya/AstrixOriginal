const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");

module.exports = {
  alias: ["j2climit", "vclimit", "roomlimit"],
  category: "Join To Create",
  desc: "Set the user capacity limit for your temporary voice channel.",
  botPermissions: ["ManageChannels"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.member.voice.channel;
    if (!channel || !j2cManager.isTempChannel(message.guild.id, channel.id)) {
      return message.reply("❌ You must be connected to your temp voice channel to set its user limit.").catch(() => null);
    }

    const ownerId = j2cManager.getTempChannelOwner(message.guild.id, channel.id);
    if (message.author.id !== ownerId && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(`❌ Only the room owner (<@${ownerId || "None"}>) can modify capacity.`).catch(() => null);
    }

    const limit = parseInt(args[0]);
    if (isNaN(limit) || limit < 0 || limit > 99) {
      return message.reply("❌ Provide a valid limit between 0 and 99! Example: `.j2climit 4`").catch(() => null);
    }

    await channel.setUserLimit(limit).catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🔢 Voice channel capacity set to **${limit === 0 ? "Unlimited" : `${limit} members`}**.`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
