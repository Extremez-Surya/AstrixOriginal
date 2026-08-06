const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["boostermessage", "setboostermsg"],
  category: "Booster",
  desc: "Set custom celebration text template when a user boosts the server.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ");
    if (!text) return message.reply("Provide booster message: `.boostermessage Thank you {user} for boosting {server}!`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🚀 Booster Message Updated\n> - **Template:** \`${text}\``)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
