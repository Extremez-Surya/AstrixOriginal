const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["antinukedisable", "anti-disable", "antiwizz-disable"],
  category: "Security",
  desc: "Disable Anti-Nuke protection for this server.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⚠️ Anti-Nuke Protection Deactivated\n` +
        `-# *Server protection has been disabled by administrator.*\n\n` +
        `> - **Status:** \`DISABLED\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
