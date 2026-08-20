const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CASES_FILE = path.join(DATA_DIR, "moderationCases.json");
const NOTES_FILE = path.join(DATA_DIR, "moderationNotes.json");
const FROZEN_NICK_FILE = path.join(DATA_DIR, "frozenNicknames.json");
const DETAIN_FILE = path.join(DATA_DIR, "detainData.json");
const TEMPBANS_FILE = path.join(DATA_DIR, "tempbans.json");
const TEMPROLES_FILE = path.join(DATA_DIR, "temproles.json");

// In-Memory Caches for 0.1s ultra-fast reaction latency
let casesCache = new Map(); // guildId -> array of cases
let notesCache = new Map(); // `${guildId}_${userId}` -> array of notes
let frozenNickCache = new Map(); // `${guildId}_${userId}` -> nickname string
let detainCache = new Map(); // `${guildId}_${userId}` -> { roles: [], reason, moderatorId, timestamp }
let tempbansCache = new Map(); // `${guildId}_${userId}` -> { expiresAt, reason, moderatorId }
let temprolesCache = new Map(); // `${guildId}_${userId}_${roleId}` -> { expiresAt, roleId }

function safeLoad(filePath, defaultVal = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error(`[ModerationManager] Error loading ${filePath}:`, e);
  }
  return defaultVal;
}

function safeSave(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error(`[ModerationManager] Error saving ${filePath}:`, e);
  }
}

// Initialize memory from disk
function initCache() {
  const rawCases = safeLoad(CASES_FILE, {});
  for (const [gid, list] of Object.entries(rawCases)) {
    casesCache.set(gid, list);
  }

  const rawNotes = safeLoad(NOTES_FILE, {});
  for (const [key, list] of Object.entries(rawNotes)) {
    notesCache.set(key, list);
  }

  const rawNicks = safeLoad(FROZEN_NICK_FILE, {});
  for (const [key, nick] of Object.entries(rawNicks)) {
    frozenNickCache.set(key, nick);
  }

  const rawDetain = safeLoad(DETAIN_FILE, {});
  for (const [key, data] of Object.entries(rawDetain)) {
    detainCache.set(key, data);
  }

  const rawTempbans = safeLoad(TEMPBANS_FILE, {});
  for (const [key, data] of Object.entries(rawTempbans)) {
    tempbansCache.set(key, data);
  }

  const rawTemproles = safeLoad(TEMPROLES_FILE, {});
  for (const [key, data] of Object.entries(rawTemproles)) {
    temprolesCache.set(key, data);
  }
}

initCache();

function persistCases() {
  const obj = {};
  for (const [gid, list] of casesCache) {
    obj[gid] = list;
  }
  safeSave(CASES_FILE, obj);
}

function persistNotes() {
  const obj = {};
  for (const [k, list] of notesCache) {
    obj[k] = list;
  }
  safeSave(NOTES_FILE, obj);
}

function persistFrozenNicks() {
  const obj = {};
  for (const [k, nick] of frozenNickCache) {
    obj[k] = nick;
  }
  safeSave(FROZEN_NICK_FILE, obj);
}

function persistDetain() {
  const obj = {};
  for (const [k, data] of detainCache) {
    obj[k] = data;
  }
  safeSave(DETAIN_FILE, obj);
}

function persistTempbans() {
  const obj = {};
  for (const [k, data] of tempbansCache) {
    obj[k] = data;
  }
  safeSave(TEMPBANS_FILE, obj);
}

function persistTemproles() {
  const obj = {};
  for (const [k, data] of temprolesCache) {
    obj[k] = data;
  }
  safeSave(TEMPROLES_FILE, obj);
}

// Parse human duration (e.g. 10m, 2h, 1d, 7d, 30s) to milliseconds
function parseDuration(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)([smhdwy])$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s": return val * 1000;
    case "m": return val * 60 * 1000;
    case "h": return val * 60 * 60 * 1000;
    case "d": return val * 24 * 60 * 60 * 1000;
    case "w": return val * 7 * 24 * 60 * 60 * 1000;
    case "y": return val * 365 * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return "Permanent";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ") || "0s";
}

