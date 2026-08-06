const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["eval", "executejs"],
  category: "Owner",
  desc: "Evaluate arbitrary JavaScript code dynamically.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    const code = args.join(" ");
    if (!code) return message.reply("Please provide code to evaluate.");

    try {
      let evaluated = await eval(code);
      if (typeof evaluated !== "string") {
        evaluated = require("util").inspect(evaluated, { depth: 0 });
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 💻 Code Evaluation Result\n\n` +
          `\`\`\`js\n${evaluated.slice(0, 1800)}\n\`\`\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Evaluation Exception\n\n` +
          `\`\`\`js\n${err?.message || err}\n\`\`\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
