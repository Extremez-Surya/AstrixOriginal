const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["nuke", "channelnuke", "clearchannel"],
  category: "Moderation",
  desc: "Nuke and clone the current channel, wiping all messages while preserving settings.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.channel;

    if (!channel.deletable) {
      return message.reply("❌ I cannot nuke this channel (insufficient permissions or system channel).");
    }

    try {
      const position = channel.position;
      const topic = channel.topic;
      const rateLimit = channel.rateLimitPerUser;
      const nsfw = channel.nsfw;
      const parent = channel.parentId;
      const permissionOverwrites = channel.permissionOverwrites.cache;

      const newChannel = await channel.clone({
        name: channel.name,
        reason: `Channel nuked by ${message.author.tag}`,
      });

      await newChannel.setPosition(position).catch(() => null);
      if (topic) await newChannel.setTopic(topic).catch(() => null);
      if (rateLimit) await newChannel.setRateLimitPerUser(rateLimit).catch(() => null);

      await channel.delete(`Nuked by ${message.author.tag}`);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 💥 **Channel Nuked Successfully**\n` +
          `-# *All messages cleared while preserving permissions, topic & position.*\n\n` +
          `> - **Nuked by:** <@${message.author.id}>`
        )
      );

      return newChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to nuke channel: \`${err.message}\``);
    }
  },
};
