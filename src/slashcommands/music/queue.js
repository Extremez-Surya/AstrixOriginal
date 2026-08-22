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

module.exports = {
  name: "queue",
  description: "Display the server music queue.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || (!player.queue.current && player.queue.length === 0)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Empty Queue\n` +
            `-# *There are no tracks in the queue right now.*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const currentTrack = player.queue.current;
    const tracks = player.queue.slice(0, 10);

    let text = `### 📜 Music Queue • ${interaction.guild.name}\n`;
    if (currentTrack) {
      text += `> - **Now Playing:** [${currentTrack.title}](${currentTrack.uri}) (\`${formatTime(currentTrack.length)}\`)\n\n`;
    }

    if (tracks.length === 0) {
      text += `-# *No upcoming tracks queued.*`;
    } else {
      text += `**Upcoming Tracks:**\n` +
        tracks
          .map(
            (t, idx) =>
              `**${idx + 1}.** [${t.title}](${t.uri}) • \`${formatTime(t.length)}\``
          )
          .join("\n");

      if (player.queue.length > 10) {
        text += `\n\n-# *...and ${player.queue.length - 10} more tracks in queue.*`;
      }
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
      .addSeparatorComponents(new SeparatorBuilder());

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
