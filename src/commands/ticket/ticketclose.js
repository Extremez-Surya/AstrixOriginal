const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const ticketManager = require("../../lib/ticketManager");
const { generateTranscript } = require("../../lib/ticketTranscript");

module.exports = {
  alias: ["ticketclose", "tclose", "tktclose"],
  category: "Ticket",
  desc: "Close the current support ticket, generate HTML transcript & delete channel.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.channel;
    const ticketRecord = ticketManager.getTicketRecord(message.guild.id, channel.id);

    if (!ticketRecord) {
      return message.reply("❌ This command can only be executed inside an active ticket channel.").catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent("🔒 **Closing ticket...** Generating HTML transcript and deleting channel in **5 seconds**.")
    );
    await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);

    const transcriptAttachment = await generateTranscript(channel, ticketRecord, message.guild);
    const config = ticketManager.getGuildTicketConfig(message.guild.id);

    if (config.logsChannelId) {
      const logsChannel = message.guild.channels.cache.get(config.logsChannelId);
      if (logsChannel && logsChannel.isTextBased()) {
        await logsChannel.send({
          content: `📜 **Ticket #${ticketRecord.ticketId} Closed** by <@${message.author.id}>\n> - **Opener:** <@${ticketRecord.userId}>`,
          files: [transcriptAttachment],
        }).catch(() => null);
      }
    }

    ticketManager.closeTicketRecord(message.guild.id, channel.id, message.author.id);

    setTimeout(async () => {
      await channel.delete("Ticket closed").catch(() => null);
    }, 5000);
  },
};
