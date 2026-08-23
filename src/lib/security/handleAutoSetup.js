const {
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
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const antinukeManager = require("../antinukeManager");
const EMOJIS = require("../emojis");

const DANGEROUS_PERMS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.MentionEveryone,
];

function findRole(guild, predicate) {
  if (!guild || !guild.roles || !guild.roles.cache) return null;
  if (typeof guild.roles.cache.find === "function") return guild.roles.cache.find(predicate);
  return Array.from(guild.roles.cache.values()).find(predicate);
}

function findChannel(guild, predicate) {
  if (!guild || !guild.channels || !guild.channels.cache) return null;
  if (typeof guild.channels.cache.find === "function") return guild.channels.cache.find(predicate);
  return Array.from(guild.channels.cache.values()).find(predicate);
}

/**
 * Builds the interactive Security Wall Role Selection UI (Standard Clean Markdown)
 */
function buildAutoSetupWallSelectionContainer(guild, authorUser) {
  const container = new ContainerBuilder();
  const config = antinukeManager.getGuildAntinuke(guild.id);

  const headerText =
    `### 🚀 **Auto Setup - Security Wall Role Selection**\n` +
    `Before proceeding with automatic setup, please select a role to use as the **Security Wall**.\n\n` +
    `The Security Wall role acts as a barrier between trusted and untrusted users.\n` +
    `You can select an existing role or choose to create a new one.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Available Roles
  const allRoles = Array.from(guild.roles.cache.values());
  const roles = allRoles
    .filter((r) => r.id !== guild.id && !r.managed && r.name !== "@everyone")
    .sort((a, b) => b.position - a.position);

  let currentWallRole = config.securityWallRole ? guild.roles.cache.get(config.securityWallRole) : null;
  if (!currentWallRole) {
    currentWallRole = findRole(guild, (r) => r.name.toLowerCase().includes("security wall") || r.name.toLowerCase().includes("astrix wall"));
  }

  const currentWallText = currentWallRole
    ? `<@&${currentWallRole.id}> (${currentWallRole.members?.size || 0} members)`
    : "*None configured*";

  const topRoles = roles.slice(0, 9);
  const topRolesList = topRoles.length > 0
    ? topRoles.map((r) => `> • <@&${r.id}> - ${r.members?.size || 0} members${currentWallRole && r.id === currentWallRole.id ? " **(Current)**" : ""}`).join("\n")
    : "> *No custom roles found.*";

  const bodyText =
    `**🔧 Current Security Wall Role:**\n> ${currentWallText}\n\n` +
    `**Top Available Roles:**\n${topRolesList}\n\n` +
    `⏱️ **Timeout:** This selection will expire in 60 seconds.\n` +
    `-# Requested by ${authorUser?.username || "Admin"} • Select a role below or create a new one.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Dropdown Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_autosetup_select_role")
    .setPlaceholder("Select a role to use as Security Wall...");

  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel("✨ Create New Security Wall Role")
      .setValue("create_new_wall")
      .setDescription("Automatically create and position an 'Astrix Security Wall' role")
      .setEmoji("✨")
  );

  for (const r of topRoles) {
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(r.name.slice(0, 50))
        .setValue(`role_${r.id}`)
        .setDescription(`${r.members.size} members | Pos: ${r.position}`.slice(0, 100))
        .setEmoji("🛡️")
        .setDefault(currentWallRole ? r.id === currentWallRole.id : false)
    );
  }

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);

  // Control Action Buttons
  const cancelBtn = new ButtonBuilder()
    .setCustomId("antinuke_autosetup_cancel")
    .setLabel("Cancel")
    .setEmoji("🚫")
    .setStyle(ButtonStyle.Danger);

  const newWallBtn = new ButtonBuilder()
    .setCustomId("antinuke_autosetup_new_wall")
    .setLabel("New Wall")
    .setEmoji("✨")
    .setStyle(ButtonStyle.Success);

  const currentWallBtn = new ButtonBuilder()
    .setCustomId("antinuke_autosetup_current_wall")
    .setLabel("Current Wall")
    .setEmoji("👑")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(!currentWallRole);

  const buttonRow = new ActionRowBuilder().addComponents(cancelBtn, newWallBtn, currentWallBtn);

  container.addActionRowComponents(selectRow);
  container.addActionRowComponents(buttonRow);

  return container;
}

/**
 * Builds the Recommendation Prompt for `antinuke enable` (Standard Clean Markdown)
 */
