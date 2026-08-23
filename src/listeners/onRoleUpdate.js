const { Events, AuditLogEvent } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onRoleUpdate",
  event: Events.GuildRoleUpdate,
  once: false,

  async execute(client, oldRole, newRole) {
    if (!newRole || !newRole.guild) return;

    const changes = [];
    let beforeVal = "";
    let afterVal = "";

    // 1. Role Name
    if (oldRole.name !== newRole.name) {
      changes.push(`Role renamed: \`${oldRole.name}\` ➔ \`${newRole.name}\``);
      beforeVal = oldRole.name;
      afterVal = newRole.name;
    }

    // 2. Role Color
    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push(`Color changed: \`${oldRole.hexColor}\` ➔ \`${newRole.hexColor}\``);
    }

    // 3. Hoist (Display separately)
    if (oldRole.hoist !== newRole.hoist) {
      changes.push(`Hoist changed: \`${Boolean(oldRole.hoist)}\` ➔ \`${Boolean(newRole.hoist)}\``);
    }

    // 4. Mentionable
    if (oldRole.mentionable !== newRole.mentionable) {
      changes.push(`Mentionable changed: \`${Boolean(oldRole.mentionable)}\` ➔ \`${Boolean(newRole.mentionable)}\``);
    }

    // 5. Permissions
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      changes.push("Role permissions were modified");
    }

    if (changes.length === 0) return;

    let executor = null;
    try {
      const logs = await newRole.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate }).catch(() => null);
      if (logs && logs.entries.size > 0) {
        const entry = logs.entries.first();
        if (entry && entry.target?.id === newRole.id && Date.now() - entry.createdTimestamp < 8000) {
          executor = entry.executor;
        }
      }
    } catch (_) {}

    await loggingManager.dispatchLog(
      client,
      newRole.guild.id,
      "roleUpdate",
      {
        role: newRole,
        executor,
        details: changes.join("\n> - "),
        before: beforeVal || undefined,
        after: afterVal || undefined,
      }
    ).catch(() => null);
  },
};
