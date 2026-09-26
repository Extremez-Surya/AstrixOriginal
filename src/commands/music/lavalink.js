const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

function formatUptime(ms) {
  if (!ms || isNaN(ms)) return "0m";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["lavalink", "node", "nodes", "nodestats", "lavalinkstats"],
  category: "Music",
  desc: "Display live Lavalink cluster connection status, memory, CPU load, and active player statistics.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const nodesMap = client.manager?.shoukaku?.nodes;
    if (!nodesMap || nodesMap.size === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ No Lavalink Nodes Registered\n` +
            `-# *The audio manager currently has no active node definitions.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const allNodes = Array.from(nodesMap.values());
    const onlineCount = allNodes.filter((n) => n.state === 1).length;
    const totalCount = allNodes.length;

    const guildPlayer = client.manager?.players?.get(message.guild.id);
    const activeGuildNode = guildPlayer?.node?.name || "None (Not playing)";

    let content =
      `### ⚡ Lavalink Cluster Status\n` +
      `-# Cluster Health: \`${onlineCount}/${totalCount} Nodes Online\` • Active Server Node: \`${activeGuildNode}\`\n\n`;

    for (const node of allNodes) {
      const isOnline = node.state === 1;
      const isConnecting = node.state === 0;
      const statusIcon = isOnline ? "🟢" : isConnecting ? "🟡" : "🔴";
      const statusText = isOnline
        ? "CONNECTED"
        : isConnecting
          ? "CONNECTING"
          : "OFFLINE";

      const stats = node.stats || {};
      const players = stats.players || 0;
      const playing = stats.playingPlayers || 0;
      const ram = formatBytes(stats.memory?.used);
      const cpu = stats.cpu?.lavalinkLoad
        ? `${(stats.cpu.lavalinkLoad * 100).toFixed(1)}%`
        : "0%";
      const uptime = formatUptime(stats.uptime);

      content += `> ${statusIcon} **${node.name}** — \`${statusText}\`\n`;
      if (isOnline) {
        content +=
          `> -# 👥 **Streams:** \`${playing}/${players}\` • 🧠 **RAM:** \`${ram}\` • ⚙️ **CPU:** \`${cpu}\` • ⏱️ **Uptime:** \`${uptime}\`\n\n`;
      } else {
        content += `> -# *Reconnecting or awaiting handshake with host...*\n\n`;
      }
    }

    content += `-# 🛡️ Auto-failover and stream migration are active. Powered by Astrix Audio Engine.`;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
