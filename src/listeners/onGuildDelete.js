const { Events } = require("discord.js");
const { sendGuildLeaveLog } = require("../lib/serverLogsManager");

module.exports = {
  name: "onGuildDelete",
  event: Events.GuildDelete,
  once: false,

  async execute(client, guild) {
    if (!guild || !guild.id) return;
    await sendGuildLeaveLog(client, guild);
  },
};
