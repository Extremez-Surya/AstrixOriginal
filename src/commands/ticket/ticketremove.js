const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["ticketremove", "removeuserfromticket"],
  category: "Ticket",
  desc: "Remove a member from the current ticket channel.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply("Mention user: `.ticketremove @user`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎟️ User Removed from Ticket\n> - **User:** ${targetUser} (\`${targetUser.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
