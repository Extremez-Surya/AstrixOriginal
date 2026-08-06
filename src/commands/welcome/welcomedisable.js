const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomedisable", "disablewelcome", "welcomoff"],
  category: "Welcome",
  desc: "Disable server welcome greetings module.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    welcomeManager.updateGuildWelcome(message.guild.id, { enabled: false });
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⚠️ Welcome Module Deactivated\n` +
        `-# *Member join greetings are currently DISABLED.*`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
