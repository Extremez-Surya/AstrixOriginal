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
} = require("discord.js");
const noprefixManager = require("../noprefixManager");
const EMOJIS = require("../emojis");

function buildOwnerContainer(client) {
  const container = new ContainerBuilder();
  const store = noprefixManager.getStore();

  const now = Date.now();
  const activeUsers = (store.users || []).filter((u) => u.expiresAt > now);
  const activeServers = (store.servers || []).filter((s) => s.expiresAt > now);
  const activeRoles = (store.roles || []).filter((r) => r.expiresAt > now);
  const blacklistedUsers = store.blacklistedUsers || [];
  const blacklistedServers = store.blacklistedServers || [];

  // Minimal Header
  const headerText = `### ${EMOJIS.crown || "👑"} **Astrix Owner & No-Prefix Control Center**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Status Summary
  const bodyText =
    `> - **No-Prefix Users:** \`${activeUsers.length}\` active • **No-Prefix Servers:** \`${activeServers.length}\` active\n` +
    `> - **No-Prefix Roles:** \`${activeRoles.length}\` active • **Executions:** \`⚡ ${store.stats?.totalNoPrefixExecutions || 0}\` commands\n` +
    `> - **Blacklisted Users:** \`${blacklistedUsers.length}\` • **Blacklisted Servers:** \`${blacklistedServers.length}\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Creative Dropdown Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("owner_select_menu")
    .setPlaceholder("⚙️ Select an owner system directory...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("View No-Prefix Users")
        .setValue("owner_opt_noprefix_users")
        .setDescription(`Directory of ${activeUsers.length} no-prefix user grants`)
        .setEmoji("👤"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View No-Prefix Servers")
        .setValue("owner_opt_noprefix_servers")
        .setDescription(`Directory of ${activeServers.length} no-prefix server grants`)
        .setEmoji("🏠"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View No-Prefix Roles")
        .setValue("owner_opt_noprefix_roles")
        .setDescription(`Directory of ${activeRoles.length} no-prefix role grants`)
        .setEmoji("🎭"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View Blacklist Directory")
        .setValue("owner_opt_blacklist")
        .setDescription(`Directory of ${blacklistedUsers.length} users / ${blacklistedServers.length} servers`)
        .setEmoji("🚫"),
      new StringSelectMenuOptionBuilder()
        .setLabel("System Statistics")
        .setValue("owner_opt_stats")
        .setDescription("View system metrics & memory usage")
        .setEmoji("📊")
    );

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  // Minimal Buttons
  const addUserBtn = new ButtonBuilder()
    .setCustomId("owner_btn_add_user")
    .setLabel("Add User NP")
    .setStyle(ButtonStyle.Success);

  const addServerBtn = new ButtonBuilder()
    .setCustomId("owner_btn_add_server")
    .setLabel("Add Server NP")
    .setStyle(ButtonStyle.Primary);

  const blacklistBtn = new ButtonBuilder()
    .setCustomId("owner_btn_blacklist")
    .setLabel("Blacklist User")
    .setStyle(ButtonStyle.Danger);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("owner_btn_refresh")
    .setLabel("Refresh")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(addUserBtn, addServerBtn, blacklistBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  const footerText = `-# ASTRIXCODE™ Security • Sub-0.1s No-Prefix Execution Engine`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

  return container;
}

