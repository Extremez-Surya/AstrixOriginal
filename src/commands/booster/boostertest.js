const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["boostertest", "testbooster"],
  category: "Booster",
  desc: "Send a preview test server boost announcement in current channel.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🚀 Thank you for boosting ${message.guild.name}, ${message.author.username}!\n` +
        `-# *Preview test booster message successfully rendered.*\n\n` +
        `> - **Boost Level:** Tier \`${message.guild.premiumTier}\` | **Total Boosts:** \`${message.guild.premiumSubscriptionCount || 1}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
