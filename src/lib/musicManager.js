const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  AttachmentBuilder,
  MessageFlags,
  Events,
} = require("discord.js");
const { Kazagumo, Plugins } = require("kazagumo");
const { Connectors } = require("shoukaku");
const ShoukakuSpotify = require("kazagumo-spotify");
const path = require("path");
const VoiceHealthMonitor = require(path.join(__dirname, "music", "voiceHealthMonitor.js"));
const { getGuildTheme, renderThemeCard } = require(path.join(__dirname, "music", "presetManager.js"));
const { DSP_FILTERS, attemptAutoplay } = require(path.join(__dirname, "music", "playerUtils.js"));
const { logger } = require(path.join(__dirname, "functions", "common.js"));

function formatDuration(ms) {
  if (!ms || isNaN(ms) || ms === 0) return "Live Stream";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function generateMusicCard(player, track) {
  try {
    const guildId = player?.guildId;
    const themeKey = getGuildTheme(guildId);

    const title = track.title || "Unknown Track";
    const author = track.author || "Unknown Artist";
    const duration = track.length || 0;

    let thumbnail = track.thumbnail || track.displayThumbnail?.() || null;
    if (
      !thumbnail ||
      typeof thumbnail !== "string" ||
      !thumbnail.startsWith("http")
    ) {
      thumbnail = path.join(__dirname, "../assets/helpmenu.png");
    }

    const imageBuffer = await renderThemeCard(themeKey, {
      title,
      author,
      thumbnail,
      duration,
    });

    if (!imageBuffer) return null;

    return new AttachmentBuilder(imageBuffer, { name: "musicard.png" });
  } catch (err) {
    console.error("[Musicard] Generation error:", err);
    return null;
  }
}

function createSafeOptionValue(prefix, rawString) {
  const clean = String(rawString || "").trim();
  const full = prefix + clean;
  return full.length > 100 ? full.substring(0, 100) : full;
}

async function createNowPlayingComponentsPayload(
  client,
  player,
  track,
  forcePaused = null,
  hasCardAttachment = true,
) {
  const isPaused = forcePaused !== null ? forcePaused : player.shoukaku.paused;
  const loopState = (player.loop || "none").toString().toLowerCase();
  const activeFilter = player.data?.get("activeFilter") || "Off";

  const requesterMention = track.requester?.username
    ? `${track.requester.username}`
    : track.requester?.id
      ? `<@${track.requester.id}>`
      : "Automated";

  const engineName = (track.sourceName || "YouTube").toUpperCase();

  // 1. Container ONLY holds Artwork & Footer (No text header above artwork)
  const container = new ContainerBuilder();
  container.setAccentColor(16711808); // Magenta/Pink accent border

  if (hasCardAttachment) {
    const mediaGallery = new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL("attachment://musicard.png"),
    );
    container.addMediaGalleryComponents(mediaGallery);
  }

  const footerDisplay = new TextDisplayBuilder().setContent(
    `-# ⚙️ Engine: ${engineName} | Requested By ${requesterMention}`,
  );
  container.addTextDisplayComponents(footerDisplay);

  // 2. Fetch Actual Similar Songs for Suggested Songs Dropdown Menu
  // Build set of URIs / titles already in queue or playing so they disappear from suggestions
  const queuedUris = new Set(
    (player.queue ? Array.from(player.queue) : []).map((t) => t.uri || t.title),
  );
  if (track?.uri) queuedUris.add(track.uri);
  if (track?.title) queuedUris.add(track.title);

  const suggestedOptions = [];
  try {
    const query = track.author || track.title;
    if (query && client.manager) {
      const res = await client.manager
        .search(query, { engine: "youtube" })
        .catch(() => null);
      if (res && res.tracks && res.tracks.length > 0) {
        const uniqueTracks = res.tracks
          .filter((t) => !queuedUris.has(t.uri) && !queuedUris.has(t.title))
          .slice(0, 5);

        uniqueTracks.forEach((t) => {
          const rawQuery = t.title
            ? `${t.title} ${t.author || ""}`
            : t.author || "Music";
          suggestedOptions.push({
            label:
              t.title.length > 45 ? t.title.substring(0, 42) + "..." : t.title,
            value: createSafeOptionValue("sugg_play_q_", rawQuery),
            description: t.author
              ? t.author.length > 45
                ? t.author.substring(0, 42) + "..."
                : t.author
              : "Suggested Track",
            default: false,
          });
        });
      }
    }
  } catch (e) {
    console.error("[AudioEngine] Error fetching similar songs:", e);
  }

  if (suggestedOptions.length === 0) {
    const rawQuery = track.author || track.title || "Music";
    suggestedOptions.push({
      label: `Explore tracks by ${track.author ? track.author.substring(0, 30) : "Artist"}`,
      value: createSafeOptionValue("sugg_play_q_", rawQuery),
      description: "Search similar recommended songs",
      default: false,
    });
  }

  const maxVals = Math.min(Math.max(suggestedOptions.length, 1), 5);
  const suggestedSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("music_suggested_select")
    .setPlaceholder("✨ Suggested songs...")
    .setMinValues(1)
    .setMaxValues(maxVals)
    .addOptions(suggestedOptions);

  const rowSuggested = new ActionRowBuilder().addComponents(
    suggestedSelectMenu,
  );

  // 3. Dropdown 2: Filter Select Menu
  const filterOptions = Object.keys(DSP_FILTERS)
    .filter((key) => key !== "clear" && key !== "reverb")
    .slice(0, 25)
    .map((key) => ({
      label: DSP_FILTERS[key].name,
      value: key,
      default:
        activeFilter.toLowerCase() === DSP_FILTERS[key].name.toLowerCase(),
    }));

  const filterSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("music_filter_select")
    .setPlaceholder("✨ Select a music filter to apply...")
    .addOptions(filterOptions);

  const rowFilter = new ActionRowBuilder().addComponents(filterSelectMenu);

  // 4. Row 1 Buttons: 🔂  ◀️  ⏸️/▶️  ▶️  💖
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("music_loop")
      .setEmoji("🔂")
      .setStyle(
        loopState !== "none" ? ButtonStyle.Success : ButtonStyle.Secondary,
      ),
    new ButtonBuilder()
      .setCustomId("music_prev")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_pause_resume")
      .setEmoji(isPaused ? "▶️" : "⏸️")
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("music_skip")
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_like")
      .setEmoji("💖")
      .setStyle(ButtonStyle.Secondary),
  );

  // 5. Row 2 Buttons: 🔀  🔉  ⏹️  🔊  🎵
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("music_shuffle")
      .setEmoji("🔀")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_down_10")
      .setEmoji("🔉")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("vol_up_10")
      .setEmoji("🔊")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_queue")
      .setEmoji("🎵")
      .setStyle(ButtonStyle.Secondary),
  );

  return [container, rowSuggested, rowFilter, row1, row2];
}

