const fs = require("fs");
const path = require("path");

const BADGES_FILE = path.join(__dirname, "userBadges.json");

const CUSTOM_BADGES = {
  owner: {
    name: "Bot Founder / Owner",
    emoji: "<:owner3:1539875556173029380>",
  },
  developer: {
    name: "Lead Developer",
    emoji: "<:developers:1539875562124738602>",
  },
  designer: {
    name: "Bot Designer & Artist",
    emoji: "<:Artist:1539875568122597406>",
  },
  partner: { name: "Astrix Partner", emoji: "<:servers:1539875396546207795>" },
  vip: { name: "VIP Member", emoji: "<:vip:1539875573252231209>" },
  supporter: {
    name: "Early Supporter",
    emoji: "<:EarlySupporter:1539875579292024833>",
  },
  bug_hunter: {
    name: "Astrix Bug Hunter",
    emoji: "<:bug_hunter:1539875585097080922>",
  },
  staff: { name: "Astrix Staff Team", emoji: "<:staff:1539875590298009672>" },
  booster: {
    name: "Server Booster",
    emoji: "<:red_boost:1539875476255023157>",
  },
};

function loadData() {
  try {
    if (fs.existsSync(BADGES_FILE)) {
      const data = fs.readFileSync(BADGES_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {}
  return {};
}

function saveData(data) {
  try {
    fs.writeFileSync(BADGES_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save userBadges.json:", e);
  }
}

function getUserBadges(userId) {
  const data = loadData();
  const badges = data[userId] || [];
  return badges.map((badgeId) => ({
    id: badgeId,
    ...(CUSTOM_BADGES[badgeId] || { name: badgeId, emoji: "🏷️" }),
  }));
}

function addBadge(userId, badgeId) {
  const data = loadData();
  if (!data[userId]) data[userId] = [];
  if (!data[userId].includes(badgeId)) {
    data[userId].push(badgeId);
    saveData(data);
    return true;
  }
  return false;
}

function removeBadge(userId, badgeId) {
  const data = loadData();
  if (data[userId]) {
    const index = data[userId].indexOf(badgeId);
    if (index !== -1) {
      data[userId].splice(index, 1);
      if (data[userId].length === 0) delete data[userId];
      saveData(data);
      return true;
    }
  }
  return false;
}

function getAvailableBadges() {
  return CUSTOM_BADGES;
}

module.exports = {
  getUserBadges,
  addBadge,
  removeBadge,
  getAvailableBadges,
  CUSTOM_BADGES,
};
