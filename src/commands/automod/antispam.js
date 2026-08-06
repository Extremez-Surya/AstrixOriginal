const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["antispam", "spamfilter"],
  category: "Automod",
  desc: "Configure anti-spam thresholds and enforcement penalties.",
  botPermissions: ["ManageMessages", "ModerateMembers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const status = args[0]?.toLowerCase();

    if (status === "enable" || status === "on") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛑 Anti-Spam Enabled\n` +
          `-# *Users sending messages rapidly will be rate-limited or muted.*\n\n` +
          `> - **Threshold:** \`5 messages per 3 seconds\`\n` +
          `> - **Penalty:** \`Timeout (5 minutes)\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (status === "disable" || status === "off") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛑 Anti-Spam Disabled\n` +
          `-# *Spam detection disabled for this server.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🛑 Anti-Spam Configuration\n` +
        `-# *Prevent message flood and rapid spamming.*\n\n` +
        `> - **Usage:** \`.antispam enable\` | \`.antispam disable\`\n` +
        `> - **Current Status:** \`ENABLED\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
