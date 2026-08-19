const { Events } = require("discord.js");
const bumpReminderManager = require("../lib/bumpReminderManager");

module.exports = {
  name: "onBumpReminderMessage",
  event: Events.MessageCreate,
  once: false,

  async execute(client, message) {
    if (!message.guild || message.author.bot && message.author.id !== bumpReminderManager.DISBOARD_BOT_ID) return;

    try {
      const config = bumpReminderManager.getGuildBumpConfig(message.guild.id);
      if (!config.enabled || !config.channel) return;
      if (message.channelId !== config.channel) return;

      // 1. Auto-Clean non-bump messages sent in bump channel
      if (config.autoClean && message.author.id !== bumpReminderManager.DISBOARD_BOT_ID && message.author.id !== client.user.id) {
        const clientPrefix = client.config?.clientPrefix || "-";
        if (!message.content.startsWith(clientPrefix) && !message.content.startsWith(".")) {
          setTimeout(() => {
            message.delete().catch(() => null);
          }, 3000);
          return;
        }
      }

      // 2. Disboard /bump command detection
      if (message.author.id === bumpReminderManager.DISBOARD_BOT_ID) {
        let isBumpSuccess = false;
        let bumperUserId = null;

        // Detection Method A: Slash interaction metadata
        if (message.interaction) {
          if (message.interaction.commandName === "bump") {
            isBumpSuccess = true;
            bumperUserId = message.interaction.user?.id;
          }
        }

        // Detection Method B: Embed content parsing
        if (!isBumpSuccess && message.embeds?.length > 0) {
          const embed = message.embeds[0];
          const desc = embed.description || "";
          const title = embed.title || "";

          if (desc.includes("Bump done!") || desc.includes("Check it out on DISBOARD") || title.includes("DISBOARD")) {
            isBumpSuccess = true;
            // Extract user ID from embed description if present
            const match = desc.match(/<@!?(\d+)>/);
            if (match) bumperUserId = match[1];
          }
        }

        if (isBumpSuccess) {
          const finalUser = bumperUserId || message.mentions.users.first()?.id || message.author.id;
          await bumpReminderManager.handleSuccessfulBump(client, message.guild, finalUser);
        }
      }
    } catch (err) {
      console.error("[onBumpReminderMessage] Error:", err);
    }
  },
};
