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

/**
 * Resolve an emoji by name or key
 */
function resolveEmoji(prop) {
  if (typeof prop !== "string") return "✨";

  // 1. Direct match in dynamic cache
  if (dynamicCache.has(prop)) {
    return dynamicCache.get(prop);
  }

  // 2. Normalized match in dynamic cache
  const norm = normalizeKey(prop);
  if (dynamicCache.has(norm)) {
    return dynamicCache.get(norm);
  }

  // 3. Match in default fallbacks
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
