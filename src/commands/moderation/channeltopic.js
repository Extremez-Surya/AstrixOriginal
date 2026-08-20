const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["channeltopic", "topic", "settopic"],
  category: "Moderation",
  desc: "Set or clear the topic of the current channel.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const newTopic = message.mentions.channels.first() ? args.slice(1).join(" ") : args.join(" ");

    try {
      await channel.setTopic(newTopic || null, `Topic modified by ${message.author.tag}`);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📝 **Channel Topic Updated** ── ${channel}\n` +
          `-# *Updated by <@${message.author.id}>*\n\n` +
          `> - **New Topic:** ${newTopic ? `\`${newTopic}\`` : "*Cleared (None)*"}`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to update channel topic: \`${err.message}\``);
    }
  },
};
