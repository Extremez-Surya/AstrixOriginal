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
    admins: [],
    whitelist: [],
    superWhitelist: [],
    protocolUsers: {},
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

function readDiskData() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("[AntiNukeManager] Read disk error:", e);
  }
  return {};
}

function initCache() {
  try {
    const parsed = readDiskData();
    for (const [guildId, cfg] of Object.entries(parsed)) {
      configCache.set(guildId, cfg);
    }
  } catch (e) {
    console.error("[AntiNukeManager] Cache init error:", e);
  }
  isInitialized = true;
}

function flushDiskSync() {
  try {
    const existing = readDiskData();
    for (const [guildId, cfg] of configCache.entries()) {
      existing[guildId] = cfg;
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(existing, null, 2), "utf8");
  } catch (e) {
    console.error("[AntiNukeManager] Flush disk error:", e);
  }
}

function saveDiskAsync() {
  flushDiskSync();
}

function getGuildAntinuke(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultConfig();

  let raw = configCache.get(guildId);
  if (!raw) {
    const diskData = readDiskData();
    if (diskData[guildId]) {
      raw = diskData[guildId];
      configCache.set(guildId, raw);
    }
  }
  if (!raw) return getDefaultConfig();

  const defaultConfig = getDefaultConfig();
  return {
    ...defaultConfig,
    ...raw,
    modules: { ...defaultConfig.modules, ...(raw.modules || {}) },
    wallRoles: Array.isArray(raw.wallRoles) ? raw.wallRoles : (raw.securityWallRole ? [raw.securityWallRole] : []),
    extraOwners: Array.isArray(raw.extraOwners) ? raw.extraOwners : [],
    admins: Array.isArray(raw.admins) ? raw.admins : [],
    whitelist: Array.isArray(raw.whitelist) ? raw.whitelist : [],
    superWhitelist: Array.isArray(raw.superWhitelist) ? raw.superWhitelist : [],
    protocolUsers: raw.protocolUsers && typeof raw.protocolUsers === "object" && !Array.isArray(raw.protocolUsers) ? raw.protocolUsers : {},
    stats: { ...defaultConfig.stats, ...(raw.stats || {}) },
  };
}

function setGuildAntinuke(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  flushDiskSync();
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
  if (config.superWhitelist && config.superWhitelist.includes(userId)) return true;
  if (config.admins && config.admins.includes(userId)) return true;
  if (config.whitelist && config.whitelist.includes(userId)) return true;

  if (config.bypassRole) {
    const member = guild.members?.cache?.get(userId);
    if (member && member.roles.cache.has(config.bypassRole)) return true;
  }

  return false;
}

