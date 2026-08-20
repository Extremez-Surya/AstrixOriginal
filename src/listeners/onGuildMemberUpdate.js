const { Events } = require("discord.js");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onGuildMemberUpdate",
  event: Events.GuildMemberUpdate,
  once: false,

  async execute(client, oldMember, newMember) {
    if (!newMember.guild) return;
    const guildId = newMember.guild.id;

    // 1. Nickname Change
    if (oldMember.nickname !== newMember.nickname) {
      loggingManager.dispatchLog(
        client,
        guildId,
        "nicknameUpdate",
        {
          target: newMember.user,
          before: oldMember.nickname || oldMember.user.username,
          after: newMember.nickname || newMember.user.username,
          details: `Nickname changed from \`${oldMember.nickname || oldMember.user.username}\` to \`${newMember.nickname || newMember.user.username}\``,
        },
        { author: newMember.user, member: newMember }
      ).catch(() => null);
    }

    // 2. Role Add / Remove
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter((r) => !oldRoles.has(r.id));
    const removedRoles = oldRoles.filter((r) => !newRoles.has(r.id));

    if (addedRoles.size > 0) {
      for (const [, role] of addedRoles) {
        loggingManager.dispatchLog(
          client,
          guildId,
          "roleAdd",
          {
            target: newMember.user,
            role,
            details: `Role assigned: <@&${role.id}> (\`${role.name}\`)`,
          },
          { author: newMember.user, member: newMember }
        ).catch(() => null);
      }
    }

    if (removedRoles.size > 0) {
      for (const [, role] of removedRoles) {
        loggingManager.dispatchLog(
          client,
          guildId,
          "roleRemove",
          {
            target: newMember.user,
            role,
            details: `Role removed: <@&${role.id}> (\`${role.name}\`)`,
          },
          { author: newMember.user, member: newMember }
        ).catch(() => null);
      }
    }

    // 3. Timeout Add / Remove
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    if (!oldTimeout && newTimeout && newTimeout > Date.now()) {
      loggingManager.dispatchLog(
        client,
        guildId,
        "timeoutAdd",
        {
          target: newMember.user,
          details: `Timed out until <t:${Math.floor(newTimeout / 1000)}:F> (<t:${Math.floor(newTimeout / 1000)}:R>)`,
        },
        { author: newMember.user, member: newMember }
      ).catch(() => null);
    } else if (oldTimeout && (!newTimeout || newTimeout <= Date.now())) {
      loggingManager.dispatchLog(
        client,
        guildId,
        "timeoutRemove",
        {
          target: newMember.user,
          details: `Timeout removed from member`,
        },
        { author: newMember.user, member: newMember }
      ).catch(() => null);
    }
  },
};
