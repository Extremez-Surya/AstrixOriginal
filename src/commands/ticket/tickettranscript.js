const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const ticketManager = require("../../lib/ticketManager");
const { generateTranscript } = require("../../lib/ticketTranscript");

module.exports = {
  alias: ["tickettranscript", "transcript"],
  category: "Ticket",
  desc: "Generate an HTML transcript of the current support ticket.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const channel = message.channel;
    const ticketRecord = ticketManager.getTicketRecord(message.guild.id, channel.id);

    if (!ticketRecord) {
      return message.reply("❌ This command can only be executed inside an active ticket channel.").catch(() => null);
    }

    try {
      const transcript = await generateTranscript(channel, ticketRecord, message.guild);
      return message.reply({
        content: `📜 **HTML Transcript for Ticket #${ticketRecord.ticketId}**:`,
        files: [transcript],
      }).catch(() => null);
    } catch (err) {
      console.error("[tickettranscript] Error generating transcript:", err);
      return message.reply("❌ Failed to generate HTML transcript.").catch(() => null);
    }
  },
};
