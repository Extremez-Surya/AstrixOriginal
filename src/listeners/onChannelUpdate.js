const { Events, AuditLogEvent } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onChannelUpdate",
  event: Events.ChannelUpdate,
  once: false,

  async execute(client, oldChannel, newChannel) {
    if (!newChannel || !newChannel.guild) return;

    const changes = [];
    let beforeVal = "";
    let afterVal = "";

    // 1. Channel Name
    if (oldChannel.name !== newChannel.name) {
      changes.push(`Channel renamed: \`#${oldChannel.name}\` ➔ \`#${newChannel.name}\``);
      beforeVal = oldChannel.name;
      afterVal = newChannel.name;
    }

    // 2. Channel Topic
    if (oldChannel.topic !== newChannel.topic) {
      changes.push(`Topic updated: \`${oldChannel.topic || "None"}\` ➔ \`${newChannel.topic || "None"}\``);
    }

    // 3. Slowmode
    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      changes.push(`Slowmode adjusted: \`${oldChannel.rateLimitPerUser || 0}s\` ➔ \`${newChannel.rateLimitPerUser || 0}s\``);
    }

    // 4. NSFW
    if (oldChannel.nsfw !== newChannel.nsfw) {
      changes.push(`NSFW status changed: \`${Boolean(oldChannel.nsfw)}\` ➔ \`${Boolean(newChannel.nsfw)}\``);
    }

    // 5. Parent Category
    if (oldChannel.parentId !== newChannel.parentId) {
      changes.push(`Parent category moved: \`${oldChannel.parent?.name || "None"}\` ➔ \`${newChannel.parent?.name || "None"}\``);
    }

    if (changes.length === 0) return;

    let executor = null;
    try {
      const logs = await newChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate }).catch(() => null);
      if (logs && logs.entries.size > 0) {
        const entry = logs.entries.first();
        if (entry && entry.target?.id === newChannel.id && Date.now() - entry.createdTimestamp < 8000) {
          executor = entry.executor;
        }
      }
    } catch (_) {}

    await loggingManager.dispatchLog(
      client,
      newChannel.guild.id,
      "channelUpdate",
      {
        channel: newChannel,
        executor,
        details: changes.join("\n> - "),
        before: beforeVal || undefined,
        after: afterVal || undefined,
      }
    ).catch(() => null);
  },
};
