const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["ticketadd", "addusertoticket"],
  category: "Ticket",
  desc: "Add a member to the current ticket channel.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply("Mention user: `.ticketadd @user`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎟️ User Added to Ticket\n> - **User:** ${targetUser} (\`${targetUser.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
