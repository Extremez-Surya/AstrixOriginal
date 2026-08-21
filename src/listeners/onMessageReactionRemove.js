const { Events } = require("discord.js");
const snipeManager = require("../lib/snipeManager");

module.exports = {
  name: "onMessageReactionRemove",
  event: Events.MessageReactionRemove,
  once: false,

  async execute(client, reaction, user) {
    if (!reaction?.message?.guild || user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        return;
      }
    }

    const starboardManager = require("../lib/starboardManager");
    starboardManager.handleReactionRemove(client, reaction, user).catch(() => null);

    snipeManager.addRemovedReaction(reaction, user);
  },
};
