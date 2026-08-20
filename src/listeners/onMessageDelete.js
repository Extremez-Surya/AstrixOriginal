const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onMessageDelete",
  event: Events.MessageDelete,
  once: false,

  async execute(client, message) {
    if (!message || !message.guild || message.author?.bot) return;

    if (!client.snipes) {
      client.snipes = new Map();
    }

    client.snipes.set(message.channel.id, {
      content: message.content || null,
      author: message.author,
      attachments: message.attachments ? message.attachments.map((a) => a.url) : [],
      createdTimestamp: message.createdTimestamp,
      deletedTimestamp: Date.now(),
    });

    loggingManager.dispatchLog(
      client,
      message.guild.id,
      "messageDelete",
      {
        target: message.author,
        channel: message.channel,
        content: message.content || "(No text content / attachment only)",
        details: `Deleted message sent at <t:${Math.floor(message.createdTimestamp / 1000)}:T>`,
      },
      { author: message.author, channelId: message.channel.id, member: message.member }
    ).catch(() => null);
  },
};
