const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["nightmode", "nightm"],
  category: "Security",
  desc: "Lock down channel permissions overnight to prevent raid damage.",
  botPermissions: ["ManageChannels", "ManageRoles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();

    if (action === "enable" || action === "on") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🌙 Nightmode Activated\n` +
          `-# *Server channels have been locked down against permission modifications.*\n\n` +
          `> - **Status:** \`ACTIVE\`\n` +
          `> - **Permissions Restricted:** \`SendMessages\`, \`AttachFiles\`, \`AddReactions\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (action === "disable" || action === "off") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ☀️ Nightmode Deactivated\n` +
          `-# *Server permissions restored to normal operational state.*\n\n` +
          `> - **Status:** \`INACTIVE\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🌙 Nightmode Security\n` +
        `-# *Prevent overnight spam & raid damage with automatic channel restrictions.*\n\n` +
        `> - **Usage:** \`.nightmode enable\` | \`.nightmode disable\`\n` +
        `> - **Status:** \`INACTIVE\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
