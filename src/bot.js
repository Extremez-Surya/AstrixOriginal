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
  ],
  failIfNotExists: false,
  allowedMentions: {
    parse: [],
    repliedUser: false,
  },
});

AppEvents(client);
module.exports = client;
client.start();

process.on("uncaughtException", (err, origin) => {
  logger.Error(`Shard #${client.shard?.ids[0] ?? 0}`, "uncaughtException", err);
});

process.on("unhandledRejection", (reason) => {
  const errMsg = reason?.message || String(reason);
  if (errMsg.includes("Player not found") || reason?.status === 404) {
    logger.Warn(`Shard #${client.shard?.ids[0] ?? 0}`, "Handled stale Lavalink player 404 rejection");
    return;
  }
  logger.Error(`Shard #${client.shard?.ids[0] ?? 0}`, `unhandledRejection: ${errMsg}`);
});
