const fs = require("fs");
const path = require("path");
const {
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const EMOJIS = require("./emojis");
const securityConfig = require("./customRolesConfig.json");

const DATA_FILE = path.join(__dirname, "customRolesData.json");

const configCache = new Map();
let isInitialized = false;

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

function getDefaultGuildConfig() {
  return {
    aliases: {},
    reqRole: null,
    antiBypass: true,
  };
}

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(data);
      if (parsed.guilds) {
        for (const [guildId, cfg] of Object.entries(parsed.guilds)) {
          configCache.set(guildId, {
            aliases: cfg.aliases || {},
            reqRole: cfg.reqRole || null,
            antiBypass: cfg.antiBypass !== false,
          });
        }
      }
    }
  } catch (e) {
    console.error("[CustomRolesManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      const obj = { guilds: {} };
      for (const [guildId, cfg] of configCache.entries()) {
        obj.guilds[guildId] = cfg;
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[CustomRolesManager] Save disk error:", e);
    }
  });
}

function getGuildConfig(client, guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultGuildConfig();

  if (client && !client.customRolesCache) {
    client.customRolesCache = configCache;
  }

  const raw = configCache.get(guildId);
  if (!raw) return getDefaultGuildConfig();

  return {
    aliases: raw.aliases ? { ...raw.aliases } : {},
    reqRole: raw.reqRole || null,
    antiBypass: raw.antiBypass !== false,
  };
}

function updateGuildConfig(client, guildId, updateFn) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultGuildConfig();

  const current = getGuildConfig(client, guildId);
  const updated = updateFn({ ...current });

  configCache.set(guildId, updated);
  if (client) {
    if (!client.customRolesCache) client.customRolesCache = configCache;
    else client.customRolesCache.set(guildId, updated);
  }

  saveDiskAsync();
  return updated;
}

async function findRole(guild, input, message = null) {
  if (message && message.mentions && message.mentions.roles && message.mentions.roles.size > 0) {
    return message.mentions.roles.first();
  }

  if (!input) return null;

  // Check mention tag syntax <@&123456789>
  const mentionMatch = input.match(/<@&?(\d+)>/);
  if (mentionMatch) {
    const roleId = mentionMatch[1];
    const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
    if (role) return role;
  }

  const rawId = input.replace(/\D/g, "");
  if (rawId && rawId.length >= 17) {
    const role = guild.roles.cache.get(rawId) || (await guild.roles.fetch(rawId).catch(() => null));
    if (role) return role;
  }

  const clean = input.toLowerCase().replace(/^@/, "").trim();
  if (!clean) return null;

  // Exact name match
  let role = guild.roles.cache.find((r) => r.name.toLowerCase() === clean);
  if (role) return role;

  // Starts with match
  role = guild.roles.cache.find((r) => r.name.toLowerCase().startsWith(clean));
  if (role) return role;

  // Contains match
  role = guild.roles.cache.find((r) => r.name.toLowerCase().includes(clean));
  return role || null;
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

function buildDashboardContainer(guild, crConfig, activeTab = "overview") {
  const { buildCustomRolesDashboard } = require("./customroles/handleCustomRoleInteraction");
  return buildCustomRolesDashboard(guild, crConfig, activeTab);
}

async function executeAlias(client, message, invokedAlias, args) {
  const crConfig = getGuildConfig(client, message.guild.id);
  if (!crConfig.aliases || !crConfig.aliases[invokedAlias]) {
    return false;
  }

  const roleId = crConfig.aliases[invokedAlias];
  let role = message.guild.roles.cache.get(roleId);
  if (!role) {
    role = await message.guild.roles.fetch(roleId).catch(() => null);
  }

  if (!role) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} Role Not Found\n` +
          `-# *The role assigned to shortcut \`.${invokedAlias}\` (ID: \`${roleId}\`) no longer exists on this server.*`
      )
    );
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
    return true;
  }

  let targetMember = null;

  // 1. Check mentions
  if (message.mentions.members && message.mentions.members.size > 0) {
    targetMember = message.mentions.members.first();
  } else if (message.mentions.users && message.mentions.users.size > 0) {
    const firstUser = message.mentions.users.first();
    targetMember = await message.guild.members.fetch(firstUser.id).catch(() => null);
  }

  // 2. Search args for member ID or username
  if (!targetMember && args.length > 0) {
    const fullInput = args.join(" ").trim();
    const rawId = fullInput.replace(/\D/g, "");
    if (rawId && rawId.length >= 17) {
      targetMember = await message.guild.members.fetch(rawId).catch(() => null);
    }

    if (!targetMember) {
      const cleanName = fullInput.toLowerCase().replace(/^@/, "").trim();
      targetMember = message.guild.members.cache.find(
        (m) =>
          m.user.username.toLowerCase() === cleanName ||
          m.displayName.toLowerCase() === cleanName ||
          m.user.tag.toLowerCase() === cleanName
      );
    }
  }

  if (!targetMember) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} Target Member Required\n` +
          `-# *Usage: \`.${invokedAlias} <@user|userID|username>\`*`
      )
    );
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
    return true;
  }

  if (!hasCustomRolePermission(message.member, crConfig.reqRole)) {
    const isSuspicious = trackSecurityViolation(message.member);
    if (isSuspicious && crConfig.antiBypass !== false) {
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
          `-# *You need ${reqRoleStr} permission to trigger custom role shortcuts.*`
      )
    );
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    }).catch(() => null);
    return true;
  }

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

initCache();

module.exports = {
  RESERVED_SUBCOMMANDS,
  getGuildConfig,
  updateGuildConfig,
  findRole,
  hasCustomRolePermission,
  checkDangerousPermissions,
  buildDashboardContainer,
  executeAlias,
};
