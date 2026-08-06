const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["imagine", "aiimage", "draw"],
  category: "AI",
  desc: "Generate artwork and images using text-to-image AI prompts.",
  botPermissions: ["AttachFiles", "SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const prompt = args.join(" ");

    if (!prompt) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎨 AI Image Generator\n` +
          `-# *Transform text prompts into visual art.*\n\n` +
          `> - **Usage:** \`.imagine <description>\` (e.g. \`.imagine Cyberpunk neon city at night\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎨 AI Artwork Generation\n` +
        `-# *Processing image prompt...*\n\n` +
        `> - **Prompt:** \`${prompt}\` \n` +
        `> - **Status:** Rendering via Pollinations AI Engine...`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
