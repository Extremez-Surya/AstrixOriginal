const fs = require("fs");
const path = require("path");

// In-memory dynamic cache for Developer Portal Application Emojis
const dynamicCache = new Map();

// Canonical mappings and aliases for Developer Portal Application Emojis
const ALIASES = {
  // Moderation
  ban: "ban",
  kick: "kick",
  mute: "mute",
  unmute: "unmute",
  warn: "warn",
  Warn_red: "warn",
  timeout: "timeout",
  clear: "clear",
  lock: "lock",
  unlock: "unlock",
  nick: "nick",
  slowmode: "slowmode",

  // Status indicators & actions
  online: "green_dot",
  idle: "green_dot",
  DoNotDisturb: "red_point",
  dnd: "red_point",
  offline: "2179offlinestatus",
  "2179offlinestatus": "2179offlinestatus",

  // Success / Failure / Notices
  tick: "green_dot",
  success: "green_dot",
  ticky_red: "green_dot",
  check: "green_dot",
  cross: "red_point",
  error: "red_point",
  red_circle: "red_point",
  alert: "warn",
  caution: "warn",
  info: "green_dot",
};

// Helper to normalize strings for fuzzy matching
function normalizeKey(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Initial load from emojis.json if present
function loadJsonMap() {
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
}

loadJsonMap();

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

/**
 * Resolve an emoji by name or key, prioritizing Developer Portal Application Emojis
 */
function resolveEmoji(prop) {
  if (typeof prop !== "string") return "✨";

  // 1. Direct match in dynamic cache (Application Emojis)
  if (dynamicCache.has(prop)) {
    return dynamicCache.get(prop);
  }

  // 2. Alias match in dynamic cache
  if (ALIASES[prop] && dynamicCache.has(ALIASES[prop])) {
    return dynamicCache.get(ALIASES[prop]);
  }

  // 3. Normalized alias match
  const norm = normalizeKey(prop);
  if (ALIASES[norm] && dynamicCache.has(ALIASES[norm])) {
    return dynamicCache.get(ALIASES[norm]);
  }

  // 4. Normalized match in dynamic cache
  if (dynamicCache.has(norm)) {
    return dynamicCache.get(norm);
  }

  // 5. Fallbacks for status / common keys
  if (prop.toLowerCase().includes("online") || prop.toLowerCase().includes("success") || prop.toLowerCase().includes("tick")) {
    return dynamicCache.get("green_dot") || "🟢";
  }
  if (prop.toLowerCase().includes("dnd") || prop.toLowerCase().includes("error") || prop.toLowerCase().includes("cross")) {
    return dynamicCache.get("red_point") || "🔴";
  }
  if (prop.toLowerCase().includes("offline")) {
    return dynamicCache.get("2179offlinestatus") || "⚪";
  }

  return "✨";
}

// Smart Proxy that never returns broken undefined or raw invalid text
const emojisProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === "syncFromClient") return syncFromClient;
    if (prop === "resolveEmoji") return resolveEmoji;
    if (prop === "dynamicCache") return dynamicCache;
    if (prop === "loadJsonMap") return loadJsonMap;
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
