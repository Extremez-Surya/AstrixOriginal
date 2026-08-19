const {
  Events,
  AuditLogEvent,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const antinukeManager = require("../lib/antinukeManager");
const EMOJIS = require("../lib/emojis");

const DANGEROUS_PERMISSIONS = [
  "Administrator",
  "BanMembers",
  "KickMembers",
  "ManageGuild",
  "ManageChannels",
  "ManageRoles",
  "ManageWebhooks",
  "ManageEmojisAndStickers",
  "MentionEveryone",
  "ModerateMembers",
];

const strikeCache = new Map();

function getAuditLogFast(guild, type, targetId = null) {
  return guild
    .fetchAuditLogs({ limit: 3, type })
    .then((logs) => {
      if (!logs || !logs.entries) return null;
      for (const entry of logs.entries.values()) {
        if (Date.now() - entry.createdTimestamp > 8000) continue;
        if (targetId && entry.target?.id !== targetId) continue;
        return entry;
      }
      return null;
    })
    .catch(() => null);
}

function logAntinukeAsync(guild, config, title, description) {
  setImmediate(async () => {
    if (!config.logChannel) return;
    const channel = guild.channels.cache.get(config.logChannel);
    if (!channel || !channel.isTextBased()) return;

    try {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### ${EMOJIS.antinuke || "🔒"} ${title}`)
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# ASTRIXCODE™ Hardened Anti-Nuke • Sub-0.1s Execution Engine`
          )
        );

      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } catch (_) {}
  });
}

function punishExecutorFast(guild, executorId, punishment, reason) {
  const fullReason = `[ASTRIX ANTI-NUKE HARDENED] ${reason}`;
  return guild.members
    .fetch(executorId)
    .then(async (member) => {
      if (!member) return false;

      if (punishment === "ban" && member.bannable) {
        await member.ban({ reason: fullReason, deleteMessageSeconds: 86400 });
        return true;
      } else if (punishment === "kick" && member.kickable) {
        await member.kick(fullReason);
        return true;
      } else if (punishment === "strip") {
        const editableRoles = member.roles.cache.filter((r) => r.id !== guild.id && r.editable);
        await member.roles.remove(editableRoles, fullReason);
        return true;
      } else if (punishment === "timeout") {
        await member.timeout(28 * 24 * 60 * 60 * 1000, fullReason);
        return true;
      } else if (member.bannable) {
        await member.ban({ reason: fullReason, deleteMessageSeconds: 86400 });
        return true;
      }
      return false;
    })
    .catch(() => false);
}

