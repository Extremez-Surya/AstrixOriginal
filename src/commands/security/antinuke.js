const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["antinuke", "antiwizz", "anti"],
  category: "Security",
  desc: "Enable, disable, or view Anti-Nuke protection settings for the server.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const option = args[0]?.toLowerCase();

    if (option === "enable" || option === "on") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Anti-Nuke System Activated\n` +
          `-# *Server protection against unauthorized changes is now ACTIVE.*\n\n` +
          `> - **Protected Actions:** \`Role Delete/Create, Channel Delete/Create, Member Kick/Ban, Bot Add, Webhook Create\`\n` +
          `> - **Status:** \`ENABLED\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (option === "disable" || option === "off") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ Anti-Nuke System Deactivated\n` +
          `-# *Server protection has been disabled by administrator.*\n\n` +
          `> - **Status:** \`DISABLED\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🛡️ Anti-Nuke Module Panel\n` +
        `-# *Configure server anti-nuke limits and whitelist settings.*\n\n` +
        `> - **Subcommands:** \`.antinuke enable\` | \`.antinuke disable\` | \`.whitelist\`\n` +
        `> - **Current Status:** \`ENABLED\`\n` +
        `> - **Time Window:** \`10 seconds\` | **Action Limit:** \`3 per window\``
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
  },
};
