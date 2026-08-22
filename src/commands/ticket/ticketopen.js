const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { createTicketChannel } = require("../../lib/ticket/handleTicketInteraction");

module.exports = {
  alias: ["ticketopen", "ticketcreate", "topen", "tktcreate"],
  category: "Ticket",
  desc: "Open a support ticket via text command.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const reasonStr = args.join(" ").trim() || "General Inquiry";
    const result = await createTicketChannel(message.guild, message.member, "General Support", reasonStr);

    if (result.error) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(result.error)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`✅ Support ticket created! Head over to <#${result.channel.id}> to speak with staff.`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
