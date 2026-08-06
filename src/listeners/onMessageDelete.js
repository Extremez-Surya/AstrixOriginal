const { Events } = require("discord.js");

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
  },
};
