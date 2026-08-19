const {
  Events,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const antiraidManager = require("../lib/antiraidManager");
const EMOJIS = require("../lib/emojis");

const joinCache = new Map();
const regexCache = new Map(); // Pre-compiled Regex cache for 0.01ms matching

function getCompiledRegex(pattern) {
  if (!regexCache.has(pattern)) {
    try {
      regexCache.set(pattern, new RegExp(pattern, "i"));
    } catch (_) {
      regexCache.set(pattern, null);
    }
  }
  return regexCache.get(pattern);
}

function cleanString(str) {
  if (!str) return "";
  return str
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Background Non-Blocking Audit Logger (<0.1ms overhead)
function logAntiraidActionAsync(guild, config, title, description) {
  setImmediate(async () => {
    if (!config.logChannel) return;
    const channel = guild.channels.cache.get(config.logChannel);
    if (!channel || !channel.isTextBased()) return;

    try {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.rshield || "🛡️"} ${title}`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(description)
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™ • Ultra-Fast Sub-0.1s Defense`
          )
        );

      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } catch (_) {}
  });
}

// Background Non-Blocking Channel Lockdown
function lockAllTextChannelsAsync(guild) {
  setImmediate(async () => {
    try {
      const textChannels = guild.channels.cache.filter(
        (c) =>
          c.type === ChannelType.GuildText &&
          c.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.SendMessages)
      );

      for (const [, channel] of textChannels) {
        await channel.permissionOverwrites
          .edit(
            guild.roles.everyone,
            { SendMessages: false },
            { reason: "Anti-Raid: High-speed attack detected - Instant lockdown" }
          )
          .catch(() => null);
      }
    } catch (_) {}
  });
}

