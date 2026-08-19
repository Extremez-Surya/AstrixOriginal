const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "automodConfig.json");
const configCache = new Map();
let isInitialized = false;

const MODULES = {
  antiinvite: { name: "Anti-Invite", description: "Blocks Discord invite links", emoji: "🔗", defaultPunishment: "delete", strikes: 1 },
  antilink: { name: "Anti-Link", description: "Blocks external URLs & links", emoji: "🌐", defaultPunishment: "delete", strikes: 1 },
  antispam: { name: "Anti-Spam", description: "Prevents rapid & duplicate messages", emoji: "📨", defaultPunishment: "warn", strikes: 1 },
  anticaps: { name: "Anti-Caps", description: "Blocks excessive capital letters", emoji: "🔠", defaultPunishment: "delete", strikes: 0 },
  antimention: { name: "Anti-Mass-Mention", description: "Blocks mass user mentions", emoji: "📢", defaultPunishment: "warn", strikes: 2 },
  antiemoji: { name: "Anti-Emoji", description: "Blocks excessive emoji spam", emoji: "😀", defaultPunishment: "delete", strikes: 0 },
  badwords: { name: "Bad Words", description: "Filters custom banned words/phrases", emoji: "🤬", defaultPunishment: "delete", strikes: 1 },
  maxlines: { name: "Max Lines", description: "Limits message line count", emoji: "📏", defaultPunishment: "delete", strikes: 0 },
  antieveryone: { name: "Anti-Everyone", description: "Blocks @everyone / @here mentions", emoji: "📣", defaultPunishment: "delete", strikes: 2 },
  antirole: { name: "Anti-Role Mention", description: "Blocks mass role mentions", emoji: "🎭", defaultPunishment: "warn", strikes: 2 },
  antizalgo: { name: "Anti-Zalgo", description: "Blocks zalgo & glitched text", emoji: "👾", defaultPunishment: "delete", strikes: 0 },
  antinewlines: { name: "Anti-Newlines", description: "Blocks excessive blank lines", emoji: "↕️", defaultPunishment: "delete", strikes: 0 },
  anticopypasta: { name: "Anti-Copypasta", description: "Blocks viral copypasta spam", emoji: "📋", defaultPunishment: "delete", strikes: 2 },
  antiai: { name: "AI Toxicity", description: "AI checks messages & nicknames", emoji: "🧪", defaultPunishment: "delete", strikes: 1 },
};

const PUNISHMENTS = {
  warn: { name: "Warn", description: "Sends a warning message to user", emoji: "⚠️" },
  delete: { name: "Delete", description: "Deletes the violating message", emoji: "🗑️" },
  mute: { name: "Mute", description: "Mutes user (10 minutes timeout)", emoji: "🔇" },
  kick: { name: "Kick", description: "Kicks user from server", emoji: "👢" },
  ban: { name: "Ban", description: "Bans user from server", emoji: "🔨" },
  protocol: { name: "Protocol", description: "Strips all roles & 28-day timeout", emoji: "🚨" },
};

const PRESETS = {
  strict: {
    name: "Strict",
    description: "Maximum security - punishes all violations",
    modules: ["antiinvite", "antilink", "antispam", "anticaps", "antimention", "antiemoji", "badwords", "maxlines", "antieveryone", "antirole", "antizalgo", "antinewlines", "anticopypasta", "antiai"],
  },
  moderate: {
    name: "Moderate",
    description: "Balanced protection for standard community servers",
    modules: ["antiinvite", "antilink", "antispam", "antimention", "badwords", "antieveryone", "antirole"],
  },
  light: {
    name: "Light",
    description: "Basic protection - only invite & spam filters",
    modules: ["antiinvite", "antieveryone", "antispam"],
  },
};

function getDefaultConfig() {
  const modulesObj = {};
  for (const [key, mod] of Object.entries(MODULES)) {
    modulesObj[key] = {
      enabled: false,
      punishments: [mod.defaultPunishment],
      strikes: mod.strikes || 0,
      threshold:
        key === "anticaps"
          ? 70
          : key === "antispam"
          ? 5
          : key === "antimention"
          ? 5
          : key === "antiemoji"
          ? 10
          : key === "maxlines"
          ? 15
          : key === "antinewlines"
          ? 5
          : key === "antirole"
          ? 5
          : key === "antieveryone"
          ? 5
          : 1,
      window: key === "antispam" ? 5 : undefined,
      words: key === "badwords" ? [] : undefined,
      usePercent: key === "antirole" || key === "antieveryone" ? true : undefined,
      ignore: { channels: [], roles: [] },
    };
  }

  return {
    enabled: false,
    logChannel: null,
    notifyUser: true,
    activePreset: null,
    strikesEnabled: true,
    strikeExpiry: 24,
    strikeActions: {
      3: { action: "mute", duration: "10m" },
      5: { action: "mute", duration: "1h" },
      7: { action: "kick" },
      10: { action: "ban" },
    },
    modules: modulesObj,
    ignore: { channels: [], roles: [], users: [] },
    userStrikes: {},
    stats: {
      violationsIntercepted: 0,
      strikesIssued: 0,
      messagesDeleted: 0,
    },
  };
}

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      const parsed = JSON.parse(data);
      for (const [guildId, cfg] of Object.entries(parsed)) {
        configCache.set(guildId, cfg);
      }
    }
  } catch (e) {
    console.error("[AutomodManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      const obj = {};
      for (const [guildId, cfg] of configCache.entries()) {
        obj[guildId] = cfg;
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[AutomodManager] Save disk error:", e);
    }
  });
}

