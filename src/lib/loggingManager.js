const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("./emojis");

const CONFIG_FILE = path.join(__dirname, "loggingConfig.json");
const DATA_FILE = path.join(__dirname, "loggingData.json");

const configCache = new Map();
const logsCache = new Map();

let isInitialized = false;

const LOG_CATEGORIES = {
  message: ["messageDelete", "messageEdit", "bulkDelete", "messagePin", "messageUnpin"],
  member: ["memberJoin", "memberLeave", "botAdd", "nicknameUpdate", "avatarUpdate", "roleAdd", "roleRemove", "timeoutAdd", "timeoutRemove"],
  mod: ["memberBan", "memberUnban", "memberKick", "modWarn", "modMute", "modUnmute", "modLock", "modUnlock", "modSlowmode", "modNuke", "modClear"],
  server: ["serverUpdate", "boostAdd", "boostRemove", "inviteCreate", "inviteDelete"],
  voice: ["voiceJoin", "voiceLeave", "voiceMove", "voiceMute", "voiceDeafen"],
  role: ["roleCreate", "roleDelete", "roleUpdate"],
  channel: ["channelCreate", "channelDelete", "channelUpdate", "threadCreate", "threadDelete", "threadUpdate"],
  emoji: ["emojiCreate", "emojiDelete", "emojiUpdate", "stickerCreate", "stickerDelete", "stickerUpdate"],
};

const CATEGORY_NAMES = {
  message: "Message Logs",
  member: "Member Logs",
  mod: "Moderation Logs",
  server: "Server Logs",
  voice: "Voice Logs",
  role: "Role Logs",
  channel: "Channel Logs",
  emoji: "Emoji & Sticker Logs",
};

const EVENT_ICONS = {
  messageDelete: "🗑️",
  messageEdit: "✏️",
  bulkDelete: "🧹",
  messagePin: "📌",
  messageUnpin: "📍",
  memberJoin: "📥",
  memberLeave: "📤",
  botAdd: "🤖",
  memberBan: "🔨",
  memberUnban: "🔓",
  memberKick: "👢",
  nicknameUpdate: "🏷️",
  avatarUpdate: "🖼️",
  roleAdd: "➕",
  roleRemove: "➖",
  timeoutAdd: "⏱️",
  timeoutRemove: "⌛",
  channelCreate: "📁",
  channelDelete: "🗑️",
  channelUpdate: "⚙️",
  threadCreate: "🧵",
  threadDelete: "🗑️",
  threadUpdate: "⚙️",
  roleCreate: "🎭",
  roleDelete: "🗑️",
  roleUpdate: "⚙️",
  emojiCreate: "😀",
  emojiDelete: "🗑️",
  emojiUpdate: "⚙️",
  stickerCreate: "🏷️",
  stickerDelete: "🗑️",
  stickerUpdate: "⚙️",
  serverUpdate: "🌐",
  boostAdd: "🚀",
  boostRemove: "📉",
  inviteCreate: "✉️",
  inviteDelete: "🗑️",
  voiceJoin: "🔊",
  voiceLeave: "🔇",
  voiceMove: "🔀",
  voiceMute: "🎙️",
  voiceDeafen: "🎧",
  modWarn: "⚠️",
  modMute: "🔇",
  modUnmute: "🔊",
  modLock: "🔒",
  modUnlock: "🔓",
  modSlowmode: "🐢",
  modNuke: "💣",
  modClear: "🧹",
};

const EVENT_TITLES = {
  messageDelete: "Message Deleted",
  messageEdit: "Message Edited",
  bulkDelete: "Bulk Messages Deleted",
  messagePin: "Message Pinned",
  messageUnpin: "Message Unpinned",
  memberJoin: "Member Joined",
  memberLeave: "Member Left",
  botAdd: "Bot Added to Server",
  memberBan: "Member Banned",
  memberUnban: "Member Unbanned",
  memberKick: "Member Kicked",
  nicknameUpdate: "Nickname Updated",
  avatarUpdate: "Avatar Updated",
  roleAdd: "Role Assigned to Member",
  roleRemove: "Role Removed from Member",
  timeoutAdd: "Member Timed Out",
  timeoutRemove: "Member Timeout Removed",
  channelCreate: "Channel Created",
  channelDelete: "Channel Deleted",
  channelUpdate: "Channel Settings Updated",
  threadCreate: "Thread Created",
  threadDelete: "Thread Deleted",
  threadUpdate: "Thread Updated",
  roleCreate: "Role Created",
  roleDelete: "Role Deleted",
  roleUpdate: "Role Settings Updated",
  emojiCreate: "Custom Emoji Created",
  emojiDelete: "Custom Emoji Deleted",
  emojiUpdate: "Custom Emoji Updated",
  stickerCreate: "Custom Sticker Created",
  stickerDelete: "Custom Sticker Deleted",
  stickerUpdate: "Custom Sticker Updated",
  serverUpdate: "Server Settings Updated",
  boostAdd: "Server Boosted",
  boostRemove: "Server Boost Removed",
  inviteCreate: "Invite Link Created",
  inviteDelete: "Invite Link Deleted",
  voiceJoin: "Member Joined Voice Channel",
  voiceLeave: "Member Left Voice Channel",
  voiceMove: "Member Switched Voice Channel",
  voiceMute: "Member Voice Mute Toggled",
  voiceDeafen: "Member Voice Deafen Toggled",
  modWarn: "Moderation: Member Warned",
  modMute: "Moderation: Member Muted",
  modUnmute: "Moderation: Member Unmuted",
  modLock: "Moderation: Channel Locked",
  modUnlock: "Moderation: Channel Unlocked",
  modSlowmode: "Moderation: Slowmode Adjusted",
  modNuke: "Moderation: Channel Nuked",
  modClear: "Moderation: Messages Cleared",
};

