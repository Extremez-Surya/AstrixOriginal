const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["nightmodeenable", "nightmode-on"],
  category: "Security",
  desc: "Activate Nightmode to lock down server permissions.",
  botPermissions: ["ManageChannels", "ManageRoles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🌙 Nightmode Activated\n` +
        `-# *Server channels have been locked down against permission modifications.*\n\n` +
        `> - **Status:** \`ACTIVE\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
