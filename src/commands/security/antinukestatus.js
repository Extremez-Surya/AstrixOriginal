const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["antinukestatus", "anti-status", "antiwizz-status"],
  category: "Security",
  desc: "View current Anti-Nuke settings and limits.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🛡️ Anti-Nuke Status & Limits\n` +
        `-# *Server safety configuration overview.*\n\n` +
        `> - **Status:** \`ENABLED\`\n` +
        `> - **Time Window:** \`10s\` | **Max Actions:** \`3\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
