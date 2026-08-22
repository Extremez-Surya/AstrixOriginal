const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  MediaGalleryBuilder,
  ChannelType,
} = require("discord.js");
const EMOJIS = require("./emojis");

const CONFIG_FILE = path.join(__dirname, "levelingConfig.json");
const DATA_FILE = path.join(__dirname, "levelingData.json");

const configCache = new Map();
const dataCache = new Map();
const voiceSessions = new Map();
const spamTracker = new Map();

let isInitialized = false;

const DEFAULT_LEVELING = {
  enabled: false,
  ignores: {
    channels: [],
    roles: [],
    users: [],
  },
  announce: {
    mode: "context", // "context", "channel", "dm", "none"
    channelId: null,
    template: "{user.mention} just reached level **{level}**! 🎉",
    includeMention: true,
  },
  xp: {
    text: {
      enabled: true,
      minXp: 15,
      maxXp: 25,
    },
    voice: {
      enabled: true,
      minXp: 10,
      maxXp: 20,
    },
    multiplier: 1,
    cooldownMs: 60000,
    countCommands: false,
    minMsgLength: 3,
  },
  antiCheat: {
    enabled: true,
    maxBurst: 5, // max messages in 10s window before anti-cheat triggers
    action: "warn", // "warn", "timeout", "ignore"
  },
  rewards: {
    stackRoles: true,
    roles: [], // [{ level: 5, roleId: "123..." }]
  },
  leaderboardTitle: "Server Leveling Leaderboard",
};

const getDefaultMemberData = (userId) => ({
  userId,
  xp: 0,
  level: 0,
  totalXp: 0,
  lastMessageAt: 0,
  lastVoiceAt: 0,
  rewardsGranted: [],
  muteAnnouncements: false,
  optOut: false,
  warnings: 0,
});

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
      for (const [guildId, cfg] of Object.entries(parsed)) {
        configCache.set(guildId, cfg);
      }
    }
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      for (const [guildId, members] of Object.entries(parsed)) {
        dataCache.set(guildId, members);
      }
    }
  } catch (e) {
    console.error("[LevelingManager] Cache init error:", e);
  }
  isInitialized = true;
}

let savePending = false;
function saveDiskAsync() {
  if (savePending) return;
  savePending = true;
  setImmediate(() => {
    try {
      const configObj = {};
      for (const [guildId, cfg] of configCache.entries()) {
        configObj[guildId] = cfg;
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(configObj, null, 2), "utf8");

      const dataObj = {};
      for (const [guildId, members] of dataCache.entries()) {
        dataObj[guildId] = members;
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataObj, null, 2), "utf8");
    } catch (e) {
      console.error("[LevelingManager] Save disk error:", e);
    } finally {
      savePending = false;
    }
  });
}

function getGuildLeveling(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return { ...DEFAULT_LEVELING };

  const raw = configCache.get(guildId);
  if (!raw) return { ...DEFAULT_LEVELING };

  return {
    ...DEFAULT_LEVELING,
    ...raw,
    ignores: { ...DEFAULT_LEVELING.ignores, ...(raw.ignores || {}) },
    announce: { ...DEFAULT_LEVELING.announce, ...(raw.announce || {}) },
    xp: { ...DEFAULT_LEVELING.xp, ...(raw.xp || {}) },
    antiCheat: { ...DEFAULT_LEVELING.antiCheat, ...(raw.antiCheat || {}) },
    rewards: { ...DEFAULT_LEVELING.rewards, ...(raw.rewards || {}) },
  };
}

function setGuildLeveling(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function getGuildMembersData(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return {};
  return dataCache.get(guildId) || {};
}

function getMemberData(guildId, userId) {
  if (!isInitialized) initCache();
  const members = getGuildMembersData(guildId);
  if (!members[userId]) {
    members[userId] = getDefaultMemberData(userId);
  }
  return members[userId];
}

function setMemberData(guildId, userId, data) {
  if (!isInitialized) initCache();
  const members = getGuildMembersData(guildId);
  members[userId] = data;
  dataCache.set(guildId, members);
  saveDiskAsync();
  return true;
}

function xpToNextLevel(level) {
  return Math.floor(5 * level * level + 50 * level + 100);
}

function getLeaderboard(guildId, limit = 50) {
  const members = getGuildMembersData(guildId);
  const list = Object.values(members)
    .filter((m) => !m.optOut)
    .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0) || (b.level || 0) - (a.level || 0));
  return list.slice(0, limit);
}

function getRankPosition(guildId, userId) {
  const members = getGuildMembersData(guildId);
  const list = Object.values(members)
    .filter((m) => !m.optOut)
    .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0) || (b.level || 0) - (a.level || 0));

  const idx = list.findIndex((m) => m.userId === userId);
  return { position: idx === -1 ? list.length + 1 : idx + 1, total: list.length };
}

