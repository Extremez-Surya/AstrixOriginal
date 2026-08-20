const {
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("./emojis");
const configManager = require("./configManager");
const securityConfig = require("./customRolesConfig.json");

// In-memory bypass tracking map: userId:guildId -> { count, timestamp }
const bypassTracker = new Map();

const RESERVED_SUBCOMMANDS = [
  "add",
  "remove",
  "del",
  "delete",
  "view",
  "list",
  "reqrole",
  "requiredrole",
  "perms",
  "reset",
  "security",
];

const DANGEROUS_PERMS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.ManageThreads,
  PermissionFlagsBits.ManageEvents,
  PermissionFlagsBits.MentionEveryone,
];

function getMemoryCache(client) {
  if (!client.customRolesCache) {
    client.customRolesCache = new Map();
  }
  return client.customRolesCache;
}

function getGuildConfig(client, guildId) {
  const cache = getMemoryCache(client);
  if (cache.has(guildId)) {
    return cache.get(guildId);
  }

  // Load from configManager
  const fullConfig = configManager.getGuildConfig(guildId);
  const crConfig = fullConfig.custom_roles || { aliases: {}, reqRole: null, antiBypass: true };
  cache.set(guildId, crConfig);
  return crConfig;
}

function updateGuildConfig(client, guildId, updateFn) {
  const cache = getMemoryCache(client);
  const current = getGuildConfig(client, guildId);
  const updated = updateFn({ ...current });

  cache.set(guildId, updated);
  configManager.updateGuildConfig(guildId, { custom_roles: updated });
  return updated;
}

function hasCustomRolePermission(member, reqRoleId) {
  if (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    return true;
  }

  if (reqRoleId) {
    return member.roles.cache.has(reqRoleId);
  }

  return member.permissions.has(PermissionFlagsBits.ManageRoles);
}

function checkDangerousPermissions(role) {
  for (const perm of DANGEROUS_PERMS) {
    if (role.permissions.has(perm)) {
      return true;
    }
  }
  return false;
}

function trackSecurityViolation(member) {
  const key = `${member.id}:${member.guild.id}`;
  const now = Date.now();
  const data = bypassTracker.get(key) || { count: 0, timestamp: now };

  if (now - data.timestamp > securityConfig.antiBypassWindowMs) {
    data.count = 1;
    data.timestamp = now;
  } else {
    data.count += 1;
  }

  bypassTracker.set(key, data);
  return data.count >= securityConfig.maxBypassAttempts;
}

async function executeAlias(client, message, invokedAlias, args) {
  const crConfig = getGuildConfig(client, message.guild.id);
  if (!crConfig.aliases || !crConfig.aliases[invokedAlias]) {
    return false; // Not a custom role alias
  }

  const roleId = crConfig.aliases[invokedAlias];
  const role = message.guild.roles.cache.get(roleId);
  if (!role) {
    return false;
  }

  // Target input check
  const targetInput = args[0];
  if (!targetInput) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} Target Missing\n` +
          `-# *Usage: \`.${invokedAlias} <@user|userID>\`*`
      )
    );
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
    return true;
  }

  // Permission Check
  if (!hasCustomRolePermission(message.member, crConfig.reqRole)) {
    const isSuspicious = trackSecurityViolation(message.member);
    if (isSuspicious && crConfig.antiBypass !== false) {
      // Apply 5-min security timeout to bad actors trying to spam unauthorized role grants
      if (message.member.moderatable) {
        await message.member.timeout(
          securityConfig.autoPunishTimeoutSeconds * 1000,
          "Anti-Bypass: Unauthorized custom role spam attempt"
        ).catch(() => null);
      }
    }

    const reqRoleStr = crConfig.reqRole ? `<@&${crConfig.reqRole}>` : "`Manage Roles`";
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} Security Violation & Permission Denied\n` +
          `-# *You need ${reqRoleStr} permission to toggle custom roles.*`
      )
    );
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
    return true;
  }

  const targetId = targetInput.replace(/\D/g, "");
  if (!targetId) return true;

  let targetMember = null;
  try {
    targetMember = await message.guild.members.fetch(targetId);
  } catch {}

  if (!targetMember) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} Member Not Found\n` +
          `-# *Could not resolve member with ID \`${targetId}\`.*`
      )
    );
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
    return true;
  }

  // Hierarchy Safety Check
  const me = message.guild.members.me;
  if (role.position >= me.roles.highest.position) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} Hierarchy Error\n` +
          `-# *I cannot manage <@&${role.id}> because it is higher than or equal to my highest role.*`
      )
    );
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
    return true;
  }

  // Execute Role Toggle
  const hasRole = targetMember.roles.cache.has(role.id);
  const container = new ContainerBuilder();

  if (hasRole) {
    await targetMember.roles.remove(role, `Custom Role Alias trigger .${invokedAlias} by ${message.author.tag}`).catch(() => null);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Role Removed\n` +
          `-# *Successfully removed <@&${role.id}> from ${targetMember.user}.*`
      )
    );
  } else {
    await targetMember.roles.add(role, `Custom Role Alias trigger .${invokedAlias} by ${message.author.tag}`).catch(() => null);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} Role Granted\n` +
          `-# *Successfully granted <@&${role.id}> to ${targetMember.user}.*`
      )
    );
  }

  await message.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [], repliedUser: false },
  }).catch(() => null);

  return true;
}

module.exports = {
  RESERVED_SUBCOMMANDS,
  getGuildConfig,
  updateGuildConfig,
  hasCustomRolePermission,
  checkDangerousPermissions,
  executeAlias,
};
