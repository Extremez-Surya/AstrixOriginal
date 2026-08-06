const fs = require("fs");
const path = require("path");
const afkFilePath = path.join(__dirname, "afk.json");

// Load AFK map from JSON file or create if not exists
function loadAFKData() {
  try {
    if (!fs.existsSync(afkFilePath)) {
      fs.writeFileSync(afkFilePath, JSON.stringify({}));
      return {};
    }
    const data = fs.readFileSync(afkFilePath, "utf8");
    return JSON.parse(data || "{}");
  } catch (e) {
    console.error("Error loading AFK data:", e);
    return {};
  }
}

function saveAFKData(data) {
  try {
    fs.writeFileSync(afkFilePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saving AFK data:", e);
  }
}

module.exports = {
  setAFK(userId, username, reason, isGlobal, guildId) {
    const data = loadAFKData();
    data[userId] = {
      username,
      reason: reason || "None specified",
      isGlobal,
      guildId: isGlobal ? null : guildId,
      timestamp: Date.now(),
    };
    saveAFKData(data);
  },

  checkAFK(userId, guildId) {
    const data = loadAFKData();
    const userAfk = data[userId];
    if (!userAfk) return null;

    if (userAfk.isGlobal || userAfk.guildId === guildId) {
      return userAfk;
    }
    return null;
  },

  removeAFK(userId) {
    const data = loadAFKData();
    if (data[userId]) {
      const info = data[userId];
      delete data[userId];
      saveAFKData(data);
      return info;
    }
    return null;
  },
};
