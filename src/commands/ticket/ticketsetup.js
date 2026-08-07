const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  alias: ["ticketsetup", "ticketpanel", "sendpanel"],
  category: "Ticket",
  desc: "Launch interactive step-by-step wizard for configuring and sending a support ticket panel.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const embed = new EmbedBuilder()
      .setTitle("Ticket System Setup")
      .setDescription("Click the button below to start the interactive setup wizard for your ticket panel.")
      .setColor("#5865F2");

    const startBtn = new ButtonBuilder()
      .setCustomId("tkt_setup_start")
      .setEmoji("🪄")
      .setLabel("Start Setup")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(startBtn);

    return message.reply({ embeds: [embed], components: [row] }).catch(() => null);
  },
};
