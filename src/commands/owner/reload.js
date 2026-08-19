const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["reload", "rel"],
  category: "Owner",
  desc: "Reloads message commands or core systems.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    try {
      const { applicationECSLoader } = require("../../lib/functions/application-ecs-loader");
      await applicationECSLoader(client);
      return message.reply("✅ Successfully reloaded message commands & application ECS systems!").catch(() => null);
    } catch (err) {
      console.error("[reload] Error reloading client:", err);
      return message.reply(`❌ Failed to reload systems: ${err.message}`).catch(() => null);
    }
  },
};
