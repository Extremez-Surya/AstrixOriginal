const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["joindm", "dmwelcome"],
  category: "Welcome",
  desc: "Send a direct message greeting to new members upon joining.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");

    if (action === "test") {
      const testCmd = client.messageCommands.get("joindmtest");
      if (testCmd) {
        return testCmd.execute(client, message, args);
      }
    }

    if (action === "enable" || action === "on") {
      if (!text) return message.reply("Provide Join DM message content: `.joindm enable <text>`");

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✉️ Join DM Enabled\n` +
          `-# *New members will receive a direct message on join.*\n\n` +
          `> - **Message:** \`${text}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (action === "disable" || action === "off") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ✉️ Join DM Disabled\n-# *Join DMs turned off.*`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✉️ Join DM Setup\n` +
        `-# *Send private welcome messages to new joins.*\n\n` +
        `> - **Usage:** \`.joindm enable <text>\` | \`.joindm disable\` | \`.joindm test\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