function handleStrikeFast(client, guild, executor, moduleKey, eventTitle, details, revertFn = null) {
  const startTime = Date.now();
  const config = antinukeManager.getGuildAntinuke(guild.id);

  if (!config.enabled) return;
  if (config.modules && config.modules[moduleKey] === false) return;
  if (antinukeManager.isWhitelisted(client, guild, executor.id)) return;

  const guildId = guild.id;
  const userId = executor.id;
  const now = Date.now();
  const windowMs = config.windowMs || 60000;
  const threshold = config.threshold || 2;

  if (!strikeCache.has(guildId)) strikeCache.set(guildId, new Map());
  const gStrikes = strikeCache.get(guildId);

  if (!gStrikes.has(userId)) gStrikes.set(userId, {});
  const uStrikes = gStrikes.get(userId);

  if (!uStrikes[moduleKey]) uStrikes[moduleKey] = [];
  uStrikes[moduleKey] = uStrikes[moduleKey].filter((t) => now - t < windowMs);
  uStrikes[moduleKey].push(now);

  const strikeCount = uStrikes[moduleKey].length;

  // Auto-Revert if enabled
  if (config.autoRevert && typeof revertFn === "function") {
    setImmediate(async () => {
      try {
        await revertFn();
        antinukeManager.incrementStats(guildId, "reversionsExecuted");
      } catch (_) {}
    });
  }

  // Punish immediately on threshold hit
  if (strikeCount >= threshold) {
    uStrikes[moduleKey] = [];
    const punishment = config.punishment || "ban";
    const reason = `Anti-Nuke Triggered: ${moduleKey} limit exceeded (${strikeCount}/${threshold})`;

    punishExecutorFast(guild, executor.id, punishment, reason).then((punished) => {
      if (punished) {
        antinukeManager.incrementStats(guildId, "nukesIntercepted");
      }
      logAntinukeAsync(
        guild,
        config,
        `🚨 NUKE ATTACK NEUTRALIZED - ${eventTitle}`,
        `> - **Offender:** ${executor.tag} (\`${executor.id}\`)\n` +
          `> - **Violation:** Unauthorized ${moduleKey} modification (${strikeCount}/${threshold} actions)\n` +
          `> - **Punishment Executed:** \`${punishment.toUpperCase()}\` (Sub-0.1s Response)\n` +
          `> - **Auto-Revert State:** \`${config.autoRevert ? "EXECUTED" : "DISABLED"}\` \n` +
          `> - **Execution Latency:** \`${Date.now() - startTime}ms\`\n` +
          `> - **Details:** ${details}`
      );
    });
  } else {
    logAntinukeAsync(
      guild,
      config,
      `⚠️ Anti-Nuke Strike Warning (${strikeCount}/${threshold})`,
      `> - **User:** ${executor.tag} (\`${executor.id}\`)\n` +
        `> - **Module:** \`${moduleKey}\`\n` +
        `> - **Details:** ${details}\n` +
        `> - **Execution Latency:** \`${Date.now() - startTime}ms\``
    );
  }
}

