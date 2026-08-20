const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onChannelCreate",
  event: Events.ChannelCreate,
  once: false,

  async execute(client, channel) {
    if (!channel.guild) return;
    loggingManager.dispatchLog(
      client,
      channel.guild.id,
      "channelCreate",
      {
        channel,
        details: `Channel created: <#${channel.id}> (\`${channel.name}\`) • Type: \`${channel.type}\``,
      },
      { channelId: channel.id }
    ).catch(() => null);
  },
};
