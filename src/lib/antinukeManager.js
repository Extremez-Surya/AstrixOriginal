const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "antinukeConfig.json");
const configCache = new Map();
let isInitialized = false;
let saveTimer = null;

function getDefaultConfig() {
  return {
    enabled: false,
    superAntinuke: false,
    logChannel: null,
    superLogChannel: null,
    modLogChannel: null,
    securityWallRole: null,
    antivanityAdminRole: null,
    criminalsRole: null,
    unbypassableRole: null,
    wallRoles: [],
    extraOwners: [],
    whitelist: [],
    superWhitelist: [],
    punishment: "ban", // "ban" | "kick" | "strip" | "timeout" | "quarantine"
    threshold: 3, // Default 3 actions (with rapid sub-second burst detection)
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
      prune: true,
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
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const obj = {};
      for (const [guildId, cfg] of configCache.entries()) {
        obj[guildId] = cfg;
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[AntiNukeManager] Save disk error:", e);
    }
  }, 100);
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
    wallRoles: Array.isArray(raw.wallRoles) ? raw.wallRoles : (raw.securityWallRole ? [raw.securityWallRole] : []),
    extraOwners: Array.isArray(raw.extraOwners) ? raw.extraOwners : [],
    whitelist: Array.isArray(raw.whitelist) ? raw.whitelist : [],
    superWhitelist: Array.isArray(raw.superWhitelist) ? raw.superWhitelist : [],
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

  // Bot Developers / Owners are strictly immune
  const noprefixManager = require("./noprefixManager");
  if (noprefixManager.isOwner(userId, client)) return true;

  // Guild Owner is strictly immune
  if (guild.ownerId === userId) return true;

  // Bot itself is strictly immune
  if (client.user?.id === userId) return true;

  const config = getGuildAntinuke(guild.id);
  if (config.extraOwners && config.extraOwners.includes(userId)) return true;
  if (config.whitelist && config.whitelist.includes(userId)) return true;
  if (config.superWhitelist && config.superWhitelist.includes(userId)) return true;

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
    setGuildAntinuke(guildId, config);
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

function addSuperWhitelist(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (!config.superWhitelist) config.superWhitelist = [];
  if (!config.superWhitelist.includes(userId)) {
    config.superWhitelist.push(userId);
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function removeSuperWhitelist(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (config.superWhitelist && config.superWhitelist.includes(userId)) {
    config.superWhitelist = config.superWhitelist.filter((id) => id !== userId);
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function clearSuperWhitelist(guildId) {
  const config = getGuildAntinuke(guildId);
  config.superWhitelist = [];
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

function setSecurityWallRole(guildId, roleId) {
  const config = getGuildAntinuke(guildId);
  config.securityWallRole = roleId;
  if (!config.wallRoles) config.wallRoles = [];
  if (roleId && !config.wallRoles.includes(roleId)) {
    config.wallRoles.push(roleId);
  }
  setGuildAntinuke(guildId, config);
  return true;
}

function addWallRole(guildId, roleId) {
  const config = getGuildAntinuke(guildId);
  if (!config.wallRoles) config.wallRoles = [];
  if (!config.wallRoles.includes(roleId)) {
    config.wallRoles.push(roleId);
    if (!config.securityWallRole) config.securityWallRole = roleId;
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function removeWallRole(guildId, roleId) {
  const config = getGuildAntinuke(guildId);
  if (config.wallRoles && config.wallRoles.includes(roleId)) {
    config.wallRoles = config.wallRoles.filter((id) => id !== roleId);
    if (config.securityWallRole === roleId) {
      config.securityWallRole = config.wallRoles[0] || null;
    }
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function setAntinukeLogs(guildId, channelId) {
  const config = getGuildAntinuke(guildId);
  config.logChannel = channelId;
  setGuildAntinuke(guildId, config);
  return true;
}

function setModLogs(guildId, channelId) {
  const config = getGuildAntinuke(guildId);
  config.modLogChannel = channelId;
  setGuildAntinuke(guildId, config);
  return true;
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
  addSuperWhitelist,
  removeSuperWhitelist,
  clearSuperWhitelist,
  addExtraOwner,
  removeExtraOwner,
  setSecurityWallRole,
  addWallRole,
  removeWallRole,
  setAntinukeLogs,
  setModLogs,
  incrementStats,
  resetAntinuke,
};