function getGuildAutomod(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultConfig();

  const raw = configCache.get(guildId);
  if (!raw) return getDefaultConfig();

  const defaultConfig = getDefaultConfig();
  const mergedModules = { ...defaultConfig.modules };

  if (raw.modules) {
    for (const [modKey, modVal] of Object.entries(raw.modules)) {
      mergedModules[modKey] = {
        ...(defaultConfig.modules[modKey] || {}),
        ...modVal,
        ignore: {
          channels: [],
          roles: [],
          ...(modVal.ignore || {}),
        },
      };
    }
  }

  return {
    ...defaultConfig,
    ...raw,
    modules: mergedModules,
    ignore: {
      channels: [],
      roles: [],
      users: [],
      ...(raw.ignore || {}),
    },
    strikeActions: { ...defaultConfig.strikeActions, ...(raw.strikeActions || {}) },
    stats: { ...defaultConfig.stats, ...(raw.stats || {}) },
  };
}

function setGuildAutomod(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function applyPreset(guildId, presetName) {
  const preset = PRESETS[presetName.toLowerCase()];
  if (!preset) return false;

  const config = getGuildAutomod(guildId);
  config.enabled = true;
  config.activePreset = presetName.toLowerCase();

  for (const modKey of Object.keys(MODULES)) {
    if (!config.modules[modKey]) {
      config.modules[modKey] = { enabled: false, punishments: ["delete"], threshold: 1, ignore: { channels: [], roles: [] } };
    }
    config.modules[modKey].enabled = preset.modules.includes(modKey);
  }

  setGuildAutomod(guildId, config);
  return true;
}

function enableMaster(guildId) {
  const config = getGuildAutomod(guildId);
  config.enabled = true;
  for (const modKey of Object.keys(config.modules)) {
    if (config.modules[modKey]) config.modules[modKey].enabled = true;
  }
  setGuildAutomod(guildId, config);
  return config;
}

function disableMaster(guildId) {
  const config = getGuildAutomod(guildId);
  config.enabled = false;
  for (const modKey of Object.keys(config.modules)) {
    if (config.modules[modKey]) config.modules[modKey].enabled = false;
  }
  setGuildAutomod(guildId, config);
  return config;
}

function toggleMaster(guildId) {
  const config = getGuildAutomod(guildId);
  if (config.enabled) return disableMaster(guildId);
  else return enableMaster(guildId);
}

function toggleModule(guildId, modKey) {
  const config = getGuildAutomod(guildId);
  if (!config.modules[modKey]) {
    config.modules[modKey] = { enabled: true, punishments: ["delete"] };
  } else {
    config.modules[modKey].enabled = !config.modules[modKey].enabled;
  }

  if (config.modules[modKey].enabled) {
    config.enabled = true;
  } else {
    const anyActive = Object.values(config.modules).some((m) => m.enabled);
    if (!anyActive) config.enabled = false;
  }

  setGuildAutomod(guildId, config);
  return config;
}

function isIgnored(message, config, moduleName, client = null) {
  if (!config.enabled) return true;

  const noprefixManager = require("./noprefixManager");
  if (noprefixManager.isOwner(message.author.id, client || message.client)) return true;

  const moduleConfig = config.modules?.[moduleName];
  if (!moduleConfig?.enabled) return true;

  // Global Ignores
  if (config.ignore?.channels?.includes(message.channel.id)) return true;
  if (config.ignore?.users?.includes(message.author.id)) return true;
  if (config.ignore?.roles?.some((roleId) => message.member?.roles.cache.has(roleId))) return true;

  // Module Ignores
  if (moduleConfig.ignore?.channels?.includes(message.channel.id)) return true;
  if (moduleConfig.ignore?.roles?.some((roleId) => message.member?.roles.cache.has(roleId))) return true;

  return false;
}

function addBadWord(guildId, word) {
  const config = getGuildAutomod(guildId);
  if (!config.modules.badwords) {
    config.modules.badwords = { enabled: true, punishments: ["delete"], words: [] };
  }
  if (!Array.isArray(config.modules.badwords.words)) {
    config.modules.badwords.words = [];
  }

  const clean = word.trim().toLowerCase();
  if (clean && !config.modules.badwords.words.includes(clean)) {
    config.modules.badwords.words.push(clean);
    setGuildAutomod(guildId, config);
    return true;
  }
  return false;
}

function removeBadWord(guildId, word) {
  const config = getGuildAutomod(guildId);
  if (config.modules.badwords?.words) {
    const clean = word.trim().toLowerCase();
    const idx = config.modules.badwords.words.indexOf(clean);
    if (idx !== -1) {
      config.modules.badwords.words.splice(idx, 1);
      setGuildAutomod(guildId, config);
      return true;
    }
  }
  return false;
}

function clearBadWords(guildId) {
  const config = getGuildAutomod(guildId);
  if (config.modules.badwords) {
    config.modules.badwords.words = [];
    setGuildAutomod(guildId, config);
    return true;
  }
  return false;
}

function resetAutomod(guildId) {
  if (!guildId) return false;
  if (!isInitialized) initCache();

  configCache.delete(guildId);
  saveDiskAsync();
  return true;
}

initCache();

module.exports = {
  MODULES,
  PUNISHMENTS,
  PRESETS,
  getDefaultConfig,
  getGuildAutomod,
  setGuildAutomod,
  enableMaster,
  disableMaster,
  toggleMaster,
  toggleModule,
  applyPreset,
  isIgnored,
  addBadWord,
  removeBadWord,
  clearBadWords,
  resetAutomod,
};