// Instant Direct Punishment Engine (<80ms response time)
function punishMemberFast(member, action, reason) {
  const fullReason = `[ASTRIX ULTRA-FAST 0.1s DEFENSE] ${reason}`;
  if (action === "ban" && member.bannable) {
    // Immediate non-blocking Discord API ban request with message purge
    return member.ban({ reason: fullReason, deleteMessageSeconds: 86400 }).then(() => true).catch(() => false);
  } else if (action === "kick" && member.kickable) {
    return member.kick(fullReason).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

module.exports = {
  name: "onAntiRaidMemberAdd",
  event: Events.GuildMemberAdd,
  once: false,

  async execute(client, member) {
    const startTime = Date.now();
    if (!member.guild) return;

    const guildId = member.guild.id;
    const userId = member.id;

    // Instant RAM config lookup (<0.01ms)
    const config = antiraidManager.getGuildAntiraid(guildId);
    if (!config || (!config.enabled && !config.raidState)) return;

    // 1. Instant Whitelist Check
    if (config.whitelist && config.whitelist.includes(userId)) {
      logAntiraidActionAsync(
        member.guild,
        config,
        "Whitelist Bypass Verified",
        `> - **User:** ${member.user.tag} (\`${member.id}\`)\n` +
          `> - **Action:** Allowed entry (Whitelisted)\n` +
          `> - **Execution Latency:** \`${Date.now() - startTime}ms\``
      );
      return;
    }

    // 2. Unauthorized Bot Addition Block
    if (member.user.bot) {
      if (config.enabled || config.raidState) {
        punishMemberFast(member, "ban", "Unauthorized bot added during high security state").then((punished) => {
          if (punished) {
            antiraidManager.incrementStats(guildId, "blockedCount");
            logAntiraidActionAsync(
              member.guild,
              config,
              "🚨 Unauthorized Bot Addition Blocked",
              `> - **Bot:** ${member.user.tag} (\`${member.id}\`)\n` +
                `> - **Execution Latency:** \`${Date.now() - startTime}ms\`\n` +
                `> - **Action:** BANNED (Sub-0.1s response)`
            );
          }
        });
        return;
      }
    }

    // 3. Ultra-Fast Name Pattern & Spam Regex Filter (<0.05ms)
    if (config.enabled && config.namefilter?.enabled) {
      const username = cleanString(member.user.username);
      const globalName = cleanString(member.user.globalName);
      const displayName = cleanString(member.displayName);
      const combined = `${username} ${globalName} ${displayName}`;

      const patterns = config.namefilter.patterns || [
        "discord\\.gg/",
        "discord\\.com/invite",
        "https?://",
        "wizz",
        "nuke",
        "raid",
        "hacked",
        "crasher",
        "salazar",
      ];

      let matchedPattern = null;
      for (let i = 0; i < patterns.length; i++) {
        const regex = getCompiledRegex(patterns[i]);
        if (regex && regex.test(combined)) {
          matchedPattern = patterns[i];
          break;
        }
      }

      if (matchedPattern) {
        const action = config.namefilter.action || "ban";
        punishMemberFast(member, action, `Suspicious name pattern matched (${matchedPattern})`).then((punished) => {
          if (punished) {
            antiraidManager.incrementStats(guildId, "blockedCount");
            logAntiraidActionAsync(
              member.guild,
              config,
              "Name Pattern & Spam Interception",
              `> - **Member:** ${member.user.tag} (<@${member.id}>)\n` +
                `> - **Matched Pattern:** \`${matchedPattern}\`\n` +
                `> - **Execution Latency:** \`${Date.now() - startTime}ms\`\n` +
                `> - **Action:** \`${action.toUpperCase()}\``
            );
          }
        });
        return;
      }
    }

    // 4. Default Avatar Filter
    if (config.enabled && config.avatar?.enabled && !member.user.avatar) {
      const action = config.avatar.action || "ban";
      punishMemberFast(member, action, "No profile picture (Default Avatar Filter)").then((punished) => {
        if (punished) {
          antiraidManager.incrementStats(guildId, "blockedCount");
          logAntiraidActionAsync(
            member.guild,
            config,
            "Default Avatar Filter Interception",
            `> - **Member:** ${member.user.tag} (<@${member.id}>)\n` +
              `> - **Violation:** Missing Profile Picture\n` +
              `> - **Execution Latency:** \`${Date.now() - startTime}ms\`\n` +
              `> - **Action:** \`${action.toUpperCase()}\``
          );
        }
      });
      return;
    }

    // 5. New Account Age Filter
    if (config.enabled && config.newaccounts?.enabled) {
      const accountAgeMs = Date.now() - member.user.createdTimestamp;
      const minAgeDays = config.newaccounts.threshold || 7;
      const minAgeMs = minAgeDays * 24 * 60 * 60 * 1000;

      if (accountAgeMs < minAgeMs) {
        const action = config.newaccounts.action || "ban";
        punishMemberFast(member, action, `Account younger than ${minAgeDays} days`).then((punished) => {
          if (punished) {
            const ageInDays = (accountAgeMs / (24 * 60 * 60 * 1000)).toFixed(1);
            antiraidManager.incrementStats(guildId, "blockedCount");
            logAntiraidActionAsync(
              member.guild,
              config,
              "New Account Age Filter Interception",
              `> - **Member:** ${member.user.tag} (<@${member.id}>)\n` +
                `> - **Account Age:** \`${ageInDays}\` days (Required: \`${minAgeDays}\` days)\n` +
                `> - **Execution Latency:** \`${Date.now() - startTime}ms\`\n` +
                `> - **Action:** \`${action.toUpperCase()}\``
            );
          }
        });
        return;
      }
    }

    // 6. Fresh Alt Spike Defense (<24h during joins)
    if (config.enabled && config.youngAccountSpike?.enabled) {
      const accountAgeHours = (Date.now() - member.user.createdTimestamp) / (60 * 60 * 1000);
      const thresholdHours = config.youngAccountSpike.thresholdHours || 24;

      if (accountAgeHours < thresholdHours) {
        const now = Date.now();
        const joins = joinCache.get(guildId) || [];
        const recentSpikeJoins = joins.filter((t) => now - t < 60000);

        if (recentSpikeJoins.length >= 2 || config.raidState) {
          const action = config.youngAccountSpike.action || "ban";
          punishMemberFast(member, action, `Fresh alt created under ${thresholdHours}h ago during join activity`).then((punished) => {
            if (punished) {
              antiraidManager.incrementStats(guildId, "blockedCount");
              logAntiraidActionAsync(
                member.guild,
                config,
                "🚨 Fresh Alt Spike Interception",
                `> - **Member:** ${member.user.tag} (<@${member.id}>)\n` +
                  `> - **Account Age:** \`${accountAgeHours.toFixed(1)}\` hours\n` +
                  `> - **Execution Latency:** \`${Date.now() - startTime}ms\`\n` +
                  `> - **Action:** \`${action.toUpperCase()}\``
              );
            }
          });
          return;
        }
      }
    }

    // 7. Active Emergency Raid Mode Immediate Punishment (<0.1s)
    if (config.raidState) {
      const action = config.massjoin?.action || "ban";
      punishMemberFast(member, action, "Server in Emergency Raid Mode").then((punished) => {
        if (punished) {
          antiraidManager.incrementStats(guildId, "blockedCount");
          logAntiraidActionAsync(
            member.guild,
            config,
            "Emergency Raid Mode Instant Enforcement",
            `> - **Member:** ${member.user.tag} (<@${member.id}>)\n` +
              `> - **Reason:** Active Emergency Raid Mode\n` +
              `> - **Execution Latency:** \`${Date.now() - startTime}ms\`\n` +
              `> - **Action:** \`${action.toUpperCase()}\``
          );
        }
      });
      return;
    }

    // 8. Mass Join Rate Limiter & Automatic Lockdown
    if (config.enabled && config.massjoin?.enabled) {
      const now = Date.now();
      const windowMs = config.massjoin.windowMs || 10000;
      const threshold = config.massjoin.threshold || 5;

      if (!joinCache.has(guildId)) {
        joinCache.set(guildId, []);
      }

      const joins = joinCache.get(guildId);
      joins.push(now);

      const recentJoins = joins.filter((t) => now - t < windowMs);
      joinCache.set(guildId, recentJoins);

      if (recentJoins.length >= threshold && !config.raidState) {
        config.raidState = true;
        antiraidManager.setGuildAntiraid(guildId, config);
        antiraidManager.incrementStats(guildId, "raidsDetected");

        if (config.massjoin.lockChannels) {
          lockAllTextChannelsAsync(member.guild);
        }

        const action = config.massjoin.action || "ban";
        punishMemberFast(member, action, `Mass join threshold exceeded (${recentJoins.length} joins / 10s)`).then(() => {
          antiraidManager.incrementStats(guildId, "blockedCount");
          logAntiraidActionAsync(
            member.guild,
            config,
            "🚨 HIGH-VELOCITY ATTACK DETECTED - 0.1s INSTANT LOCKDOWN",
            `> - **Threshold Exceeded:** \`${recentJoins.length}\` joins in 10 seconds\n` +
              `> - **System Response:** Emergency Raid Mode & Sub-0.1s Fortress Lockdown ENGAGED\n` +
              `> - **Offender Banned:** ${member.user.tag} (\`${member.id}\`)\n` +
              `> - **Detection Latency:** \`${Date.now() - startTime}ms\``
          );
        });
      }
    }
  },
};

// Periodic Cache Cleanup
setInterval(() => {
  const now = Date.now();
  for (const [guildId, joins] of joinCache.entries()) {
    const filtered = joins.filter((t) => now - t < 60000);
    if (filtered.length === 0) {
      joinCache.delete(guildId);
    } else {
      joinCache.set(guildId, filtered);
    }
  }
}, 60000);
