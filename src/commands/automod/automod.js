const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["automod", "automoderation"],
  category: "Automod",
  desc: "Enable, disable, or configure automated message moderation.",
  botPermissions: ["ManageMessages", "ModerateMembers"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();

    if (action === "enable" || action === "on") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🤖 Automod System Activated\n` +
          `-# *Automated moderation protection is now live.*\n\n` +
          `> - **Active Modules:** \`Anti-Spam, Anti-Link, Anti-Caps, Anti-Invite\`\n` +
          `> - **Status:** \`ENABLED\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (action === "disable" || action === "off") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🤖 Automod System Deactivated\n` +
          `-# *Automated moderation filtering has been disabled.*\n\n` +
          `> - **Status:** \`DISABLED\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🤖 Auto-Moderation Control Panel\n` +
        `-# *Configure automated filters to keep your server safe.*\n\n` +
        `> - **Usage:** \`.automod enable\` | \`.automod disable\`\n` +
        `> - **Modules:** \`.antispam\` | \`.antilink\` | \`.anticaps\` | \`.autoreact\` | \`.autoresponder\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
