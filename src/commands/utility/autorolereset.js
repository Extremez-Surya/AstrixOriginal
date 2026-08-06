const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["autorolereset", "resetautorole", "joinrolereset"],
  category: "Utility",
  desc: "Reset and remove automatic join role settings.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    welcomeManager.updateGuildWelcome(message.guild.id, {
      autoRoleId: null,
    });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🔧 Auto-Role Reset\n-# *Auto-role disabled for new joins.*`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
