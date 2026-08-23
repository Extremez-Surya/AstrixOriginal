const { Events, AuditLogEvent } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onGuildBanRemove",
  event: Events.GuildBanRemove,
  once: false,

  async execute(client, ban) {
    if (!ban || !ban.guild) return;

    let executor = null;
    try {
      const logs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove }).catch(() => null);
      if (logs && logs.entries.size > 0) {
        const entry = logs.entries.first();
        if (entry && entry.target?.id === ban.user?.id && Date.now() - entry.createdTimestamp < 8000) {
          executor = entry.executor;
        }
      }
    } catch (_) {}

    await loggingManager.dispatchLog(
      client,
      ban.guild.id,
      "memberUnban",
      {
        target: ban.user,
        executor,
        details: `Member <@${ban.user.id}> (\`${ban.user.tag || ban.user.username}\`) was unbanned from the server.`,
      }
    ).catch(() => null);
  },
};
