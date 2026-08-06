const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["birthdayset", "setbday", "setbirthday"],
  category: "Utility",
  desc: "Save your birthday (DD/MM format).",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const dateStr = args[0];
    if (!dateStr) return message.reply("Please specify date: `.birthdayset DD/MM` (e.g. `.birthdayset 14/02`)");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎂 Birthday Set\n> - **Date:** \`${dateStr}\` | **User:** ${message.author.username}`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
