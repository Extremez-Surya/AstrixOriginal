const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["antinukeenable", "anti-enable", "antiwizz-enable"],
  category: "Security",
  desc: "Enable Anti-Nuke protection for this server.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <a:red_star:1528688099436003419> Anti-Nuke Protection Activated\n` +
        `-# *Server protection against unauthorized changes is now ACTIVE.*\n\n` +
        `> - **Protected Actions:** \`Role Delete/Create, Channel Delete/Create, Kick/Ban, Webhooks\`\n` +
        `> - **Status:** \`ENABLED\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
