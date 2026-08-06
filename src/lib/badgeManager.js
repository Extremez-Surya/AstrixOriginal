const fs = require("fs");
const path = require("path");

const BADGES_FILE = path.join(__dirname, "userBadges.json");

const CUSTOM_BADGES = {
  owner: {
    name: "Bot Founder / Owner",
    emoji: "<a:owner3:1530088048996384812>",
  },
  developer: {
    name: "Lead Developer",
    emoji: "<a:developers:1530088612228497418>",
  },
  designer: {
    name: "Bot Designer & Artist",
    emoji: "<a:Artist:1530089006484815962>",
  },
  partner: { name: "Astrix Partner", emoji: "<:servers:1528311514065535007>" },
  vip: { name: "VIP Member", emoji: "<a:vip:1530089304552902790>" },
  supporter: {
    name: "Early Supporter",
    emoji: "<a:EarlySupporter:1530089449105526834>",
  },
  bug_hunter: {
    name: "Astrix Bug Hunter",
    emoji: "<a:bug_hunter:1530089623764598855>",
  },
  staff: { name: "Astrix Staff Team", emoji: "<a:staff:1530089783467184218>" },
  booster: {
    name: "Server Booster",
    emoji: "<a:red_boost:1528682966199566356>",
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
