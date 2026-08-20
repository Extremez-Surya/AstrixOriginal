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

  // Also bind cache to client.customRolesCache for backwards compatibility
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

function findRole(guild, input, message = null) {
  if (message && message.mentions && message.mentions.roles && message.mentions.roles.size > 0) {
    return message.mentions.roles.first();
  }

  if (!input) return null;

  const rawId = input.replace(/\D/g, "");
  if (rawId && guild.roles.cache.has(rawId)) {
    return guild.roles.cache.get(rawId);
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

function buildDashboardContainer(guild, crConfig) {
  const aliases = Object.entries(crConfig.aliases || {});
  const reqStatus = crConfig.reqRole ? `<@&${crConfig.reqRole}>` : "`None` (Manage Roles)";

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# 🎭 Custom Roles Control Dashboard\n` +
        `-# *Ultra-fast role shortcuts & interactive management for ${guild.name}.*\n\n` +
        `### 📌 System Status & Security\n` +
        `> - **Required Role:** ${reqStatus}\n` +
        `> - **Active Aliases:** \`${aliases.length}\` configured\n` +
        `> - **Anti-Bypass Guard:** \`ACTIVE 🛡️\``
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (aliases.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `*No custom role aliases configured yet.*\n` +
          `-# *Click **Add Shortcut** below or run \`.customrole add <alias> <role>\` to create one.*`
      )
    );
  } else {
    const listLines = aliases.map(
      ([alias, roleId]) => `> -# **\` .${alias} \`** ➔ <@&${roleId}>`
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📋 Configured Role Aliases\n${listLines.join("\n")}`
      )
    );

    const selectOptions = aliases.slice(0, 25).map(([alias, roleId]) => {
      const role = guild.roles.cache.get(roleId);
      return new StringSelectMenuOptionBuilder()
        .setLabel(`Alias: .${alias}`)
        .setValue(`cr_inspect_${alias}_${roleId}`)
        .setDescription(`Role: ${role ? role.name : roleId}`)
        .setEmoji("🎭");
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("customrole_alias_select")
      .setPlaceholder("🔍 Select an alias to inspect or test...")
      .addOptions(selectOptions);

    container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));
  }

  // Interactive Buttons Row
  const btnRemove = new ButtonBuilder()
    .setCustomId("cr_btn_remove_menu")
    .setLabel("Remove Alias")
    .setEmoji("🗑️")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(aliases.length === 0);

  const btnReqRole = new ButtonBuilder()
    .setCustomId("cr_btn_reqrole_menu")
    .setLabel("ReqRole Config")
    .setEmoji("🔒")
    .setStyle(ButtonStyle.Primary);

  const btnRefresh = new ButtonBuilder()
    .setCustomId("cr_btn_refresh")
    .setLabel("Refresh")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(
    btnRemove,
    btnReqRole,
    btnRefresh
  );
  container.addActionRowComponents(buttonRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# *ASTRIXCODE™ High-Speed Engine • Response Time < 0.1s*`
    )
  );

  return container;
}

async function executeAlias(client, message, invokedAlias, args) {
  const crConfig = getGuildConfig(client, message.guild.id);
  if (!crConfig.aliases || !crConfig.aliases[invokedAlias]) {
    return false;
  }

  const roleId = crConfig.aliases[invokedAlias];
  const role = message.guild.roles.cache.get(roleId);
  if (!role) {
    return false;
  }

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

  let targetMember = null;
  if (message.mentions.members && message.mentions.members.size > 0) {
    targetMember = message.mentions.members.first();
  } else {
    const targetId = targetInput.replace(/\D/g, "");
    if (targetId) {
      try {
        targetMember = await message.guild.members.fetch(targetId);
      } catch {}
    }
  }

  if (!targetMember) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} Member Not Found\n` +
          `-# *Could not resolve member \`${targetInput}\`.*`
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
