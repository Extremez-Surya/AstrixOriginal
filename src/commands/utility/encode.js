const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["encode", "base64encode"],
  category: "Utility",
  desc: "Encode plain text to Base64 string.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ");
    if (!text) return message.reply("Specify text to encode: `.encode hello world`");

    const encoded = Buffer.from(text).toString("base64");
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔐 Base64 Encoded\n> - **Output:** \`${encoded}\``)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
