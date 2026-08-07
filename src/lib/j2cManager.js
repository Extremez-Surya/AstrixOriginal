const fs = require("fs");
const path = require("path");

const J2C_FILE = path.join(__dirname, "j2cConfig.json");

const defaultConfig = {
  hubChannelId: null,
  categoryChannelId: null,
  interfaceTextChannelId: null,
  interfaceMessageId: null,
  nameTemplate: "🔊 {user}'s Lounge",
  userLimit: 0,
  tempChannels: {}, // channelId -> { ownerId, createdAt }
};

let data = {};

function loadData() {
  try {
    if (fs.existsSync(J2C_FILE)) {
      const raw = fs.readFileSync(J2C_FILE, "utf8");
      data = JSON.parse(raw);
    } else {
      data = {};
      saveData();
    }
  } catch (err) {
    console.error("[j2cManager] Error loading config:", err);
    data = {};
  }
}

function saveData() {
  try {
    fs.writeFileSync(J2C_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[j2cManager] Error saving config:", err);
  }
}

loadData();

function getGuildJ2C(guildId) {
  if (!data[guildId]) {
    data[guildId] = { ...defaultConfig, tempChannels: {} };
    saveData();
  }
  return data[guildId];
}

function setJ2CHub(guildId, hubChannelId, categoryChannelId = null) {
  const config = getGuildJ2C(guildId);
  config.hubChannelId = hubChannelId;
  config.categoryChannelId = categoryChannelId;
  saveData();
  return config;
}

function updateJ2CSettings(guildId, updates = {}) {
  const config = getGuildJ2C(guildId);
  Object.assign(config, updates);
  saveData();
  return config;
}

function resetJ2C(guildId) {
  delete data[guildId];
  saveData();
  return true;
}

function addTempChannel(guildId, channelId, ownerId) {
  const config = getGuildJ2C(guildId);
  config.tempChannels[channelId] = {
    ownerId,
    createdAt: Date.now(),
  };
  saveData();
}

function removeTempChannel(guildId, channelId) {
  const config = getGuildJ2C(guildId);
  if (config.tempChannels[channelId]) {
    delete config.tempChannels[channelId];
    saveData();
  }
}

function isTempChannel(guildId, channelId) {
  const config = getGuildJ2C(guildId);
  return Boolean(config.tempChannels && config.tempChannels[channelId]);
}

function isHubChannel(guildId, channelId) {
  const config = getGuildJ2C(guildId);
  return config.hubChannelId === channelId;
}

function getTempChannelOwner(guildId, channelId) {
  const config = getGuildJ2C(guildId);
  return config.tempChannels?.[channelId]?.ownerId || null;
}

function setTempChannelOwner(guildId, channelId, newOwnerId) {
  const config = getGuildJ2C(guildId);
  if (config.tempChannels?.[channelId]) {
    config.tempChannels[channelId].ownerId = newOwnerId;
    saveData();
    return true;
  }
  return false;
}

function getTempChannelData(guildId, channelId) {
  const config = getGuildJ2C(guildId);
  return config.tempChannels?.[channelId] || null;
}

function updateTempChannelData(guildId, channelId, updates = {}) {
  const config = getGuildJ2C(guildId);
  if (config.tempChannels?.[channelId]) {
    Object.assign(config.tempChannels[channelId], updates);
    saveData();
    return config.tempChannels[channelId];
  }
  return null;
}

module.exports = {
  getGuildJ2C,
  setJ2CHub,
  updateJ2CSettings,
  resetJ2C,
  addTempChannel,
  removeTempChannel,
  isTempChannel,
  isHubChannel,
  getTempChannelOwner,
  setTempChannelOwner,
  getTempChannelData,
  updateTempChannelData,
};