async function sendNowPlayingMessage(client, player, track) {
  if (player.data?.get("isSendingNowPlaying")) return;
  player.data?.set("isSendingNowPlaying", true);

  try {
    let channel = client.channels.cache.get(player.textId);
    if (!channel) {
      channel = await client.channels.fetch(player.textId).catch(() => null);
    }
    if (!channel) return;

    // Delete previous Now Playing message if any
    const prevMessage = player.data?.get("nowPlayingMessage");
    if (prevMessage && typeof prevMessage.delete === "function") {
      prevMessage.delete().catch(() => null);
      player.data?.delete("nowPlayingMessage");
    }

    const cardAttachment = await generateMusicCard(player, track);
    const components = await createNowPlayingComponentsPayload(
      client,
      player,
      track,
      null,
      Boolean(cardAttachment),
    );

    const payload = {
      components: components,
      flags: MessageFlags.IsComponentsV2,
    };

    if (cardAttachment) {
      payload.files = [cardAttachment];
    }

    const msg = await channel.send(payload);
    player.data.set("nowPlayingMessage", msg);
  } catch (error) {
    console.error("[AudioEngine] Error sending Now Playing card:", error);
  } finally {
    player.data?.set("isSendingNowPlaying", false);
  }
}

async function updateNowPlayingMessage(client, player, forcePaused = null) {
  try {
    const message = player.data?.get("nowPlayingMessage");
    if (!message || !player.queue?.current) return;

    const track = player.queue.current;
    const cardAttachment = await generateMusicCard(player, track);
    const components = await createNowPlayingComponentsPayload(
      client,
      player,
      track,
      forcePaused,
      Boolean(cardAttachment),
    );

    const payload = {
      components: components,
      flags: MessageFlags.IsComponentsV2,
    };

    if (cardAttachment) {
      payload.files = [cardAttachment];
    }

    await message.edit(payload).catch(() => {
      player.data?.delete("nowPlayingMessage");
    });
  } catch (error) {
    console.error("[AudioEngine] Error updating Now Playing message:", error);
  }
}

