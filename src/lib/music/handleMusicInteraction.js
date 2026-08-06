const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  AttachmentBuilder,
  MessageFlags,
} = require("discord.js");
const { updateNowPlayingMessage } = require("../musicManager.js");
const { DSP_FILTERS } = require("./playerUtils.js");
const { THEMES, setGuildTheme, createPresetPayload } = require("./presetManager.js");
const { createVolumeContainer } = require("../../commands/music/volume.js");

async function handleMusicInteraction(client, interaction) {
  if (!interaction.guild) return false;

  const isMusicButton = interaction.isButton() && interaction.customId.startsWith("music_");
  const isVolumeButton = interaction.isButton() && interaction.customId.startsWith("vol_");
  const isFilterMenu = interaction.isStringSelectMenu() && interaction.customId === "music_filter_select";
  const isSuggestedMenu = interaction.isStringSelectMenu() && interaction.customId === "music_suggested_select";
  const isPresetMenu = interaction.isStringSelectMenu() && interaction.customId.startsWith("music_preset_select");
  const isPresetSave = interaction.isButton() && interaction.customId.startsWith("music_preset_save");
  const isPresetReset = interaction.isButton() && interaction.customId === "music_preset_reset";

  if (!isMusicButton && !isVolumeButton && !isFilterMenu && !isSuggestedMenu && !isPresetMenu && !isPresetSave && !isPresetReset) return false;

  // 1. Handle Dropdown Selection (Live Non-Ephemeral Preview)
  if (isPresetMenu) {
    const selectedThemeKey = interaction.values[0];
    await interaction.deferUpdate().catch(() => null);

    const { container, attachment } = await createPresetPayload(interaction.guildId, selectedThemeKey);

    const payload = {
      components: [container],
      files: attachment ? [attachment] : [],
    };

    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  // 2. Handle Save Preset Button
  if (isPresetSave) {
    const selectedThemeKey = interaction.customId.split(":")[1] || "melt";
    setGuildTheme(interaction.guildId, selectedThemeKey);

    await interaction.deferUpdate().catch(() => null);

    const { container, attachment } = await createPresetPayload(interaction.guildId, selectedThemeKey);

    const payload = {
      components: [container],
      files: attachment ? [attachment] : [],
    };

    await interaction.editReply(payload).catch(() => null);

    // Update active player's card if music is running
    const activePlayer = client.manager?.players.get(interaction.guildId);
    if (activePlayer && activePlayer.queue.current) {
      await updateNowPlayingMessage(client, activePlayer);
    }
    return true;
  }

  // 3. Handle Reset Preset Button
  if (isPresetReset) {
    setGuildTheme(interaction.guildId, "melt");

    await interaction.deferUpdate().catch(() => null);

    const { container, attachment } = await createPresetPayload(interaction.guildId, "melt");

    const payload = {
      components: [container],
      files: attachment ? [attachment] : [],
    };

    await interaction.editReply(payload).catch(() => null);

    // Update active player's card if music is running
    const activePlayer = client.manager?.players.get(interaction.guildId);
    if (activePlayer && activePlayer.queue.current) {
      await updateNowPlayingMessage(client, activePlayer);
    }
    return true;
  }

  const player = client.manager.players.get(interaction.guildId);

  // General check: Player active
  if (!player) {
    const errorContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <a:red_star:1528688099436003419> No Audio Player\n` +
          `-# *There is no active music player running in this server.*`
      )
    );
    await interaction.reply({
      components: [errorContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // Voice Channel Check
  const memberVoiceChannel = interaction.member?.voice?.channel;
  if (!memberVoiceChannel || memberVoiceChannel.id !== player.voiceId) {
    const errorContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
          `-# *You must be in <#${player.voiceId}> to use the music controller.*`
      )
    );
    await interaction.reply({
      components: [errorContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  try {
    // Handle Suggested Songs Multi-Select Dropdown Menu
    if (isSuggestedMenu) {
      await interaction.deferUpdate().catch(() => null);

      let addedCount = 0;
      let lastAddedTitle = "";

      for (const selectedVal of interaction.values) {
        let query = "";

        if (selectedVal.startsWith("sugg_play_q_")) {
          query = decodeURIComponent(selectedVal.replace("sugg_play_q_", ""));
        } else if (selectedVal.startsWith("sugg_search_")) {
          query = decodeURIComponent(selectedVal.replace("sugg_search_", ""));
        } else if (selectedVal.startsWith("sugg_queue_")) {
          const idx = parseInt(selectedVal.split("_")[2], 10);
          const queueArr = Array.from(player.queue);
          if (!isNaN(idx) && queueArr[idx]) {
            const targetTrack = queueArr[idx];
            player.queue.splice(idx, 1);
            player.queue.unshift(targetTrack);
            await player.skip();
            continue;
          }
        }

        if (query) {
          const res = await client.manager.search(query, { requester: interaction.user, engine: "youtube" }).catch(() => null);
          if (res && res.tracks && res.tracks.length > 0) {
            const track = res.tracks[0];
            player.queue.add(track);
            addedCount++;
            lastAddedTitle = track.title;
          }
        }
      }

      if (!player.playing && !player.paused) {
        await player.play();
      } else {
        await updateNowPlayingMessage(client, player);
      }

      if (addedCount > 0) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ➕ Added ${addedCount} Track${addedCount > 1 ? "s" : ""} to Queue\n` +
              `-# *Queued: ${lastAddedTitle}${addedCount > 1 ? ` and ${addedCount - 1} more` : ""}*`
          )
        );
        await interaction.followUp({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }
      return true;
    }

    // Handle Volume Controller Buttons
    if (isVolumeButton) {
      const customId = interaction.customId;
      let targetVol = player.volume || 100;

      if (customId === "vol_0") targetVol = 0;
      else if (customId === "vol_25") targetVol = 25;
      else if (customId === "vol_50") targetVol = 50;
      else if (customId === "vol_75") targetVol = 75;
      else if (customId === "vol_100") targetVol = 100;
      else if (customId === "vol_down_20") targetVol = Math.max(targetVol - 20, 0);
      else if (customId === "vol_down_10") targetVol = Math.max(targetVol - 10, 0);
      else if (customId === "vol_up_10") targetVol = Math.min(targetVol + 10, 100);
      else if (customId === "vol_up_20") targetVol = Math.min(targetVol + 20, 100);

      await player.setVolume(targetVol);
      await interaction.deferUpdate().catch(() => null);

      const container = createVolumeContainer(player.volume);
      await interaction.editReply({ components: [container] }).catch(() => null);
      await updateNowPlayingMessage(client, player);
      return true;
    }

    // Handle Filter Dropdown Selection
    if (isFilterMenu) {
      const selectedFilterKey = interaction.values[0];
      const filterConfig = DSP_FILTERS[selectedFilterKey];
      if (filterConfig) {
        await filterConfig.apply(player);
        await interaction.deferUpdate().catch(() => null);
        await updateNowPlayingMessage(client, player);
      }
      return true;
    }

    // Handle Music Buttons
    const customId = interaction.customId;

    switch (customId) {
      case "music_pause_resume": {
        const isPaused = player.shoukaku.paused;
        await player.pause(!isPaused);
        await interaction.deferUpdate().catch(() => null);
        await updateNowPlayingMessage(client, player, !isPaused);
        break;
      }

      case "music_skip": {
        if (!player.queue.current) {
          await interaction.deferUpdate().catch(() => null);
          break;
        }
        await player.skip();
        await interaction.deferUpdate().catch(() => null);
        break;
      }

      case "music_prev": {
        const lastTrack = player.data?.get("lastTrack");
        if (lastTrack) {
          player.queue.unshift(lastTrack);
          await player.skip();
        }
        await interaction.deferUpdate().catch(() => null);
        break;
      }

      case "music_stop": {
        player.queue.clear();
        await player.destroy().catch(() => null);
        const stopContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ⏹️ Playback Stopped\n` +
              `-# *Cleared queue and left the voice channel.*`
          )
        );
        await interaction.reply({
          components: [stopContainer],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
        break;
      }

      case "music_loop": {
        const modes = ["none", "track", "queue"];
        const currentMode = (player.loop || "none").toString().toLowerCase();
        const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
        const nextMode = modes[nextIndex];
        player.setLoop(nextMode);

        await interaction.deferUpdate().catch(() => null);
        await updateNowPlayingMessage(client, player);
        break;
      }

      case "music_shuffle": {
        if (player.queue.size <= 1) {
          const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🔀 Shuffle Unavailable\n` +
                `-# *Queue must have at least 2 tracks to shuffle.*`
            )
          );
          await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          }).catch(() => null);
          break;
        }
        player.queue.shuffle();
        await interaction.deferUpdate().catch(() => null);
        await updateNowPlayingMessage(client, player);
        break;
      }

      case "music_autoplay": {
        const currentAutoplay = Boolean(player.data.get("autoplay"));
        player.data.set("autoplay", !currentAutoplay);

        await interaction.deferUpdate().catch(() => null);
        await updateNowPlayingMessage(client, player);
        break;
      }

      case "music_like": {
        const track = player.queue.current;
        if (!track) {
          await interaction.deferUpdate().catch(() => null);
          break;
        }

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 💖 Track Liked\n` +
              `> - **Title:** [${track.title}](${track.uri})\n` +
              `-# *Saved to your personal favourites.*`
          )
        );

        await interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
        break;
      }

      case "music_queue": {
        const currentTrack = player.queue.current;
        const tracks = player.queue.slice(0, 10);

        let content = `### 🎵 Current Server Queue\n`;
        if (currentTrack) {
          content += `> - **Now Playing:** [${currentTrack.title}](${currentTrack.uri})\n\n`;
        }

        if (tracks.length === 0) {
          content += `-# *No upcoming tracks in the queue.*`;
        } else {
          content += tracks
            .map((t, idx) => `**${idx + 1}.** [${t.title}](${t.uri}) - \`${t.author}\``)
            .join("\n");
          if (player.queue.size > 10) {
            content += `\n\n-# *...and ${player.queue.size - 10} more tracks.*`;
          }
        }

        const queueContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content)
        );

        await interaction.reply({
          components: [queueContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
        break;
      }

      case "music_grab": {
        const track = player.queue.current;
        if (!track) {
          await interaction.deferUpdate().catch(() => null);
          break;
        }

        const dmContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📂 Saved Track Details\n` +
              `> - **Title:** [${track.title}](${track.uri})\n` +
              `> - **Artist:** \`${track.author || "Unknown"}\`\n` +
              `> - **Source:** \`${track.sourceName || "Web"}\`\n` +
              `> - **Server:** \`${interaction.guild.name}\``
          )
        );

        await interaction.user
          .send({
            components: [dmContainer],
            flags: MessageFlags.IsComponentsV2,
          })
          .then(async () => {
            const successContainer = new ContainerBuilder().addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `### 📬 Direct Message Sent\n` +
                  `-# *Track information saved directly to your DMs.*`
              )
            );
            await interaction.reply({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            }).catch(() => null);
          })
          .catch(async () => {
            const failContainer = new ContainerBuilder().addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `### <a:red_star:1528688099436003419> DMs Closed\n` +
                  `-# *Could not send track details. Please enable direct messages from server members.*`
              )
            );
            await interaction.reply({
              components: [failContainer],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            }).catch(() => null);
          });
        break;
      }
    }
  } catch (err) {
    if (err?.message?.includes("Player not found") || err?.status === 404) {
      console.warn(`[AudioEngine] Cleared stale player for guild ${interaction.guildId}`);
      client.manager.players.delete(interaction.guildId);
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Audio Session Expired\n` +
            `-# *The music session expired. Please use \`.play\` to start playing music again.*`
        )
      );
      await interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    } else {
      console.error("[AudioEngine] Error handling music interaction:", err);
    }
  }

  return true;
}

module.exports = { handleMusicInteraction };
