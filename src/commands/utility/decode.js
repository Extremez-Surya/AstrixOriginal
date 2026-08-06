const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["decode", "base64decode"],
  category: "Utility",
  desc: "Decode Base64 string back to plain text.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ");
    if (!text) return message.reply("Specify Base64 string to decode.");

    const decoded = Buffer.from(text, "base64").toString("utf-8");
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔓 Base64 Decoded\n> - **Output:** \`${decoded}\``)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
