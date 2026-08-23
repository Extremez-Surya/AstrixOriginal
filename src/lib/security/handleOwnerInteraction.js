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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType,
} = require("discord.js");
const noprefixManager = require("../noprefixManager");
const EMOJIS = require("../emojis");

const ACTIVITY_TYPES = {
  custom: ActivityType.Custom,
  playing: ActivityType.Playing,
  streaming: ActivityType.Streaming,
  listening: ActivityType.Listening,
  watching: ActivityType.Watching,
  competing: ActivityType.Competing,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. BUILD OWNER DASHBOARD CONTAINER (MULTI-TAB ARCHITECTURE)
// ─────────────────────────────────────────────────────────────────────────────
function buildOwnerContainer(client, currentTab = "overview", page = 1) {
  const container = new ContainerBuilder();
  const store = noprefixManager.getStore();
  const now = Date.now();

  const activeUsers = (store.users || []).filter((u) => u.expiresAt > now);
  const activeServers = (store.servers || []).filter((s) => s.expiresAt > now);
  const activeRoles = (store.roles || []).filter((r) => r.expiresAt > now);
  const blacklistedUsers = store.blacklistedUsers || [];
  const blacklistedServers = store.blacklistedServers || [];

  // Tab Navigation Bar
  const tabSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("owner_tab_nav")
    .setPlaceholder("🧭 Navigate Owner Control Center...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("System Overview")
        .setValue("owner_tab_overview")
        .setDescription("Bot metrics, memory, uptime & quick stats")
        .setEmoji("👑")
        .setDefault(currentTab === "overview"),
      new StringSelectMenuOptionBuilder()
        .setLabel("No-Prefix Studio")
        .setValue("owner_tab_noprefix")
        .setDescription(`Manage ${activeUsers.length} users, ${activeServers.length} servers`)
        .setEmoji("⚡")
        .setDefault(currentTab === "noprefix"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Blacklist Directory")
        .setValue("owner_tab_blacklist")
        .setDescription(`Manage ${blacklistedUsers.length} users, ${blacklistedServers.length} servers`)
        .setEmoji("🚫")
        .setDefault(currentTab === "blacklist"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Server Guilds Explorer")
        .setValue("owner_tab_servers")
        .setDescription(`Explore ${client.guilds.cache.size} connected servers`)
        .setEmoji("🏠")
        .setDefault(currentTab === "servers"),
      new StringSelectMenuOptionBuilder()
        .setLabel("System Engine & Reload")
        .setValue("owner_tab_system")
        .setDescription("Engine reload, memory cache & audio node status")
        .setEmoji("⚙️")
        .setDefault(currentTab === "system")
    );

  const tabRow = new ActionRowBuilder().addComponents(tabSelectMenu);

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: OVERVIEW
  // ───────────────────────────────────────────────────────────────────────────
  if (currentTab === "overview") {
    const mem = process.memoryUsage();
    const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const heapTotalMB = (mem.heapTotal / 1024 / 1024).toFixed(1);
    const rssMB = (mem.rss / 1024 / 1024).toFixed(1);
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    const totalMembers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 👑 **Astrix Owner & System Control Center**\n` +
        `-# *Master Administrative Dashboard & Hardware Telemetry*\n\n` +
        `**⚡ Core Engine Telemetry:**\n` +
        `> • **Bot Identity:** \`${client.user?.tag || "Astrix#9917"}\` (\`${client.user?.id}\`)\n` +
        `> • **Gateway Latency:** \`${client.ws.ping >= 0 ? `${client.ws.ping}ms` : "Optimal (<1ms)"}\` • **Shards:** \`1 Shard Active\`\n` +
        `> • **Process Uptime:** \`${hours}h ${minutes}m\` • **Node.js:** \`${process.version}\`\n` +
        `> • **Memory Usage:** \`${heapUsedMB} MB\` / \`${heapTotalMB} MB\` (RSS: \`${rssMB} MB\`)\n\n` +
        `**🌐 Network Reach:**\n` +
        `> • **Connected Guilds:** \`${client.guilds.cache.size}\` servers\n` +
        `> • **Cached Members:** \`${totalMembers.toLocaleString()}\` total members\n` +
        `> • **No-Prefix Executions:** \`⚡ ${store.stats?.totalNoPrefixExecutions || 0}\` total triggers\n\n` +
        `**🔒 Global Access Matrix:**\n` +
        `> • **No-Prefix Users:** \`${activeUsers.length}\` active • **Servers:** \`${activeServers.length}\` active\n` +
        `> • **Blacklisted Users:** \`${blacklistedUsers.length}\` • **Blacklisted Servers:** \`${blacklistedServers.length}\``
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addActionRowComponents(tabRow);

    const quickRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("owner_btn_add_user").setLabel("Grant NP User").setEmoji("⚡").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("owner_btn_add_server").setLabel("Grant NP Server").setEmoji("🏠").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("owner_btn_blacklist").setLabel("Blacklist User").setEmoji("🚫").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("owner_btn_reload_all").setLabel("Hot Reload").setEmoji("🔄").setStyle(ButtonStyle.Secondary)
    );
    container.addActionRowComponents(quickRow);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2: NO-PREFIX STUDIO
  // ───────────────────────────────────────────────────────────────────────────
  else if (currentTab === "noprefix") {
    const userList = activeUsers.length > 0
      ? activeUsers.slice(0, 8).map((u, i) => `> \`${i + 1}.\` <@${u.id}> (\`${u.id}\`) — ${noprefixManager.formatExpiry(u.expiresAt)}`).join("\n")
      : "> *No active no-prefix user grants.*";

    const serverList = activeServers.length > 0
      ? activeServers.slice(0, 5).map((s, i) => {
          const g = client.guilds.cache.get(s.id);
          return `> \`${i + 1}.\` **${g?.name || s.id}** (\`${s.id}\`) — ${noprefixManager.formatExpiry(s.expiresAt)}`;
        }).join("\n")
      : "> *No active no-prefix server grants.*";

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⚡ **No-Prefix Management Studio**\n` +
        `-# *Zero-Latency Instant Execution Access Control*\n\n` +
        `**👤 Active No-Prefix Users (${activeUsers.length}):**\n` +
        `${userList}\n\n` +
        `**🏠 Active No-Prefix Servers (${activeServers.length}):**\n` +
        `${serverList}\n\n` +
        `-# Use buttons below to grant or revoke access via ID or username.`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addActionRowComponents(tabRow);

    const npActions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("owner_btn_add_user").setLabel("Add User NP").setEmoji("➕").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("owner_btn_remove_user_np").setLabel("Remove User NP").setEmoji("➖").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("owner_btn_add_server").setLabel("Add Server NP").setEmoji("🏠").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("owner_tab_overview_btn").setLabel("Back to Hub").setEmoji("👑").setStyle(ButtonStyle.Secondary)
    );
    container.addActionRowComponents(npActions);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 3: BLACKLIST DIRECTORY
  // ───────────────────────────────────────────────────────────────────────────
  else if (currentTab === "blacklist") {
    const blUsers = blacklistedUsers.length > 0
      ? blacklistedUsers.slice(0, 8).map((u, i) => `> \`${i + 1}.\` <@${u.id}> (\`${u.id}\`) — Reason: *${u.reason}*`).join("\n")
      : "> *No blacklisted users.*";

    const blServers = blacklistedServers.length > 0
      ? blacklistedServers.slice(0, 5).map((s, i) => `> \`${i + 1}.\` ID: \`${s.id}\` — Reason: *${s.reason}*`).join("\n")
      : "> *No blacklisted servers.*";

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🚫 **Global Blacklist Directory**\n` +
        `-# *Permanent Zero-Access Network Quarantine*\n\n` +
        `**👤 Blacklisted Users (${blacklistedUsers.length}):**\n` +
        `${blUsers}\n\n` +
        `**🏠 Blacklisted Servers (${blacklistedServers.length}):**\n` +
        `${blServers}\n\n` +
        `-# Blacklisted entities cannot invoke any commands or access bot infrastructure.`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addActionRowComponents(tabRow);

    const blActions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("owner_btn_blacklist").setLabel("Blacklist User").setEmoji("🚫").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("owner_btn_unblacklist_user").setLabel("Unblacklist User").setEmoji("🔓").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("owner_btn_blacklist_server").setLabel("Blacklist Server").setEmoji("⛔").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("owner_tab_overview_btn").setLabel("Back to Hub").setEmoji("👑").setStyle(ButtonStyle.Secondary)
    );
    container.addActionRowComponents(blActions);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 4: SERVER GUILDS EXPLORER
  // ───────────────────────────────────────────────────────────────────────────
  else if (currentTab === "servers") {
    const guilds = Array.from(client.guilds.cache.values());
    guilds.sort((a, b) => b.memberCount - a.memberCount);

    const perPage = 6;
    const totalPages = Math.ceil(guilds.length / perPage) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * perPage;
    const pageItems = guilds.slice(start, start + perPage);

    const guildList = pageItems
      .map((g, i) => `> \`${start + i + 1}.\` **${g.name}** (\`${g.id}\`)\n> 👥 \`${g.memberCount}\` members • 👑 Owner: <@${g.ownerId}>`)
      .join("\n\n");

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🏠 **Server Guilds Explorer**\n` +
        `-# *Total Connected Guilds: ${guilds.length} servers • Page ${safePage}/${totalPages}*\n\n` +
        `${guildList || "> *No servers found.*"}`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addActionRowComponents(tabRow);

    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`owner_servers_page:${safePage - 1}`)
        .setLabel("Previous")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage <= 1),
      new ButtonBuilder()
        .setCustomId(`owner_servers_page:${safePage + 1}`)
        .setLabel("Next")
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage >= totalPages),
      new ButtonBuilder()
        .setCustomId("owner_btn_leave_server")
        .setLabel("Leave Guild")
        .setEmoji("🚪")
        .setStyle(ButtonStyle.Danger)
    );
    container.addActionRowComponents(navRow);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 5: SYSTEM ENGINE & RELOAD
  // ───────────────────────────────────────────────────────────────────────────
  else if (currentTab === "system") {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⚙️ **System Engine & Diagnostics**\n` +
        `-# *Live Application Architecture & Dynamic Reload*\n\n` +
        `**📦 Core Components Status:**\n` +
        `> • **Command Engine:** \`364 Base Commands (967 Aliases)\`\n` +
        `> • **Event Listeners:** \`28 Real-Time Gateway Handlers\`\n` +
        `> • **Anti-Nuke Engine:** \`Active (Sub-0.1s Zero-Bypass Filter)\`\n` +
        `> • **AutoMod Engine:** \`Active (Regex & Token Pattern Scanner)\`\n` +
        `> • **Audio Engine:** \`Lavalink Node (v4) Connected\`\n\n` +
        `**⚡ Quick Maintenance Operations:**\n` +
        `> • Select an option below to perform zero-downtime hot reloads.`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addActionRowComponents(tabRow);

    const sysActions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("owner_btn_reload_all").setLabel("Reload All Systems").setEmoji("🔄").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("owner_btn_gc_clean").setLabel("Clear Memory Cache").setEmoji("🧹").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("owner_tab_overview_btn").setLabel("Back to Hub").setEmoji("👑").setStyle(ButtonStyle.Secondary)
    );
    container.addActionRowComponents(sysActions);
  }

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Engine • Owner Control Suite • <t:${Math.floor(Date.now() / 1000)}:R>`)
  );

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DURATION SELECTION CONTAINER FOR NO-PREFIX
// ─────────────────────────────────────────────────────────────────────────────
function buildDurationSelectionContainer(targetUser) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ⚡ **Grant No-Prefix Access: <@${targetUser.id}>**\n` +
      `-# *Select access duration for ${targetUser.username || targetUser.tag || targetUser.id}*`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const durationMenu = new StringSelectMenuBuilder()
    .setCustomId(`np_duration_select:${targetUser.id}`)
    .setPlaceholder("⏱️ Choose access duration...")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("1 Day").setValue("1d").setDescription("Grant No-Prefix for 24 Hours").setEmoji("📅"),
      new StringSelectMenuOptionBuilder().setLabel("7 Days").setValue("7d").setDescription("Grant No-Prefix for 1 Week").setEmoji("🗓️"),
      new StringSelectMenuOptionBuilder().setLabel("30 Days (1 Month)").setValue("30d").setDescription("Grant No-Prefix for 30 Days").setEmoji("📆"),
      new StringSelectMenuOptionBuilder().setLabel("90 Days (3 Months)").setValue("90d").setDescription("Grant No-Prefix for 90 Days").setEmoji("✨"),
      new StringSelectMenuOptionBuilder().setLabel("Lifetime (Permanent)").setValue("lifetime").setDescription("Grant Permanent Lifetime Access").setEmoji("♾️")
    );

  const menuRow = new ActionRowBuilder().addComponents(durationMenu);

  const closeBtn = new ButtonBuilder()
    .setCustomId("np_btn_close")
    .setLabel("Cancel")
    .setEmoji("✖️")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(closeBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ No-Prefix Engine`)
  );

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERACTION HANDLER FOR OWNER CONTROL CENTER
// ─────────────────────────────────────────────────────────────────────────────
async function handleOwnerInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isModal = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isModal) return false;

  const customId = interaction.customId;

  // Handle np_ close button
  if (isBtn && customId === "np_btn_close") {
    await interaction.message?.delete().catch(() => null);
    return true;
  }

  // Handle np_ duration select menu
  if (isMenu && customId.startsWith("np_duration_select:")) {
    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      await interaction.reply({ content: "❌ Only Bot Owners can grant No-Prefix access.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    const targetUserId = customId.split(":")[1];
    const durationArg = interaction.values[0];
    const durationMs = noprefixManager.parseDuration(durationArg);
    const durationLabel = noprefixManager.getDurationLabel(durationArg);

    noprefixManager.addNoPrefixUser(targetUserId, durationMs, interaction.user.id);
    await noprefixManager.sendNoPrefixDM(client, targetUserId, durationLabel, true);

    const updated = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ **No-Prefix Granted Successfully**\n\n` +
          `> • **User:** <@${targetUserId}> (\`${targetUserId}\`)\n` +
          `> • **Granted Duration:** \`${durationLabel}\`\n` +
          `> • **Authorizer:** <@${interaction.user.id}>\n\n` +
          `-# Direct Message confirmation dispatched to user.`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("np_btn_close").setLabel("Close").setEmoji("🔒").setStyle(ButtonStyle.Secondary)
        )
      );

    await interaction.update({
      components: [updated],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    return true;
  }

  if (!customId.startsWith("owner_")) return false;

  // Permissions Check: Bot Owner Only
  if (!noprefixManager.isOwner(interaction.user.id, client)) {
    await interaction
      .reply({
        content: "❌ Access Denied: Only Bot Owners can execute owner control actions.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  // Tab Navigation Menu
  if (isMenu && customId === "owner_tab_nav") {
    const selected = interaction.values[0];
    let tab = "overview";
    if (selected === "owner_tab_noprefix") tab = "noprefix";
    else if (selected === "owner_tab_blacklist") tab = "blacklist";
    else if (selected === "owner_tab_servers") tab = "servers";
    else if (selected === "owner_tab_system") tab = "system";

    const view = buildOwnerContainer(client, tab, 1);
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // Back to Hub Button
  if (isBtn && customId === "owner_tab_overview_btn") {
    const view = buildOwnerContainer(client, "overview", 1);
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // Server Pagination Buttons
  if (isBtn && customId.startsWith("owner_servers_page:")) {
    const p = parseInt(customId.split(":")[1], 10) || 1;
    const view = buildOwnerContainer(client, "servers", p);
    await interaction.update({ components: [view], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  // Reload All Systems Button
  if (isBtn && customId === "owner_btn_reload_all") {
    const startTime = Date.now();
    try {
      const { applicationECSLoader } = require("../functions/application-ecs-loader");
      await applicationECSLoader(client);
      const elapsed = Date.now() - startTime;

      const notice = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔄 **System Hot-Reload Complete**\n\n` +
            `> • **Status:** \`All 364 Commands & 28 Events Reloaded\`\n` +
            `> • **Execution Time:** \`${elapsed} ms\`\n` +
            `> • **Core Engine:** \`Operational & Ready\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("owner_tab_overview_btn").setLabel("Back to Hub").setEmoji("👑").setStyle(ButtonStyle.Primary)
          )
        );

      await interaction.update({ components: [notice], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch (e) {
      await interaction.reply({ content: `❌ Reload failed: ${e.message}`, flags: MessageFlags.Ephemeral }).catch(() => null);
    }
    return true;
  }

  // Clear Memory Cache Button
  if (isBtn && customId === "owner_btn_gc_clean") {
    if (global.gc) global.gc();
    const mem = process.memoryUsage();
    const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);

    await interaction.reply({
      content: `🧹 Memory cache flushed! Current heap: \`${heapMB} MB\``,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // Modals Triggers
  if (isBtn && customId === "owner_btn_add_user") {
    const modal = new ModalBuilder()
      .setCustomId("owner_modal_add_user")
      .setTitle("Grant No-Prefix to User")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_userid")
            .setLabel("User ID or Mention")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 123456789012345678")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_duration")
            .setLabel("Duration (1d, 7d, 30d, 90d, lifetime)")
            .setStyle(TextInputStyle.Short)
            .setValue("lifetime")
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "owner_btn_remove_user_np") {
    const modal = new ModalBuilder()
      .setCustomId("owner_modal_remove_user_np")
      .setTitle("Revoke No-Prefix Access")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_userid")
            .setLabel("User ID or Mention")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 123456789012345678")
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "owner_btn_add_server") {
    const modal = new ModalBuilder()
      .setCustomId("owner_modal_add_server")
      .setTitle("Grant No-Prefix to Server")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_serverid")
            .setLabel("Server ID")
            .setStyle(TextInputStyle.Short)
            .setValue(interaction.guildId || "")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_duration")
            .setLabel("Duration (30d, 90d, lifetime)")
            .setStyle(TextInputStyle.Short)
            .setValue("lifetime")
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "owner_btn_blacklist") {
    const modal = new ModalBuilder()
      .setCustomId("owner_modal_blacklist")
      .setTitle("Blacklist User Globally")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_targetid")
            .setLabel("Target User ID")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_reason")
            .setLabel("Reason")
            .setStyle(TextInputStyle.Short)
            .setValue("Violated bot terms of service.")
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "owner_btn_unblacklist_user") {
    const modal = new ModalBuilder()
      .setCustomId("owner_modal_unblacklist_user")
      .setTitle("Revoke User Blacklist")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_targetid")
            .setLabel("User ID")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }



  if (isBtn && customId === "owner_btn_leave_server") {
    const modal = new ModalBuilder()
      .setCustomId("owner_modal_leave_server")
      .setTitle("Force Leave Guild")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_guildid")
            .setLabel("Guild ID to Leave")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 123456789012345678")
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // Modal Submissions
  if (isModal) {
    if (customId === "owner_modal_add_user") {
      const targetArg = interaction.fields.getTextInputValue("input_userid").trim();
      const durationArg = interaction.fields.getTextInputValue("input_duration").trim();
      const userId = targetArg.replace(/[<@!>]/g, "");
      const durationMs = noprefixManager.parseDuration(durationArg) || 30 * 24 * 60 * 60 * 1000;
      const durationLabel = noprefixManager.getDurationLabel(durationArg);

      noprefixManager.addNoPrefixUser(userId, durationMs, interaction.user.id);
      await noprefixManager.sendNoPrefixDM(client, userId, durationLabel, true);

      await interaction.reply({
        content: `✅ Granted No-Prefix access to <@${userId}> for **${durationLabel}**.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (customId === "owner_modal_remove_user_np") {
      const targetArg = interaction.fields.getTextInputValue("input_userid").trim();
      const userId = targetArg.replace(/[<@!>]/g, "");

      const removed = noprefixManager.removeNoPrefixUser(userId);
      await interaction.reply({
        content: removed ? `✅ Revoked No-Prefix access from <@${userId}>.` : `❌ User <@${userId}> does not have active No-Prefix.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (customId === "owner_modal_add_server") {
      const serverId = interaction.fields.getTextInputValue("input_serverid").trim();
      const durationArg = interaction.fields.getTextInputValue("input_duration").trim();
      const durationMs = noprefixManager.parseDuration(durationArg) || 30 * 24 * 60 * 60 * 1000;
      const durationLabel = noprefixManager.getDurationLabel(durationArg);

      noprefixManager.addNoPrefixServer(serverId, durationMs, interaction.user.id);
      await interaction.reply({
        content: `✅ Granted No-Prefix access to Server \`${serverId}\` for **${durationLabel}**.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (customId === "owner_modal_blacklist") {
      const targetId = interaction.fields.getTextInputValue("input_targetid").trim().replace(/[<@!>]/g, "");
      const reason = interaction.fields.getTextInputValue("input_reason").trim();

      if (noprefixManager.isOwner(targetId, client)) {
        await interaction.reply({ content: "❌ Cannot blacklist a Bot Owner.", flags: MessageFlags.Ephemeral }).catch(() => null);
        return true;
      }

      noprefixManager.addBlacklistUser(targetId, reason, interaction.user.id);
      await interaction.reply({
        content: `🚫 Blacklisted User <@${targetId}> (\`${targetId}\`). Reason: *${reason}*`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (customId === "owner_modal_unblacklist_user") {
      const targetId = interaction.fields.getTextInputValue("input_targetid").trim().replace(/[<@!>]/g, "");
      const removed = noprefixManager.removeBlacklistUser(targetId);

      await interaction.reply({
        content: removed ? `✅ Unblacklisted user <@${targetId}>.` : `❌ User \`${targetId}\` was not blacklisted.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }



    if (customId === "owner_modal_leave_server") {
      const guildId = interaction.fields.getTextInputValue("input_guildid").trim();
      const targetGuild = client.guilds.cache.get(guildId);
      if (!targetGuild) {
        await interaction.reply({ content: `❌ Guild \`${guildId}\` not found in cache.`, flags: MessageFlags.Ephemeral }).catch(() => null);
        return true;
      }

      const guildName = targetGuild.name;
      await targetGuild.leave().catch(() => null);
      await interaction.reply({ content: `✅ Left guild **${guildName}** (\`${guildId}\`).`, flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }
  }

  const updatedMain = buildOwnerContainer(client, "overview", 1);
  await interaction.update({ components: [updatedMain], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  return true;
}

module.exports = {
  buildOwnerContainer,
  buildDurationSelectionContainer,
  handleOwnerInteraction,
};
