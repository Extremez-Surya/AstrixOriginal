const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyedisable", "leavedisable", "goodbyeoff", "leaveoff"],
  category: "Goodbye",
  desc: "Deactivate the member departure and goodbye greetings module.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    goodbyeManager.updateGuildGoodbye(message.guild.id, { enabled: false });
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⚠️ Goodbye Module Deactivated\n` +
        `-# *Member departure messages are currently DISABLED.*`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
