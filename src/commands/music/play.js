const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
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

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["play", "p"],
  category: "Music",
  desc: "Play tracks or playlists from YouTube, Spotify, SoundCloud, or Apple Music.",

  botPermissions: ["SendMessages", "Connect", "Speak"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    try {
      const voiceChannel =
        message.member?.voice?.channel ||
        (message.member?.voice?.channelId
          ? message.guild?.channels?.cache?.get(message.member.voice.channelId)
          : null);

      if (!voiceChannel) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
              `-# *You must be connected to a voice channel to use music commands.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const query = args.join(" ");
      if (!query) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Missing Track Query\n` +
              `-# *Please provide a track title, keyword, or URL to play.*\n\n` +
              `> - **Usage:** \`.play <title | URL>\`\n` +
              `> - **Supported:** YouTube, Spotify, SoundCloud, Apple Music`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      let existingPlayer = client.manager.players.get(message.guild.id);
      if (existingPlayer && existingPlayer.voiceId !== voiceChannel.id) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Channel Mismatch\n` +
              `-# *You must be in the same voice channel as the bot (<#${existingPlayer.voiceId}>).*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      // Perform track search FIRST
      const engine = getSearchEngine(query);
      let res;
      try {
        res = await client.manager.search(query, {
          requester: message.author,
          engine: engine,
        });
      } catch (searchErr) {
        console.warn("[PlayCommand] Primary engine search failed, trying fallback:", searchErr?.message);
        res = await client.manager.search(query, {
          requester: message.author,
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
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      // Create or get player AFTER confirming tracks exist
      let player = existingPlayer;
      if (!player) {
        const orphanConnection = client.manager.shoukaku?.connections?.get(message.guild.id);
        if (orphanConnection) {
          try {
            orphanConnection.disconnect();
          } catch (e) {}
        }

        player = await client.manager.createPlayer({
          guildId: message.guild.id,
          voiceId: voiceChannel.id,
          textId: message.channel.id,
          deaf: true,
          shardId: message.guild.shardId ?? 0,
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
                  `> - **Requested By:** <@${message.author.id}>`,
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

          return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [], repliedUser: false },
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

          return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [], repliedUser: false },
          });
        }
      }
    } catch (error) {
      console.error("[PlayCommand] Execution Error:", error);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Playback Error\n` +
            `-# *An unexpected error occurred while processing playback: ${error?.message || "Lavalink Node Error"}*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
