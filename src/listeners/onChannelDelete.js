const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onChannelDelete",
  event: Events.ChannelDelete,
  once: false,

  async execute(client, channel) {
    if (!channel.guild) return;
    loggingManager.dispatchLog(
      client,
      channel.guild.id,
      "channelDelete",
      {
        details: `Channel deleted: \`#${channel.name}\` (\`${channel.id}\`)`,
      },
      { channelId: channel.id }
    ).catch(() => null);
  },
};