function buildDurationSelectionContainer(targetUser) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### <@${targetUser.id}> Info`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`For How Much Duration do you grant No-Prefix to <@${targetUser.id}>?`)
  );

  const durationMenu = new StringSelectMenuBuilder()
    .setCustomId(`np_duration_select:${targetUser.id}`)
    .setPlaceholder("Select a duration")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("1 Minute").setValue("1m").setDescription("Grant No-Prefix for 1 Minute").setEmoji("⚡"),
      new StringSelectMenuOptionBuilder().setLabel("5 Minutes").setValue("5m").setDescription("Grant No-Prefix for 5 Minutes").setEmoji("⏱️"),
      new StringSelectMenuOptionBuilder().setLabel("1 Hour").setValue("1h").setDescription("Grant No-Prefix for 1 Hour").setEmoji("⏳"),
      new StringSelectMenuOptionBuilder().setLabel("1 Day").setValue("1d").setDescription("Grant No-Prefix for 1 Day").setEmoji("📅"),
      new StringSelectMenuOptionBuilder().setLabel("7 Days").setValue("7d").setDescription("Grant No-Prefix for 7 Days").setEmoji("🗓️"),
      new StringSelectMenuOptionBuilder().setLabel("30 Days").setValue("30d").setDescription("Grant No-Prefix for 30 Days").setEmoji("📆"),
      new StringSelectMenuOptionBuilder().setLabel("90 Days").setValue("90d").setDescription("Grant No-Prefix for 90 Days").setEmoji("✨"),
      new StringSelectMenuOptionBuilder().setLabel("Lifetime").setValue("lifetime").setDescription("Grant Permanent Lifetime No-Prefix").setEmoji("♾️")
    );

  const menuRow = new ActionRowBuilder().addComponents(durationMenu);

  const closeBtn = new ButtonBuilder()
    .setCustomId("np_btn_close")
    .setLabel("Close")
    .setEmoji("🔒")
    .setStyle(ButtonStyle.Danger);

  const buttonRow = new ActionRowBuilder().addComponents(closeBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# Made By ASTRIXCODE`)
  );

  return container;
}

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
        new TextDisplayBuilder().setContent(`### ✅ No-Prefix Granted`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Successfully granted No-Prefix to <@${targetUserId}> for **${durationLabel}**.\n\n-# Direct Message notification sent to user.`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Made By ASTRIXCODE`)
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("np_btn_close").setLabel("Close").setEmoji("🔒").setStyle(ButtonStyle.Danger)
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

  const store = noprefixManager.getStore();
  const now = Date.now();

  // Handle Select Menu Interactions
  if (isMenu && customId === "owner_select_menu") {
    const selected = interaction.values[0];

    if (selected === "owner_opt_noprefix_users") {
      const users = (store.users || []).filter((u) => u.expiresAt > now);
      const listText =
        users.length > 0
          ? users
              .map((u, i) => `\`${i + 1}.\` <@${u.id}> (\`${u.id}\`) — ${noprefixManager.formatExpiry(u.expiresAt)}`)
              .join("\n")
          : "*No active no-prefix user grants.*";

      const dirContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 👤 **NO-PREFIX USERS DIRECTORY**\n\n${listText}`)
      );

      await interaction
        .reply({
          components: [dirContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    if (selected === "owner_opt_noprefix_servers") {
      const servers = (store.servers || []).filter((s) => s.expiresAt > now);
      const listText =
        servers.length > 0
          ? servers
              .map((s, i) => {
                const guild = client.guilds.cache.get(s.id);
                return `\`${i + 1}.\` **${guild?.name || s.id}** (\`${s.id}\`) — ${noprefixManager.formatExpiry(s.expiresAt)}`;
              })
              .join("\n")
          : "*No active no-prefix server grants.*";

      const dirContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🏠 **NO-PREFIX SERVERS DIRECTORY**\n\n${listText}`)
      );

      await interaction
        .reply({
          components: [dirContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    if (selected === "owner_opt_noprefix_roles") {
      const roles = (store.roles || []).filter((r) => r.expiresAt > now);
      const listText =
        roles.length > 0
          ? roles
              .map((r, i) => {
                const guild = client.guilds.cache.get(r.guildId);
                const role = guild?.roles.cache.get(r.roleId);
                return `\`${i + 1}.\` **${role?.name || r.roleId}** in *${guild?.name || r.guildId}* — ${noprefixManager.formatExpiry(r.expiresAt)}`;
              })
              .join("\n")
          : "*No active no-prefix role grants.*";

      const dirContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🎭 **NO-PREFIX ROLES DIRECTORY**\n\n${listText}`)
      );

      await interaction
        .reply({
          components: [dirContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    if (selected === "owner_opt_blacklist") {
      const blacklistedUsers = store.blacklistedUsers || [];
      const blacklistedServers = store.blacklistedServers || [];

      let userText = blacklistedUsers.length > 0 ? blacklistedUsers.map((u) => `> <@${u.id}> — Reason: ${u.reason}`).join("\n") : "*None*";
      let serverText = blacklistedServers.length > 0 ? blacklistedServers.map((s) => `> ID: ${s.id} — Reason: ${s.reason}`).join("\n") : "*None*";

      const blContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🚫 **BLACKLIST DIRECTORY**\n\n**Users:**\n${userText}\n\n**Servers:**\n${serverText}`)
      );

      await interaction
        .reply({
          components: [blContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    if (selected === "owner_opt_stats") {
      const mem = process.memoryUsage();
      const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
      const uptimeHours = (client.uptime / 1000 / 60 / 60).toFixed(2);

      const statsContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📊 **SYSTEM METRICS & STATS**\n` +
            `> - **Heap Memory:** \`${heapUsedMB} MB\`\n` +
            `> - **Uptime:** \`${uptimeHours} hours\`\n` +
            `> - **Cached Guilds:** \`${client.guilds.cache.size}\` servers\n` +
            `> - **Cached Users:** \`${client.users.cache.size}\` users\n` +
            `> - **No-Prefix Executions:** \`⚡ ${store.stats?.totalNoPrefixExecutions || 0}\` commands`
        )
      );

      await interaction
        .reply({
          components: [statsContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    const updated = buildOwnerContainer(client);
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  // Handle Buttons (Trigger Modals)
  if (isBtn && customId === "owner_btn_add_user") {
    const modal = new ModalBuilder()
      .setCustomId("owner_modal_add_user")
      .setTitle("Grant User No-Prefix Access")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_userid")
            .setLabel("User Mention or ID")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 123456789012345678")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_duration")
            .setLabel("Duration (30d, 7d, 1h, lifetime)")
            .setStyle(TextInputStyle.Short)
            .setValue("lifetime")
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "owner_btn_add_server") {
    const modal = new ModalBuilder()
      .setCustomId("owner_modal_add_server")
      .setTitle("Grant Server No-Prefix Access")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_serverid")
            .setLabel("Server ID")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 123456789012345678")
            .setValue(interaction.guildId || "")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_duration")
            .setLabel("Duration (30d, 7d, lifetime)")
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
      .setTitle("Blacklist User from Bot")
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
            .setLabel("Blacklist Reason")
            .setStyle(TextInputStyle.Short)
            .setValue("Violated terms of service.")
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // Modal Submits
  if (isModal) {
    if (customId === "owner_modal_add_user") {
      const targetArg = interaction.fields.getTextInputValue("input_userid").trim();
      const durationArg = interaction.fields.getTextInputValue("input_duration").trim();
      const userId = targetArg.replace(/[<@!>]/g, "");
      const durationMs = noprefixManager.parseDuration(durationArg) || 90 * 24 * 60 * 60 * 1000;

      noprefixManager.addNoPrefixUser(userId, durationMs, interaction.user.id);
      await interaction
        .reply({
          content: `✅ Granted No-Prefix access to <@${userId}> for **${noprefixManager.formatExpiry(Date.now() + durationMs)}**.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    if (customId === "owner_modal_add_server") {
      const serverId = interaction.fields.getTextInputValue("input_serverid").trim();
      const durationArg = interaction.fields.getTextInputValue("input_duration").trim();
      const durationMs = noprefixManager.parseDuration(durationArg) || 90 * 24 * 60 * 60 * 1000;

      noprefixManager.addNoPrefixServer(serverId, durationMs, interaction.user.id);
      await interaction
        .reply({
          content: `✅ Granted No-Prefix access to Server \`${serverId}\` for **${noprefixManager.formatExpiry(Date.now() + durationMs)}**.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    if (customId === "owner_modal_blacklist") {
      const targetId = interaction.fields.getTextInputValue("input_targetid").trim();
      const reason = interaction.fields.getTextInputValue("input_reason").trim();

      noprefixManager.addBlacklistUser(targetId, reason, interaction.user.id);
      await interaction
        .reply({
          content: `🚫 Blacklisted User \`${targetId}\` from using Astrix. Reason: *${reason}*`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }
  }

  const updatedMain = buildOwnerContainer(client);
  await interaction
    .update({
      components: [updatedMain],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch(() => null);
  return true;
}

module.exports = {
  buildOwnerContainer,
  buildDurationSelectionContainer,
  handleOwnerInteraction,
};
