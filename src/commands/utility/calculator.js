const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["calculator", "calc"],
  category: "Utility",
  desc: "Evaluate mathematical expressions safely.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const expression = args.join(" ");

    if (!expression) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧮 Calculator\n` +
          `-# *Provide a mathematical formula to evaluate.*\n\n` +
          `> - **Usage:** \`.calc <expression>\` (e.g. \`.calc 5 * (12 + 4)\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    try {
      // Clean and safe math evaluation (alphanumeric + operators only)
      const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, "");
      const result = eval(sanitized);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧮 Mathematical Evaluation\n` +
          `-# *Calculation completed cleanly.*\n\n` +
          `> - **Input:** \`${expression}\` \n` +
          `> - **Result:** \`${result}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Calculation Error\n` +
          `-# *Failed to process formula. Please verify syntax.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
