const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["stickyremove", "stickydel", "sticky-remove"],
  category: "Utility",
  desc: "Remove active sticky message from current channel.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 📌 Sticky Message Removed\n-# *Sticky message cleared.*`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