async function applyRewards(client, guildId, memberState, member) {
  try {
    const config = getGuildLeveling(guildId);
    if (!config.rewards?.roles?.length) return;

    const rewards = [...config.rewards.roles].sort((a, b) => (a.level || 0) - (b.level || 0));
    const eligible = rewards.filter((r) => memberState.level >= (r.level || 0));
    if (!eligible.length) return;

    let guildMember = member;
    if (!guildMember) {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;
      guildMember = await guild.members.fetch(memberState.userId).catch(() => null);
    }
    if (!guildMember) return;

    const rewardRoleIds = eligible.map((r) => r.roleId).filter(Boolean);
    const toAdd = config.rewards.stackRoles
      ? rewardRoleIds
      : [rewardRoleIds[rewardRoleIds.length - 1]];

    const allRewardRoleIds = rewards.map((r) => r.roleId).filter(Boolean);

    await guildMember.roles.add(toAdd).catch(() => {});

    if (!config.rewards.stackRoles) {
      const toRemove = allRewardRoleIds.filter((rid) => !toAdd.includes(rid));
      if (toRemove.length) await guildMember.roles.remove(toRemove).catch(() => {});
    }

    memberState.rewardsGranted = Array.from(new Set([...(memberState.rewardsGranted || []), ...toAdd]));
  } catch (e) {
    console.error("[LevelingManager] applyRewards failed:", e);
  }
}

function addXp(config, memberState, amount) {
  let gained = Math.max(0, Math.floor(amount));
  if (gained === 0) return { leveledUp: false, levelsGained: 0, gained: 0 };

  gained = Math.floor(gained * (config.xp.multiplier || 1));
  memberState.xp += gained;
  memberState.totalXp += gained;

  let leveledUp = false;
  let levelsGained = 0;

  while (true) {
    const needed = xpToNextLevel(memberState.level);
    if (memberState.xp < needed) break;
    memberState.xp -= needed;
    memberState.level += 1;
    levelsGained += 1;
    leveledUp = true;
  }

  return { leveledUp, levelsGained, gained };
}

function checkAntiCheat(guildId, userId, config) {
  if (!config.antiCheat?.enabled) return { flagged: false };

  const key = `${guildId}:${userId}`;
  const now = Date.now();
  const userTimestamps = spamTracker.get(key) || [];

  // Filter timestamps within 10-second window
  const recent = userTimestamps.filter((t) => now - t < 10000);
  recent.push(now);
  spamTracker.set(key, recent);

  if (recent.length > (config.antiCheat.maxBurst || 5)) {
    return { flagged: true, count: recent.length };
  }

  return { flagged: false };
}

function renderTemplate(template, ctx) {
  if (!template || typeof template !== "string") {
    return `${ctx.userMention} just reached level **${ctx.level}**! 🎉`;
  }
  let output = template;
  const replacements = {
    "{user}": ctx.userMention,
    "{user.name}": ctx.userName,
    "{user.tag}": ctx.userTag,
    "{user.id}": ctx.userId,
    "{user.mention}": ctx.userMention,
    "{level}": String(ctx.level),
    "{xp}": String(ctx.xp),
    "{totalXp}": String(ctx.totalXp),
    "{nextLevelXp}": String(ctx.nextLevelXp),
  };

  for (const [token, value] of Object.entries(replacements)) {
    output = output.split(token).join(value);
  }

  return output.replace(/\\n/g, "\n");
}

function buildLevelUpContainer(text, level) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### 📈 **LEVEL UP!** ── Level ${level}\n` +
      `-# *Server activity progress update*\n\n` +
      `> ${text}`
    )
  );
  return container;
}

