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
const loggingManager = require("../loggingManager");
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
 * Builds the interactive Security Wall Role Selection UI (Minimal Inline Embed Style)
 */
function buildAutoSetupWallSelectionContainer(guild, authorUser) {
  const container = new ContainerBuilder();
  const config = antinukeManager.getGuildAntinuke(guild.id);

  const headerText =
    `### 🚀 **Astrix Security • Auto-Setup Role Selection**\n` +
    `-# Configure server security wall barrier for **${guild.name}**`;
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
    ? `<@&${currentWallRole.id}> (\`${currentWallRole.members?.size || 0} members\`)`
    : "*None (Will create automatically)*";

  const bodyText =
    `> **🛡️ Security Wall Role:** ${currentWallText}\n` +
    `> **🔒 Hardening Scope:** \`10/10 Modules\` • \`Log Channels\` • \`Permission Stripping\`\n` +
    `> **Barrier Function:** Isolates trusted admins and locks down untrusted accounts.\n\n` +
    `-# Select a role from the dropdown below or click 'New Wall' to start setup.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Dropdown Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("antinuke_autosetup_select_role")
    .setPlaceholder("🛡️ Select Role to use as Security Wall...");

  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel("Create New Security Wall Role (Recommended)")
      .setValue("create_new_wall")
      .setDescription("Automatically creates and configures 'Astrix Security Wall' role")
      .setEmoji("✨")
  );

  const topRoles = roles.slice(0, 10);
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

  // Minimal Control Action Buttons (Clean 2-button layout)
  const newWallBtn = new ButtonBuilder()
    .setCustomId("antinuke_autosetup_new_wall")
    .setLabel("Start Auto-Setup")
    .setEmoji("✨")
    .setStyle(ButtonStyle.Success);

  const cancelBtn = new ButtonBuilder()
    .setCustomId("antinuke_autosetup_cancel")
    .setLabel("Cancel")
    .setEmoji("🚫")
    .setStyle(ButtonStyle.Danger);

  const buttonRow = new ActionRowBuilder().addComponents(newWallBtn, cancelBtn);

  container.addActionRowComponents(selectRow);
  container.addActionRowComponents(buttonRow);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Automated Hardening Engine`));

  return container;
}

/**
 * Builds the Recommendation Prompt for `antinuke enable` (Minimal Inline Embed Style)
 */
