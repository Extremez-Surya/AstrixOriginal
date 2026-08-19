const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "birthdayConfig.json");
const configCache = new Map();
let isInitialized = false;

const TIMEZONES = [
  { label: "India (IST)", value: "Asia/Kolkata" },
  { label: "UTC / GMT", value: "UTC" },
  { label: "US Eastern (EST/EDT)", value: "America/New_York" },
  { label: "US Pacific (PST/PDT)", value: "America/Los_Angeles" },
  { label: "UK (GMT/BST)", value: "Europe/London" },
  { label: "Central Europe (CET)", value: "Europe/Berlin" },
  { label: "Japan (JST)", value: "Asia/Tokyo" },
  { label: "Australia Eastern (AEST)", value: "Australia/Sydney" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
];

const DEFAULT_WISH = {
  content: "Happy Birthday {user}! 🎉❤️",
  title: "🎂 Happy Birthday!",
  description: "Wishing you an amazing day filled with joy, laughter, and success!",
  accentColor: "#FF69B4",
  thumbnail: "avatar",
  image: "",
  footer: "Have a fantastic year ahead! ✨",
};

function getDefaultConfig() {
  return {
    enabled: false,
    commandChannel: null,
    wishChannel: null,
    birthdayRole: null,
    timezone: "Asia/Kolkata",
    wishMessage: DEFAULT_WISH,
    birthdays: {},
    stats: {
      totalWishesSent: 0,
      lastCheckTimestamp: null,
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
    console.error("[BirthdayManager] Cache init error:", e);
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
      console.error("[BirthdayManager] Save disk error:", e);
    }
  });
}

function getGuildBirthday(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultConfig();

  const raw = configCache.get(guildId);
  if (!raw) return getDefaultConfig();

  const defaultConfig = getDefaultConfig();
  return {
    ...defaultConfig,
    ...raw,
    wishMessage: { ...defaultConfig.wishMessage, ...(raw.wishMessage || {}) },
    birthdays: raw.birthdays || {},
    stats: { ...defaultConfig.stats, ...(raw.stats || {}) },
  };
}

function setGuildBirthday(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function enableMaster(guildId) {
  const config = getGuildBirthday(guildId);
  config.enabled = true;
  setGuildBirthday(guildId, config);
  return config;
}

function disableMaster(guildId) {
  const config = getGuildBirthday(guildId);
  config.enabled = false;
  setGuildBirthday(guildId, config);
  return config;
}

function toggleMaster(guildId) {
  const config = getGuildBirthday(guildId);
  if (config.enabled) return disableMaster(guildId);
  else return enableMaster(guildId);
}

function setBirthday(guildId, userId, day, month) {
  const config = getGuildBirthday(guildId);
  if (!config.birthdays) config.birthdays = {};
  config.birthdays[userId] = { day: parseInt(day, 10), month: parseInt(month, 10) };

  // Auto-enable system if user sets birthday
  if (!config.enabled && config.wishChannel) {
    config.enabled = true;
  }

  setGuildBirthday(guildId, config);
  return true;
}

function getBirthday(guildId, userId) {
  const config = getGuildBirthday(guildId);
  return config.birthdays?.[userId] || null;
}

function removeBirthday(guildId, userId) {
  const config = getGuildBirthday(guildId);
  if (config.birthdays && config.birthdays[userId]) {
    delete config.birthdays[userId];
    setGuildBirthday(guildId, config);
    return true;
  }
  return false;
}

function getUpcomingBirthdays(guildId, limit = 10) {
  const config = getGuildBirthday(guildId);
  const birthdays = config.birthdays || {};
  const now = new Date();

  const upcoming = [];
  for (const [userId, bday] of Object.entries(birthdays)) {
    const thisYear = now.getFullYear();
    const bdayDate = new Date(thisYear, bday.month - 1, bday.day);

    if (bdayDate < now) {
      bdayDate.setFullYear(thisYear + 1);
    }

    const daysUntil = Math.ceil((bdayDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 30) {
      upcoming.push({ userId, day: bday.day, month: bday.month, daysUntil });
    }
  }

  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  return upcoming.slice(0, limit);
}

function resetBirthdayConfig(guildId) {
  if (!guildId) return false;
  if (!isInitialized) initCache();

  configCache.delete(guildId);
  saveDiskAsync();
  return true;
}

initCache();

module.exports = {
  TIMEZONES,
  DEFAULT_WISH,
  getDefaultConfig,
  getGuildBirthday,
  setGuildBirthday,
  enableMaster,
  disableMaster,
  toggleMaster,
  setBirthday,
  getBirthday,
  removeBirthday,
  getUpcomingBirthdays,
  resetBirthdayConfig,
};
