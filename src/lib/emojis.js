const fs = require("fs");
const path = require("path");

// Default aesthetic fallback Unicode emojis for every known key
const FALLBACKS = {
  Loading: "⏳",
  astrix: "✨",
  invite: "🔗",
  discord: "💬",
  website: "🌐",
  prefix: "⚡",
  signal: "📶",
  members: "👥",
  servers: "🏛️",
  clock: "⏰",
  Red_heart: "❤️",
  list: "📋",
  home: "🏠",
  stats: "📊",
  online: "🟢",
  idle: "🟡",
  DoNotDisturb: "🔴",
  offline: "⚪",
  calender: "📅",
  Servericon: "🖼️",
  games: "🎮",
  badge: "🎖️",
  channel: "💬",
  rmicrophone: "🎙️",
  rshield: "🛡️",
  rspeaker: "🔊",
  red_boost: "🚀",
  red_star: "⭐",
  rmessage: "✉️",
  assetemoji: "💎",
  Warn_red: "⚠️",
  RedGear: "⚙️",
  RedMail: "📬",
  bote: "🤖",
  linkRed: "🔗",
  Sleepy: "💤",
  antinuke: "🔒",
  minecraft: "⛏️",
  Valorant: "🎯",
  roblox_op: "🕹️",
  github: "🐙",
  chatgpt: "🧠",
  owner3: "👑",
  developers: "💻",
  Artist: "🎨",
  vip: "🌟",
  EarlySupporter: "⭐",
  bug_hunter: "🐛",
  staff: "🛡️",
  red_circle: "🔴",
  ticky_red: "✅",
  tick: "✅",
  cross: "❌",
  tada2: "🎉",
  Trophy: "🏆",
  red_yellow_gift: "🎁",
};

// In-memory dynamic cache for Developer Portal Application Emojis
const dynamicCache = new Map();

// Helper to normalize strings for fuzzy matching
function normalizeKey(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Fetch and synchronize all Application Emojis from Discord Developer Portal
 */
async function syncFromClient(client) {
  try {
    if (!client || !client.application) return;

    let appEmojis = null;
    try {
      appEmojis = await client.application.emojis.fetch();
    } catch (err) {
      console.warn("[Emoji Engine] Could not fetch application emojis via client.application.emojis:", err.message);
    }

    if (!appEmojis || appEmojis.size === 0) {
      // Also check client.emojis.cache across guilds bot is in
      if (client.emojis?.cache?.size > 0) {
        client.emojis.cache.forEach((e) => {
          const formatted = `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`;
          dynamicCache.set(e.name, formatted);
          dynamicCache.set(normalizeKey(e.name), formatted);
        });
      }
      return;
    }

    console.log(`[Emoji Engine] 📡 Successfully synced ${appEmojis.size} Application Emojis from Developer Portal.`);

    const rawExport = {};

    appEmojis.forEach((e) => {
      const formatted = `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`;
      dynamicCache.set(e.name, formatted);
      dynamicCache.set(normalizeKey(e.name), formatted);
      rawExport[e.name] = formatted;
    });

    // Save updated map to emojis.json for persistence
    const jsonPath = path.join(__dirname, "emojis.json");
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(rawExport, null, 2), "utf8");
    } catch (_) {}
  } catch (err) {
    console.error("[Emoji Engine] Sync Error:", err);
  }
}

// Initial load from emojis.json if present
try {
  const jsonPath = path.join(__dirname, "emojis.json");
  if (fs.existsSync(jsonPath)) {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    for (const [k, v] of Object.entries(parsed)) {
      dynamicCache.set(k, v);
      dynamicCache.set(normalizeKey(k), v);
    }
  }
} catch (_) {}

