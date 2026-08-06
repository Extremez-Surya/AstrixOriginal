const { ContainerBuilder, TextDisplayBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  alias: ["ticketpanel", "deployticketpanel"],
  category: "Ticket",
  desc: "Send interactive support ticket button panel in channel.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const button = new ButtonBuilder()
      .setCustomId("create_ticket_btn")
      .setLabel("Create Ticket")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎟️");

    const row = new ActionRowBuilder().addComponents(button);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎟️ Support Ticket Center\n` +
          `-# *Need assistance or wish to contact staff? Click below to open a private ticket channel.*\n\n` +
          `> A staff member will respond to your channel shortly.`
        )
      )
      .addActionRowComponents(row);

    await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return message.reply({ content: "✅ Ticket panel deployed successfully.", ephemeral: true }).catch(() => null);
  },
};