// Role Hierarchy & Immune Verification (Anti-Bypass Guard)
function canModerate(executor, target, botMember) {
  if (!executor || !target) return { allowed: false, reason: "Invalid target." };
  if (target.id === executor.guild.ownerId) {
    return { allowed: false, reason: "You cannot moderate the server owner." };
  }
  if (target.id === executor.id) {
    return { allowed: false, reason: "You cannot moderate yourself." };
  }
  if (target.id === executor.client.user.id) {
    return { allowed: false, reason: "You cannot moderate the bot." };
  }

  // Hierarchy check for executor (unless executor is guild owner)
  if (executor.id !== executor.guild.ownerId) {
    if (executor.roles.highest.position <= target.roles.highest.position) {
      return {
        allowed: false,
        reason: "Target user has equal or higher role hierarchy than you.",
      };
    }
  }

  // Hierarchy check for bot
  if (botMember && botMember.roles.highest.position <= target.roles.highest.position) {
    return {
      allowed: false,
      reason: "Target user has equal or higher role hierarchy than the bot.",
    };
  }

  return { allowed: true };
}

// 1. Cases / Crimefile System
function addCase(guildId, data) {
  if (!casesCache.has(guildId)) {
    casesCache.set(guildId, []);
  }

  const list = casesCache.get(guildId);
  const nextId = list.length + 1;

  const newCase = {
    caseId: nextId,
    action: data.action || "WARN",
    targetId: data.targetId,
    targetTag: data.targetTag || "Unknown",
    moderatorId: data.moderatorId,
    moderatorTag: data.moderatorTag || "System",
    reason: data.reason || "No reason provided.",
    duration: data.duration || null,
    details: data.details || null,
    timestamp: Date.now(),
  };

  list.push(newCase);
  persistCases();
  return newCase;
}

function getCase(guildId, caseId) {
  const list = casesCache.get(guildId) || [];
  return list.find((c) => c.caseId === parseInt(caseId, 10)) || null;
}

function updateCaseReason(guildId, caseId, newReason, moderatorTag) {
  const list = casesCache.get(guildId) || [];
  const item = list.find((c) => c.caseId === parseInt(caseId, 10));
  if (!item) return null;

  item.reason = newReason;
  item.updatedBy = moderatorTag;
  item.updatedAt = Date.now();
  persistCases();
  return item;
}

function deleteCase(guildId, caseId) {
  const list = casesCache.get(guildId) || [];
  const idx = list.findIndex((c) => c.caseId === parseInt(caseId, 10));
  if (idx === -1) return false;

  list.splice(idx, 1);
  persistCases();
  return true;
}

function getUserCases(guildId, userId) {
  const list = casesCache.get(guildId) || [];
  return list.filter((c) => c.targetId === userId);
}

function getGuildCases(guildId, actionFilter = null) {
  const list = casesCache.get(guildId) || [];
  if (!actionFilter || actionFilter === "all") return list;
  return list.filter((c) => c.action.toLowerCase() === actionFilter.toLowerCase());
}

// 2. Moderator Notes System
function addNote(guildId, userId, noteText, moderatorTag) {
  const key = `${guildId}_${userId}`;
  if (!notesCache.has(key)) {
    notesCache.set(key, []);
  }

  const list = notesCache.get(key);
  const newNote = {
    id: list.length + 1,
    content: noteText,
    moderator: moderatorTag,
    timestamp: Date.now(),
  };

  list.push(newNote);
  persistNotes();
  return newNote;
}

function getNotes(guildId, userId) {
  const key = `${guildId}_${userId}`;
  return notesCache.get(key) || [];
}

function removeNote(guildId, userId, noteId) {
  const key = `${guildId}_${userId}`;
  const list = notesCache.get(key) || [];
  const idx = list.findIndex((n) => n.id === parseInt(noteId, 10));
  if (idx === -1) return false;

  list.splice(idx, 1);
  persistNotes();
  return true;
}

function clearNotes(guildId, userId) {
  const key = `${guildId}_${userId}`;
  notesCache.delete(key);
  persistNotes();
  return true;
}

