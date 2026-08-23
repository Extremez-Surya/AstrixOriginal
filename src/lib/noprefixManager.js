const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "noprefixConfig.json");
const LIFETIME = 9999999999999;

let store = {
  owners: [],
  users: [],
  servers: [],
  roles: [],
  blacklistedUsers: [],
  blacklistedServers: [],
};

let isInitialized = false;

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      const parsed = JSON.parse(data);
      store = {
        owners: parsed.owners || [],
        users: parsed.users || [],
        servers: parsed.servers || [],
        roles: parsed.roles || [],
        blacklistedUsers: parsed.blacklistedUsers || [],
        blacklistedServers: parsed.blacklistedServers || [],
      };
    }
  } catch (e) {
    console.error("[NoprefixManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(store, null, 2), "utf8");
    } catch (e) {
      console.error("[NoprefixManager] Save disk error:", e);
    }
  });
}

function parseDuration(str) {
  if (!str) return 90 * 24 * 60 * 60 * 1000; // Default 90 days
  if (str.toLowerCase() === "lifetime" || str.toLowerCase() === "perm" || str.toLowerCase() === "permanent") return LIFETIME;

  const match = str.match(/^(\d+)([dhms])$/i);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit === "d") return val * 24 * 60 * 60 * 1000;
    if (unit === "h") return val * 60 * 60 * 1000;
    if (unit === "m") return val * 60 * 1000;
    if (unit === "s") return val * 1000;
  }
  return null;
}

function getDurationLabel(durationMsOrStr) {
  if (typeof durationMsOrStr === "string") {
    const lower = durationMsOrStr.toLowerCase();
    if (lower === "lifetime" || lower === "perm" || lower === "permanent") return "Lifetime";
    if (lower === "1m") return "1 Minute";
    if (lower === "5m") return "5 Minutes";
    if (lower === "1h") return "1 Hour";
    if (lower === "1d") return "1 Day";
    if (lower === "7d") return "7 Days";
    if (lower === "30d") return "30 Days";
    if (lower === "90d") return "90 Days";
  }

  const ms = typeof durationMsOrStr === "number" ? durationMsOrStr : parseDuration(durationMsOrStr);
  if (!ms || ms >= LIFETIME - 100000000) return "Lifetime";

  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) return `${days} Day${days !== 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} Hour${hours !== 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} Minute${minutes !== 1 ? "s" : ""}`;
  return `${Math.floor(ms / 1000)} Seconds`;
}

async function sendNoPrefixDM(client, userId, durationLabel, isGranted = true) {
  try {
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return false;

    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");

    const container = new ContainerBuilder();
    if (isGranted) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### Hey There <@${userId}> ❤️`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `You Have Been Granted No-Prefix Of Astrix Bot For **${durationLabel}**.\n\n` +
          `You can now use supported Astrix commands without a prefix.`
        )
      );
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### Hey There <@${userId}>`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Your No-Prefix access for Astrix Bot has expired or been removed.\n\n` +
          `You will now need to use the server prefix (e.g. \`-\`) to run commands.`
        )
      );
    }

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# Made By ASTRIXCODE`)
    );

    await user.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    return true;
  } catch (e) {
    return false;
  }
}

