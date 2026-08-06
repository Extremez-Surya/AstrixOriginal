const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["j2creset", "jointocreatereset"],
  category: "Voice",
  desc: "Reset Join-To-Create configuration.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔊 J2C Hub Reset\n-# *Join-To-Create temp VC generator disabled.*`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