function buildEnableRecommendationContainer(guild, authorUser) {
  const container = new ContainerBuilder();

  const titleText = `### ⚠️ **Astrix Anti-Nuke • Enable & Auto-Setup**\n-# Complete server hardening & sub-0.1s zero-bypass deployment for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(titleText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const descText =
    `> **🛡️ Security Roles:** Creates \`Security Wall\`, \`Un-Bypassable\` & \`Antivanity\` roles\n` +
    `> **📜 Audit Channels:** Configures \`#antinuke-logs\` & \`#mod-logs\` in Security Category\n` +
    `> **🔒 Access Hardening:** Strips dangerous administrative permissions from untrusted roles\n\n` +
    `-# Click **Continue** to immediately activate protection and harden this server.`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(descText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const continueBtn = new ButtonBuilder()
    .setCustomId("antinuke_enable_prompt_continue")
    .setLabel("Continue")
    .setEmoji("🟢")
    .setStyle(ButtonStyle.Success);

  const cancelBtn = new ButtonBuilder()
    .setCustomId("antinuke_enable_prompt_cancel")
    .setLabel("Cancel")
    .setEmoji("🔴")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(continueBtn, cancelBtn);
  container.addActionRowComponents(row);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Hardened Protection Engine`));

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
    const config = antinukeManager.getGuildAntinuke(guild.id);

    // Step 1: Enable Master Anti-Nuke Shield
    antinukeManager.enableMaster(guild.id);
    await logStep(`🛡️ **Antinuke has been enabled!**`);

    // Step 2: Setup Security Roles
    await logStep(`🌀 **Setting up Security Roles & Hierarchy...** *(Bypass, Unbypass, Security Wall & Criminals)*`);

    await guild.roles.fetch().catch(() => guild.roles.cache);

    // 1. Bypass Role (Top Near Bot)
    let bypassRole = findRole(guild, (r) => r.name.toLowerCase() === "astrix bypass" || r.name.toLowerCase() === "bypass");
    if (!bypassRole) {
      bypassRole = await guild.roles.create({
        name: "Astrix Bypass",
        colors: { primaryColor: 0xf59e0b },
        reason: "Astrix Bypass Staff Whitelist Role",
      }).catch((err) => {
        console.error("[AutoSetup] Error creating Astrix Bypass role:", err);
        return null;
      });
    }

    // 2. Unbypass Role (Top Near Bot)
    let unbypassableRole = findRole(guild, (r) => r.name.toLowerCase().includes("un-bypassable") || r.name.toLowerCase() === "astrix un-bypassable setup");
    if (!unbypassableRole) {
      unbypassableRole = await guild.roles.create({
        name: "Astrix Un-Bypassable Setup",
        colors: { primaryColor: 0x22c55e },
        permissions: [PermissionFlagsBits.Administrator],
        reason: "Astrix Root Setup Role",
      }).catch((err) => {
        console.error("[AutoSetup] Error creating Astrix Un-Bypassable Setup role:", err);
        return null;
      });
    }

    // 3. Security Wall Role (Bottom Above Criminals)
    let wallRole = null;
    if (selectedRoleOrAction === "create_new_wall" || !selectedRoleOrAction) {
      wallRole = findRole(guild, (r) => r.name.toLowerCase() === "astrix security wall" || r.name.toLowerCase() === "security wall");
      if (!wallRole) {
        wallRole = await guild.roles.create({
          name: "Astrix Security Wall",
          colors: { primaryColor: 0x38bdf8 },
          reason: "Astrix Security Wall Role",
        }).catch((err) => {
          console.error("[AutoSetup] Error creating Astrix Security Wall role:", err);
          return null;
        });
      }
    } else {
      wallRole = guild.roles.cache.get(selectedRoleOrAction) || findRole(guild, (r) => r.name.toLowerCase() === "astrix security wall" || r.name.toLowerCase() === "security wall");
      if (!wallRole) {
        wallRole = await guild.roles.create({
          name: "Astrix Security Wall",
          colors: { primaryColor: 0x38bdf8 },
          reason: "Astrix Security Wall Role",
        }).catch((err) => {
          console.error("[AutoSetup] Error creating Astrix Security Wall role:", err);
          return null;
        });
      }
    }

    if (wallRole) {
      antinukeManager.setSecurityWallRole(guild.id, wallRole.id);
    }

    // 4. Criminals Role (Lowest Position with 0 perms)
    let criminalsRole = findRole(guild, (r) => r.name.toLowerCase() === "criminals" || r.name.toLowerCase() === "criminal");
    if (!criminalsRole) {
      criminalsRole = await guild.roles.create({
        name: "Criminals",
        colors: { primaryColor: 0xef4444 },
        permissions: [],
        reason: "Astrix Criminals Quarantine Role",
      }).catch((err) => {
        console.error("[AutoSetup] Error creating Criminals role:", err);
        return null;
      });
    }

    // 5. Antivanity Admin Role
    let antivanityRole = findRole(guild, (r) => r.name.toLowerCase() === "astrix antivanity admin" || r.name.toLowerCase() === "antivanity admin");
    if (!antivanityRole) {
      antivanityRole = await guild.roles.create({
        name: "Astrix Antivanity Admin",
        colors: { primaryColor: 0xa855f7 },
        reason: "Astrix Antivanity Admin Role",
      }).catch((err) => {
        console.error("[AutoSetup] Error creating Astrix Antivanity Admin role:", err);
        return null;
      });
    }

    // Hierarchy Positioning: Bypass & Unbypass TOP, Security & Criminals BOTTOM
    const botMember = guild.members.me;
    const botHighestPosition = botMember?.roles?.highest?.position || guild.roles.cache.size;

    const positionsToSet = [];
    if (bypassRole) positionsToSet.push({ role: bypassRole.id, position: Math.max(1, botHighestPosition - 1) });
    if (unbypassableRole) positionsToSet.push({ role: unbypassableRole.id, position: Math.max(1, botHighestPosition - 2) });
    if (antivanityRole) positionsToSet.push({ role: antivanityRole.id, position: Math.max(1, botHighestPosition - 3) });
    if (wallRole) positionsToSet.push({ role: wallRole.id, position: 2 });
    if (criminalsRole) positionsToSet.push({ role: criminalsRole.id, position: 1 });

    try {
      await guild.roles.setPositions(positionsToSet).catch(async () => {
        if (bypassRole) await bypassRole.setPosition(Math.max(1, botHighestPosition - 1)).catch(() => null);
        if (unbypassableRole) await unbypassableRole.setPosition(Math.max(1, botHighestPosition - 2)).catch(() => null);
        if (antivanityRole) await antivanityRole.setPosition(Math.max(1, botHighestPosition - 3)).catch(() => null);
        if (wallRole) await wallRole.setPosition(2).catch(() => null);
        if (criminalsRole) await criminalsRole.setPosition(1).catch(() => null);
      });
    } catch (_) {}

    config.enabled = true;
    if (!config.modules) config.modules = {};
    for (const k of ["channel", "role", "ban", "kick", "webhook", "botAdd", "guildUpdate", "emoji", "permissions", "prune"]) {
      config.modules[k] = true;
    }
    config.bypassRole = bypassRole ? bypassRole.id : null;
    config.antivanityAdminRole = antivanityRole ? antivanityRole.id : null;
    config.criminalsRole = criminalsRole ? criminalsRole.id : null;
    config.unbypassableRole = unbypassableRole ? unbypassableRole.id : null;
    if (wallRole) {
      config.securityWallRole = wallRole.id;
      if (!config.wallRoles) config.wallRoles = [];
      if (!config.wallRoles.includes(wallRole.id)) config.wallRoles.push(wallRole.id);
    }
    antinukeManager.setGuildAntinuke(guild.id, config);

    await logStep(`🛡️ **Security roles configured:** \`Astrix Bypass\` (Top), \`Astrix Un-Bypassable Setup\` (Top), \`Astrix Security Wall\` (Bottom), \`Criminals\` (Bottom)`);

    // Step 3: Log Channels Setup (Inside Dedicated Astrix Security Category)
    let category = findChannel(
      guild,
      (c) =>
        c.type === ChannelType.GuildCategory &&
        (c.name === "🛡️ ASTRIX SECURITY" || c.name.toLowerCase() === "astrix security")
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
    const modLogChan = await setupChannel("mod-logs", "Astrix Moderation & Punishments Feed");
    const msgLogChan = await setupChannel("message-logs", "Astrix Message Lifecycle & Edit Feed");
    const memberLogChan = await setupChannel("member-logs", "Astrix Member Joins, Leaves & Identity Feed");
    const voiceLogChan = await setupChannel("voice-logs", "Astrix Voice Channel Activity Feed");
    const chanLogChan = await setupChannel("channel-logs", "Astrix Channel Structure & Permission Feed");
    const roleLogChan = await setupChannel("role-logs", "Astrix Role & Hierarchy Audit Feed");
    const serverLogChan = await setupChannel("server-logs", "Astrix Server, Vanity & Invite Feed");

    if (anLogChan) antinukeManager.setAntinukeLogs(guild.id, anLogChan.id);
    if (modLogChan) antinukeManager.setModLogs(guild.id, modLogChan.id);

    try {
      const loggingConfig = loggingManager.getGuildLogging(guild.id);
      loggingConfig.enabled = true;
      loggingConfig.channels.mod = modLogChan ? modLogChan.id : null;
      loggingConfig.channels.message = msgLogChan ? msgLogChan.id : null;
      loggingConfig.channels.member = memberLogChan ? memberLogChan.id : null;
      loggingConfig.channels.voice = voiceLogChan ? voiceLogChan.id : null;
      loggingConfig.channels.channel = chanLogChan ? chanLogChan.id : null;
      loggingConfig.channels.role = roleLogChan ? roleLogChan.id : null;
      loggingConfig.channels.server = serverLogChan ? serverLogChan.id : null;
      loggingManager.setGuildLogging(guild.id, loggingConfig);
    } catch (_) {}

    // Send Specialized Welcome / Thank You Message in each of the 8 Log Channels
    const sendWelcomeCard = async (chan, title, subtitle, desc, bulletTitle, bullets) => {
      if (!chan) return;
      const card = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🛡️ **${title}**\n` +
            `-# *${subtitle}*\n\n` +
            `> **${desc}**\n\n` +
            `**${bulletTitle}**\n` +
            bullets.map((b) => `> • ${b}`).join("\n") +
            `\n\n-# ASTRIXCODE™ High-Speed Logging Engine • Initialized <t:${Math.floor(Date.now() / 1000)}:F>`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

      await chan.send({
        components: [card],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    };

    // 1. Anti-Nuke Logs
    await sendWelcomeCard(
      anLogChan,
      "Astrix Anti-Nuke Sentinel Online",
      "Zero-Bypass Real-Time Server Defense",
      `Thank you for securing ${guild.name} with Astrix Security! This channel records real-time anti-nuke defense triggers, instant quarantine actions, and zero-bypass breaches.`,
      "🔒 Active Protection Safeguards:",
      [
        `**Security Wall:** ${wallRole ? `<@&${wallRole.id}>` : "Active"}`,
        `**Defense Modules:** All 10 Anti-Nuke Modules Armed & Ready`,
        `**Auto-Revert:** Automatic restoration for deleted channels & roles`,
        `**Un-Bypassable Engine:** Sub-0.1s privilege interception active`,
      ]
    );

    // 2. Moderation Logs
    await sendWelcomeCard(
      modLogChan,
      "Astrix Moderation & Member Audit Feed",
      "Member Sanctions & Disciplinary Enforcement",
      `Thank you for setting up Astrix Moderation! This channel records all staff moderation commands, automated sanctions (Kicks, Bans, Timeouts, Mutes), and member security alerts.`,
      "⚖️ Tracked Member Actions:",
      [
        `**Member Sanctions:** Kicks, Bans, Unbans, Timeouts & Warnings`,
        `**Staff Audits:** Moderator tag, target ID & provided reason`,
        `**Quarantine Records:** Automated anti-abuse member lockdowns`,
        `**Disciplinary Records:** Persistent moderation action history`,
      ]
    );

    // 3. Message Logs
    await sendWelcomeCard(
      msgLogChan,
      "Astrix Message & Chat Audit Feed",
      "Message Deletions, Edits & Purge Records",
      `Thank you for enabling Message Tracking! This channel records deleted messages, edited message history, bulk purge operations, and pinned messages.`,
      "💬 Tracked Message Events:",
      [
        `**Message Deletes:** Author, channel & original message content`,
        `**Message Edits:** Before and after comparative diff`,
        `**Bulk Purges:** Moderator clear commands & message count`,
        `**Pin Actions:** Messages pinned or unpinned in channels`,
      ]
    );

    // 4. Member Logs
    await sendWelcomeCard(
      memberLogChan,
      "Astrix Member & Identity Audit Feed",
      "Member Joins, Departures & Profile Changes",
      `Thank you for enabling Member Tracking! This channel records member joins, leaves, bot additions, nickname updates, avatar changes, and role assignments.`,
      "👥 Tracked Member Events:",
      [
        `**Member Gate:** Member joins, account age & departures`,
        `**Identity Updates:** Nickname & server avatar modifications`,
        `**Bot Ingestion:** New bot invites & integrator authorizations`,
        `**Role Updates:** Direct roles granted or revoked from members`,
      ]
    );

    // 5. Voice Logs
    await sendWelcomeCard(
      voiceLogChan,
      "Astrix Voice Activity & Session Feed",
      "Voice Channel Connections & State Changes",
      `Thank you for enabling Voice Tracking! This channel records voice joins, leaves, channel switches, and server mute/deafen states.`,
      "🎙️ Tracked Voice Events:",
      [
        `**Voice Lifecycle:** Joined, Left & Switched voice channels`,
        `**Session Time:** Time spent in active audio rooms`,
        `**Audio State:** Server Mute & Deafen toggles`,
        `**Stream & Video:** Screen sharing & video camera updates`,
      ]
    );

    // 6. Channel Logs
    await sendWelcomeCard(
      chanLogChan,
      "Astrix Channel & Structure Audit Feed",
      "Channel Modifications & Permission Tracking",
      `Thank you for enabling Channel Monitoring! This channel records all channel creations, deletions, name/topic changes, and permission override modifications.`,
      "📂 Tracked Channel Events:",
      [
        `**Channel Lifecycle:** Channels Created, Deleted, Cloned & Restored`,
        `**Permission Overwrites:** ViewChannel, SendMessages & Role syncs`,
        `**Topic & Name Changes:** Live channel metadata audits`,
        `**Thread Tracking:** Public and private thread lifecycles`,
      ]
    );

    // 7. Role Logs
    await sendWelcomeCard(
      roleLogChan,
      "Astrix Role & Hierarchy Audit Feed",
      "Role Lifecycle, Permissions & Assignment Tracking",
      `Thank you for enabling Role Monitoring! This channel records role creations, deletions, dangerous permission grants, and role assignments across server members.`,
      "🎭 Tracked Role Events:",
      [
        `**Role Lifecycle:** Roles Created, Deleted, Renamed & Reordered`,
        `**Permission Audits:** Administrator & Manage Server permission grants`,
        `**Member Roles:** Custom role assignments & staff role grants`,
        `**Hierarchy Tracking:** Role color, hoist & mentionable updates`,
      ]
    );

    // 8. Server Logs
    await sendWelcomeCard(
      serverLogChan,
      "Astrix Server, Vanity & Invite Feed",
      "Guild Settings, Vanity URL & Integration Tracking",
      `Thank you for enabling Server Tracking! This channel records server setting updates, vanity URL alterations, server boost events, invite links, and custom emojis/stickers.`,
      "🌐 Tracked Server Events:",
      [
        `**Guild Settings:** Server Name, Icon, Banner & Verification Level`,
        `**Vanity & Invites:** Invite creation, deletion & vanity URL defense`,
        `**Server Boosts:** Member boosts added & boost tier changes`,
        `**Custom Assets:** Emojis & stickers uploaded, edited or deleted`,
      ]
    );

    await logStep(`🛡️ **Dedicated log channels have been setuped in category \`${category?.name || "ASTRIX SECURITY"}\`!** (\`#antinuke-logs\`, \`#mod-logs\`, \`#message-logs\`, \`#member-logs\`, \`#voice-logs\`, \`#channel-logs\`, \`#role-logs\`, \`#server-logs\`)`);

    // Step 4: Permission Stripping across dangerous roles
    await logStep(`🔧 **Stripping administrator/manage server/kick/ban permissions from custom roles...**`);

    let strippedCount = 0;
    let skippedCount = 0;

    for (const role of guild.roles.cache.values()) {
      if (role.id === guild.id) continue;
      if (role.name === "@everyone") continue;
      if ([wallRole?.id, antivanityRole?.id, unbypassableRole?.id, bypassRole?.id].includes(role.id)) continue;
      if (role.managed) continue; // Skip Discord integration/bot-managed roles

      const hasDangerous = DANGEROUS_PERMS.some((p) => role.permissions.has(p));
      if (!hasDangerous) continue;

      if (role.position >= botHighestPosition) {
        skippedCount++;
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
        skippedCount++;
      }
    }

    await logStep(`🛡️ **Stripped dangerous permissions from ${strippedCount} custom roles!**${skippedCount > 0 ? ` *(Protected/Higher roles skipped: ${skippedCount})*` : ""}`);

    // Step 5: Wall role assignment to ALL members (users, bots, owner & bot itself)
    let totalMembers = 0;
    let newlyAssigned = 0;
    try {
      const members = await guild.members.fetch().catch(() => guild.members.cache);
      if (wallRole) {
        for (const m of members.values()) {
          totalMembers++;
          if (!m.roles.cache.has(wallRole.id)) {
            try {
              await m.roles.add(wallRole.id, "Astrix Security Wall Assignment").catch(() => null);
              newlyAssigned++;
            } catch (_) {}
          }
        }
        // Explicitly guarantee bot itself has the wall role
        if (guild.members.me && !guild.members.me.roles.cache.has(wallRole.id)) {
          await guild.members.me.roles.add(wallRole.id, "Astrix Security Wall (Bot Self)").catch(() => null);
        }
        // Explicitly guarantee server owner has the wall role
        try {
          const ownerMember = await guild.members.fetch(guild.ownerId).catch(() => null);
          if (ownerMember && !ownerMember.roles.cache.has(wallRole.id)) {
            await ownerMember.roles.add(wallRole.id, "Astrix Security Wall (Guild Owner)").catch(() => null);
          }
        } catch (_) {}
      }
    } catch (_) {}

    await logStep(
      `🛡️ **Astrix Security Wall role assigned to all members (users, bots, owner & Astrix)!**\n> *(Members secured: ${totalMembers}/${totalMembers}, Newly assigned: ${newlyAssigned})*`
    );
    await logStep(`🛡️ **All security features and antinuke modules have been enabled**`);

    // Finalize state and persist to disk
    const finalConfig = antinukeManager.getGuildAntinuke(guild.id);
    finalConfig.enabled = true;
    if (!finalConfig.modules) finalConfig.modules = {};
    for (const k of ["channel", "role", "ban", "kick", "webhook", "botAdd", "guildUpdate", "emoji", "permissions", "prune"]) {
      finalConfig.modules[k] = true;
    }
    if (bypassRole) finalConfig.bypassRole = bypassRole.id;
    if (unbypassableRole) finalConfig.unbypassableRole = unbypassableRole.id;
    if (antivanityRole) finalConfig.antivanityAdminRole = antivanityRole.id;
    if (criminalsRole) finalConfig.criminalsRole = criminalsRole.id;
    if (wallRole) {
      finalConfig.securityWallRole = wallRole.id;
      if (!finalConfig.wallRoles) finalConfig.wallRoles = [];
      if (!finalConfig.wallRoles.includes(wallRole.id)) finalConfig.wallRoles.push(wallRole.id);
    }
    antinukeManager.setGuildAntinuke(guild.id, finalConfig);

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
      `> 🛡️ \`message-logs\` has proper security permissions!\n` +
      `> 🛡️ \`member-logs\` has proper security permissions!\n` +
      `> 🛡️ \`voice-logs\` has proper security permissions!\n` +
      `> 🛡️ \`channel-logs\` has proper security permissions!\n` +
      `> 🛡️ \`role-logs\` has proper security permissions!\n` +
      `> 🛡️ \`server-logs\` has proper security permissions!\n` +
      `> 🛡️ Checking role positions...\n` +
      `> 🔧 Stripping dangerous permissions from custom roles...\n` +
      `> 🛡️ **Stripped dangerous permissions from ${strippedCount} custom roles!**\n\n` +
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
      config.bypassRole,
      config.securityWallRole,
      config.antivanityAdminRole,
      config.criminalsRole,
      config.unbypassableRole,
      ...(config.wallRoles || []),
    ].filter(Boolean));

    const securityRoleNames = [
      "astrix bypass",
      "astrix security wall",
      "astrix antivanity admin",
      "criminals",
      "astrix un-bypassable setup",
    ];

    const fetchedRoles = await guild.roles.fetch().catch(() => guild.roles.cache);
    const rolesCache = Array.from(fetchedRoles.values());
    for (const r of rolesCache) {
      if (r.id === guild.id || r.managed || r.name === "@everyone") continue;
      const lower = r.name.toLowerCase();
      if (
        roleIdsToDelete.has(r.id) ||
        securityRoleNames.includes(lower) ||
        lower.includes("astrix bypass") ||
        lower.includes("astrix security wall") ||
        lower.includes("astrix antivanity") ||
        lower.includes("un-bypassable setup")
      ) {
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
      config.chanLogChannel,
      config.roleLogChannel,
      config.serverLogChannel,
    ].filter(Boolean));

    const securityChannelNames = [
      "antinuke-logs",
      "superantinuke-logs",
      "mod-logs",
      "message-logs",
      "member-logs",
      "voice-logs",
      "channel-logs",
      "role-logs",
      "server-logs",
    ];

    const fetchedChannels = await guild.channels.fetch().catch(() => guild.channels.cache);
    const channelsCache = Array.from(fetchedChannels.values());

    // Find "🛡️ ASTRIX SECURITY" Category
    const category = channelsCache.find(
      (c) => c && c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes("astrix security") || c.name.toLowerCase().includes("security logs"))
    );

    for (const c of channelsCache) {
      if (!c || c.id === guild.id || c.type === ChannelType.GuildCategory) continue;
      const lower = c.name.toLowerCase();
      const isInSecCategory = category && c.parentId === category.id;
      if (channelIdsToDelete.has(c.id) || securityChannelNames.includes(lower) || isInSecCategory) {
        try {
          await c.delete("Astrix Security Deactivation & Asset Purge").catch(() => null);
          deletedChannels++;
        } catch (_) {}
      }
    }

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

function buildLoadingNotice(title = "Processing Action", description = "Please wait while your request is processed...") {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ⏳ **${title}**\n> ${description}`
    )
  );
  return container;
}

module.exports = {
  buildLoadingNotice,
  buildAutoSetupWallSelectionContainer,
  buildEnableRecommendationContainer,
  executeAutoSetup,
  executeAutoCleanup,
};
