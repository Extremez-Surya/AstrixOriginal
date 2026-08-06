const fs = require("fs");
const path = require("path");
const warnsPath = path.join(__dirname, "../lib/warns.json");

function loadWarns() {
  try {
    if (!fs.existsSync(warnsPath)) {
      fs.writeFileSync(warnsPath, "{}", "utf8");
    }
    return JSON.parse(fs.readFileSync(warnsPath, "utf8"));
  } catch (e) {
    return {};
  }
}

function saveWarns(data) {
  try {
    fs.writeFileSync(warnsPath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save warns:", e);
  }
}

function addWarn(guildId, userId, moderatorId, reason) {
  const data = loadWarns();
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = [];
  
  const warnObj = {
    moderatorId,
    reason,
    timestamp: Date.now(),
  };
  data[guildId][userId].push(warnObj);
  saveWarns(data);
  return data[guildId][userId];
}

function getWarns(guildId, userId) {
  const data = loadWarns();
  return data[guildId]?.[userId] || [];
}

function clearWarns(guildId, userId) {
  const data = loadWarns();
  if (data[guildId] && data[guildId][userId]) {
    delete data[guildId][userId];
    saveWarns(data);
    return true;
  }
  return false;
}

function removeWarnAtIndex(guildId, userId, index) {
  const data = loadWarns();
  if (data[guildId] && data[guildId][userId]) {
    const warns = data[guildId][userId];
    if (index >= 0 && index < warns.length) {
      const removed = warns.splice(index, 1);
      if (warns.length === 0) {
        delete data[guildId][userId];
      }
      saveWarns(data);
      return removed[0];
    }
  }
  return null;
}

module.exports = {
  addWarn,
  getWarns,
  clearWarns,
  removeWarnAtIndex,
};
