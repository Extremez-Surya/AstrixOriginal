const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyereset", "leavereset"],
  category: "Goodbye",
  desc: "Reset all goodbye system configurations back to defaults.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    goodbyeManager.resetGuildGoodbye(message.guild.id);
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔄 Goodbye Settings Reset\n` +
        `-# *All goodbye system parameters have been reset to factory defaults.*`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
