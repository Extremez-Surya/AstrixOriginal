const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const os = require("os");

module.exports = {
  alias: ["botstats", "sysinfo", "hostinfo", "vpsinfo", "specs"],
  category: "Owner",
  desc: "View deep host hardware specs, process metrics, memory allocations & gateway telemetry.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    const mem = process.memoryUsage();
    const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(1);
    const rss = (mem.rss / 1024 / 1024).toFixed(1);
    const external = (mem.external / 1024 / 1024).toFixed(1);

    const totalSystemMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeSystemMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedSystemMem = (totalSystemMem - freeSystemMem).toFixed(2);

    const uptimeSec = Math.floor(process.uptime());
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    const cpus = os.cpus();
    const cpuModel = cpus && cpus[0] ? cpus[0].model.trim() : "Unknown CPU";
    const cpuCores = cpus ? cpus.length : 1;

    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
    const totalChannels = client.channels.cache.size;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🖥️ **Astrix Host & Hardware Telemetry**\n` +
          `-# *Real-Time Hardware, Runtime & Process Health*\n\n` +
          `**⚙️ Process Runtime:**\n` +
          `> • **Process Uptime:** \`${days}d ${hours}h ${minutes}m\`\n` +
          `> • **Node.js Runtime:** \`${process.version}\`\n` +
          `> • **Discord.js Engine:** \`v14.27.0\`\n` +
          `> • **Platform:** \`${os.type()} ${os.release()} (${os.arch()})\`\n\n` +
          `**🧠 Memory Allocations:**\n` +
          `> • **Process Heap:** \`${heapUsed} MB\` / \`${heapTotal} MB\`\n` +
          `> • **Process RSS:** \`${rss} MB\` • **External:** \`${external} MB\`\n` +
          `> • **Host System RAM:** \`${usedSystemMem} GB\` / \`${totalSystemMem} GB\` (\`${freeSystemMem} GB\` free)\n\n` +
          `**⚡ CPU & Shard Gateway:**\n` +
          `> • **Processor:** \`${cpuModel} (${cpuCores} Cores)\`\n` +
          `> • **Gateway Ping:** \`${client.ws.ping >= 0 ? `${client.ws.ping}ms` : "Optimal (<1ms)"}\`\n` +
          `> • **Shards:** \`1 Shard Active\`\n\n` +
          `**🌐 Entity Cache Footprint:**\n` +
          `> • **Guilds:** \`${totalGuilds}\` servers • **Users:** \`${totalUsers.toLocaleString()}\` • **Channels:** \`${totalChannels}\``
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ High-Performance Node.js Engine`)
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
