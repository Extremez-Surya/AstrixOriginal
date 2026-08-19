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
} = require("discord.js");
const antiraidManager = require("../antiraidManager");
const EMOJIS = require("../emojis");

function buildAntiraidContainer(config) {
  const container = new ContainerBuilder();

  // Minimal Header
  const headerText = `### ${EMOJIS.rshield || "🛡️"} **Astrix Anti-Raid System**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Small)
      .setDivider(true)
  );

  // Minimal Status & Module Summary
  const masterStatus = config.enabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const raidStateStatus = config.raidState ? "🚨 **`RAID MODE ACTIVE`**" : "🟢 `NORMAL`";
  const logChan = config.logChannel ? `<#${config.logChannel}>` : "`None`";

  const isMod = (modObj) => (config.enabled && modObj?.enabled ? "🟢" : "🔴");

  const massjoinStatus = isMod(config.massjoin);
  const namefilterStatus = isMod(config.namefilter);
  const avatarStatus = isMod(config.avatar);
  const newaccStatus = isMod(config.newaccounts);
  const lockStatus = config.enabled && config.massjoin?.lockChannels ? "🟢" : "🔴";

  const bodyText =
    `> - **Master System:** ${masterStatus} • **Raid Mode:** ${raidStateStatus}\n` +
    `> - **Log Channel:** ${logChan} • **Whitelist:** \`${config.whitelist.length}\` user(s)\n\n` +
    `**Active Security Modules:**\n` +
    `> ${massjoinStatus} **Mass Join:** \`${config.massjoin.threshold}/10s\` (\`${config.massjoin.action.toUpperCase()}\`) | Auto-Lock: ${lockStatus}\n` +
    `> ${namefilterStatus} **Name Filter:** (\`${(config.namefilter?.action || "ban").toUpperCase()}\`) | ${avatarStatus} **Avatar:** (\`${config.avatar.action.toUpperCase()}\`)\n` +
    `> ${newaccStatus} **New Account:** \`${config.newaccounts.threshold}d\` (\`${config.newaccounts.action.toUpperCase()}\`)\n` +
    `> 📊 **Intercepted Stats:** \`${config.stats?.blockedCount || 0}\` raiders blocked`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

  container.addSeparatorComponents(
    new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Small)
      .setDivider(true)
  );

  // Creative Dropdown Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("antiraid_select_menu")
    .setPlaceholder("⚙️ Select an anti-raid module or feature...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(config.enabled ? "Disable Master System" : "Enable Master System")
        .setValue("antiraid_opt_toggle")
        .setDescription(config.enabled ? "Turn off anti-raid system" : "Turn on master anti-raid system")
        .setEmoji(config.enabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel(config.raidState ? "Deactivate Raid Mode" : "Activate Emergency Raid Mode")
        .setValue("antiraid_opt_raidmode")
        .setDescription(config.raidState ? "Return server to normal join limits" : "Instantly lock down and ban all incoming raiders")
        .setEmoji(config.raidState ? "🟢" : "🚨"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Mass Join Protection")
        .setValue("antiraid_opt_massjoin")
        .setDescription(`Mass Join Defense (Currently: ${config.enabled && config.massjoin.enabled ? "ON" : "OFF"})`)
        .setEmoji("⚡"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Name & Regex Filter")
        .setValue("antiraid_opt_namefilter")
        .setDescription(`Raid bot username regex filter (Currently: ${config.enabled && config.namefilter?.enabled ? "ON" : "OFF"})`)
        .setEmoji("📛"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Default Avatar Filter")
        .setValue("antiraid_opt_avatar")
        .setDescription(`No-avatar bot filter (Currently: ${config.enabled && config.avatar.enabled ? "ON" : "OFF"})`)
        .setEmoji("🖼️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("New Account Age Gate")
        .setValue("antiraid_opt_newaccounts")
        .setDescription(`Young account filter (Currently: ${config.enabled && config.newaccounts.enabled ? "ON" : "OFF"})`)
        .setEmoji("👶"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Auto-Channel Lockdown")
        .setValue("antiraid_opt_lockdown")
        .setDescription(`Channel lockdown on raid trigger (Currently: ${config.enabled && config.massjoin.lockChannels ? "ON" : "OFF"})`)
        .setEmoji("🔒"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View Whitelist Directory")
        .setValue("antiraid_opt_whitelist")
        .setDescription("View whitelisted users immune to join filters")
        .setEmoji("📋")
    );

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  // Minimal Buttons
  const toggleBtn = new ButtonBuilder()
    .setCustomId("antiraid_toggle")
    .setLabel(config.enabled ? "Disable" : "Enable")
    .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const raidmodeBtn = new ButtonBuilder()
    .setCustomId("antiraid_raidmode_toggle")
    .setLabel(config.raidState ? "Normal Mode" : "Raid Lockdown")
    .setStyle(config.raidState ? ButtonStyle.Success : ButtonStyle.Danger);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("antiraid_refresh")
    .setLabel("Refresh")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(toggleBtn, raidmodeBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  const footerText = `-# ASTRIXCODE™ Security • Sub-0.1s Anti-Raid Engine`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

  return container;
}

async function handleAntiRaidInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();

  if (!isBtn && !isMenu) return false;

  const customId = interaction.customId;
  if (
    !customId.startsWith("antiraid_") &&
    !customId.startsWith("raidwipe_")
  ) {
    return false;
  }

  if (!interaction.guild) return false;

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** permissions to interact with Anti-Raid controls.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guildId = interaction.guild.id;

  // Handle StringSelectMenu Interactions
  if (isMenu && customId === "antiraid_select_menu") {
    const selected = interaction.values[0];

    if (selected === "antiraid_opt_toggle") {
      antiraidManager.toggleMaster(guildId);
    } else if (selected === "antiraid_opt_raidmode") {
      const cfg = antiraidManager.getGuildAntiraid(guildId);
      cfg.raidState = !cfg.raidState;
      if (cfg.raidState) antiraidManager.incrementStats(guildId, "raidsDetected");
      antiraidManager.setGuildAntiraid(guildId, cfg);
    } else if (selected === "antiraid_opt_massjoin") {
      antiraidManager.toggleSubmodule(guildId, "massjoin");
    } else if (selected === "antiraid_opt_namefilter") {
      antiraidManager.toggleSubmodule(guildId, "namefilter");
    } else if (selected === "antiraid_opt_avatar") {
      antiraidManager.toggleSubmodule(guildId, "avatar");
    } else if (selected === "antiraid_opt_newaccounts") {
      antiraidManager.toggleSubmodule(guildId, "newaccounts");
    } else if (selected === "antiraid_opt_lockdown") {
      const cfg = antiraidManager.getGuildAntiraid(guildId);
      cfg.massjoin.lockChannels = !cfg.massjoin.lockChannels;
      antiraidManager.setGuildAntiraid(guildId, cfg);
    } else if (selected === "antiraid_opt_whitelist") {
      const cfg = antiraidManager.getGuildAntiraid(guildId);
      const whitelist = cfg.whitelist || [];
      const listText =
        whitelist.length > 0
          ? whitelist.map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n")
          : "*No users currently whitelisted.*";

      const wlContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📋 ANTI-RAID WHITELIST DIRECTORY\n` +
              `-# Whitelisted users bypass default avatar and new account filters.\n\n` +
              listText
          )
        );

      await interaction
        .reply({
          components: [wlContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    const updated = buildAntiraidContainer(antiraidManager.getGuildAntiraid(guildId));
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  // Handle Button Interactions
  if (customId === "antiraid_toggle") {
    antiraidManager.toggleMaster(guildId);
    const updated = buildAntiraidContainer(antiraidManager.getGuildAntiraid(guildId));
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  if (customId === "antiraid_raidmode_toggle") {
    config.raidState = !config.raidState;
    if (config.raidState) {
      antiraidManager.incrementStats(guildId, "raidsDetected");
    }
    antiraidManager.setGuildAntiraid(guildId, config);
    const updated = buildAntiraidContainer(config);
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  if (customId === "antiraid_refresh") {
    const updated = buildAntiraidContainer(config);
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  // Handle raidwipe confirmation buttons
  if (customId.startsWith("raidwipe_confirm_")) {
    if (!client.raidwipeConfirmations || !client.raidwipeConfirmations.has(customId)) {
      await interaction
        .reply({
          content: "❌ Confirmation session expired or invalid.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    const session = client.raidwipeConfirmations.get(customId);
    if (interaction.user.id !== session.authorId) {
      await interaction
        .reply({
          content: "❌ Only the command invoker can confirm this action.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    client.raidwipeConfirmations.delete(customId);
    await interaction.deferUpdate().catch(() => null);

    const guild = interaction.guild;
    const { action, reason, toProcessIds } = session;
    let successful = 0;
    let failed = 0;

    for (const memberId of toProcessIds) {
      try {
        const member = await guild.members.fetch(memberId).catch(() => null);
        if (!member) continue;

        if (action === "ban" && member.bannable) {
          await member.ban({ reason: `[RAIDWIPE HARDENED] ${reason}`, deleteMessageSeconds: 86400 });
          successful++;
        } else if (action === "kick" && member.kickable) {
          await member.kick(`[RAIDWIPE HARDENED] ${reason}`);
          successful++;
        } else {
          failed++;
        }
      } catch (_) {
        failed++;
      }
    }

    antiraidManager.incrementStats(guild.id, "blockedCount", successful);

    const summary = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.ticky_red || "✅"} Raidwipe Mass Purge Complete\n` +
            `> - **Action Executed:** \`${action.toUpperCase()}\` (Messages Cleared)\n` +
            `> - **Reason:** \`${reason}\` \n` +
            `> - **Members Intercepted:** \`${successful}\` member(s)\n` +
            `> - **Failed Removals:** \`${failed}\` member(s)`
        )
      );

    await interaction
      .editReply({
        components: [summary],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  if (customId.startsWith("raidwipe_cancel_")) {
    const cancelContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} Raidwipe Aborted\n` +
          `-# Mass member purge action was cancelled by the administrator.`
      )
    );
    await interaction
      .update({
        components: [cancelContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildAntiraidContainer,
  handleAntiRaidInteraction,
};
