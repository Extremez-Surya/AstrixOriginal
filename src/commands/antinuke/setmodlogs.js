const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");

module.exports = {
  alias: ["setmodlogs", "setmodlog", "modlogs"],
  category: "Anti Nuke",
  desc: "Configure the dedicated moderation and security log channel.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isOwner = message.guild.ownerId === message.author.id;
    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(message.author.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(message.author.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      return message.reply({
        content: "❌ Only the **Server Owner** or authorized **Extra Owners** can configure log channels.",
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const channel = message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]) ||
      message.guild.channels.cache.find((c) => c.name.toLowerCase() === args[0]?.toLowerCase());

    if (!channel) {
      return message.reply({
        content: "⚠️ **Usage:** `setmodlogs <#channel | channelId>`",
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    antinukeManager.setModLogs(message.guild.id, channel.id);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ **Moderation Log Channel Configured**\n\n` +
        `> • **Channel:** <#${channel.id}> (\`${channel.id}\`)\n` +
        `> • **Telemetry:** Security alerts and moderation actions will be logged here.`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
