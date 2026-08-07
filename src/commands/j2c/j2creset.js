const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const j2cManager = require("../../lib/j2cManager");

module.exports = {
  alias: ["j2creset", "jointocreatereset"],
  category: "Join To Create",
  desc: "Reset and disable Join-To-Create temp VC generators for this server.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    j2cManager.resetJ2C(message.guild.id);
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`✅ Join-To-Create system has been reset and disabled for this server.`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