function getDefaultLoggingConfig() {
  const allEvents = {};
  for (const catEvents of Object.values(LOG_CATEGORIES)) {
    for (const evt of catEvents) {
      allEvents[evt] = true;
    }
  }

  return {
    enabled: false,
    channels: {
      message: null,
      member: null,
      mod: null,
      server: null,
      voice: null,
      role: null,
      channel: null,
      emoji: null,
      combined: null,
    },
    categories: {
      message: true,
      member: true,
      mod: true,
      server: true,
      voice: true,
      role: true,
      channel: true,
      emoji: true,
    },
    events: allEvents,
    ignore: {
      channels: [],
      roles: [],
      users: [],
      bots: false,
    },
  };
}

function readDiskConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch (e) {
    console.error("[LoggingManager] Read config error:", e);
  }
  return {};
}

function readDiskData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (e) {
    console.error("[LoggingManager] Read data error:", e);
  }
  return {};
}

function initCache() {
  try {
    const configParsed = readDiskConfig();
    for (const [guildId, cfg] of Object.entries(configParsed)) {
      configCache.set(guildId, cfg);
    }
    const dataParsed = readDiskData();
    for (const [guildId, logs] of Object.entries(dataParsed)) {
      logsCache.set(guildId, logs);
    }
  } catch (e) {
    console.error("[LoggingManager] Cache init error:", e);
  }
  isInitialized = true;
}

function flushDiskSync() {
  try {
    const configObj = readDiskConfig();
    for (const [guildId, cfg] of configCache.entries()) {
      configObj[guildId] = cfg;
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configObj, null, 2), "utf8");

    const dataObj = readDiskData();
    for (const [guildId, logs] of logsCache.entries()) {
      dataObj[guildId] = logs;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataObj, null, 2), "utf8");
  } catch (e) {
    console.error("[LoggingManager] Flush disk error:", e);
  }
}

function saveDiskAsync() {
  flushDiskSync();
}

function getGuildLogging(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultLoggingConfig();

  let raw = configCache.get(guildId);
  if (!raw) {
    const diskData = readDiskConfig();
    if (diskData[guildId]) {
      raw = diskData[guildId];
      configCache.set(guildId, raw);
    }
  }
  if (!raw) return getDefaultLoggingConfig();

  const defaults = getDefaultLoggingConfig();
  return {
    ...defaults,
    ...raw,
    channels: { ...defaults.channels, ...(raw.channels || {}) },
    categories: { ...defaults.categories, ...(raw.categories || {}) },
    events: { ...defaults.events, ...(raw.events || {}) },
    ignore: { ...defaults.ignore, ...(raw.ignore || {}) },
  };
}

function setGuildLogging(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  flushDiskSync();
  return true;
}

function getGuildLogs(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return [];
  return logsCache.get(guildId) || [];
}

function getCategoryForEvent(eventType) {
  for (const [category, events] of Object.entries(LOG_CATEGORIES)) {
    if (events.includes(eventType)) {
      return category;
    }
  }
  return "message";
}

function shouldIgnore(config, context = {}) {
  if (!config.enabled) return true;

  const ignore = config.ignore || {};

  if (ignore.bots && context.author?.bot) return true;
  if (context.author?.id && ignore.users?.includes(context.author.id)) return true;
  if (context.channelId && ignore.channels?.includes(context.channelId)) return true;

  if (context.member?.roles?.cache && ignore.roles?.length) {
    const hasIgnoredRole = context.member.roles.cache.some((r) => ignore.roles.includes(r.id));
    if (hasIgnoredRole) return true;
  }

  return false;
}