// 3. Frozen Nicknames
function freezeNickname(guildId, userId, nickname) {
  const key = `${guildId}_${userId}`;
  frozenNickCache.set(key, nickname);
  persistFrozenNicks();
}

function unfreezeNickname(guildId, userId) {
  const key = `${guildId}_${userId}`;
  const deleted = frozenNickCache.delete(key);
  persistFrozenNicks();
  return deleted;
}

function getFrozenNickname(guildId, userId) {
  const key = `${guildId}_${userId}`;
  return frozenNickCache.get(key) || null;
}

// 4. Detain / Quarantine System
function detainMember(guildId, userId, roleIds, reason, moderatorId) {
  const key = `${guildId}_${userId}`;
  detainCache.set(key, {
    roles: roleIds,
    reason: reason || "Quarantined by moderator",
    moderatorId,
    timestamp: Date.now(),
  });
  persistDetain();
}

function releaseMember(guildId, userId) {
  const key = `${guildId}_${userId}`;
  const data = detainCache.get(key);
  if (!data) return null;
  detainCache.delete(key);
  persistDetain();
  return data;
}

function getDetainedMember(guildId, userId) {
  const key = `${guildId}_${userId}`;
  return detainCache.get(key) || null;
}

function getAllDetained(guildId) {
  const list = [];
  for (const [key, data] of detainCache) {
    if (key.startsWith(`${guildId}_`)) {
      const userId = key.split("_")[1];
      list.push({ userId, ...data });
    }
  }
  return list;
}

// 5. Tempbans & Temproles with Background Expiry Engine
function addTempban(client, guildId, userId, expiresAt, reason, moderatorId) {
  const key = `${guildId}_${userId}`;
  tempbansCache.set(key, { expiresAt, reason, moderatorId });
  persistTempbans();

  const delay = Math.max(0, expiresAt - Date.now());
  setTimeout(async () => {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        await guild.bans.remove(userId, "Tempban expired automatically.").catch(() => null);
      }
      tempbansCache.delete(key);
      persistTempbans();
    } catch (e) {}
  }, delay);
}

function addTemprole(client, guildId, userId, roleId, expiresAt) {
  const key = `${guildId}_${userId}_${roleId}`;
  temprolesCache.set(key, { guildId, userId, roleId, expiresAt });
  persistTemproles();

  const delay = Math.max(0, expiresAt - Date.now());
  setTimeout(async () => {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
          await member.roles.remove(roleId, "Temprole expired automatically.").catch(() => null);
        }
      }
      temprolesCache.delete(key);
      persistTemproles();
    } catch (e) {}
  }, delay);
}

function initTimers(client) {
  const now = Date.now();

  // Restore Tempbans
  for (const [key, data] of tempbansCache) {
    const [guildId, userId] = key.split("_");
    const delay = Math.max(0, data.expiresAt - now);

    setTimeout(async () => {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          await guild.bans.remove(userId, "Tempban expired automatically.").catch(() => null);
        }
        tempbansCache.delete(key);
        persistTempbans();
      } catch (e) {}
    }, delay);
  }

  // Restore Temproles
  for (const [key, data] of temprolesCache) {
    const { guildId, userId, roleId, expiresAt } = data;
    const delay = Math.max(0, expiresAt - now);

    setTimeout(async () => {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member) {
            await member.roles.remove(roleId, "Temprole expired automatically.").catch(() => null);
          }
        }
        temprolesCache.delete(key);
        persistTemproles();
      } catch (e) {}
    }, delay);
  }
}

module.exports = {
  parseDuration,
  formatDuration,
  canModerate,
  addCase,
  getCase,
  updateCaseReason,
  deleteCase,
  getUserCases,
  getGuildCases,
  addNote,
  getNotes,
  removeNote,
  clearNotes,
  freezeNickname,
  unfreezeNickname,
  getFrozenNickname,
  detainMember,
  releaseMember,
  getDetainedMember,
  getAllDetained,
  addTempban,
  addTemprole,
  initTimers,
};