function initMusicManager(client) {
  const nodes = [
    {
      name: "Serenetia-Primary (v4 SSL)",
      url: "lavalinkv4.serenetia.com:443",
      auth: "https://seretia.link/discord",
      secure: true,
    },
    {
      name: "Serenetia-Main (v4 SSL)",
      url: "lavalink.serenetia.com:443",
      auth: "https://seretia.link/discord",
      secure: true,
    },
    {
      name: "Millohost-Public (v4 SSL)",
      url: "lava-v4.millohost.my.id:443",
      auth: "https://discord.gg/mjS5J2K3ep",
      secure: true,
    },
    {
      name: "Vexanode-Nokia (Ultra-Resilient)",
      url: "nokia.vexanode.gg:19133",
      auth: "vexanode.cloud",
      secure: false,
    },
    {
      name: "AjieBlogs-Fallback (v4 SSL)",
      url: "lava-v4.ajieblogs.eu.org:443",
      auth: "https://dsc.gg/ajidevserver",
      secure: true,
    },
    {
      name: "Serenetia-NonSSL (v4)",
      url: "lavalinkv4.serenetia.com:80",
      auth: "https://seretia.link/discord",
      secure: false,
    },
  ];

  // If user provided a custom private Lavalink node in .env, prioritize it at the top
  if (process.env.LAVALINK_HOST) {
    nodes.unshift({
      name: process.env.LAVALINK_NAME || "Custom Private Node",
      url: process.env.LAVALINK_HOST,
      auth: process.env.LAVALINK_PASSWORD || "youshallnotpass",
      secure: process.env.LAVALINK_SECURE ? process.env.LAVALINK_SECURE === "true" : true,
    });
  }

  const spotifyPlugin = new ShoukakuSpotify({
    clientId:
      process.env.SPOTIFY_CLIENT_ID || "e7f09f0868f0473e9702df93f0b2f0a1",
    clientSecret:
      process.env.SPOTIFY_CLIENT_SECRET || "c7b7f14b60a34b2298e29a3f23aef542",
  });

  const shoukakuOptions = {
    moveOnDisconnect: true,
    resume: true,
    resumeTimeout: 60,
    resumeByLibrary: true,
    reconnectTries: 20,
    reconnectInterval: 5,
    restTimeout: 10000,
    userAgent: "AstrixMusicBot/1.0 (DiscordBot)",
  };

  const kazagumo = new Kazagumo(
    {
      defaultSearchEngine: "youtube",
      plugins: [spotifyPlugin],
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      },
    },
    new Connectors.DiscordJS(client),
    nodes,
    shoukakuOptions,
  );

  client.voiceHealthMonitor = new VoiceHealthMonitor(client);
  client.voiceHealthMonitor.start();

  const handleReady = () => {
    if (kazagumo?.shoukaku && client.user) {
      kazagumo.shoukaku.id = client.user.id;
    }
  };

  client.once(Events.ClientReady, handleReady);
  if (client.isReady()) handleReady();

  kazagumo.shoukaku.on("ready", (name) => {
    logger.Music("Lavalink", `Audio Node "${name}" connected.`);
  });

  kazagumo.shoukaku.on("error", (name, error) => {
    logger.Error(
      "Lavalink",
      `Node "${name}" error: ${error?.message || error}`,
    );
  });

  kazagumo.on("playerStart", async (player, track) => {
    if (!player || !track) return;
    try {
      if (!player.data) player.data = new Map();
      player.data.set("lastTrack", track);
      client.voiceHealthMonitor?.updateActivity(player.guildId);

      await sendNowPlayingMessage(client, player, track);
    } catch (err) {
      logger.Error("AudioEngine", "Error in playerStart handler", err);
    }
  });

  kazagumo.on("playerEmpty", async (player) => {
    if (!player) return;
    try {
      const prevMessage = player.data?.get("nowPlayingMessage");
      if (prevMessage && typeof prevMessage.delete === "function") {
        prevMessage.delete().catch(() => null);
        player.data.delete("nowPlayingMessage");
      }

      await attemptAutoplay(client, player);
    } catch (err) {
      logger.Error("AudioEngine", "Error in playerEmpty handler", err);
    }
  });

  kazagumo.on("playerError", (player, error) => {
    const errMsg = error?.message || String(error);
    if (errMsg.includes("Connection exist but player not found")) return;
    logger.Error("Lavalink", `Player Error in guild ${player?.guildId}`, error);
  });

  kazagumo.on("playerException", (player, data) => {
    logger.Error(
      "Lavalink",
      `Player Exception in guild ${player?.guildId}: ${data?.exception?.message || data}`,
    );
    if (player && player.queue && player.queue.length > 0) {
      player.skip().catch(() => null);
    }
  });

  kazagumo.on("playerStuck", (player, data) => {
    logger.Warn(
      "Lavalink",
      `Player Stuck in guild ${player?.guildId} (threshold: ${data?.thresholdMs}ms)`,
    );
    if (player && player.queue && player.queue.length > 0) {
      player.skip().catch(() => null);
    }
  });

  return kazagumo;
}

function getSearchEngine(query) {
  if (!query) return "youtube";
  const str = query.trim().toLowerCase();

  if (str.includes("spotify.com") || str.startsWith("sp:")) return "spotify";
  if (str.includes("soundcloud.com") || str.startsWith("sc:"))
    return "soundcloud";
  if (str.includes("music.apple.com") || str.startsWith("am:"))
    return "applemusic";
  if (
    str.includes("youtube.com") ||
    str.includes("youtu.be") ||
    str.startsWith("yt:")
  )
    return "youtube";

  return "youtube";
}

module.exports = {
  initMusicManager,
  sendNowPlayingMessage,
  updateNowPlayingMessage,
  getSearchEngine,
};