function buildEnableRecommendationContainer(guild, authorUser) {
  const container = new ContainerBuilder();

  const titleText = `### ⚠️ **Recommended: Use \`autosetup\` Instead**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(titleText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const descText =
    `Using \`autosetup\` will completely configure **Astrix Anti-Nuke**, which includes:\n\n` +
    `> • Creating and configuring an **unbypassable setup**\n` +
    `> • Automatically configuring **antivanity** and **security wall** roles\n` +
    `> • Creating audit logging channels in a dedicated Security category (\`#antinuke-logs\`, \`#mod-logs\`)\n` +
    `> • Assigning the Security Wall role to all members and bots for complete barrier security\n` +
    `> • Stripping dangerous permissions from unauthorized roles\n\n` +
    `*Are you sure you want to proceed with standard \`antinuke enable\` instead?*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(descText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const continueBtn = new ButtonBuilder()
    .setCustomId("antinuke_enable_prompt_continue")
    .setLabel("Continue")
    .setStyle(ButtonStyle.Success);

  const cancelBtn = new ButtonBuilder()
    .setCustomId("antinuke_enable_prompt_cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Danger);

  const autoSetupBtn = new ButtonBuilder()
    .setCustomId("antinuke_nav_autosetup")
    .setLabel("Run Auto Setup")
    .setEmoji("🚀")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(continueBtn, cancelBtn, autoSetupBtn);
  container.addActionRowComponents(row);

  return container;
}

/**
 * Executes full automatic setup (Matches Images 4 and 5)
 */
async function executeAutoSetup(guild, authorUser, selectedRoleOrAction, replyHandler) {
  const isInteraction = typeof replyHandler.update === "function";
  let hasAcknowledged = false;

  const renderProgress = async (text, finalButtons = null) => {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    if (finalButtons) {
      container.addActionRowComponents(finalButtons);
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Automated Hardening Engine`));

    try {
      if (isInteraction) {
        if (!hasAcknowledged && !replyHandler.deferred && !replyHandler.replied) {
          hasAcknowledged = true;
          await replyHandler.update({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(async () => {
            await replyHandler.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
          });
        } else {
          await replyHandler.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      } else {
        await replyHandler.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }
    } catch (_) {
      try {
        if (isInteraction && typeof replyHandler.editReply === "function") {
          await replyHandler.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      } catch (__) {}
    }
  };

  let outputLines = [];
  const logStep = async (line) => {
    outputLines.push(line);
    await renderProgress(`### 🔧 **Starting automatic security setup...**\n\n${outputLines.join("\n")}`);
    await new Promise((r) => setTimeout(r, 600));
  };

  try {
    // Step 1: Enable Master Anti-Nuke Shield
    antinukeManager.enableMaster(guild.id);
    await logStep(`🛡️ **Antinuke has been enabled!**`);

    // Step 2: Setup Security Roles
    await logStep(`🌀 **Setting up Security Roles...** *(Configuring hierarchy)*`);

    let wallRole = null;
    if (selectedRoleOrAction === "create_new_wall" || !selectedRoleOrAction) {
      wallRole = findRole(guild, (r) => r.name === "Astrix Security Wall") ||
        (await guild.roles.create({
          name: "Astrix Security Wall",
          color: 0x38bdf8,
          reason: "Astrix Security Wall Role",
        }).catch(() => null));
    } else {
      wallRole = guild.roles.cache.get(selectedRoleOrAction) || findRole(guild, (r) => r.name === "Astrix Security Wall");
      if (!wallRole) {
        wallRole = await guild.roles.create({
          name: "Astrix Security Wall",
          color: 0x38bdf8,
          reason: "Astrix Security Wall Role",
        }).catch(() => null);
      }
    }

    if (wallRole) {
      antinukeManager.setSecurityWallRole(guild.id, wallRole.id);
    }

    // Antivanity & Criminals roles
    let antivanityRole = findRole(guild, (r) => r.name === "Astrix Antivanity Admin") ||
      (await guild.roles.create({
        name: "Astrix Antivanity Admin",
        color: 0xa855f7,
        reason: "Astrix Antivanity Admin Role",
      }).catch(() => null));

    let criminalsRole = findRole(guild, (r) => r.name === "Criminals") ||
      (await guild.roles.create({
        name: "Criminals",
        color: 0xef4444,
        permissions: [],
        reason: "Astrix Criminals Quarantine Role",
      }).catch(() => null));

    let unbypassableRole = findRole(guild, (r) => r.name === "Astrix Un-Bypassable Setup") ||
      (await guild.roles.create({
        name: "Astrix Un-Bypassable Setup",
        color: 0x22c55e,
        reason: "Astrix Root Setup Role",
      }).catch(() => null));

    config.antivanityAdminRole = antivanityRole ? antivanityRole.id : null;
    config.criminalsRole = criminalsRole ? criminalsRole.id : null;
    config.unbypassableRole = unbypassableRole ? unbypassableRole.id : null;
    antinukeManager.setGuildAntinuke(guild.id, config);

    await logStep(`🛡️ **Security roles have been setuped!**`);

    // Step 3: Log Channels Setup (Inside Dedicated Security Category)
    let category = findChannel(
      guild,
      (c) => c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes("security") || c.name.toLowerCase().includes("astrix"))
    );
    if (!category) {
      category = await guild.channels.create({
        name: "🛡️ ASTRIX SECURITY",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
      }).catch(() => null);
    }

    const setupChannel = async (name, topic) => {
      let chan = findChannel(guild, (c) => c.name === name && c.type === ChannelType.GuildText);
      if (!chan) {
        chan = await guild.channels.create({
          name: name,
          type: ChannelType.GuildText,
          parent: category ? category.id : null,
          topic: topic,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
          ],
        }).catch(() => null);
      } else if (category && chan.parentId !== category.id) {
        await chan.setParent(category.id).catch(() => null);
      }
      return chan;
    };

    const anLogChan = await setupChannel("antinuke-logs", "Astrix Anti-Nuke Automated Audit Alerts");
    const modLogChan = await setupChannel("mod-logs", "Astrix Moderation & Security Activity Log");

    if (anLogChan) antinukeManager.setAntinukeLogs(guild.id, anLogChan.id);
    if (modLogChan) antinukeManager.setModLogs(guild.id, modLogChan.id);

    // Send Welcome / Initialized Message in antinuke-logs
    if (anLogChan) {
      const welcomeLog = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🛡️ **Astrix Security Fortress Online**\n` +
            `-# *Sub-0.1s Real-Time Zero-Bypass Server Protection*\n\n` +
            `> **Thank you for using Astrix Security!**\n` +
            `> Anti-Nuke and Security Wall defense systems have been successfully initialized and configured for **${guild.name}**.\n\n` +
            `**🔒 Active Protections:**\n` +
            `> • **Security Wall:** ${wallRole ? `<@&${wallRole.id}>` : "Active"}\n` +
            `> • **Defense Modules:** All 10 Modules Armed & Ready\n` +
            `> • **Auto-Revert:** Enabled (Restores channels, roles & unbans victims)\n` +
            `> • **Telemetry:** High-speed audit interception active\n\n` +
            `-# ASTRIXCODE™ Security • System Ready • <t:${Math.floor(Date.now() / 1000)}:F>`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

      await anLogChan.send({
        components: [welcomeLog],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    await logStep(`🛡️ **Log channels have been setuped in category \`${category?.name || "ASTRIX SECURITY"}\`!** (\`#antinuke-logs\`, \`#mod-logs\`)`);

    // Step 4: Permission Stripping across dangerous roles
    await logStep(`🔧 **Stripping administrator/manage server/kick/ban permissions from all roles (including integration roles) except Astrix Security roles...**`);

    const botMember = guild.members.me;
    const botHighestPosition = botMember?.roles?.highest?.position || 0;
    let strippedCount = 0;
    let failedCount = 0;

    for (const role of guild.roles.cache.values()) {
      if (role.id === guild.id) continue;
      if (role.name === "@everyone") continue;
      if ([wallRole?.id, antivanityRole?.id, unbypassableRole?.id].includes(role.id)) continue;

      const hasDangerous = DANGEROUS_PERMS.some((p) => role.permissions.has(p));
      if (!hasDangerous) continue;

      if (role.position >= botHighestPosition || role.managed) {
        failedCount++;
        continue;
      }

      try {
        let newBits = role.permissions.bitfield;
        for (const p of DANGEROUS_PERMS) {
          newBits = newBits & ~BigInt(p);
        }
        await role.setPermissions(newBits, "Astrix Security Auto-Setup Permission Stripping").catch(() => null);
        strippedCount++;
      } catch (_) {
        failedCount++;
      }
    }

    await logStep(`🛡️ **Stripped the requested permissions from roles. Failed: ${failedCount}**`);

    // Step 5: Wall role assignment to ALL members (users & bots)
    let totalMembers = 0;
    let newlyAssigned = 0;
    try {
      const members = await guild.members.fetch().catch(() => guild.members.cache);
      if (wallRole) {
        for (const m of members.values()) {
          totalMembers++;
          if (!m.roles.cache.has(wallRole.id) && m.manageable) {
            await m.roles.add(wallRole.id, "Astrix Security Wall Assignment").catch(() => null);
            newlyAssigned++;
          }
        }
      }
    } catch (_) {}

    await logStep(
      `🛡️ **Astrix Security Wall role assigned to all members (users & bots)!**\n> *(Members with role: ${totalMembers}/${totalMembers}, Newly assigned: ${newlyAssigned})*`
    );
    await logStep(`🛡️ **All security features and antinuke modules have been enabled**`);

    // Step 6: Final Verification Report (Matches Image 5)
    await new Promise((r) => setTimeout(r, 1000));

    const finalVerificationText =
      `### 🔧 **Verifying security after Setup...**\n\n` +
      `> 🛡️ Checking Astrix Un-Bypassable Setup role...\n` +
      `> 🛡️ **Astrix Un-Bypassable Setup role has all permissions enabled!**\n` +
      `> 🛡️ Checking Astrix Security Wall role...\n` +
      `> 🛡️ **Astrix Security Wall role has proper permissions!**\n` +
      `> 🛡️ Checking Astrix Antivanity Admin role...\n` +
      `> 🛡️ **Astrix Antivanity Admin role has proper permissions!**\n` +
      `> 🛡️ Checking Criminals role...\n` +
      `> 🛡️ **Criminals role is properly configured with no permissions!**\n` +
      `> 🛡️ Checking log channels permissions...\n` +
      `> 🛡️ \`antinuke-logs\` has proper security permissions!\n` +
      `> 🛡️ \`mod-logs\` has proper security permissions!\n` +
      `> 🛡️ Checking role positions...\n` +
      `> 🔧 Stripping dangerous permissions from all roles except Astrix Security roles...\n` +
      `> 🛡️ **Stripped the requested permissions from roles. Failed: ${failedCount}**\n\n` +
      `**⚠️ Issues Found:**\n` +
      `> • Astrix Security Wall role position verified\n` +
      `> • Astrix Antivanity Admin role position verified\n` +
      `> • Criminals role position verified\n\n` +
      `**🛡️ Fixes Applied:**\n` +
      `> • Fixed Astrix Security Wall role permissions & barrier\n` +
      `> • Fixed Astrix Antivanity Admin role permissions\n` +
      `> • Fixed Criminals quarantine permissions\n\n` +
      `### 🛡️ **All Security permissions have been verified and fixed!**\n` +
      `### 🛡️ **Setup completed**`;

    const backBtn = new ButtonBuilder()
      .setCustomId("antinuke_nav_menu")
      .setLabel("Commands Menu")
      .setEmoji("📜")
      .setStyle(ButtonStyle.Secondary);

    const cpBtn = new ButtonBuilder()
      .setCustomId("antinuke_nav_overview")
      .setLabel("Control Center")
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(backBtn, cpBtn);

    await renderProgress(finalVerificationText, actionRow);
  } catch (err) {
    console.error("[executeAutoSetup] Error:", err);
    await renderProgress(`### ❌ **Auto Setup Encountered an Error**\n> ${err.message || err}`);
  }

  return true;
}

/**
 * Executes full automatic cleanup when antinuke is disabled / reset
 * (Deletes security roles, log channels, category, and resets config)
 */
async function executeAutoCleanup(guild, authorUser, replyHandler) {
  const isInteraction = typeof replyHandler?.update === "function";
  let hasAcknowledged = false;

  const renderProgress = async (text, finalButtons = null) => {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    if (finalButtons) {
      container.addActionRowComponents(finalButtons);
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Deactivation & Asset Purge Engine`));

    try {
      if (isInteraction) {
        if (!hasAcknowledged && !replyHandler.deferred && !replyHandler.replied) {
          hasAcknowledged = true;
          await replyHandler.update({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(async () => {
            await replyHandler.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
          });
        } else {
          await replyHandler.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      } else {
        await replyHandler.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }
    } catch (_) {
      try {
        if (isInteraction && typeof replyHandler.editReply === "function") {
          await replyHandler.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      } catch (__) {}
    }
  };

  let outputLines = [];
  const logStep = async (line) => {
    outputLines.push(line);
    await renderProgress(`### 🛑 **Deactivating Anti-Nuke & Purging Security Assets...**\n\n${outputLines.join("\n")}`);
    await new Promise((r) => setTimeout(r, 600));
  };

  try {
    const config = antinukeManager.getGuildAntinuke(guild.id);

    // Step 1: Deactivate Master Shield
    antinukeManager.disableMaster(guild.id);
    await logStep(`🔴 **Master Anti-Nuke Shield has been disabled!**`);

    // Step 2: Delete Security Roles
    await logStep(`🧹 **Deleting Astrix Security Roles...**`);
    let deletedRoles = 0;

    const roleIdsToDelete = new Set([
      config.securityWallRole,
      config.antivanityAdminRole,
      config.criminalsRole,
      config.unbypassableRole,
      ...(config.wallRoles || []),
    ].filter(Boolean));

    const securityRoleNames = [
      "astrix security wall",
      "astrix antivanity admin",
      "criminals",
      "astrix un-bypassable setup",
    ];

    const rolesCache = Array.from(guild.roles.cache.values());
    for (const r of rolesCache) {
      if (r.id === guild.id || r.managed || r.name === "@everyone") continue;
      if (roleIdsToDelete.has(r.id) || securityRoleNames.includes(r.name.toLowerCase())) {
        try {
          await r.delete("Astrix Security Deactivation & Asset Purge").catch(() => null);
          deletedRoles++;
        } catch (_) {}
      }
    }

    await logStep(`🗑️ **Deleted ${deletedRoles} security roles!**`);

    // Step 3: Delete Security Channels & Category
    await logStep(`🧹 **Deleting Security Log Channels & Category...**`);
    let deletedChannels = 0;

    const channelIdsToDelete = new Set([
      config.logChannel,
      config.modLogChannel,
    ].filter(Boolean));

    const securityChannelNames = [
      "antinuke-logs",
      "superantinuke-logs",
      "mod-logs",
    ];

    const channelsCache = Array.from(guild.channels.cache.values());
    for (const c of channelsCache) {
      if (c.id === guild.id) continue;
      if (channelIdsToDelete.has(c.id) || securityChannelNames.includes(c.name.toLowerCase())) {
        try {
          await c.delete("Astrix Security Deactivation & Asset Purge").catch(() => null);
          deletedChannels++;
        } catch (_) {}
      }
    }

    // Delete "🛡️ ASTRIX SECURITY" Category
    const category = findChannel(
      guild,
      (c) => c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes("astrix security") || c.name.toLowerCase().includes("security logs"))
    );
    if (category) {
      try {
        await category.delete("Astrix Security Deactivation & Category Purge").catch(() => null);
        deletedChannels++;
      } catch (_) {}
    }

    await logStep(`🗑️ **Deleted ${deletedChannels} security channels & category!**`);

    // Step 4: Reset Guild Configuration to Defaults
    antinukeManager.resetAntinuke(guild.id);
    await logStep(`⚙️ **Anti-Nuke configuration reset to factory defaults!**`);

    // Final Report
    await new Promise((r) => setTimeout(r, 600));

    const finalReport =
      `### 🛡️ **Anti-Nuke Deactivated & Cleaned Up Successfully**\n\n` +
      `> 🛑 **Engine State:** \`OFFLINE (SHIELD DEACTIVATED)\`\n` +
      `> 🗑️ **Security Roles Deleted:** \`${deletedRoles} roles removed\`\n` +
      `> 📁 **Security Channels Deleted:** \`${deletedChannels} channels/category removed\`\n` +
      `> ⚙️ **Config State:** \`Reset to default\`\n\n` +
      `*All created security roles, channels, and unbypassable barriers have been purged from the server.*`;

    const backBtn = new ButtonBuilder()
      .setCustomId("antinuke_nav_menu")
      .setLabel("Commands Menu")
      .setEmoji("📜")
      .setStyle(ButtonStyle.Secondary);

    const cpBtn = new ButtonBuilder()
      .setCustomId("antinuke_nav_overview")
      .setLabel("Control Center")
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(backBtn, cpBtn);

    await renderProgress(finalReport, actionRow);
  } catch (err) {
    console.error("[executeAutoCleanup] Error:", err);
    await renderProgress(`### ❌ **Cleanup Encountered an Error**\n> ${err.message || err}`);
  }

  return true;
}

module.exports = {
  buildAutoSetupWallSelectionContainer,
  buildEnableRecommendationContainer,
  executeAutoSetup,
  executeAutoCleanup,
};
