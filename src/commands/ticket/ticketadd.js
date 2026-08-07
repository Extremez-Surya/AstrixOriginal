const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const ticketManager = require("../../lib/ticketManager");

module.exports = {
  alias: ["ticketadd", "addmember"],
  category: "Ticket",
  desc: "Add a member to the current support ticket channel.",
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

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const cleanId = args[0].replace(/\D/g, "");
      if (cleanId) targetMember = await message.guild.members.fetch(cleanId).catch(() => null);
    }

    if (!targetMember) {
      return message.reply("❌ Please mention or specify a valid member! Example: `.ticketadd @user`").catch(() => null);
    }

    await channel.permissionOverwrites.edit(targetMember.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
    }).catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`👤 **${targetMember.user.username}** (<@${targetMember.id}>) has been added to the ticket.`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
