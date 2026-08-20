const { Events } = require("discord.js");
const levelingManager = require("../lib/levelingManager");

module.exports = {
  name: "onVoiceStateUpdate",
  event: Events.VoiceStateUpdate,
  once: false,

  async execute(client, oldState, newState) {
    levelingManager.handleVoiceStateUpdate(client, oldState, newState).catch(() => null);
  },
};