function addAdmin(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (!config.admins) config.admins = [];
  if (!config.admins.includes(userId)) {
    config.admins.push(userId);
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function removeAdmin(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (config.admins && config.admins.includes(userId)) {
    config.admins = config.admins.filter((id) => id !== userId);
    setGuildAntinuke(guildId, config);
    return true;
  }
  return false;
}

function toggleAdmin(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (!config.admins) config.admins = [];
  let added = false;
  if (config.admins.includes(userId)) {
    config.admins = config.admins.filter((id) => id !== userId);
    added = false;
  } else {
    config.admins.push(userId);
    added = true;
  }
  setGuildAntinuke(guildId, config);
  return added;
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

function toggleWhitelist(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (!config.whitelist) config.whitelist = [];
  let added = false;
  if (config.whitelist.includes(userId)) {
    config.whitelist = config.whitelist.filter((id) => id !== userId);
    added = false;
  } else {
    config.whitelist.push(userId);
    added = true;
  }
  setGuildAntinuke(guildId, config);
  return added;
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

function toggleTrustedAdmin(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (!config.superWhitelist) config.superWhitelist = [];
  let added = false;
  if (config.superWhitelist.includes(userId)) {
    config.superWhitelist = config.superWhitelist.filter((id) => id !== userId);
    added = false;
  } else {
    config.superWhitelist.push(userId);
    added = true;
  }
  setGuildAntinuke(guildId, config);
  return added;
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

function toggleExtraOwner(guildId, userId) {
  const config = getGuildAntinuke(guildId);
  if (!config.extraOwners) config.extraOwners = [];
  let added = false;
  if (config.extraOwners.includes(userId)) {
    config.extraOwners = config.extraOwners.filter((id) => id !== userId);
    added = false;
  } else {
    config.extraOwners.push(userId);
    added = true;
  }
  setGuildAntinuke(guildId, config);
  return added;
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

function clearWallRoles(guildId) {
  const config = getGuildAntinuke(guildId);
  config.wallRoles = [];
  config.securityWallRole = null;
  setGuildAntinuke(guildId, config);
  return true;
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

function applyPreset(guildId, presetName = "recommended") {
  const config = getGuildAntinuke(guildId);
  const name = String(presetName).toLowerCase();

  config.enabled = true;
  config.autoRevert = true;
  if (!config.modules) config.modules = {};
  for (const k of ["channel", "role", "ban", "kick", "webhook", "botAdd", "guildUpdate", "emoji", "permissions", "prune"]) {
    config.modules[k] = true;
  }

  if (name === "hardcore" || name === "extreme") {
    config.threshold = 1;
    config.punishment = "ban";
    config.windowMs = 60000;
  } else if (name === "relaxed" || name === "light") {
    config.threshold = 5;
    config.punishment = "kick";
    config.windowMs = 60000;
  } else {
    // "recommended" / "balanced"
    config.threshold = 3;
    config.punishment = "ban";
    config.windowMs = 60000;
  }

  setGuildAntinuke(guildId, config);
  return config;
}

async function applyProtocol(guild, member, authorId) {
  if (!guild || !member) return { success: false, reason: "Member not found" };
  const config = getGuildAntinuke(guild.id);
  if (!config.protocolUsers) config.protocolUsers = {};

  const manageableRoles = member.roles.cache
    .filter((r) => r.id !== guild.id && r.editable && !r.managed)
    .map((r) => r.id);

  if (manageableRoles.length > 0) {
    await member.roles.remove(manageableRoles, `[ASTRIX PROTOCOL] Applied by <@${authorId}>`).catch(() => null);
  }

  if (member.moderatable) {
    await member.timeout(28 * 24 * 60 * 60 * 1000, `[ASTRIX PROTOCOL] Emergency security lockdown`).catch(() => null);
  }

  config.protocolUsers[member.id] = {
    timestamp: Date.now(),
    roles: manageableRoles,
    appliedBy: authorId,
  };

  setGuildAntinuke(guild.id, config);
  return { success: true, strippedCount: manageableRoles.length };
}

async function removeProtocol(guild, member, authorId) {
  if (!guild || !member) return { success: false, reason: "Member not found" };
  const config = getGuildAntinuke(guild.id);
  if (!config.protocolUsers) config.protocolUsers = {};

  const record = config.protocolUsers[member.id];
  if (!record) return { success: false, reason: "User is not under protocol" };

  if (member.moderatable) {
    await member.timeout(null, `[ASTRIX PROTOCOL] Restored by <@${authorId}>`).catch(() => null);
  }

  let restoredCount = 0;
  if (Array.isArray(record.roles) && record.roles.length > 0) {
    const validRoles = record.roles.filter((id) => guild.roles.cache.has(id));
    if (validRoles.length > 0) {
      await member.roles.add(validRoles, `[ASTRIX PROTOCOL] Role restoration by <@${authorId}>`).catch(() => null);
      restoredCount = validRoles.length;
    }
  }

  delete config.protocolUsers[member.id];
  setGuildAntinuke(guild.id, config);
  return { success: true, restoredCount };
}

function getProtocolList(guildId) {
  const config = getGuildAntinuke(guildId);
  return config.protocolUsers || {};
}

const MODULE_ALIASES = {
  ban: "ban",
  bans: "ban",
  kick: "kick",
  kicks: "kick",
  role: "role",
  roles: "role",
  channel: "channel",
  channels: "channel",
  webhook: "webhook",
  webhooks: "webhook",
  emoji: "emoji",
  emojis: "emoji",
  sticker: "emoji",
  stickers: "emoji",
  botadd: "botAdd",
  bot: "botAdd",
  bots: "botAdd",
  vanity: "guildUpdate",
  server: "guildUpdate",
  guildupdate: "guildUpdate",
  prune: "prune",
  prunes: "prune",
  permissions: "permissions",
  permission: "permissions",
  perms: "permissions",
  perm: "permissions",
};

function isExtraOwner(guildId, userId) {
  if (!guildId || !userId) return false;
  const config = getGuildAntinuke(guildId);
  return Array.isArray(config.extraOwners) && config.extraOwners.includes(userId);
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
  isExtraOwner,
  addAdmin,
  removeAdmin,
  toggleAdmin,
  addWhitelist,
  removeWhitelist,
  toggleWhitelist,
  clearWhitelist,
  addSuperWhitelist,
  removeSuperWhitelist,
  toggleTrustedAdmin,
  clearSuperWhitelist,
  addExtraOwner,
  removeExtraOwner,
  toggleExtraOwner,
  setSecurityWallRole,
  addWallRole,
  removeWallRole,
  clearWallRoles,
  setAntinukeLogs,
  setModLogs,
  incrementStats,
  resetAntinuke,
  applyPreset,
  applyProtocol,
  removeProtocol,
  getProtocolList,
  MODULE_ALIASES,
};
