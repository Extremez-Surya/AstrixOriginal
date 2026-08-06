try {
  process.loadEnvFile();
} catch (_) {}

const { developerIds } = require("../config.json");
const { Client, Collection, version } = require("discord.js");
const { initMusicManager } = require("../musicManager.js");
const { logger } = require("./common.js");

module.exports.CustomClient = class CustomClient extends Client {
  messageCommands = new Collection();
  slashCommands = new Collection();
  developer = developerIds;
  manager = null;

  constructor(options) {
    super(options);
    this.manager = initMusicManager(this);
  }

  start() {
    logger.System(
      "Framework",
      `discord.js v${version} | Node.js ${process.versions.node}`,
    );
    let token = process.env.DISCORD_TOKEN;
    if (!token) {
      logger.Error("Client", "DISCORD_TOKEN environment variable is missing.");
      process.exit(1);
    }
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      token = token.slice(1, -1);
    }
    this.login(token);
  }
};
