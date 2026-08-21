const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
} = require("discord.js");

function formatTime(ms) {
  if (!ms || isNaN(ms) || ms === 0) return "Live Stream";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["queue", "q"],
  category: "Music",
  desc: "Display the server music queue.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || (!player.queue.current && player.queue.length === 0)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Empty Queue\n` +
            `-# *There are no tracks in the queue right now.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const currentTrack = player.queue.current;
    const tracks = player.queue.slice(0, 10);
    const totalTracks = (currentTrack ? 1 : 0) + player.queue.length;
    const totalDurationMs =
      (currentTrack?.length || 0) +
      player.queue.reduce((acc, t) => acc + (t.length || 0), 0);

    let text = `### 📜 Music Queue • ${message.guild.name}\n`;
    if (currentTrack) {
      text += `> - **Now Playing:** [${currentTrack.title}](${currentTrack.uri}) (\`${formatTime(currentTrack.length)}\`)\n\n`;
    }

    if (tracks.length === 0) {
      text += `-# *No upcoming tracks queued.*`;
    } else {
      text +=
        `**Upcoming Tracks:**\n` +
        tracks
          .map(
            (t, idx) =>
              `**${idx + 1}.** [${t.title}](${t.uri}) • \`${formatTime(t.length)}\``,
          )
          .join("\n");

      if (player.queue.length > 10) {
        text += `\n\n-# *...and ${player.queue.length - 10} more tracks in queue.*`;
      }
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `📊 **Total:** \`${totalTracks}\` track${totalTracks === 1 ? "" : "s"} (${formatTime(totalDurationMs)}) • **Loop:** \`${player.loop || "none"}\` • **24/7:** \`${player.data?.get("is247") ? "Enabled" : "Disabled"}\``,
        ),
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
