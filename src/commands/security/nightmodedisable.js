const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["nightmodedisable", "nightmode-off"],
  category: "Security",
  desc: "Deactivate Nightmode lockdown.",
  botPermissions: ["ManageChannels", "ManageRoles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ☀️ Nightmode Deactivated\n` +
        `-# *Server channel permissions restored to normal.*\n\n` +
        `> - **Status:** \`INACTIVE\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
