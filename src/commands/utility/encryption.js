const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["encode", "decode", "encryption", "b64"],
  category: "Utility",
  desc: "Encode or decode strings using Base64 or Hex encoding algorithms.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");

    if (mode === "encode") {
      if (!text) return message.reply("Please provide text to encode.");
      const encoded = Buffer.from(text).toString("base64");
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🔐 Base64 Encoded\n\n> - **Output:** \`${encoded}\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (mode === "decode") {
      if (!text) return message.reply("Please provide encoded string to decode.");
      const decoded = Buffer.from(text, "base64").toString("utf-8");
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🔓 Base64 Decoded\n\n> - **Output:** \`${decoded}\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔐 Text Encryption Tool\n` +
        `-# *Base64 string encoder & decoder.*\n\n` +
        `> - **Usage:** \`.encode encode <text>\` | \`.encode decode <base64_string>\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
