try {
  process.loadEnvFile();
} catch (_) {}

const { ShardingManager } = require("discord.js");
const path = require("path");
const { printBanner, logger, colors } = require("./lib/functions/common.js");

printBanner();

let token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.Error("ShardManager", "CRITICAL ERROR: DISCORD_TOKEN environment variable is not defined.");
  process.exit(1);
}
if (
  (token.startsWith('"') && token.endsWith('"')) ||
  (token.startsWith("'") && token.endsWith("'"))
) {
  token = token.slice(1, -1);
}

const totalShards = process.env.TOTAL_SHARDS
  ? process.env.TOTAL_SHARDS === "auto"
    ? "auto"
    : parseInt(process.env.TOTAL_SHARDS, 10)
  : "auto";

const manager = new ShardingManager(path.join(__dirname, "bot.js"), {
  token: token,
  totalShards: totalShards,
  respawn: true,
  mode: "process",
});

manager.on("shardCreate", (shard) => {
  logger.System("ShardManager", `Launched Gateway Shard #${shard.id}`);

  shard.on("ready", () => {
    logger.Success("ShardManager", `Shard #${shard.id} is ONLINE & READY.`);
  });

  shard.on("disconnect", (event) => {
    logger.Warn("ShardManager", `Shard #${shard.id} disconnected: ${event?.reason || "Connection lost"}`);
  });

  shard.on("reconnecting", () => {
    logger.System("ShardManager", `Shard #${shard.id} is reconnecting...`);
  });

  shard.on("death", (process) => {
    logger.Error("ShardManager", `Shard #${shard.id} died with exit code ${process.exitCode}. Respawning...`);
  });

  shard.on("error", (error) => {
    logger.Error("ShardManager", `Shard #${shard.id} error: ${error?.message || error}`);
  });
});

manager.spawn().catch((err) => {
  logger.Error("ShardManager", `Failed to spawn shards: ${err?.message || err}`);
});

process.on("uncaughtException", (err, origin) => {
  logger.Error("Process", `uncaughtException (origin: ${origin || "unknown"})`, err);
});
process.on("unhandledRejection", (reason) => {
  logger.Error("Process", "unhandledRejection", reason);
});
