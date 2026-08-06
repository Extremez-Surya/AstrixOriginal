const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["owner", "botowner", "dev"],
  category: "Owner",
  desc: "Developer & bot owner administrative menu.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 👑 Developer Administration\n` +
        `-# *Internal control stats for Astrix bot developers.*\n\n` +
        `> - **Total Shards:** \`${client.ws.shards.size}\` \n` +
        `> - **Total Guilds:** \`${totalGuilds.toLocaleString()}\` \n` +
        `> - **Total Users:** \`${totalUsers.toLocaleString()}\` \n` +
        `> - **Memory Usage:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
