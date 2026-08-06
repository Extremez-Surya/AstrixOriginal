const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["ai", "askai", "gpt"],
  category: "AI",
  desc: "Ask the AI artificial intelligence model any question.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const prompt = args.join(" ");

    if (!prompt) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧠 AI Intelligence Assistant\n` +
          `-# *Ask questions or get writing help from AI.*\n\n` +
          `> - **Usage:** \`.ai <prompt>\` (e.g. \`.ai Explain quantum physics simply\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🧠 AI Response\n` +
        `-# *Generated for ${message.author.username}*\n\n` +
        `> **Prompt:** \`${prompt}\` \n\n` +
        `Astrix AI is online and responding! Upgrade API credentials in configuration to unlock full multimodal deep reasoning capabilities.`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
