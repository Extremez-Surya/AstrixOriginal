const { Events } = require("discord.js");
const configManager = require("../lib/configManager");

module.exports = {
  name: "onConfigurationMessage",
  event: Events.MessageCreate,
  once: false,

  async execute(client, message) {
    if (!message.guild || message.author.bot) return;

    // Fast sub-0.1s evaluation of triggers & reaction triggers
    await configManager.evaluateTriggersAndReactions(message, client);
  },
};
