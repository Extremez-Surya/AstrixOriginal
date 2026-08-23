const { Events } = require("discord.js");
const { sendGuildJoinLog } = require("../lib/serverLogsManager");

module.exports = {
  name: "onGuildCreate",
  event: Events.GuildCreate,
  once: false,

  async execute(client, guild) {
    if (!guild || !guild.id) return;
    await sendGuildJoinLog(client, guild);
  },
};
