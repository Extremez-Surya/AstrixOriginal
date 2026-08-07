const fs = require("fs");
const path = require("path");

const TICKET_FILE = path.join(__dirname, "ticketConfig.json");

const defaultGuildConfig = {
  panels: [],
  tickets: {}, // channelId -> { ticketId, channelId, userId, categoryId, supportRole, closed, claimedBy, reason, createdAt, closedAt }
  ticketCount: 0,
  blacklist: [], // array of userIds or roleIds
  logsChannelId: null,
  supportRoleId: null,
  parentCategoryId: null,
};

let data = {};

function loadData() {
  try {
    if (fs.existsSync(TICKET_FILE)) {
      const raw = fs.readFileSync(TICKET_FILE, "utf8");
      data = JSON.parse(raw);
    } else {
      data = {};
      saveData();
    }
  } catch (err) {
    console.error("[ticketManager] Error loading config:", err);
    data = {};
  }
}

function saveData() {
  try {
    fs.writeFileSync(TICKET_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[ticketManager] Error saving config:", err);
  }
}

loadData();

function getGuildTicketConfig(guildId) {
  if (!data[guildId]) {
    data[guildId] = { ...defaultGuildConfig, tickets: {}, panels: [], blacklist: [] };
    saveData();
  }
  return data[guildId];
}

function updateGuildTicketConfig(guildId, updates = {}) {
  const config = getGuildTicketConfig(guildId);
  Object.assign(config, updates);
  saveData();
  return config;
}

function getNextTicketId(guildId) {
  const config = getGuildTicketConfig(guildId);
  config.ticketCount = (config.ticketCount || 0) + 1;
  saveData();
  return config.ticketCount;
}

function createTicketRecord(guildId, ticketData) {
  const config = getGuildTicketConfig(guildId);
  config.tickets[ticketData.channelId] = {
    ...ticketData,
    closed: false,
    claimedBy: null,
    createdAt: Date.now(),
  };
  saveData();
  return config.tickets[ticketData.channelId];
}

function getTicketRecord(guildId, channelId) {
  const config = getGuildTicketConfig(guildId);
  return config.tickets?.[channelId] || null;
}

function closeTicketRecord(guildId, channelId, closedByUserId) {
  const config = getGuildTicketConfig(guildId);
  if (config.tickets?.[channelId]) {
    config.tickets[channelId].closed = true;
    config.tickets[channelId].closedBy = closedByUserId;
    config.tickets[channelId].closedAt = Date.now();
    saveData();
    return config.tickets[channelId];
  }
  return null;
}

function claimTicketRecord(guildId, channelId, staffUserId) {
  const config = getGuildTicketConfig(guildId);
  if (config.tickets?.[channelId]) {
    config.tickets[channelId].claimedBy = staffUserId;
    saveData();
    return config.tickets[channelId];
  }
  return null;
}

function unclaimTicketRecord(guildId, channelId) {
  const config = getGuildTicketConfig(guildId);
  if (config.tickets?.[channelId]) {
    config.tickets[channelId].claimedBy = null;
    saveData();
    return config.tickets[channelId];
  }
  return null;
}

function isBlacklisted(guildId, userId, userRoles = []) {
  const config = getGuildTicketConfig(guildId);
  const blacklist = config.blacklist || [];
  if (blacklist.includes(userId)) return true;
  if (userRoles.some((roleId) => blacklist.includes(roleId))) return true;
  return false;
}

function addToBlacklist(guildId, id) {
  const config = getGuildTicketConfig(guildId);
  if (!config.blacklist) config.blacklist = [];
  if (!config.blacklist.includes(id)) {
    config.blacklist.push(id);
    saveData();
  }
  return config.blacklist;
}

function removeFromBlacklist(guildId, id) {
  const config = getGuildTicketConfig(guildId);
  if (config.blacklist) {
    config.blacklist = config.blacklist.filter((item) => item !== id);
    saveData();
  }
  return config.blacklist;
}

module.exports = {
  getGuildTicketConfig,
  updateGuildTicketConfig,
  getNextTicketId,
  createTicketRecord,
  getTicketRecord,
  closeTicketRecord,
  claimTicketRecord,
  unclaimTicketRecord,
  isBlacklisted,
  addToBlacklist,
  removeFromBlacklist,
};
