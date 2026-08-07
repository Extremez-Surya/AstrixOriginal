const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyemessage", "goodbyetext", "leavetext"],
  category: "Goodbye",
  desc: "Set the custom departure description text template for goodbye cards.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ");
    if (!text) {
      return message.reply("❌ Please provide a goodbye message template (e.g. `.goodbyemessage Goodbye {username}, we will miss you!`).").catch(() => null);
    }

    const config = goodbyeManager.getGuildGoodbye(message.guild.id);
    if (!config.channels || config.channels.length === 0) {
      return message.reply("❌ Add a goodbye channel first with `.goodbyechannel #channel`.").catch(() => null);
    }

    for (const ch of config.channels) {
      ch.description = text;
    }
    goodbyeManager.updateGuildGoodbye(message.guild.id, { channels: config.channels });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Goodbye Message Template Updated\n` +
        `-# *Updated departure text across configured channels.*\n\n` +
        `> **New Message Template:**\n` +
        `\`\`\`\n${text}\n\`\`\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
