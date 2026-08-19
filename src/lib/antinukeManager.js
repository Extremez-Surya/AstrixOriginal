const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "antinukeConfig.json");
const configCache = new Map();
let isInitialized = false;

function getDefaultConfig() {
  return {
    enabled: false,
    logChannel: null,
    extraOwners: [],
    whitelist: [],
    punishment: "ban",
    threshold: 2,
    windowMs: 60000,
    autoRevert: true,
    modules: {
      channel: true,
      role: true,
      ban: true,
      kick: true,
      webhook: true,
      botAdd: true,
      guildUpdate: true,
      emoji: true,
      permissions: true,
    },
    stats: {
      nukesIntercepted: 0,
      reversionsExecuted: 0,
      lastNukeTimestamp: null,
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
    console.error("[AntiNukeManager] Cache init error:", e);
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
      console.error("[AntiNukeManager] Save disk error:", e);
    }
  });
}

function getGuildAntinuke(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultConfig();

  const raw = configCache.get(guildId);
  if (!raw) return getDefaultConfig();

  const defaultConfig = getDefaultConfig();
  return {
    ...defaultConfig,
    ...raw,
    modules: { ...defaultConfig.modules, ...(raw.modules || {}) },
    extraOwners: Array.isArray(raw.extraOwners) ? raw.extraOwners : [],
    whitelist: Array.isArray(raw.whitelist) ? raw.whitelist : [],
    stats: { ...defaultConfig.stats, ...(raw.stats || {}) },
  };
}

function setGuildAntinuke(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function enableMaster(guildId) {
  const config = getGuildAntinuke(guildId);
  config.enabled = true;
  for (const modKey of Object.keys(config.modules)) {
    config.modules[modKey] = true;
  }
  setGuildAntinuke(guildId, config);
  return config;
}

function disableMaster(guildId) {
  const config = getGuildAntinuke(guildId);
  config.enabled = false;
  for (const modKey of Object.keys(config.modules)) {
    config.modules[modKey] = false;
  }
  setGuildAntinuke(guildId, config);
  return config;
}

function toggleMaster(guildId) {
  const config = getGuildAntinuke(guildId);
  if (config.enabled) return disableMaster(guildId);
  else return enableMaster(guildId);
}

function toggleModule(guildId, modKey) {
  const config = getGuildAntinuke(guildId);
  if (!config.modules) config.modules = {};
  config.modules[modKey] = !config.modules[modKey];

  if (config.modules[modKey]) {
    config.enabled = true;
  } else {
    const anyActive = Object.values(config.modules).some(Boolean);
    if (!anyActive) config.enabled = false;
  }

  setGuildAntinuke(guildId, config);
  return config;
}

function updateGuildAntinuke(guildId, updates) {
  if (!guildId) return false;
  const current = getGuildAntinuke(guildId);
  const updated = {
    ...current,
    ...updates,
    modules: { ...current.modules, ...(updates.modules || {}) },
    stats: { ...current.stats, ...(updates.stats || {}) },
  };
  return setGuildAntinuke(guildId, updated);
}

function isWhitelisted(client, guild, userId) {
  if (!guild || !userId) return true;

  // Bot Owners / Developers are strictly immune
  const noprefixManager = require("./noprefixManager");
  if (noprefixManager.isOwner(userId, client)) return true;

  // Guild Owner is strictly immune
  if (guild.ownerId === userId) return true;

  // Bot itself is immune
  if (client.user?.id === userId) return true;

  const config = getGuildAntinuke(guild.id);
  if (config.extraOwners && config.extraOwners.includes(userId)) return true;
  if (config.whitelist && config.whitelist.includes(userId)) return true;

  return false;
}

function addWhitelist(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (!config.whitelist.includes(userId)) {
    config.whitelist.push(userId);
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function removeWhitelist(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (config.whitelist.includes(userId)) {
    config.whitelist = config.whitelist.filter((id) => id !== userId);
    setGuildAntiraid(guildId, config);
    return true;
  }
  return false;
}

function clearWhitelist(guildId) {
  const config = getGuildAntinuke(guildId);
  config.whitelist = [];
  setGuildAntinuke(guildId, config);
  return true;
}

function addExtraOwner(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (!config.extraOwners.includes(userId)) {
    config.extraOwners.push(userId);
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function removeExtraOwner(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (config.extraOwners.includes(userId)) {
    config.extraOwners = config.extraOwners.filter((id) => id !== userId);
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function incrementStats(guildId, key, count = 1) {
  const config = getGuildAntinuke(guildId);
  if (!config.stats) {
    config.stats = { nukesIntercepted: 0, reversionsExecuted: 0, lastNukeTimestamp: null };
  }
  if (key === "nukesIntercepted") {
    config.stats.nukesIntercepted = (config.stats.nukesIntercepted || 0) + count;
    config.stats.lastNukeTimestamp = Date.now();
  } else if (key === "reversionsExecuted") {
    config.stats.reversionsExecuted = (config.stats.reversionsExecuted || 0) + count;
  }
  setGuildAntinuke(guildId, config);
}

function resetAntinuke(guildId) {
  if (!guildId) return false;
  if (!isInitialized) initCache();

  configCache.delete(guildId);
  saveDiskAsync();
  return true;
}

initCache();

module.exports = {
  getDefaultConfig,
  getGuildAntinuke,
  setGuildAntinuke,
  updateGuildAntinuke,
  enableMaster,
  disableMaster,
  toggleMaster,
  toggleModule,
  isWhitelisted,
  addWhitelist,
  removeWhitelist,
  clearWhitelist,
  addExtraOwner,
  removeExtraOwner,
  incrementStats,
  resetAntinuke,
};
