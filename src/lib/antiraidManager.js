const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "antiraidConfig.json");

// In-Memory RAM Cache for Sub-Millisecond (<0.1ms) Config Lookups
const configCache = new Map();
let isInitialized = false;

function getDefaultConfig() {
  return {
    enabled: false,
    raidState: false,
    strictMode: "EXTREME",
    logChannel: null,
    massjoin: {
      enabled: false,
      threshold: 5,
      windowMs: 10000,
      action: "ban",
      lockChannels: true,
      invalidateInvites: false,
    },
    avatar: {
      enabled: false,
      action: "ban",
    },
    newaccounts: {
      enabled: false,
      threshold: 7,
      action: "ban",
    },
    namefilter: {
      enabled: false,
      action: "ban",
      patterns: [
        "discord\\.gg/",
        "discord\\.com/invite",
        "https?://",
        "wizz",
        "nuke",
        "raid",
        "hacked",
        "crasher",
        "salazar",
      ],
    },
    youngAccountSpike: {
      enabled: true,
      thresholdHours: 24,
      action: "ban",
    },
    whitelist: [],
    stats: {
      blockedCount: 0,
      raidsDetected: 0,
      lastRaidTimestamp: null,
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
    console.error("[AntiRaidManager] Cache init error:", e);
  }
  isInitialized = true;
}

// Save memory cache asynchronously to disk without blocking the event loop
function saveDiskAsync() {
  setImmediate(() => {
    try {
      const obj = {};
      for (const [guildId, cfg] of configCache.entries()) {
        obj[guildId] = cfg;
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[AntiRaidManager] Save disk error:", e);
    }
  });
}

function getGuildAntiraid(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultConfig();

  const raw = configCache.get(guildId);
  if (!raw) return getDefaultConfig();

  const defaultConfig = getDefaultConfig();
  return {
    ...defaultConfig,
    ...raw,
    massjoin: { ...defaultConfig.massjoin, ...(raw.massjoin || {}) },
    avatar: { ...defaultConfig.avatar, ...(raw.avatar || {}) },
    newaccounts: { ...defaultConfig.newaccounts, ...(raw.newaccounts || {}) },
    namefilter: { ...defaultConfig.namefilter, ...(raw.namefilter || {}) },
    youngAccountSpike: { ...defaultConfig.youngAccountSpike, ...(raw.youngAccountSpike || {}) },
    whitelist: Array.isArray(raw.whitelist) ? raw.whitelist : [],
    stats: { ...defaultConfig.stats, ...(raw.stats || {}) },
  };
}

function setGuildAntiraid(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function enableMaster(guildId) {
  const config = getGuildAntiraid(guildId);
  config.enabled = true;
  if (config.massjoin) config.massjoin.enabled = true;
  if (config.avatar) config.avatar.enabled = true;
  if (config.newaccounts) config.newaccounts.enabled = true;
  if (config.namefilter) config.namefilter.enabled = true;
  if (config.youngAccountSpike) config.youngAccountSpike.enabled = true;
  setGuildAntiraid(guildId, config);
  return config;
}

function disableMaster(guildId) {
  const config = getGuildAntiraid(guildId);
  config.enabled = false;
  if (config.massjoin) config.massjoin.enabled = false;
  if (config.avatar) config.avatar.enabled = false;
  if (config.newaccounts) config.newaccounts.enabled = false;
  if (config.namefilter) config.namefilter.enabled = false;
  if (config.youngAccountSpike) config.youngAccountSpike.enabled = false;
  setGuildAntiraid(guildId, config);
  return config;
}

function toggleMaster(guildId) {
  const config = getGuildAntiraid(guildId);
  if (config.enabled) return disableMaster(guildId);
  else return enableMaster(guildId);
}

function toggleSubmodule(guildId, modKey) {
  const config = getGuildAntiraid(guildId);
  if (config[modKey]) {
    config[modKey].enabled = !config[modKey].enabled;
    if (config[modKey].enabled) {
      config.enabled = true;
    } else {
      const anyActive =
        config.massjoin?.enabled ||
        config.avatar?.enabled ||
        config.newaccounts?.enabled ||
        config.namefilter?.enabled ||
        config.youngAccountSpike?.enabled;
      if (!anyActive) config.enabled = false;
    }
  }
  setGuildAntiraid(guildId, config);
  return config;
}

function updateGuildAntiraid(guildId, updates) {
  if (!guildId) return false;
  const current = getGuildAntiraid(guildId);
  const updated = {
    ...current,
    ...updates,
    massjoin: { ...current.massjoin, ...(updates.massjoin || {}) },
    avatar: { ...current.avatar, ...(updates.avatar || {}) },
    newaccounts: { ...current.newaccounts, ...(updates.newaccounts || {}) },
    namefilter: { ...current.namefilter, ...(updates.namefilter || {}) },
    youngAccountSpike: { ...current.youngAccountSpike, ...(updates.youngAccountSpike || {}) },
    stats: { ...current.stats, ...(updates.stats || {}) },
  };
  return setGuildAntiraid(guildId, updated);
}

function isWhitelisted(guildId, userId, client = null) {
  if (!userId) return true;
  const noprefixManager = require("./noprefixManager");
  if (noprefixManager.isOwner(userId, client)) return true;

  const config = getGuildAntiraid(guildId);
  return config.whitelist.includes(userId);
}

function addWhitelist(guildId, userId) {
  const config = getGuildAntiraid(guildId);
  if (!config.whitelist.includes(userId)) {
    config.whitelist.push(userId);
    setGuildAntiraid(guildId, config);
    return true;
  }
  return false;
}

function removeWhitelist(guildId, userId) {
  const config = getGuildAntiraid(guildId);
  if (config.whitelist.includes(userId)) {
    config.whitelist = config.whitelist.filter((id) => id !== userId);
    setGuildAntiraid(guildId, config);
    return true;
  }
  return false;
}

function clearWhitelist(guildId) {
  const config = getGuildAntiraid(guildId);
  config.whitelist = [];
  setGuildAntiraid(guildId, config);
  return true;
}

function incrementStats(guildId, key, count = 1) {
  const config = getGuildAntiraid(guildId);
  if (!config.stats) {
    config.stats = { blockedCount: 0, raidsDetected: 0, lastRaidTimestamp: null };
  }
  if (key === "blockedCount") {
    config.stats.blockedCount = (config.stats.blockedCount || 0) + count;
  } else if (key === "raidsDetected") {
    config.stats.raidsDetected = (config.stats.raidsDetected || 0) + count;
    config.stats.lastRaidTimestamp = Date.now();
  }
  setGuildAntiraid(guildId, config);
}

function resetAntiraid(guildId) {
  if (!guildId) return false;
  if (!isInitialized) initCache();

  configCache.delete(guildId);
  saveDiskAsync();
  return true;
}

// Initialize cache immediately on module require
initCache();

module.exports = {
  getDefaultConfig,
  getGuildAntiraid,
  setGuildAntiraid,
  updateGuildAntiraid,
  enableMaster,
  disableMaster,
  toggleMaster,
  toggleSubmodule,
  isWhitelisted,
  addWhitelist,
  removeWhitelist,
  clearWhitelist,
  incrementStats,
  resetAntiraid,
};
