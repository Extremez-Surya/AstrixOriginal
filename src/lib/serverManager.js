const fs = require("fs");
const path = require("path");

const SERVER_CONFIG_FILE = path.join(__dirname, "serverConfig.json");
const serverCache = new Map();
let isInitialized = false;

function getDefaultServerConfig() {
  return {
    disabledCommands: {},
    disableNotice: true,
    moderation: {
      supportRoles: [],
      modRoles: [],
      headmodRoles: [],
      detainRole: null,
      detainChannel: null,
      detainMode: true,
      detainMessages: {
        detain: "You have been detained for {duration}. Reason: {reason}",
        release: "You have been released from detention.",
        response: "{user} has been detained for {duration}. Reason: {reason}",
      },
    },
  };
}

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(SERVER_CONFIG_FILE)) {
      const data = fs.readFileSync(SERVER_CONFIG_FILE, "utf8");
      const parsed = JSON.parse(data);
      if (parsed.guilds) {
        for (const [guildId, cfg] of Object.entries(parsed.guilds)) {
          serverCache.set(guildId, cfg);
        }
      }
    }
  } catch (e) {
    console.error("[ServerManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      const obj = { guilds: {} };
      for (const [guildId, cfg] of serverCache.entries()) {
        obj.guilds[guildId] = cfg;
      }
      fs.writeFileSync(SERVER_CONFIG_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[ServerManager] Save disk error:", e);
    }
  });
}

function getServerConfig(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultServerConfig();

  const raw = serverCache.get(guildId);
  if (!raw) return getDefaultServerConfig();

  const def = getDefaultServerConfig();
  return {
    disabledCommands: raw.disabledCommands || {},
    disableNotice: raw.disableNotice !== undefined ? raw.disableNotice : true,
    moderation: {
      supportRoles: Array.isArray(raw.moderation?.supportRoles) ? raw.moderation.supportRoles : [],
      modRoles: Array.isArray(raw.moderation?.modRoles) ? raw.moderation.modRoles : [],
      headmodRoles: Array.isArray(raw.moderation?.headmodRoles) ? raw.moderation.headmodRoles : [],
      detainRole: raw.moderation?.detainRole || null,
      detainChannel: raw.moderation?.detainChannel || null,
      detainMode: raw.moderation?.detainMode !== undefined ? raw.moderation.detainMode : true,
      detainMessages: {
        ...def.moderation.detainMessages,
        ...(raw.moderation?.detainMessages || {}),
      },
    },
  };
}

function saveServerConfig(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  serverCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function isCommandDisabled(guildId, channelId, commandName, categoryName) {
  if (!guildId) return false;
  const config = getServerConfig(guildId);
  const disabled = config.disabledCommands || {};

  const checkTargets = [commandName?.toLowerCase(), categoryName?.toLowerCase()].filter(Boolean);

  for (const target of checkTargets) {
    const scopes = disabled[target];
    if (Array.isArray(scopes)) {
      if (scopes.includes("global") || (channelId && scopes.includes(channelId))) {
        return true;
      }
    }
  }
  return false;
}

function disableCommand(guildId, targetName, scope = "global") {
  const config = getServerConfig(guildId);
  if (!config.disabledCommands) config.disabledCommands = {};

  const current = config.disabledCommands[targetName] || [];
  if (!current.includes(scope)) {
    current.push(scope);
    config.disabledCommands[targetName] = current;
    saveServerConfig(guildId, config);
  }
  return true;
}

function enableCommand(guildId, targetName, scope = "global") {
  const config = getServerConfig(guildId);
  if (!config.disabledCommands || !config.disabledCommands[targetName]) return false;

  const current = config.disabledCommands[targetName];
  const updated = current.filter((s) => s !== scope);

  if (updated.length === 0) {
    delete config.disabledCommands[targetName];
  } else {
    config.disabledCommands[targetName] = updated;
  }

  saveServerConfig(guildId, config);
  return true;
}

function setDisableNotice(guildId, state) {
  const config = getServerConfig(guildId);
  config.disableNotice = Boolean(state);
  saveServerConfig(guildId, config);
  return config.disableNotice;
}

function getDisableNotice(guildId) {
  const config = getServerConfig(guildId);
  return config.disableNotice !== false;
}

function setDetainMessage(guildId, type, message) {
  const config = getServerConfig(guildId);
  if (!config.moderation.detainMessages) config.moderation.detainMessages = {};
  config.moderation.detainMessages[type] = message;
  saveServerConfig(guildId, config);
  return true;
}

function resetDetainMessages(guildId) {
  const config = getServerConfig(guildId);
  const def = getDefaultServerConfig();
  config.moderation.detainMessages = { ...def.moderation.detainMessages };
  saveServerConfig(guildId, config);
  return true;
}

initCache();

module.exports = {
  getServerConfig,
  saveServerConfig,
  isCommandDisabled,
  disableCommand,
  enableCommand,
  setDisableNotice,
  getDisableNotice,
  setDetainMessage,
  resetDetainMessages,
};
