const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["anticaps", "capsfilter"],
  category: "Automod",
  desc: "Filter and auto-delete messages containing excessive capital letters.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();

    if (action === "enable" || action === "on") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔤 Anti-Caps Filter Enabled\n` +
          `-# *Messages containing >70% uppercase letters will be automatically purged.*\n\n` +
          `> - **Threshold:** \`70% capital characters (min length 8)\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (action === "disable" || action === "off") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔤 Anti-Caps Filter Disabled\n` +
          `-# *Uppercase message filtering turned off.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔤 Anti-Caps Control\n` +
        `-# *Keep chat readable by suppressing shouting in ALL CAPS.*\n\n` +
        `> - **Usage:** \`.anticaps enable\` | \`.anticaps disable\`\n` +
        `> - **Status:** \`DISABLED\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
