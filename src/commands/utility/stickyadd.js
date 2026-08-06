const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["stickyadd", "stickyset", "sticky-add"],
  category: "Utility",
  desc: "Set a sticky message for current channel.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ");
    if (!text) return message.reply("Specify sticky content: `.stickyadd <message>`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 📌 Sticky Message Created\n> - **Message:** \`${text}\``)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
