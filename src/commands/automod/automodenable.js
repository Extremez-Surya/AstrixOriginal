const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["automodenable", "automod-on"],
  category: "Automod",
  desc: "Enable overall automated moderation filters.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🤖 Automod Enabled\n-# *Automated moderation active.*`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
