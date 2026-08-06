const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["blacklistlist", "bllist", "showblacklist"],
  category: "Owner",
  desc: "List all globally blacklisted users and servers.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ⛔ Global Blacklist List\n> - **Total Blacklisted:** \`0 users / 0 servers\``)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
