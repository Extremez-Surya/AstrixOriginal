const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");
const snipeManager = require("../lib/snipeManager");

module.exports = {
  name: "onMessageUpdate",
  event: Events.MessageUpdate,
  once: false,

  async execute(client, oldMessage, newMessage) {
    if (!newMessage || !newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    snipeManager.addEditedMessage(oldMessage, newMessage);

    loggingManager.dispatchLog(
      client,
      newMessage.guild.id,
      "messageEdit",
      {
        target: newMessage.author,
        channel: newMessage.channel,
        before: oldMessage.content || "(Not cached)",
        after: newMessage.content || "(Empty)",
        details: `Message edited • [Jump to Message](${newMessage.url})`,
      },
      { author: newMessage.author, channelId: newMessage.channel.id, member: newMessage.member }
    ).catch(() => null);
  },
};
