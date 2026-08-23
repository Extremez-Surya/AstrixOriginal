const { Events, AuditLogEvent } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onGuildBanAdd",
  event: Events.GuildBanAdd,
  once: false,

  async execute(client, ban) {
    if (!ban || !ban.guild) return;

    let executor = null;
    let reason = ban.reason || null;

    try {
      const logs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
      if (logs && logs.entries.size > 0) {
        const entry = logs.entries.first();
        if (entry && entry.target?.id === ban.user?.id && Date.now() - entry.createdTimestamp < 8000) {
          executor = entry.executor;
          if (!reason && entry.reason) reason = entry.reason;
        }
      }
    } catch (_) {}

    await loggingManager.dispatchLog(
      client,
      ban.guild.id,
      "memberBan",
      {
        target: ban.user,
        executor,
        reason: reason || "No reason provided",
        details: `Member <@${ban.user.id}> (\`${ban.user.tag || ban.user.username}\`) was banned from the server.`,
      }
    ).catch(() => null);
  },
};
