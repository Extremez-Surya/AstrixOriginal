const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["joindmdisable", "joindm-off"],
  category: "Welcome",
  desc: "Disable Direct Message greeting to joining members.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    welcomeManager.updateGuildWelcome(message.guild.id, {
      joinDmEnabled: false,
    });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ✉️ Join DM Disabled\n-# *Join DM greetings turned off.*`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
