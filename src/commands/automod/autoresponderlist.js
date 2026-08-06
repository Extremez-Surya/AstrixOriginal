const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["autoresponderlist", "arlist", "ars"],
  category: "Automod",
  desc: "List all active auto-responder triggers configured in the server.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 💬 Configured Auto-Responders\n` +
        `-# *Active keywords and bot replies.*\n\n` +
        `> - **Total Triggers:** \`0 configured\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
