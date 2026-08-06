const { ContainerBuilder, TextDisplayBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  alias: ["ticket", "tickets", "ticketpanel"],
  category: "Ticket",
  desc: "Set up and manage private support ticket creation panels.",
  botPermissions: ["ManageChannels", "ManageRoles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === "panel" || sub === "setup") {
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
    }

    if (sub === "close") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🎟️ Ticket Closed\n-# *This ticket channel will be archived.*`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎟️ Ticket System Setup\n` +
        `-# *Support ticket system configuration.*\n\n` +
        `> - **Usage:** \`.ticket panel\` - Deploy ticket creation button panel\n` +
        `> - **Usage:** \`.ticket close\` - Close and delete active ticket channel\n` +
        `> - **Usage:** \`.ticket add @user\` | \`.ticket remove @user\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
