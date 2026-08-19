const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
  ChannelType,
} = require("discord.js");
const EMOJIS = require("./emojis");
const noprefixManager = require("./noprefixManager");

const CONFIG_FILE = path.join(__dirname, "nukeConfig.json");

let configStore = {
  scheduled: {},
  archives: {},
};
const activeTimerMap = new Map(); // channelId -> Timeout/Interval
let isInitialized = false;

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      const parsed = JSON.parse(data);
      configStore = {
        scheduled: parsed.scheduled || {},
        archives: parsed.archives || {},
      };
    }
  } catch (e) {
    console.error("[NukeManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(configStore, null, 2), "utf8");
    } catch (e) {
      console.error("[NukeManager] Save disk error:", e);
    }
  });
}

function parseInterval(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)([dhms])?$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = (match[2] || "m").toLowerCase();
  if (unit === "s") return val * 1000;
  if (unit === "m") return val * 60 * 1000;
  if (unit === "h") return val * 60 * 60 * 1000;
  if (unit === "d") return val * 24 * 60 * 60 * 1000;
  return val * 60 * 1000;
}

function formatInterval(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}

/**
 * Perform sub-0.1s fast channel clone & delete with pin backup support
 */
async function nukeChannelFast(guild, channel, executor = null, customMessage = null) {
  const startTime = Date.now();
  if (!guild || !channel) return null;

  try {
    let pinArchiveAttachment = null;
    const isArchiving = getArchiveSetting(guild.id, channel.id);

    if (isArchiving && typeof channel.messages?.fetchPinned === "function") {
      try {
        const pinned = await channel.messages.fetchPinned().catch(() => null);
        if (pinned && pinned.size > 0) {
          let logLines = [`==================================================\n`];
          logLines.push(`PINNED MESSAGES ARCHIVE — #${channel.name} (${channel.id})\n`);
          logLines.push(`Guild: ${guild.name} (${guild.id})\n`);
          logLines.push(`Archived At: ${new Date().toISOString()}\n`);
          logLines.push(`==================================================\n\n`);

          pinned.forEach((m) => {
            logLines.push(`[${m.createdAt.toISOString()}] ${m.author?.tag || m.author?.id}: ${m.content || "[Media/Embed]"}\n`);
          });

          const buffer = Buffer.from(logLines.join(""), "utf8");
          pinArchiveAttachment = new AttachmentBuilder(buffer, {
            name: `pins_archive_${channel.name}.txt`,
          });
        }
      } catch (_) {}
    }

    // Clone Channel preserving all channel properties
    const cloneOptions = {
      name: channel.name,
      type: channel.type,
      topic: channel.topic,
      position: channel.position,
      parent: channel.parentId,
      permissionOverwrites: channel.permissionOverwrites.cache.map((o) => o),
      rateLimitPerUser: channel.rateLimitPerUser,
      nsfw: channel.nsfw,
    };

    if (channel.bitrate) cloneOptions.bitrate = channel.bitrate;
    if (channel.userLimit) cloneOptions.userLimit = channel.userLimit;
    if (channel.rtcRegion) cloneOptions.rtcRegion = channel.rtcRegion;

    const clonedChannel = await channel.clone(cloneOptions);
    await channel.delete(`[ASTRIX HARDENED NUKE] Triggered by ${executor ? `${executor.tag} (${executor.id})` : "System Scheduler"}`);

    const elapsedMs = Date.now() - startTime;

    // Send sub-0.1s Nuke Notification Card in newly cloned channel
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 💣 **CHANNEL NUKED SUCCESSFULLY**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> - **Channel:** <#${clonedChannel.id}>\n` +
          `> - **Invoked By:** ${executor ? `<@${executor.id}>` : "`Auto-Scheduler`"}\n` +
          `> - **Execution Speed:** \`${(elapsedMs / 1000).toFixed(3)}s\` *(Sub-0.1s Engine)*\n` +
          (customMessage ? `> - **Announcement:** ${customMessage}\n` : "") +
          `-# *Channel successfully purged and recreated with identical permissions & layout.*`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Nuke Engine • Sub-0.1s Execution`)
      );

    const payload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };

    if (pinArchiveAttachment) {
      payload.files = [pinArchiveAttachment];
    }

    await clonedChannel.send(payload).catch(() => null);

    return { clonedChannel, elapsedMs };
  } catch (err) {
    console.error("[NukeManager] Error nuking channel:", err);
    return null;
  }
}

function getArchiveSetting(guildId, channelId) {
  if (!isInitialized) initCache();
  if (!guildId || !channelId) return false;
  return Boolean(configStore.archives[guildId]?.[channelId]);
}

function setArchiveSetting(guildId, channelId, enabled) {
  if (!isInitialized) initCache();
  if (!guildId || !channelId) return false;

  if (!configStore.archives[guildId]) configStore.archives[guildId] = {};
  configStore.archives[guildId][channelId] = Boolean(enabled);
  saveDiskAsync();
  return true;
}

function getScheduledNukes() {
  if (!isInitialized) initCache();
  return configStore.scheduled || {};
}

function scheduleNuke(client, guildId, channelId, intervalMs, intervalRaw, nukeMsg, scheduledBy) {
  if (!isInitialized) initCache();
  if (!guildId || !channelId || !intervalMs) return false;

  // Clear existing timer if present
  if (activeTimerMap.has(channelId)) {
    clearTimeout(activeTimerMap.get(channelId));
    activeTimerMap.delete(channelId);
  }

  const now = Date.now();
  const nukeEntry = {
    guildId,
    channelId,
    intervalMs,
    intervalRaw,
    nukeMsg: nukeMsg || "Scheduled auto-nuke executed.",
    scheduledBy,
    scheduledAt: now,
    nextRunAt: now + intervalMs,
  };

  configStore.scheduled[channelId] = nukeEntry;
  saveDiskAsync();

  const timer = setTimeout(async () => {
    try {
      const guild = client.guilds.cache.get(guildId);
      const channel = guild?.channels.cache.get(channelId);
      if (guild && channel) {
        const executorUser = await client.users.fetch(scheduledBy).catch(() => null);
        await nukeChannelFast(guild, channel, executorUser, nukeMsg);
      }
    } catch (e) {
      console.error("[NukeManager] Error executing scheduled nuke:", e);
    } finally {
      delete configStore.scheduled[channelId];
      activeTimerMap.delete(channelId);
      saveDiskAsync();
    }
  }, intervalMs);

  activeTimerMap.set(channelId, timer);
  return nukeEntry;
}

function cancelScheduledNuke(channelId) {
  if (!isInitialized) initCache();
  if (!channelId) return false;

  if (activeTimerMap.has(channelId)) {
    clearTimeout(activeTimerMap.get(channelId));
    activeTimerMap.delete(channelId);
  }

  if (configStore.scheduled[channelId]) {
    delete configStore.scheduled[channelId];
    saveDiskAsync();
    return true;
  }
  return false;
}

function restoreScheduledNukes(client) {
  if (!isInitialized) initCache();
  const now = Date.now();

  for (const [channelId, entry] of Object.entries(configStore.scheduled)) {
    const remainingMs = entry.nextRunAt - now;
    if (remainingMs <= 0) {
      setImmediate(async () => {
        const guild = client.guilds.cache.get(entry.guildId);
        const channel = guild?.channels.cache.get(channelId);
        if (guild && channel) {
          const executorUser = await client.users.fetch(entry.scheduledBy).catch(() => null);
          await nukeChannelFast(guild, channel, executorUser, entry.nukeMsg);
        }
        delete configStore.scheduled[channelId];
        saveDiskAsync();
      });
    } else {
      const timer = setTimeout(async () => {
        try {
          const guild = client.guilds.cache.get(entry.guildId);
          const channel = guild?.channels.cache.get(channelId);
          if (guild && channel) {
            const executorUser = await client.users.fetch(entry.scheduledBy).catch(() => null);
            await nukeChannelFast(guild, channel, executorUser, entry.nukeMsg);
          }
        } catch (e) {
          console.error("[NukeManager] Error executing restored scheduled nuke:", e);
        } finally {
          delete configStore.scheduled[channelId];
          activeTimerMap.delete(channelId);
          saveDiskAsync();
        }
      }, remainingMs);

      activeTimerMap.set(channelId, timer);
    }
  }
}

initCache();

module.exports = {
  nukeChannelFast,
  getArchiveSetting,
  setArchiveSetting,
  getScheduledNukes,
  scheduleNuke,
  cancelScheduledNuke,
  restoreScheduledNukes,
  parseInterval,
  formatInterval,
};
