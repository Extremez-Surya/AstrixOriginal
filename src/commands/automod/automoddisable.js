const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["automoddisable", "automod-off"],
  category: "Automod",
  desc: "Disable overall automated moderation filters.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🤖 Automod Disabled\n-# *Automated moderation deactivated.*`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
