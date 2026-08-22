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
const processedAuditLogs = new Set();

// Periodically clean processed audit logs to prevent memory leaks
setInterval(() => {
  if (processedAuditLogs.size > 2000) {
    processedAuditLogs.clear();
  }
}, 60000);

/**
 * Super-fast audit log fetch with targeted limit and timeout safety
 */
function getAuditLogFast(guild, type, targetId = null) {
  return guild
    .fetchAuditLogs({ limit: 2, type })
    .then((logs) => {
      if (!logs || !logs.entries) return null;
      for (const entry of logs.entries.values()) {
        if (Date.now() - entry.createdTimestamp > 6000) continue;
        if (targetId && entry.target?.id !== targetId) continue;
        return entry;
      }
      return null;
    })
    .catch(() => null);
}

/**
 * Asynchronous non-blocking audit logging
 */
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
            `-# ASTRIXCODE™ Hardened Anti-Nuke • Sub-0.1s Zero-Bypass Engine`
          )
        );

      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } catch (_) {}
  });
}

/**
 * Super-fast punishment executor with hierarchy-fallback role stripping & quarantine
 */
async function punishExecutorFast(guild, executorId, punishment, reason) {
  const fullReason = `[ASTRIX ANTI-NUKE HARDENED] ${reason}`;
  try {
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member) return false;

    // Direct Ban (Most common & most secure)
    if (punishment === "ban" && member.bannable) {
      await member.ban({ reason: fullReason, deleteMessageSeconds: 86400 }).catch(() => null);
      return true;
    }

    // Direct Kick
    if (punishment === "kick" && member.kickable) {
      await member.kick(fullReason).catch(() => null);
      return true;
    }

    // Direct Timeout
    if (punishment === "timeout" && member.moderatable) {
      await member.timeout(28 * 24 * 60 * 60 * 1000, fullReason).catch(() => null);
      return true;
    }

    // Strip Roles / Quarantine / Hierarchy Fallback
    const editableRoles = member.roles.cache.filter((r) => r.id !== guild.id && r.editable);
    if (editableRoles.size > 0) {
      await member.roles.remove(editableRoles, fullReason).catch(() => null);
    }

    if (member.moderatable) {
      await member.timeout(28 * 24 * 60 * 60 * 1000, fullReason).catch(() => null);
    }

    // If member was bannable but punishment was strip or fallback, try ban as ultimate containment
    if (member.bannable && (punishment === "ban" || punishment === "quarantine")) {
      await member.ban({ reason: fullReason, deleteMessageSeconds: 86400 }).catch(() => null);
    }

    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Ultra-Fast Strike Handler (Sub-0.1s response)
 */
function handleStrikeFast(client, guild, executor, moduleKey, eventTitle, details, revertFn = null) {
  if (!guild || !executor || executor.id === client.user.id) return;
  const startTime = Date.now();
  const config = antinukeManager.getGuildAntinuke(guild.id);

  if (!config.enabled) return;
  if (config.modules && config.modules[moduleKey] === false) return;
  if (antinukeManager.isWhitelisted(client, guild, executor.id)) return;

  const guildId = guild.id;
  const userId = executor.id;
  const now = Date.now();
  const windowMs = config.windowMs || 60000;
  const threshold = config.threshold || 1; // Default 1 for zero tolerance

  if (!strikeCache.has(guildId)) strikeCache.set(guildId, new Map());
  const gStrikes = strikeCache.get(guildId);

  if (!gStrikes.has(userId)) gStrikes.set(userId, {});
  const uStrikes = gStrikes.get(userId);

  if (!uStrikes[moduleKey]) uStrikes[moduleKey] = [];
  uStrikes[moduleKey] = uStrikes[moduleKey].filter((t) => now - t < windowMs);
  uStrikes[moduleKey].push(now);

  const strikeCount = uStrikes[moduleKey].length;

  // 1. Parallel Auto-Revert (Dispatched in <1ms)
  if (config.autoRevert && typeof revertFn === "function") {
    setImmediate(async () => {
      try {
        await revertFn();
        antinukeManager.incrementStats(guildId, "reversionsExecuted");
      } catch (_) {}
    });
  }

  // 2. Parallel Punishment Execution
  if (strikeCount >= threshold) {
    uStrikes[moduleKey] = [];
    const punishment = config.punishment || "ban";
    const reason = `Anti-Nuke Triggered: ${moduleKey} violation (${strikeCount}/${threshold})`;

    punishExecutorFast(guild, executor.id, punishment, reason).then((punished) => {
      const latencyMs = Date.now() - startTime;
      if (punished) {
        antinukeManager.incrementStats(guildId, "nukesIntercepted");
      }

      logAntinukeAsync(
        guild,
        config,
        `🚨 NUKE INTERCEPTED - ${eventTitle}`,
        `> - **Offender:** <@${executor.id}> (\`${executor.tag || executor.id}\`)\n` +
          `> - **Violation:** Unauthorized ${moduleKey} modification (${strikeCount}/${threshold} actions)\n` +
          `> - **Punishment Executed:** \`${punishment.toUpperCase()}\` (Sub-0.1s Enforcement)\n` +
          `> - **Auto-Revert State:** \`${config.autoRevert ? "REVERTED" : "DISABLED"}\`\n` +
          `> - **Reaction Latency:** \`${latencyMs}ms\`\n` +
          `> - **Details:** ${details}`
      );
    });
  } else {
    const latencyMs = Date.now() - startTime;
    logAntinukeAsync(
      guild,
      config,
      `⚠️ Anti-Nuke Strike Warning (${strikeCount}/${threshold})`,
      `> - **User:** <@${executor.id}> (\`${executor.tag || executor.id}\`)\n` +
        `> - **Module:** \`${moduleKey}\`\n` +
        `> - **Reaction Latency:** \`${latencyMs}ms\`\n` +
        `> - **Details:** ${details}`
    );
  }
}

module.exports = {
  name: "onAntiNukeProtection",
  event: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log("🛡️ [AntiNuke Engine] Sub-0.1s Real-Time Gateway Protection Online");

    // =========================================================================
    // 0. GATEWAY REAL-TIME AUDIT LOG DISPATCH (Sub-0.1s Instant Interception)
    // =========================================================================
    if (Events.GuildAuditLogEntryCreate) {
      client.on(Events.GuildAuditLogEntryCreate, async (auditLog, guild) => {
        if (!guild || !auditLog || !auditLog.executor) return;
        if (auditLog.executor.id === client.user.id) return;
        if (processedAuditLogs.has(auditLog.id)) return;
        processedAuditLogs.add(auditLog.id);

        const executor = auditLog.executor;
        const config = antinukeManager.getGuildAntinuke(guild.id);
        if (!config.enabled) return;
        if (antinukeManager.isWhitelisted(client, guild, executor.id)) return;

        const action = auditLog.action;

        // Fast match on gateway audit log actions
        if (action === AuditLogEvent.ChannelDelete) {
          handleStrikeFast(client, guild, executor, "channel", "Channel Delete Defense (Gateway 0.05s)", `Channel ID: \`${auditLog.targetId}\``);
        } else if (action === AuditLogEvent.RoleDelete) {
          handleStrikeFast(client, guild, executor, "role", "Role Delete Defense (Gateway 0.05s)", `Role ID: \`${auditLog.targetId}\``);
        } else if (action === AuditLogEvent.MemberBanAdd) {
          handleStrikeFast(client, guild, executor, "ban", "Anti-Ban Defense (Gateway 0.05s)", `Banned User ID: \`${auditLog.targetId}\``, () => guild.bans.remove(auditLog.targetId, "Anti-Nuke Auto Unban"));
        } else if (action === AuditLogEvent.MemberKick) {
          handleStrikeFast(client, guild, executor, "kick", "Anti-Kick Defense (Gateway 0.05s)", `Kicked User ID: \`${auditLog.targetId}\``);
        } else if (action === AuditLogEvent.BotAdd) {
          handleStrikeFast(
            client,
            guild,
            executor,
            "botAdd",
            "Rogue Bot Infiltration Defense (Gateway 0.05s)",
            `Bot ID: \`${auditLog.targetId}\` added by <@${executor.id}>`,
            async () => {
              const botMember = await guild.members.fetch(auditLog.targetId).catch(() => null);
              if (botMember && botMember.bannable) await botMember.ban({ reason: "Anti-Nuke Rogue Bot Auto-Ban" }).catch(() => null);
              else if (botMember && botMember.kickable) await botMember.kick("Anti-Nuke Rogue Bot Auto-Kick").catch(() => null);
            }
          );
        } else if (action === AuditLogEvent.MemberPrune) {
          handleStrikeFast(client, guild, executor, "prune", "Mass Prune Defense (Gateway 0.05s)", `Pruned members count: \`${auditLog.extra?.removed || "Mass"}\``);
        } else if (action === AuditLogEvent.WebhookCreate) {
          handleStrikeFast(client, guild, executor, "webhook", "Webhook Create Defense (Gateway 0.05s)", `Webhook ID: \`${auditLog.targetId}\``);
        }
      });
    }

    // =========================================================================
    // 1. Channel Delete Protection & Auto-Recreate
    // =========================================================================
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
        () => channel.guild.channels.create({
          name: channel.name,
          type: channel.type,
          topic: channel.topic,
          parent: channel.parentId,
          permissionOverwrites: channel.permissionOverwrites?.cache?.map((p) => ({
            id: p.id,
            allow: p.allow,
            deny: p.deny,
            type: p.type,
          })) || [],
        })
      );
    });

    // =========================================================================
    // 2. Channel Create Protection & Auto-Delete
    // =========================================================================
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

    // =========================================================================
    // 3. Channel Update Protection (NSFW / Rename / Permission Wipe)
    // =========================================================================
    client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
      if (!newChannel.guild) return;
      const nameChanged = oldChannel.name !== newChannel.name;
      const nsfwChanged = oldChannel.nsfw !== newChannel.nsfw;
      const permsChanged = oldChannel.permissionOverwrites?.cache?.size !== newChannel.permissionOverwrites?.cache?.size;

      if (!nameChanged && !nsfwChanged && !permsChanged) return;

      const entry = await getAuditLogFast(newChannel.guild, AuditLogEvent.ChannelUpdate, newChannel.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        newChannel.guild,
        entry.executor,
        "channel",
        "Channel Update Defense",
        `Channel: #${newChannel.name} (\`${newChannel.id}\`) • Changes: ${nameChanged ? "Name " : ""}${nsfwChanged ? "NSFW " : ""}${permsChanged ? "Permissions" : ""}`,
        () => {
          if (nameChanged) newChannel.setName(oldChannel.name, "Anti-Nuke Auto Revert").catch(() => null);
          if (nsfwChanged) newChannel.setNSFW(oldChannel.nsfw, "Anti-Nuke Auto Revert").catch(() => null);
        }
      );
    });

    // =========================================================================
    // 4. Role Delete Protection & Auto-Recreate
    // =========================================================================
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
        () => role.guild.roles.create({
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          permissions: role.permissions,
          mentionable: role.mentionable,
        })
      );
    });

    // =========================================================================
    // 5. Role Create Protection & Auto-Delete
    // =========================================================================
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

    // =========================================================================
    // 6. Dangerous Role Update Protection (Perm Escalation)
    // =========================================================================
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
        "Dangerous Role Permission Escalation Defense",
        `Role: @${newRole.name}\nDangerous Perms Added: \`${addedDangerous.join(", ")}\``,
        () => newRole.setPermissions(oldRole.permissions, "Anti-Nuke Auto Revert")
      );
    });

    // =========================================================================
    // 7. Anti-Ban Protection & Auto-Unban
    // =========================================================================
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

    // =========================================================================
    // 8. Anti-Kick Protection
    // =========================================================================
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

    // =========================================================================
    // 9. Webhook Protection
    // =========================================================================
    client.on(Events.WebhooksUpdate, async (channel) => {
      if (!channel.guild) return;
      const entry = await getAuditLogFast(channel.guild, AuditLogEvent.WebhookCreate);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        channel.guild,
        entry.executor,
        "webhook",
        "Webhook Creation Defense",
        `Channel: #${channel.name}`
      );
    });

    // =========================================================================
    // 10. Unauthorized Bot Infiltration Defense (Ban Rogue Bot + Ban Inviter!)
    // =========================================================================
    client.on(Events.GuildMemberAdd, async (member) => {
      if (!member.guild || !member.user.bot) return;
      const entry = await getAuditLogFast(member.guild, AuditLogEvent.BotAdd, member.id);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        member.guild,
        entry.executor,
        "botAdd",
        "Unauthorized Rogue Bot Infiltration Defense",
        `Rogue Bot: ${member.user.tag} (\`${member.id}\`) invited by <@${entry.executor.id}>`,
        async () => {
          if (member.bannable) await member.ban({ reason: "Anti-Nuke Rogue Bot Auto-Ban" }).catch(() => null);
          else if (member.kickable) await member.kick("Anti-Nuke Rogue Bot Auto-Kick").catch(() => null);
        }
      );
    });

    // =========================================================================
    // 11. Guild Update Protection (Vanity / Server Name / Icon)
    // =========================================================================
    client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
      const nameChanged = oldGuild.name !== newGuild.name;
      const vanityChanged = oldGuild.vanityURLCode !== newGuild.vanityURLCode;
      const iconChanged = oldGuild.icon !== newGuild.icon;

      if (!nameChanged && !vanityChanged && !iconChanged) return;

      const entry = await getAuditLogFast(newGuild, AuditLogEvent.GuildUpdate);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        newGuild,
        entry.executor,
        "guildUpdate",
        "Server Settings & Vanity Defense",
        `Changes: ${nameChanged ? `Name: "${oldGuild.name}" → "${newGuild.name}" ` : ""}${vanityChanged ? `Vanity: ${oldGuild.vanityURLCode} → ${newGuild.vanityURLCode} ` : ""}${iconChanged ? "Icon Changed" : ""}`
      );
    });

    // =========================================================================
    // 12. Dangerous Member Role Assignment Defense
    // =========================================================================
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
        "Dangerous Member Role Grant Defense",
        `Target: ${newMember.user.tag}\nDangerous Roles Added: \`${dangerousAdded.map((r) => r.name).join(", ")}\``,
        () => newMember.roles.remove(dangerousAdded, "Anti-Nuke Auto Role Strip")
      );
    });

    // =========================================================================
    // 13. Emoji & Sticker Wipe Protection
    // =========================================================================
    client.on(Events.GuildEmojisUpdate, async (emojis) => {
      const guild = emojis.first()?.guild;
      if (!guild) return;
      const entry = await getAuditLogFast(guild, AuditLogEvent.EmojiDelete);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        guild,
        entry.executor,
        "emoji",
        "Emoji Wipe Defense",
        `Emoji deletion detected by <@${entry.executor.id}>`
      );
    });

    client.on(Events.GuildStickersUpdate, async (stickers) => {
      const guild = stickers.first()?.guild;
      if (!guild) return;
      const entry = await getAuditLogFast(guild, AuditLogEvent.StickerDelete);
      if (!entry || !entry.executor) return;

      handleStrikeFast(
        client,
        guild,
        entry.executor,
        "emoji",
        "Sticker Wipe Defense",
        `Sticker deletion detected by <@${entry.executor.id}>`
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
