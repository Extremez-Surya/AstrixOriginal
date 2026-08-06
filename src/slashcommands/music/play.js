const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ApplicationCommandOptionType,
} = require("discord.js");
const { getSearchEngine } = require("../../lib/musicManager.js");

function formatDuration(ms) {
  if (!ms || isNaN(ms) || ms === 0) return "Live Stream";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

module.exports = {
  name: "play",
  description: "Play tracks or playlists from YouTube, Spotify, SoundCloud, or Apple Music.",
  options: [
    {
      name: "query",
      description: "Track title, keyword, or URL to play",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  async execute(client, interaction) {
    try {
      const voiceChannel =
        interaction.member?.voice?.channel ||
        (interaction.member?.voice?.channelId
          ? interaction.guild?.channels?.cache?.get(interaction.member.voice.channelId)
          : null);

      if (!voiceChannel) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
              `-# *You must be connected to a voice channel to use music commands.*`,
          ),
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      const query = interaction.options.getString("query");

      let existingPlayer = client.manager.players.get(interaction.guild.id);
      if (existingPlayer && existingPlayer.voiceId !== voiceChannel.id) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Channel Mismatch\n` +
              `-# *You must be in the same voice channel as the bot (<#${existingPlayer.voiceId}>).*`,
          ),
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply().catch(() => null);

      const engine = getSearchEngine(query);
      let res;
      try {
        res = await client.manager.search(query, {
          requester: interaction.user,
          engine: engine,
        });
      } catch (searchErr) {
        res = await client.manager.search(query, {
          requester: interaction.user,
          engine: "youtube",
        }).catch(() => null);
      }

      if (!res || !res.tracks || !res.tracks.length || res.type === "EMPTY") {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> No Results Found\n` +
              `-# *Could not find any tracks matching your request. Try another keyword or URL.*`,
          ),
        );
        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      let player = existingPlayer;
      if (!player) {
        const orphanConnection = client.manager.shoukaku?.connections?.get(interaction.guild.id);
        if (orphanConnection) {
          try {
            orphanConnection.disconnect();
          } catch (e) {}
        }

        player = await client.manager.createPlayer({
          guildId: interaction.guild.id,
          voiceId: voiceChannel.id,
          textId: interaction.channel.id,
          deaf: true,
          shardId: interaction.guild.shardId ?? 0,
        });
      }

      const wasPlaying = player.playing || player.paused;

      if (res.type === "PLAYLIST") {
        for (const track of res.tracks) {
          player.queue.add(track);
        }

        if (!wasPlaying) {
          await player.play();
        } else {
          const container = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `### 🎶 Playlist Added to Queue\n` +
                  `> - **Playlist:** [${res.playlistName || "Custom Playlist"}](${query})\n` +
                  `> - **Tracks Loaded:** \`${res.tracks.length}\`\n` +
                  `> - **Requested By:** <@${interaction.user.id}>`,
              ),
            )
            .addSeparatorComponents(
              new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Small)
                .setDivider(true),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `-# *ASTRIXCODE™ Audio Engine • ${engine.toUpperCase()} Source*`,
              ),
            );

          return interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      } else {
        const track = res.tracks[0];
        player.queue.add(track);

        if (!wasPlaying) {
          await player.play();
        } else {
          const container = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `### ➕ Track Queued\n` +
                  `> - **Title:** [${track.title}](${track.uri})\n` +
                  `> - **Artist:** \`${track.author || "Unknown"}\`\n` +
                  `> - **Duration:** \`${formatDuration(track.length)}\`\n` +
                  `> - **Position in Queue:** \`#${player.queue.length}\``,
              ),
            )
            .addSeparatorComponents(
              new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Small)
                .setDivider(true),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `-# *ASTRIXCODE™ Audio Engine • ${engine.toUpperCase()} Source*`,
              ),
            );

          return interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }
    } catch (error) {
      console.error("[PlaySlashCommand] Execution Error:", error);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Playback Error\n` +
            `-# *An unexpected error occurred while processing playback: ${error?.message || "Lavalink Node Error"}*`,
        ),
      );
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