function createLogContainer(eventType, data) {
  const icon = EVENT_ICONS[eventType] || "📜";
  const title = EVENT_TITLES[eventType] || "Event Logged";

  const lines = [];

  if (data.executor) {
    lines.push(`> - **Executor:** <@${data.executor.id}> (\`${data.executor.tag || data.executor.username || data.executor.id}\`)`);
  }
  if (data.target) {
    const targetTag = data.target.tag || data.target.username || data.target.name || data.target.id;
    lines.push(`> - **Target:** <@${data.target.id}> (\`${targetTag}\`)`);
  }
  if (data.channel) {
    lines.push(`> - **Channel:** <#${data.channel.id || data.channel}>`);
  }
  if (data.role) {
    lines.push(`> - **Role:** <@&${data.role.id}> (\`${data.role.name}\`)`);
  }
  if (data.details) {
    lines.push(`> - **Details:** ${data.details}`);
  }
  if (data.before !== undefined && data.after !== undefined) {
    lines.push(`> - **Before:** \`${String(data.before).slice(0, 200) || "None"}\``);
    lines.push(`> - **After:** \`${String(data.after).slice(0, 200) || "None"}\``);
  }
  if (data.reason) {
    lines.push(`> - **Reason:** \`${data.reason.slice(0, 300)}\``);
  }
  if (data.content) {
    lines.push(`\n**Content:**\n>>> ${data.content.slice(0, 800)}`);
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${icon} ${title}\n` +
        `-# *Server Event Audit Record*\n\n` +
        lines.join("\n")
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Event: ${eventType} • Timestamp: <t:${Math.floor(Date.now() / 1000)}:R>`
      )
    );

  return container;
}

async function dispatchLog(client, guildId, eventType, data, context = {}) {
  try {
    const config = getGuildLogging(guildId);
    if (!config.enabled) return;

    const category = getCategoryForEvent(eventType);

    if (config.categories && config.categories[category] === false) return;
    if (config.events && config.events[eventType] === false) return;

    if (shouldIgnore(config, context)) return;

    const channelId = config.channels[category] || config.channels.combined;
    if (!channelId) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const logChannel = guild.channels.cache.get(channelId);
    if (!logChannel || !logChannel.isTextBased()) return;

    // Record in memory log history
    const logs = getGuildLogs(guildId);
    logs.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      eventType,
      category,
      data,
    });
    // Keep max 2000 events in memory per guild
    if (logs.length > 2000) logs.shift();
    logsCache.set(guildId, logs);
    saveDiskAsync();

    const container = createLogContainer(eventType, data);
    await logChannel
      .send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] },
      })
      .catch(() => null);
  } catch (e) {
    console.error(`[LoggingManager] Error dispatching log (${eventType}):`, e);
  }
}

function searchLogs(guildId, options = {}) {
  const logs = getGuildLogs(guildId);
  return logs
    .filter((log) => {
      if (options.eventType && log.eventType !== options.eventType) return false;
      if (options.category && log.category !== options.category) return false;
      if (options.userId && log.data?.target?.id !== options.userId && log.data?.executor?.id !== options.userId) {
        return false;
      }
      if (options.channelId && log.data?.channel?.id !== options.channelId && log.data?.channel !== options.channelId) {
        return false;
      }
      return true;
    })
    .slice(-(options.limit || 50))
    .reverse();
}

function exportLogs(guildId, options = {}) {
  const logs = searchLogs(guildId, { ...options, limit: 1000 });
  return JSON.stringify(logs, null, 2);
}

function purgeLogs(guildId, options = {}) {
  let logs = getGuildLogs(guildId);
  const beforeCount = logs.length;

  if (options.all) {
    logs = [];
  } else if (options.category) {
    logs = logs.filter((l) => l.category !== options.category);
  }

  logsCache.set(guildId, logs);
  saveDiskAsync();
  return beforeCount - logs.length;
}

function getLoggingStats(guildId) {
  const logs = getGuildLogs(guildId);
  const byCategory = {};
  const byEvent = {};

  for (const log of logs) {
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    byEvent[log.eventType] = (byEvent[log.eventType] || 0) + 1;
  }

  return {
    total: logs.length,
    byCategory,
    byEvent,
    oldestLog: logs[0]?.timestamp || null,
    newestLog: logs[logs.length - 1]?.timestamp || null,
  };
}

initCache();

module.exports = {
  LOG_CATEGORIES,
  CATEGORY_NAMES,
  EVENT_ICONS,
  EVENT_TITLES,
  getDefaultLoggingConfig,
  getGuildLogging,
  setGuildLogging,
  getCategoryForEvent,
  createLogContainer,
  dispatchLog,
  searchLogs,
  exportLogs,
  purgeLogs,
  getLoggingStats,
};
