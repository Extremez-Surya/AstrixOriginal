const fs = require("fs");
const path = require("path");
const { ActivityType } = require("discord.js");
const { logger } = require("./functions/common.js");

const RPC_CONFIG_PATH = path.join(__dirname, "..", "config", "rpc.json");

const TYPE_MAPPING = {
  CUSTOM: ActivityType.Custom,
  PLAYING: ActivityType.Playing,
  STREAMING: ActivityType.Streaming,
  LISTENING: ActivityType.Listening,
  WATCHING: ActivityType.Watching,
  COMPETING: ActivityType.Competing,
};

let rotationTimer = null;
let currentIndex = 0;

function loadConfig() {
  try {
    if (fs.existsSync(RPC_CONFIG_PATH)) {
      const raw = fs.readFileSync(RPC_CONFIG_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    logger.Error("RPC", `Failed to read rpc.json config: ${err.message}`);
  }
  return {
    enabled: true,
    status: "online",
    rotateInterval: 15000,
    activities: [
      {
        type: "CUSTOM",
        state: "🛡️ Astrix Security • .help",
      },
    ],
  };
}

function replacePlaceholders(text, client) {
  if (typeof text !== "string") return text;

  let cfgPrefix = "-";
  try {
    const cfg = require("./config.json");
    cfgPrefix = cfg.clientPrefix || "-";
  } catch (_) {}

  const totalGuilds = client.guilds?.cache?.size?.toLocaleString() || "0";
  let totalMembersCount = 0;
  if (client.guilds?.cache) {
    for (const g of client.guilds.cache.values()) {
      totalMembersCount += (g.memberCount || 0);
    }
  }
  const totalMembers = totalMembersCount.toLocaleString();
  const ping = Math.max(0, client.ws?.ping || 0);
  const prefix = client.clientPrefix || client.prefix || cfgPrefix || "-";

  return text
    .replace(/\{guilds?\}/gi, totalGuilds)
    .replace(/\{servers?\}/gi, totalGuilds)
    .replace(/\{members?\}/gi, totalMembers)
    .replace(/\{users?\}/gi, totalMembers)
    .replace(/\{ping\}/gi, `${ping}ms`)
    .replace(/\{(?:client)?prefix\}/gi, prefix);
}

function applyPresence(client, config, activityItem) {
  if (!client.user) return;

  const rawType = (activityItem.type || "CUSTOM").toUpperCase();
  const activityType = TYPE_MAPPING[rawType] ?? ActivityType.Custom;
  const statusMode = config.status || "online";

  let activityPayload = {
    type: activityType,
  };

  if (activityType === ActivityType.Custom) {
    activityPayload.name = "Custom Status";
    activityPayload.state = replacePlaceholders(activityItem.state || activityItem.name || "", client);
  } else {
    activityPayload.name = replacePlaceholders(activityItem.name || activityItem.state || "Astrix", client);
    if (activityType === ActivityType.Streaming) {
      activityPayload.url = activityItem.url || "https://twitch.tv/discord";
    }
  }

  client.user.setPresence({
    activities: [activityPayload],
    status: statusMode,
  });
}

function initRPC(client) {
  if (rotationTimer) {
    clearInterval(rotationTimer);
    rotationTimer = null;
  }

  const config = loadConfig();
  if (!config.enabled || !Array.isArray(config.activities) || config.activities.length === 0) {
    logger.System("RPC", "Rich Presence is disabled in config/rpc.json");
    return;
  }

  // Initial presence
  currentIndex = 0;
  applyPresence(client, config, config.activities[0]);

  // If multiple activities are configured, start the rotator
  if (config.activities.length > 1) {
    const intervalMs = Math.max(5000, parseInt(config.rotateInterval, 10) || 15000);
    rotationTimer = setInterval(() => {
      try {
        const liveConfig = loadConfig();
        if (!liveConfig.enabled) {
          clearInterval(rotationTimer);
          rotationTimer = null;
          return;
        }

        const list = liveConfig.activities;
        if (!Array.isArray(list) || list.length === 0) return;

        currentIndex = (currentIndex + 1) % list.length;
        applyPresence(client, liveConfig, list[currentIndex]);
      } catch (err) {
        logger.Error("RPC", `Rotation error: ${err.message}`);
      }
    }, intervalMs);
  }

  logger.Success("RPC", `Initialized Rich Presence with ${config.activities.length} activity state(s).`);
}

module.exports = {
  initRPC,
  loadConfig,
};
