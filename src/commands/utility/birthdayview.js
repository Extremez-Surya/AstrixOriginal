const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["birthdayview", "viewbirthday", "viewbday"],
  category: "Utility",
  desc: "View registered birthday for yourself or a mentioned member.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || message.author;
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎂 Member Birthday\n> - **User:** ${targetUser.username}\n> - **Date:** \`Not set\``)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
