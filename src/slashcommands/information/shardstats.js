const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const os = require("os");

function getStatusLabel(status) {
  switch (status) {
    case 0:
      return "<:online:1539875424144859239> Ready";
    case 1:
      return "<:idle:1539875427722727565> Connecting";
    case 2:
      return "🔄 Reconnecting";
    case 3:
      return "💤 Idle";
    case 4:
      return "<:idle:1539875427722727565> Nearly";
    case 5:
      return "<:red_circle:1539875594744107008> Disconnected";
    default:
      return "<:offline:1539875436690153474> Unknown";
  }
}

module.exports = {
  name: "shardstats",
  category: "Information",
  description:
    "View real-time cluster and multi-shard statistics, memory usage, uptime, and system status.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();

    const shardId = client.shard ? client.shard.ids[0] : 0;
    const totalShards = client.shard ? client.shard.count : 1;

    let shardStats = [];
    if (client.shard && client.shard.count > 0) {
      try {
        shardStats = await client.shard.broadcastEval((c) => ({
          id: c.shard.ids[0],
          status: c.ws.status,
          ping: c.ws.ping,
          guilds: c.guilds.cache.size,
          users: c.guilds.cache.reduce(
            (acc, g) => acc + (g.memberCount || 0),
            0,
          ),
          channels: c.channels.cache.size,
          memory: process.memoryUsage().heapUsed,
          uptime: c.uptime || 0,
        }));
      } catch (e) {
        shardStats = [
          {
            id: shardId,
            status: client.ws.status,
            ping: client.ws.ping,
            guilds: client.guilds.cache.size,
            users: client.guilds.cache.reduce(
              (acc, g) => acc + (g.memberCount || 0),
              0,
            ),
            channels: client.channels.cache.size,
            memory: process.memoryUsage().heapUsed,
            uptime: client.uptime || 0,
          },
        ];
      }
    } else {
      shardStats = [
        {
          id: 0,
          status: client.ws.status,
          ping: client.ws.ping,
          guilds: client.guilds.cache.size,
          users: client.guilds.cache.reduce(
            (acc, g) => acc + (g.memberCount || 0),
            0,
          ),
          channels: client.channels.cache.size,
          memory: process.memoryUsage().heapUsed,
          uptime: client.uptime || 0,
        },
      ];
    }

    let totalGuilds = 0;
    let totalUsers = 0;
    let totalChannels = 0;
    let totalMemoryBytes = 0;
    let totalPing = 0;
    let responsiveShards = 0;

    for (const s of shardStats) {
      totalGuilds += s.guilds;
      totalUsers += s.users;
      totalChannels += s.channels;
      totalMemoryBytes += s.memory;
      if (typeof s.ping === "number" && s.ping >= 0) {
        totalPing += s.ping;
        responsiveShards++;
      }
    }

    const avgPing =
      responsiveShards > 0
        ? Math.round(totalPing / responsiveShards)
        : client.ws.ping;
    const totalMemoryMB = (totalMemoryBytes / 1024 / 1024).toFixed(2);
    const totalMemGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMemGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

    const uptimeMs = client.uptime || 0;
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);

    const shardListLines = shardStats.map((s) => {
      const isCurrent = s.id === shardId ? " *(Active)*" : "";
      const memMB = (s.memory / 1024 / 1024).toFixed(1);
      return `> \`Shard #${s.id}\`${isCurrent} • ${getStatusLabel(s.status)} | Ping: \`${s.ping}ms\` | Guilds: \`${s.guilds.toLocaleString()}\` | Users: \`${s.users.toLocaleString()}\` | RAM: \`${memMB} MB\``;
    });

    const content = [
      `### <:stats:1539875420256866314> Shard & Cluster Diagnostics ── Active Shard #${shardId}`,
      `-# *Real-time cluster telemetry managing over 100+ servers across all shards.*`,
      "",
      `> - **Current Shard:** \`#${shardId} of ${totalShards}\``,
      `> - **Total Cluster Guilds:** \`${totalGuilds.toLocaleString()}\``,
      `> - **Total Cluster Users:** \`${totalUsers.toLocaleString()}\``,
      `> - **Total Cluster Channels:** \`${totalChannels.toLocaleString()}\``,
      `> - **Average Latency:** \`${avgPing}ms\``,
      `> - **Total Heap Memory:** \`${totalMemoryMB} MB\``,
      `> - **System Memory (Free / Total):** \`${freeMemGB} GB / ${totalMemGB} GB\``,
      `> - **Node.js Version:** \`${process.version}\``,
      `> - **System Platform:** \`${os.type()} ${os.arch()}\``,
      `> - **Current Shard Uptime:** \`${days}d ${hours}h ${minutes}m\``,
      "",
      "### <:stats:1539875420256866314> Shards Telemetry Summary",
      ...shardListLines,
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
        ),
      );

    return interaction
      .editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