module.exports = {
  name: "onAntiNukeProtection",
  event: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log("🛡️ [AntiNuke Engine] Sub-0.1s Hardened Gateway Listeners Active");

    // 1. Channel Delete Protection
    client.on(Events.ChannelDelete, async (channel) => {
      if (!channel.guild) return;
      const entry = await getAuditLogFast(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        channel.guild,
        entry.executor,
        "channel",
        "Channel Delete Defense",
        `Channel: #${channel.name} (\`${channel.id}\`)`,
        () => channel.guild.channels.create({ name: channel.name, type: channel.type, parent: channel.parentId })
      );
    });

    // 2. Channel Create Protection
    client.on(Events.ChannelCreate, async (channel) => {
      if (!channel.guild) return;
      const entry = await getAuditLogFast(channel.guild, AuditLogEvent.ChannelCreate, channel.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        channel.guild,
        entry.executor,
        "channel",
        "Channel Create Defense",
        `Channel: #${channel.name} (\`${channel.id}\`)`,
        () => channel.delete("Anti-Nuke Auto Revert")
      );
    });

    // 3. Role Delete Protection
    client.on(Events.GuildRoleDelete, async (role) => {
      const entry = await getAuditLogFast(role.guild, AuditLogEvent.RoleDelete, role.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        role.guild,
        entry.executor,
        "role",
        "Role Delete Defense",
        `Role: @${role.name} (\`${role.id}\`)`,
        () => role.guild.roles.create({ name: role.name, color: role.color, permissions: role.permissions })
      );
    });

    // 4. Role Create Protection
    client.on(Events.GuildRoleCreate, async (role) => {
      const entry = await getAuditLogFast(role.guild, AuditLogEvent.RoleCreate, role.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        role.guild,
        entry.executor,
        "role",
        "Role Create Defense",
        `Role: @${role.name} (\`${role.id}\`)`,
        () => role.delete("Anti-Nuke Auto Revert")
      );
    });

    // 5. Dangerous Role Update Protection
    client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
      const addedDangerous = DANGEROUS_PERMISSIONS.filter(
        (p) => !oldRole.permissions.has(p) && newRole.permissions.has(p)
      );
      if (addedDangerous.length === 0) return;

      const entry = await getAuditLogFast(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        newRole.guild,
        entry.executor,
        "permissions",
        "Dangerous Role Permission Defense",
        `Role: @${newRole.name}\nDangerous Perms Granted: \`${addedDangerous.join(", ")}\``,
        () => newRole.setPermissions(oldRole.permissions, "Anti-Nuke Auto Revert")
      );
    });

    // 6. Anti-Ban Protection
    client.on(Events.GuildBanAdd, async (ban) => {
      const entry = await getAuditLogFast(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        ban.guild,
        entry.executor,
        "ban",
        "Anti-Ban Defense",
        `Target Banned: ${ban.user.tag} (\`${ban.user.id}\`)`,
        () => ban.guild.bans.remove(ban.user.id, "Anti-Nuke Auto Unban")
      );
    });

    // 7. Anti-Kick Protection
    client.on(Events.GuildMemberRemove, async (member) => {
      if (!member.guild) return;
      const entry = await getAuditLogFast(member.guild, AuditLogEvent.MemberKick, member.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        member.guild,
        entry.executor,
        "kick",
        "Anti-Kick Defense",
        `Target Kicked: ${member.user.tag} (\`${member.id}\`)`
      );
    });

    // 8. Webhook Protection
    client.on(Events.WebhooksUpdate, async (channel) => {
      if (!channel.guild) return;
      const entry = await getAuditLogFast(channel.guild, AuditLogEvent.WebhookCreate);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        channel.guild,
        entry.executor,
        "webhook",
        "Webhook Defense",
        `Channel: #${channel.name}`
      );
    });

    // 9. Unauthorized Bot Add Protection
    client.on(Events.GuildMemberAdd, async (member) => {
      if (!member.guild || !member.user.bot) return;
      const entry = await getAuditLogFast(member.guild, AuditLogEvent.BotAdd, member.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        member.guild,
        entry.executor,
        "botAdd",
        "Unauthorized Bot Add Defense",
        `Bot Added: ${member.user.tag} (\`${member.id}\`)`,
        () => member.kick("Anti-Nuke Auto Bot Kick")
      );
    });

    // 10. Guild Update Protection (Vanity / Server Name / Icon)
    client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
      const nameChanged = oldGuild.name !== newGuild.name;
      const vanityChanged = oldGuild.vanityURLCode !== newGuild.vanityURLCode;
      if (!nameChanged && !vanityChanged) return;

      const entry = await getAuditLogFast(newGuild, AuditLogEvent.GuildUpdate);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        newGuild,
        entry.executor,
        "guildUpdate",
        "Guild Settings Defense",
        `Changes: ${nameChanged ? `Name: ${oldGuild.name} → ${newGuild.name}` : ""} ${vanityChanged ? `Vanity: ${oldGuild.vanityURLCode} → ${newGuild.vanityURLCode}` : ""}`
      );
    });

    // 11. Dangerous Member Role Assignment Defense
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
      if (!newMember.guild) return;
      const addedRoles = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
      if (addedRoles.size === 0) return;

      const dangerousAdded = addedRoles.filter((r) =>
        DANGEROUS_PERMISSIONS.some((p) => r.permissions.has(p))
      );
      if (dangerousAdded.size === 0) return;

      const entry = await getAuditLogFast(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        newMember.guild,
        entry.executor,
        "permissions",
        "Member Dangerous Role Assignment Defense",
        `Target Member: ${newMember.user.tag}\nDangerous Roles Added: \`${dangerousAdded.map((r) => r.name).join(", ")}\``,
        () => newMember.roles.remove(dangerousAdded, "Anti-Nuke Auto Role Strip")
      );
    });
  },
};

// Cleanup strike cache every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [guildId, gStrikes] of strikeCache.entries()) {
    for (const [userId, uStrikes] of gStrikes.entries()) {
      let active = false;
      for (const [mod, timestamps] of Object.entries(uStrikes)) {
        uStrikes[mod] = timestamps.filter((t) => now - t < 300000);
        if (uStrikes[mod].length > 0) active = true;
      }
      if (!active) gStrikes.delete(userId);
    }
    if (gStrikes.size === 0) strikeCache.delete(guildId);
  }
}, 60000);
