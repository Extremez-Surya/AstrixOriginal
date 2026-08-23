const { Events, AuditLogEvent } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onGuildUpdate",
  event: Events.GuildUpdate,
  once: false,

  async execute(client, oldGuild, newGuild) {
    if (!newGuild) return;

    const changes = [];
    let beforeVal = "";
    let afterVal = "";

    // 1. Server Name
    if (oldGuild.name !== newGuild.name) {
      changes.push(`Name changed: \`${oldGuild.name}\` ➔ \`${newGuild.name}\``);
      beforeVal = oldGuild.name;
      afterVal = newGuild.name;
    }

    // 2. Server Icon
    if (oldGuild.icon !== newGuild.icon) {
      changes.push("Server Icon was updated");
    }

    // 3. Vanity URL
    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
      changes.push(`Vanity URL changed: \`${oldGuild.vanityURLCode || "None"}\` ➔ \`${newGuild.vanityURLCode || "None"}\``);
    }

    // 4. Banner / Splash
    if (oldGuild.banner !== newGuild.banner) {
      changes.push("Server Banner was updated");
    }
    if (oldGuild.splash !== newGuild.splash) {
      changes.push("Server Splash invite background was updated");
    }

    // 5. Verification Level
    if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
      changes.push(`Verification level changed: \`${oldGuild.verificationLevel}\` ➔ \`${newGuild.verificationLevel}\``);
    }

    // 6. AFK Channel / Timeout
    if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
      changes.push(`AFK Channel updated: <#${oldGuild.afkChannelId || "None"}> ➔ <#${newGuild.afkChannelId || "None"}>`);
    }

    // 7. System Channel / Rules Channel
    if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
      changes.push(`System Channel updated: <#${oldGuild.systemChannelId || "None"}> ➔ <#${newGuild.systemChannelId || "None"}>`);
    }
    if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
      changes.push(`Rules Channel updated: <#${oldGuild.rulesChannelId || "None"}> ➔ <#${newGuild.rulesChannelId || "None"}>`);
    }

    if (changes.length === 0) return;

    // Fetch Executor from Audit Logs
    let executor = null;
    try {
      const logs = await newGuild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate }).catch(() => null);
      if (logs && logs.entries.size > 0) {
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 8000) {
          executor = entry.executor;
        }
      }
    } catch (_) {}

    await loggingManager.dispatchLog(
      client,
      newGuild.id,
      "serverUpdate",
      {
        executor,
        details: changes.join("\n> - "),
        before: beforeVal || undefined,
        after: afterVal || undefined,
      }
    ).catch(() => null);
  },
};
