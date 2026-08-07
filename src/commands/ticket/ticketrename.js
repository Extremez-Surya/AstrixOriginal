const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const ticketManager = require("../../lib/ticketManager");

module.exports = {
  alias: ["ticketrename", "renameticket"],
  category: "Ticket",
  desc: "Rename the current support ticket channel.",
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

    const newName = args.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
    if (!newName) {
      return message.reply("❌ Provide a new channel name! Example: `.ticketrename billing-support`").catch(() => null);
    }

    const oldName = channel.name;
    await channel.setName(newName).catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`✏️ Ticket channel renamed from \`${oldName}\` to **${newName}**!`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