function formatExpiry(expiresAt) {
  if (expiresAt >= LIFETIME - 100000000) return "♾️ Lifetime";
  const now = Date.now();
  if (expiresAt <= now) return "❌ Expired";
  const remaining = expiresAt - now;
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

const BUILTIN_OWNERS = ["1299394763933618239", "984409270344908872"];

function isOwner(userId, client = null) {
  if (!isInitialized) initCache();
  if (!userId) return false;

  if (BUILTIN_OWNERS.includes(userId)) return true;
  if (store.owners.includes(userId)) return true;

  if (client) {
    if (Array.isArray(client.ownerIds) && client.ownerIds.includes(userId)) return true;
    if (Array.isArray(client.developer) && client.developer.includes(userId)) return true;
    if (Array.isArray(client.config?.ownerIds) && client.config.ownerIds.includes(userId)) return true;
    if (Array.isArray(client.config?.developerIds) && client.config.developerIds.includes(userId)) return true;
    if (client.config?.ownerId === userId) return true;
    if (client.application?.owner?.id === userId) return true;
  }

  return false;
}

function isBlacklisted(userId, guildId = null) {
  if (!isInitialized) initCache();

  const userEntry = store.blacklistedUsers.find((u) => u.id === userId);
  const serverEntry = guildId ? store.blacklistedServers.find((s) => s.id === guildId) : null;

  return {
    isBlacklisted: !!(userEntry || serverEntry),
    userBlacklisted: !!userEntry,
    serverBlacklisted: !!serverEntry,
    reason: userEntry?.reason || serverEntry?.reason || "Violated terms of service.",
  };
}

function hasNoPrefix(userId, guildId = null, memberRoleIds = [], client = null) {
  if (!isInitialized) initCache();
  if (!userId) return false;

  // 1. Bot Owner check
  if (isOwner(userId, client)) return true;

  const now = Date.now();

  // 2. User No-Prefix check
  const userEntry = store.users.find((u) => u.id === userId);
  if (userEntry && userEntry.expiresAt > now) return true;

  // 3. Server No-Prefix check
  if (guildId) {
    const serverEntry = store.servers.find((s) => s.id === guildId);
    if (serverEntry && serverEntry.expiresAt > now) return true;

    // 4. Role No-Prefix check
    if (Array.isArray(memberRoleIds) && memberRoleIds.length > 0) {
      const roleMatch = store.roles.find((r) => r.guildId === guildId && memberRoleIds.includes(r.roleId) && r.expiresAt > now);
      if (roleMatch) return true;
    }
  }

  return false;
}

function addNoPrefixUser(userId, durationMs, grantedBy) {
  if (!isInitialized) initCache();

  const now = Date.now();
  const expiresAt = durationMs >= LIFETIME ? LIFETIME : now + durationMs;

  store.users = store.users.filter((u) => u.id !== userId);
  store.users.push({
    id: userId,
    expiresAt,
    grantedBy,
    grantedAt: now,
  });

  saveDiskAsync();
  return { expiresAt };
}

function removeNoPrefixUser(userId) {
  if (!isInitialized) initCache();

  const existed = store.users.some((u) => u.id === userId);
  store.users = store.users.filter((u) => u.id !== userId);

  if (existed) saveDiskAsync();
  return existed;
}

function addNoPrefixServer(guildId, durationMs, grantedBy) {
  if (!isInitialized) initCache();

  const now = Date.now();
  const expiresAt = durationMs >= LIFETIME ? LIFETIME : now + durationMs;

  store.servers = store.servers.filter((s) => s.id !== guildId);
  store.servers.push({
    id: guildId,
    expiresAt,
    grantedBy,
    grantedAt: now,
  });

  saveDiskAsync();
  return { expiresAt };
}

function removeNoPrefixServer(guildId) {
  if (!isInitialized) initCache();

  const existed = store.servers.some((s) => s.id === guildId);
  store.servers = store.servers.filter((s) => s.id !== guildId);

  if (existed) saveDiskAsync();
  return existed;
}

function addNoPrefixRole(guildId, roleId, durationMs, grantedBy) {
  if (!isInitialized) initCache();

  const now = Date.now();
  const expiresAt = durationMs >= LIFETIME ? LIFETIME : now + durationMs;

  store.roles = store.roles.filter((r) => !(r.guildId === guildId && r.roleId === roleId));
  store.roles.push({
    guildId,
    roleId,
    expiresAt,
    grantedBy,
    grantedAt: now,
  });

  saveDiskAsync();
  return { expiresAt };
}

function removeNoPrefixRole(guildId, roleId) {
  if (!isInitialized) initCache();

  const existed = store.roles.some((r) => r.guildId === guildId && r.roleId === roleId);
  store.roles = store.roles.filter((r) => !(r.guildId === guildId && r.roleId === roleId));

  if (existed) saveDiskAsync();
  return existed;
}

function addBlacklistUser(userId, reason = "Violated terms of service.", addedBy) {
  if (!isInitialized) initCache();

  store.blacklistedUsers = store.blacklistedUsers.filter((u) => u.id !== userId);
  store.blacklistedUsers.push({
    id: userId,
    reason,
    addedBy,
    addedAt: Date.now(),
  });

  saveDiskAsync();
  return true;
}

function removeBlacklistUser(userId) {
  if (!isInitialized) initCache();

  const existed = store.blacklistedUsers.some((u) => u.id === userId);
  store.blacklistedUsers = store.blacklistedUsers.filter((u) => u.id !== userId);

  if (existed) saveDiskAsync();
  return existed;
}

function addBlacklistServer(guildId, reason = "Violated terms of service.", addedBy) {
  if (!isInitialized) initCache();

  store.blacklistedServers = store.blacklistedServers.filter((s) => s.id !== guildId);
  store.blacklistedServers.push({
    id: guildId,
    reason,
    addedBy,
    addedAt: Date.now(),
  });

  saveDiskAsync();
  return true;
}

function removeBlacklistServer(guildId) {
  if (!isInitialized) initCache();

  const existed = store.blacklistedServers.some((s) => s.id === guildId);
  store.blacklistedServers = store.blacklistedServers.filter((s) => s.id !== guildId);

  if (existed) saveDiskAsync();
  return existed;
}

function incrementExecutionCount() {
  // Stats tracking removed per configuration
}

function getStore() {
  if (!isInitialized) initCache();
  return store;
}

initCache();

module.exports = {
  LIFETIME,
  parseDuration,
  getDurationLabel,
  sendNoPrefixDM,
  formatExpiry,
  isOwner,
  isBlacklisted,
  hasNoPrefix,
  addNoPrefixUser,
  removeNoPrefixUser,
  addNoPrefixServer,
  removeNoPrefixServer,
  addNoPrefixRole,
  removeNoPrefixRole,
  addBlacklistUser,
  removeBlacklistUser,
  addBlacklistServer,
  removeBlacklistServer,
  incrementExecutionCount,
  getStore,
};
