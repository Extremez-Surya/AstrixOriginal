const { Events } = require("discord.js");
const snipeManager = require("../lib/snipeManager");

module.exports = {
  name: "onMessageReactionAdd",
  event: Events.MessageReactionAdd,
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

    snipeManager.addReactionHistoryEntry(
      reaction.message.id,
      user,
      reaction.emoji,
      "add",
      reaction.message.url,
      reaction.message.guild.id,
      reaction.message.channel.id
    );
  },
};
