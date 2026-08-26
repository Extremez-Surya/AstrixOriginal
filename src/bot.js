try {
  process.loadEnvFile();
} catch (_) {}

const { CustomClient } = require("./lib/functions/customClient.js");
const { AppEvents } = require("./lib/functions/application-ecs-loader.js");
const { logger } = require("./lib/functions/common.js");
const { GatewayIntentBits } = require("discord.js");

const client = new CustomClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
  failIfNotExists: false,
  allowedMentions: {
    parse: [],
    repliedUser: false,
  },
});

(async () => {
  try {
    await AppEvents(client);
    client.start();
  } catch (err) {
    logger.Error(`Shard #${client.shard?.ids[0] ?? 0}`, "Fatal startup error", err);
  }
})();

module.exports = client;

process.on("uncaughtException", (err, origin) => {
  logger.Error(`Shard #${client.shard?.ids[0] ?? 0}`, `uncaughtException (origin: ${origin || "unknown"})`, err);
});

process.on("unhandledRejection", (reason) => {
  const errMsg = reason?.message || String(reason);
  if (errMsg.includes("Player not found") || reason?.status === 404) {
    logger.Warn(`Shard #${client.shard?.ids[0] ?? 0}`, "Handled stale Lavalink player 404 rejection");
    return;
  }
  if (errMsg.includes("Unexpected token") || errMsg.includes("JSON at position")) {
    logger.Warn(`Shard #${client.shard?.ids[0] ?? 0}`, `Handled transient payload parse error: ${errMsg}`);
    return;
  }
  logger.Error(`Shard #${client.shard?.ids[0] ?? 0}`, `unhandledRejection: ${errMsg}`);
  if (reason?.stack) {
    console.error(reason.stack);
  }
});
