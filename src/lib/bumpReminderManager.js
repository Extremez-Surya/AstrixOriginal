const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const EMOJIS = require("./emojis");

const CONFIG_FILE = path.join(__dirname, "bumpReminderConfig.json");
const DISBOARD_BOT_ID = "302050872383242240";
const BUMP_COOLDOWN = 2 * 60 * 60 * 1000; // 2 Hours in ms

const configCache = new Map();
const timerMap = new Map(); // guildId -> Timeout
let isInitialized = false;

function getDefaultConfig() {
  return {
    enabled: false,
    channel: null,
    thankyouMessage: "Thanks {user} for bumping {server}! I'll remind you in 2 hours. 💚",
    reminderMessage: "It's time to /bump the server! {user} Use `/bump` now! ⏰",
    autoLock: false,
    autoClean: false,
    lastBump: null,
    nextBump: null,
    lastBumpUser: null,
    totalBumps: 0,
    userStats: {},
  };
}

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      const parsed = JSON.parse(data);
      if (parsed.guilds) {
        for (const [guildId, cfg] of Object.entries(parsed.guilds)) {
          configCache.set(guildId, cfg);
        }
      }
    }
  } catch (e) {
    console.error("[BumpReminderManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      const obj = { guilds: {} };
      for (const [guildId, cfg] of configCache.entries()) {
        obj.guilds[guildId] = cfg;
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[BumpReminderManager] Save disk error:", e);
    }
  });
}

function getGuildBumpConfig(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultConfig();

  const raw = configCache.get(guildId);
  if (!raw) return getDefaultConfig();

  const defaultConfig = getDefaultConfig();
  return {
    ...defaultConfig,
    ...raw,
    userStats: { ...(raw.userStats || {}) },
  };
}

function setGuildBumpConfig(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function updateGuildBumpConfig(guildId, updates) {
  if (!guildId) return false;
  const current = getGuildBumpConfig(guildId);
  const updated = {
    ...current,
    ...updates,
    userStats: { ...current.userStats, ...(updates.userStats || {}) },
  };
  return setGuildBumpConfig(guildId, updated);
}

async function lockChannel(guild, channel) {
  try {
    if (!guild || !channel) return false;
    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) return false;

    const everyoneRole = guild.roles.everyone;
    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
      AddReactions: false,
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function unlockChannel(guild, channel) {
  try {
    if (!guild || !channel) return false;
    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) return false;

    const everyoneRole = guild.roles.everyone;
    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: null,
      AddReactions: null,
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function handleSuccessfulBump(client, guild, userId) {
  try {
    const config = getGuildBumpConfig(guild.id);
    if (!config.enabled || !config.channel) return;

    const channel = guild.channels.cache.get(config.channel);
    if (!channel) return;

    const now = Date.now();
    const nextBump = now + BUMP_COOLDOWN;

    config.lastBump = now;
    config.nextBump = nextBump;
    config.lastBumpUser = userId;
    config.totalBumps = (config.totalBumps || 0) + 1;
    config.userStats[userId] = (config.userStats[userId] || 0) + 1;

    setGuildBumpConfig(guild.id, config);

    // Format thank you message
    const rawThankyou = config.thankyouMessage || getDefaultConfig().thankyouMessage;
    const thankYouText = rawThankyou
      .replace(/\{user\}/g, `<@${userId}>`)
      .replace(/\{server\}/g, guild.name);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 💚 **SERVER BUMP SUCCESSFUL!**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${thankYouText}\n\n` +
          `> - **Bumper:** <@${userId}>\n` +
          `> - **Next Bump Ready:** <t:${Math.floor(nextBump / 1000)}:R> (<t:${Math.floor(nextBump / 1000)}:f>)\n` +
          `> - **Total Server Bumps:** \`${config.totalBumps}\` 🚀`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Automated Bump Reminder Engine`)
      );

    await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    // Lock Channel if Auto-Lock is enabled
    if (config.autoLock) {
      await lockChannel(guild, channel);
    }

    // Schedule 2-Hour Reminder Timer
    scheduleReminderTimer(client, guild.id, BUMP_COOLDOWN);
  } catch (err) {
    console.error("[BumpReminderManager] Error handling bump:", err);
  }
}

async function sendBumpReminder(client, guildId) {
  try {
    const config = getGuildBumpConfig(guildId);
    if (!config.enabled || !config.channel) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(config.channel);
    if (!channel) return;

    // Reset next bump timestamp
    config.nextBump = null;
    setGuildBumpConfig(guildId, config);

    // Unlock Channel if Auto-Lock is enabled
    if (config.autoLock) {
      await unlockChannel(guild, channel);
    }

    const mentionUser = config.lastBumpUser ? `<@${config.lastBumpUser}>` : "@here";
    const rawReminder = config.reminderMessage || getDefaultConfig().reminderMessage;
    const reminderText = rawReminder
      .replace(/\{user\}/g, mentionUser)
      .replace(/\{server\}/g, guild.name);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ⏰ **TIME TO BUMP THE SERVER!**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${reminderText}\n\n` +
          `> - **Target Channel:** <#${channel.id}>\n` +
          `> - **Command:** \`/bump\`\n` +
          `-# *Bump the server on Disboard now to keep us at the top of the list!*`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Automated Bump Reminder Engine`)
      );

    await channel.send({
      content: mentionUser,
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: ["users", "everyone", "roles"] },
    }).catch(() => null);
  } catch (err) {
    console.error("[BumpReminderManager] Error sending reminder:", err);
  }
}

function scheduleReminderTimer(client, guildId, delayMs) {
  if (timerMap.has(guildId)) {
    clearTimeout(timerMap.get(guildId));
    timerMap.delete(guildId);
  }

  const timer = setTimeout(async () => {
    timerMap.delete(guildId);
    await sendBumpReminder(client, guildId);
  }, delayMs);

  timerMap.set(guildId, timer);
}

function restoreBumpTimers(client) {
  if (!isInitialized) initCache();
  const now = Date.now();

  for (const [guildId, config] of configCache.entries()) {
    if (config.enabled && config.nextBump) {
      const remainingMs = config.nextBump - now;
      if (remainingMs <= 0) {
        setImmediate(() => sendBumpReminder(client, guildId));
      } else {
        scheduleReminderTimer(client, guildId, remainingMs);
      }
    }
  }
}

initCache();

module.exports = {
  DISBOARD_BOT_ID,
  BUMP_COOLDOWN,
  getDefaultConfig,
  getGuildBumpConfig,
  setGuildBumpConfig,
  updateGuildBumpConfig,
  handleSuccessfulBump,
  sendBumpReminder,
  restoreBumpTimers,
  lockChannel,
  unlockChannel,
};
