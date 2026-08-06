const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["autoreact", "addreact"],
  category: "Automod",
  desc: "Set automatic emoji reactions for specific text triggers.",
  botPermissions: ["AddReactions", "ReadMessageHistory"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const trigger = args[0];
    const emoji = args[1];

    if (!trigger || !emoji) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎭 Auto-React Setup\n` +
          `-# *Automatically react with an emoji whenever a keyword is typed.*\n\n` +
          `> - **Usage:** \`.autoreact <trigger_word> <emoji>\`\n` +
          `> - **Example:** \`.autoreact GG 🎉\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Auto-Reaction Saved\n` +
        `-# *Astrix will now react when \`${trigger}\` is mentioned.*\n\n` +
        `> - **Trigger:** \`${trigger}\` | **Emoji:** ${emoji}`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
