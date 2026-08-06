/**
 * Modern Audio Engine Utilities for Astrix
 */

async function safeDestroyPlayer(player) {
  if (!player) return;
  try {
    await player.destroy();
  } catch (error) {
    if (error?.status !== 404) {
      console.error(`[AudioEngine] Error destroying player for guild ${player.guildId}:`, error);
    }
  }
}

async function handleSessionError(error, player, client) {
  if (error?.status === 404 && error?.message?.includes("Session not found")) {
    console.log(`[AudioEngine] Session lost for guild ${player.guildId}, cleaning up...`);
    try {
      if (client.manager?.players?.has(player.guildId)) {
        client.manager.players.delete(player.guildId);
      }
    } catch (cleanupError) {
      console.error(`[AudioEngine] Error during session cleanup:`, cleanupError);
    }
    return true;
  }
  return false;
}

async function recreatePlayer(client, guildId, voiceId, textId) {
  try {
    if (client.manager.players.has(guildId)) {
      client.manager.players.delete(guildId);
    }

    const newPlayer = await client.manager.createPlayer({
      guildId: guildId,
      voiceId: voiceId,
      textId: textId,
      volume: 80,
      deaf: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!newPlayer || !client.manager.players.get(guildId)) {
      throw new Error("Failed to recreate player - connection timeout");
    }

    return newPlayer;
  } catch (error) {
    console.error(`[AudioEngine] Error recreating player:`, error);
    throw error;
  }
}

async function attemptAutoplay(client, player) {
  try {
    if (!player) return;
    const autoplay = player.data?.get("autoplay");
    if (!autoplay) return;

    const loopMode = (player.loop || "none").toString().toLowerCase();
    if (loopMode === "track" || loopMode === "queue") {
      return;
    }
    if (player.queue?.size > 0 || player.playing || player.paused) return;
    if (player.data?.get("autoplayInProgress")) return;

    player.data.set("autoplayInProgress", true);

    const lastTrack = player.data.get("lastTrack");
    if (!lastTrack || !lastTrack.title) {
      player.data.delete("autoplayInProgress");
      return;
    }

    const cleanAuthor = (author) => {
      if (!author) return "";
      return author.replace(/\s*-\s*Topic\s*$/i, "").trim();
    };

    const extractYouTubeId = (uri) => {
      if (!uri) return null;
      const m = uri.match(/(?:v=|\/vi?\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return m ? m[1] : null;
    };

    const normalize = (str) =>
      (str || "")
        .toLowerCase()
        .replace(/\s*-\s*topic\s*$/gi, "")
        .replace(/\(.*?(official|audio|video|lyrics).*?\)/gi, "")
        .replace(/\[.*?(official|audio|video|lyrics).*?\]/gi, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const isSameTrack = (a, b) => {
      try {
        if (!a || !b) return false;
        if (a.identifier && b.identifier && a.identifier === b.identifier) return true;
        const aId = extractYouTubeId(a.uri);
        const bId = extractYouTubeId(b.uri);
        if (aId && bId && aId === bId) return true;
        const at = normalize(a.title);
        const bt = normalize(b.title);
        const aa = normalize(a.author);
        const ba = normalize(b.author);
        if (at && bt && at === bt && aa && ba && aa === ba) return true;
      } catch {}
      return false;
    };

    const recentKey = "recentAutoplayIds";
    const recent = player.data.get(recentKey) || [];
    const remember = (t) => {
      const id = t.identifier || extractYouTubeId(t.uri) || t.uri;
      const next = Array.from(new Set([id, ...recent])).filter(Boolean).slice(0, 8);
      player.data.set(recentKey, next);
    };

    const query = `${lastTrack.title} ${cleanAuthor(lastTrack.author)}`.trim();
    const engines = ["ytmsearch", "ytsearch", "spsearch", "amsearch"];

    let foundTrack = null;
    for (const engine of engines) {
      try {
        const res = await player.search(query, {
          engine,
          requester: lastTrack.requester || client.user,
        });
        const tracks = res?.tracks || [];
        if (tracks.length > 0) {
          foundTrack =
            tracks.find(
              (t) =>
                !isSameTrack(lastTrack, t) &&
                !recent.includes(t.identifier || extractYouTubeId(t.uri) || t.uri)
            ) || null;

          if (!foundTrack) {
            for (const t of tracks) {
              if (!isSameTrack(lastTrack, t)) {
                foundTrack = t;
                break;
              }
            }
          }
          if (foundTrack) break;
        }
      } catch {
        continue;
      }
    }

    if (!foundTrack) {
      player.data.delete("autoplayInProgress");
      return;
    }

    player.queue.add(foundTrack);
    remember(foundTrack);

    if (!player.playing && !player.paused) {
      await player.play().catch(() => null);
    }
  } catch (err) {
    console.error("[Autoplay] Engine error:", err);
  } finally {
    try {
      player?.data?.delete("autoplayInProgress");
    } catch {}
  }
}

const DSP_FILTERS = {
  clear: {
    name: "Off (Default)",
    apply: async (player) => {
      await player.shoukaku.clearFilters();
      player.data.set("activeFilter", "Off");
    },
  },
  off: {
    name: "Off (Default)",
    apply: async (player) => {
      await player.shoukaku.clearFilters();
      player.data.set("activeFilter", "Off");
    },
  },
  "8d": {
    name: "8D Spatial Audio",
    apply: async (player) => {
      await player.shoukaku.setFilters({ rotation: { rotationHz: 0.2 } });
      player.data.set("activeFilter", "8D Spatial");
    },
  },
  bassboost: {
    name: "Bass Boost",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        equalizer: [
          { band: 0, gain: 0.35 },
          { band: 1, gain: 0.3 },
          { band: 2, gain: 0.25 },
          { band: 3, gain: 0.15 },
        ],
      });
      player.data.set("activeFilter", "Bass Boost");
    },
  },
  deepbass: {
    name: "Deep Bass Ultra",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        equalizer: [
          { band: 0, gain: 0.6 },
          { band: 1, gain: 0.5 },
          { band: 2, gain: 0.4 },
          { band: 3, gain: 0.3 },
          { band: 4, gain: 0.2 },
        ],
      });
      player.data.set("activeFilter", "Deep Bass");
    },
  },
  nightcore: {
    name: "Nightcore",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        timescale: { speed: 1.15, pitch: 1.2, rate: 1.0 },
      });
      player.data.set("activeFilter", "Nightcore");
    },
  },
  daycore: {
    name: "Daycore",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        timescale: { speed: 0.85, pitch: 0.85, rate: 1.0 },
      });
      player.data.set("activeFilter", "Daycore");
    },
  },
  slowed: {
    name: "Slowed + Reverb",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        timescale: { speed: 0.88, pitch: 0.9 },
      });
      player.data.set("activeFilter", "Slowed + Reverb");
    },
  },
  vaporwave: {
    name: "Vaporwave",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        timescale: { speed: 0.8, pitch: 0.8 },
        tremolo: { depth: 0.3, frequency: 10 },
      });
      player.data.set("activeFilter", "Vaporwave");
    },
  },
  soft: {
    name: "Soft Muffled",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        lowPass: { smoothing: 20.0 },
      });
      player.data.set("activeFilter", "Soft Muffled");
    },
  },
  vibrato: {
    name: "Vibrato Pitch Shift",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        vibrato: { frequency: 4.0, depth: 0.75 },
      });
      player.data.set("activeFilter", "Vibrato");
    },
  },
  trebleboost: {
    name: "Treble Boost",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        equalizer: [
          { band: 8, gain: 0.25 },
          { band: 9, gain: 0.35 },
          { band: 10, gain: 0.45 },
          { band: 11, gain: 0.55 },
        ],
      });
      player.data.set("activeFilter", "Treble Boost");
    },
  },
  karaoke: {
    name: "Karaoke Vocal Filter",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 },
      });
      player.data.set("activeFilter", "Karaoke");
    },
  },
  pop: {
    name: "Pop Equalizer",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        equalizer: [
          { band: 0, gain: -0.1 },
          { band: 1, gain: 0.1 },
          { band: 2, gain: 0.2 },
          { band: 3, gain: 0.3 },
          { band: 4, gain: 0.2 },
          { band: 5, gain: -0.1 },
        ],
      });
      player.data.set("activeFilter", "Pop Equalizer");
    },
  },
  rotation: {
    name: "Rotation 360°",
    apply: async (player) => {
      await player.shoukaku.setFilters({ rotation: { rotationHz: 0.25 } });
      player.data.set("activeFilter", "Rotation 360°");
    },
  },
  lowpass: {
    name: "Lowpass Muffled",
    apply: async (player) => {
      await player.shoukaku.setFilters({ lowPass: { smoothing: 20.0 } });
      player.data.set("activeFilter", "Lowpass");
    },
  },
  tremolo: {
    name: "Tremolo Modulation",
    apply: async (player) => {
      await player.shoukaku.setFilters({ tremolo: { frequency: 4.0, depth: 0.5 } });
      player.data.set("activeFilter", "Tremolo");
    },
  },
  china: {
    name: "China Pentatonic EQ",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        equalizer: [
          { band: 0, gain: 0.35 },
          { band: 1, gain: 0.2 },
          { band: 2, gain: 0.0 },
          { band: 3, gain: 0.15 },
          { band: 4, gain: 0.3 },
          { band: 5, gain: 0.25 },
        ],
      });
      player.data.set("activeFilter", "China Pentatonic");
    },
  },
  chipmunk: {
    name: "Chipmunk Vocal",
    apply: async (player) => {
      await player.shoukaku.setFilters({ timescale: { pitch: 1.5, speed: 1.05 } });
      player.data.set("activeFilter", "Chipmunk");
    },
  },
  distant: {
    name: "Distant Room Effect",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        lowPass: { smoothing: 30.0 },
        equalizer: [{ band: 0, gain: -0.25 }, { band: 1, gain: -0.2 }],
      });
      player.data.set("activeFilter", "Distant Room");
    },
  },
  earrape: {
    name: "Earrape Gain Boost",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        volume: 4.0,
        equalizer: [
          { band: 0, gain: 1.0 },
          { band: 1, gain: 1.0 },
          { band: 2, gain: 1.0 },
        ],
      });
      player.data.set("activeFilter", "Earrape Gain");
    },
  },
  lofi: {
    name: "Lo-Fi Warm",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        lowPass: { smoothing: 15.0 },
        timescale: { pitch: 0.95 },
      });
      player.data.set("activeFilter", "Lo-Fi Warm");
    },
  },
  reverb: {
    name: "Slowed + Reverb",
    apply: async (player) => {
      await player.shoukaku.setFilters({ timescale: { speed: 0.88, pitch: 0.9 } });
      player.data.set("activeFilter", "Slowed + Reverb");
    },
  },
  slowmo: {
    name: "Slow Motion",
    apply: async (player) => {
      await player.shoukaku.setFilters({ timescale: { speed: 0.7, rate: 0.75 } });
      player.data.set("activeFilter", "Slow Motion");
    },
  },
  bassboost_low: {
    name: "Bass Boost Low",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        equalizer: [
          { band: 0, gain: 0.15 },
          { band: 1, gain: 0.1 },
          { band: 2, gain: 0.05 },
        ],
      });
      player.data.set("activeFilter", "Bass Boost Low");
    },
  },
  bassboost_medium: {
    name: "Bass Boost Medium",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        equalizer: [
          { band: 0, gain: 0.35 },
          { band: 1, gain: 0.25 },
          { band: 2, gain: 0.15 },
        ],
      });
      player.data.set("activeFilter", "Bass Boost Medium");
    },
  },
  bassboost_high: {
    name: "Bass Boost High",
    apply: async (player) => {
      await player.shoukaku.setFilters({
        equalizer: [
          { band: 0, gain: 0.65 },
          { band: 1, gain: 0.5 },
          { band: 2, gain: 0.35 },
          { band: 3, gain: 0.2 },
        ],
      });
      player.data.set("activeFilter", "Bass Boost High");
    },
  },
};

module.exports = {
  safeDestroyPlayer,
  handleSessionError,
  recreatePlayer,
  attemptAutoplay,
  DSP_FILTERS,
};