// Smart alias mapping from common bot property names to the new Astrix Application Emojis
const ALIAS_MAP = {
  // Status & Actions
  tick: "astrix_check",
  check: "astrix_check",
  ticky_red: "astrix_check",
  cross: "astrix_cross",
  error: "astrix_cross",
  warn: "astrix_warn",
  warn_red: "astrix_warn",
  alert: "astrix_warn",
  caution: "astrix_warn",
  info: "astrix_info",
  loading: "astrix_loading_anim",
  Loading: "astrix_loading_anim",

  // Modules & Security
  antinuke: "astrix_shield",
  shield: "astrix_shield",
  rshield: "astrix_shield",
  automod: "astrix_hammer",
  hammer: "astrix_hammer",
  music: "astrix_music",
  crown: "astrix_crown",
  owner: "astrix_crown",
  owner3: "astrix_crown",
  gift: "astrix_gift",
  giveaway: "astrix_gift",
  tada: "astrix_gift",
  tada2: "astrix_gift",
  red_yellow_gift: "astrix_gift",
  star: "astrix_star",
  red_star: "astrix_star",
  sparkle: "astrix_sparkle_anim",
  astrix: "astrix_sparkle_anim",
  ticket: "astrix_ticket",
  gear: "astrix_gear",
  redgear: "astrix_gear",
  settings: "astrix_gear",
  lock: "astrix_lock",
  trash: "astrix_trash",
  bin: "astrix_trash",
  stats: "astrix_stats",
  chart: "astrix_stats",
  trophy: "astrix_trophy",
  Trophy: "astrix_trophy",
  clock: "astrix_clock",
  time: "astrix_clock",
  bell: "astrix_bell_anim",
  heart: "astrix_heart_anim",
  Red_heart: "astrix_heart_anim",
  fire: "astrix_fire_anim",
  boost: "astrix_boost",
  red_boost: "astrix_boost",

  // Inline / Navigation / Tech
  arrow: "astrix_arrow",
  arrow_right: "astrix_arrow",
  arrow_left: "astrix_arrow",
  arrow_double: "astrix_arrow_double",
  dot: "astrix_dot",
  home: "astrix_home",
  server: "astrix_server",
  servers: "astrix_server",
  members: "astrix_members",
  member: "astrix_members",
  channel: "astrix_channel",
  mic: "astrix_mic",
  rmicrophone: "astrix_mic",
  volume: "astrix_volume",
  rspeaker: "astrix_volume",
  link: "astrix_link",
  linkRed: "astrix_link",
  invite: "astrix_link",
  ping: "astrix_ping_anim",
  signal: "astrix_ping_anim",
  wifi: "astrix_ping_anim",
  code: "astrix_code",
  terminal: "astrix_terminal",
  play: "astrix_play",
  pause: "astrix_pause",
  skip: "astrix_skip",
  previous: "astrix_previous",
  disc: "astrix_disc_anim",
  equalizer: "astrix_equalizer_anim",
  chat: "astrix_chat",
  discord: "astrix_chat",
  website: "astrix_globe",
  globe: "astrix_globe",
  coins: "astrix_coins",
  money: "astrix_coins",
  wallet: "astrix_coins",
  calendar: "astrix_calendar",
  calender: "astrix_calendar",
  online: "astrix_online",
  idle: "astrix_idle",
  dnd: "astrix_dnd",
  DoNotDisturb: "astrix_dnd",
  offline: "astrix_offline",
};

/**
 * Resolve an emoji by name or key
 */
function resolveEmoji(prop) {
  if (typeof prop !== "string") return "✨";

  // 1. Check if there's a mapped Astrix emoji alias
  const alias = ALIAS_MAP[prop] || ALIAS_MAP[prop.toLowerCase()];
  if (alias) {
    if (dynamicCache.has(alias)) return dynamicCache.get(alias);
    const normAlias = normalizeKey(alias);
    if (dynamicCache.has(normAlias)) return dynamicCache.get(normAlias);
  }

  // 2. Direct match in dynamic cache
  if (dynamicCache.has(prop)) {
    return dynamicCache.get(prop);
  }

  // 3. Normalized match in dynamic cache
  const norm = normalizeKey(prop);
  if (dynamicCache.has(norm)) {
    return dynamicCache.get(norm);
  }

  // 4. Match in default fallbacks
  if (FALLBACKS[prop]) {
    return FALLBACKS[prop];
  }
  const normFallback = Object.keys(FALLBACKS).find((k) => normalizeKey(k) === norm);
  if (normFallback) {
    return FALLBACKS[normFallback];
  }

  return "✨";
}

// Smart Proxy that never returns broken undefined or raw invalid text
const emojisProxy = new Proxy(FALLBACKS, {
  get(target, prop) {
    if (prop === "syncFromClient") return syncFromClient;
    if (prop === "resolveEmoji") return resolveEmoji;
    if (prop === "dynamicCache") return dynamicCache;
    if (typeof prop !== "string") return Reflect.get(target, prop);
    return resolveEmoji(prop);
  },
  set(target, prop, value) {
    if (typeof prop === "string") {
      dynamicCache.set(prop, value);
      dynamicCache.set(normalizeKey(prop), value);
    }
    return Reflect.set(target, prop, value);
  },
});

module.exports = emojisProxy;
