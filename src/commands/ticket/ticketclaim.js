const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const ticketManager = require("../../lib/ticketManager");

module.exports = {
  alias: ["ticketclaim", "claim"],
  category: "Ticket",
  desc: "Claim a support ticket for yourself as a support staff member.",
  botPermissions: ["ManageChannels"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.channel;
    const ticketRecord = ticketManager.getTicketRecord(message.guild.id, channel.id);

    if (!ticketRecord) {
      return message.reply("❌ This command can only be executed inside an active ticket channel.").catch(() => null);
    }

    if (ticketRecord.claimedBy === message.author.id) {
      return message.reply("ℹ️ You have already claimed this support ticket.").catch(() => null);
    }

    ticketManager.claimTicketRecord(message.guild.id, channel.id, message.author.id);

    await channel.setTopic(
      `Ticket #${ticketRecord.ticketId} | User: <@${ticketRecord.userId}> | Claimed by: ${message.author.tag} (${message.author.id})`
    ).catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`👑 **${message.author.username}** (<@${message.author.id}>) has claimed this support ticket!`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