async function handleMessageXp(client, message) {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const config = getGuildLeveling(guildId);

  if (!config.enabled) return;

  // Ignore lists check
  if (config.ignores.users?.includes(userId)) return;
  if (config.ignores.channels?.includes(message.channelId)) return;
  if (config.ignores.roles?.length && message.member?.roles?.cache) {
    const hasIgnoredRole = message.member.roles.cache.some((r) => config.ignores.roles.includes(r.id));
    if (hasIgnoredRole) return;
  }

  // Minimum message length check
  const content = message.content?.trim() || "";
  if (content.length < (config.xp.minMsgLength || 3)) return;

  // Command message check
  if (!config.xp.countCommands && (content.startsWith(".") || content.startsWith("!"))) {
    return;
  }

  const memberState = getMemberData(guildId, userId);
  if (memberState.optOut) return;

  // Anti-Cheat Spam Burst Check
  const antiCheatResult = checkAntiCheat(guildId, userId, config);
  if (antiCheatResult.flagged) {
    memberState.warnings = (memberState.warnings || 0) + 1;
    setMemberData(guildId, userId, memberState);

    if (config.antiCheat.action === "timeout" && message.member?.moderatable) {
      await message.member.timeout(60000, "Leveling Anti-Cheat: Excessive message spamming detected").catch(() => null);
    }
    return; // Deny XP
  }

  const now = Date.now();
  if (now - (memberState.lastMessageAt || 0) < (config.xp.cooldownMs || 60000)) {
    return; // Throttle cooldown
  }

  // Calculate Text XP
  const textXp = config.xp.text || { enabled: true, minXp: 15, maxXp: 25 };
  if (!textXp.enabled) return;

  const rawXp = Math.floor(Math.random() * (textXp.maxXp - textXp.minXp + 1)) + textXp.minXp;
  const result = addXp(config, memberState, rawXp);
  memberState.lastMessageAt = now;

  setMemberData(guildId, userId, memberState);

  if (!result.leveledUp) return;

  // Apply role rewards
  await applyRewards(client, guildId, memberState, message.member);

  if (memberState.muteAnnouncements || config.announce?.mode === "none") return;

  const nextNeeded = xpToNextLevel(memberState.level);
  const ctx = {
    userMention: `<@${userId}>`,
    userName: message.author.username,
    userTag: message.author.tag,
    userId,
    level: memberState.level,
    xp: memberState.xp,
    totalXp: memberState.totalXp,
    nextLevelXp: nextNeeded,
  };

  const text = renderTemplate(config.announce?.template, ctx);
  const container = buildLevelUpContainer(text, memberState.level);
  const payload = {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: ["users"], repliedUser: false },
  };

  try {
    if (config.announce.mode === "dm") {
      await message.author.send(payload).catch(() => {});
      return;
    }
    if (config.announce.mode === "channel" && config.announce.channelId) {
      const ch = await client.channels.fetch(config.announce.channelId).catch(() => null);
      if (ch && ch.isTextBased()) {
        await ch.send(payload).catch(() => {});
        return;
      }
    }
    await message.channel.send(payload).catch(() => {});
  } catch (e) {
    console.error("[LevelingManager] Failed level up announcement:", e);
  }
}

async function handleVoiceStateUpdate(client, oldState, newState) {
  const user = newState?.member?.user || oldState?.member?.user;
  if (!user || user.bot) return;

  const guildId = newState?.guild?.id || oldState?.guild?.id;
  if (!guildId) return;

  const oldChannelId = oldState?.channelId;
  const newChannelId = newState?.channelId;
  const now = Date.now();

  const key = `${guildId}:${user.id}`;

  if (!oldChannelId && newChannelId) {
    voiceSessions.set(key, { startedAt: now, channelId: newChannelId });
    return;
  }

  if (oldChannelId && !newChannelId) {
    await endVoiceSession(client, guildId, user.id, now, oldChannelId, oldState?.member || newState?.member);
    return;
  }

  if (oldChannelId && newChannelId && oldChannelId !== newChannelId) {
    await endVoiceSession(client, guildId, user.id, now, oldChannelId, oldState?.member || newState?.member);
    voiceSessions.set(key, { startedAt: now, channelId: newChannelId });
  }
}

async function endVoiceSession(client, guildId, userId, now, channelId, member) {
  const key = `${guildId}:${userId}`;
  const session = voiceSessions.get(key);
  if (!session) return;
  voiceSessions.delete(key);

  const durationMs = now - session.startedAt;
  const minutes = Math.floor(durationMs / 60000);
  if (minutes <= 0) return;

  const config = getGuildLeveling(guildId);
  if (!config.enabled || !config.xp.voice?.enabled) return;
  if (config.ignores.channels?.includes(session.channelId)) return;
  if (config.ignores.channels?.includes(channelId)) return;
  if (config.ignores.users?.includes(userId)) return;

  const memberState = getMemberData(guildId, userId);
  if (memberState.optOut) return;

  const voiceXp = config.xp.voice || { minXp: 10, maxXp: 20 };
  const randomPerMin = Math.floor(Math.random() * (voiceXp.maxXp - voiceXp.minXp + 1)) + voiceXp.minXp;
  const xpGain = minutes * randomPerMin;

  const result = addXp(config, memberState, xpGain);
  memberState.lastVoiceAt = now;

  setMemberData(guildId, userId, memberState);

  if (!result.leveledUp) return;

  await applyRewards(client, guildId, memberState, member);
}

function resetLevelingData(guildId, userId = null) {
  if (!guildId) return false;
  if (!isInitialized) initCache();

  if (userId) {
    const members = getGuildMembersData(guildId);
    delete members[userId];
    dataCache.set(guildId, members);
  } else {
    dataCache.delete(guildId);
    configCache.delete(guildId);
  }

  saveDiskAsync();
  return true;
}

initCache();

module.exports = {
  DEFAULT_LEVELING,
  getGuildLeveling,
  setGuildLeveling,
  getGuildMembersData,
  getMemberData,
  setMemberData,
  xpToNextLevel,
  getLeaderboard,
  getRankPosition,
  applyRewards,
  addXp,
  handleMessageXp,
  handleVoiceStateUpdate,
  resetLevelingData,
};
