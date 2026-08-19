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
  PermissionFlagsBits,
} = require("discord.js");
const bumpReminderManager = require("../bumpReminderManager");
const noprefixManager = require("../noprefixManager");
const EMOJIS = require("../emojis");

function buildBumpReminderContainer(guild, authorUser) {
  const container = new ContainerBuilder();
  const config = bumpReminderManager.getGuildBumpConfig(guild.id);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ${EMOJIS.reminder || "📣"} **ASTRIX BUMP REMINDER CONTROL CENTER**`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const statusText =
    `> - **System Status:** \`${config.enabled ? "Enabled ✅" : "Disabled ❌"}\` • **Bump Channel:** ${config.channel ? `<#${config.channel}>` : "`Not Set`"}\n` +
    `> - **Auto-Lock Channel:** \`${config.autoLock ? "Enabled 🔒" : "Disabled 🔓"}\` • **Auto-Clean:** \`${config.autoClean ? "Enabled 🧹" : "Disabled ❌"}\`\n` +
    `> - **Total Server Bumps:** \`${config.totalBumps || 0}\` 🚀 • **Last Bumper:** ${config.lastBumpUser ? `<@${config.lastBumpUser}>` : "`None`"}\n` +
    `> - **Next Bump Countdown:** ${config.nextBump ? `<t:${Math.floor(config.nextBump / 1000)}:R>` : "`Ready Now! ⏰`"}`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Creative Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("br_select_menu")
    .setPlaceholder("📣 Select a Bump Reminder option directory...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`Toggle Master (${config.enabled ? "Disable" : "Enable"})`)
        .setValue("br_opt_toggle")
        .setDescription("Enable or disable the Disboard bump reminder engine")
        .setEmoji(config.enabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Bump Channel")
        .setValue("br_opt_channel")
        .setDescription("Set the target channel for /bump detection and reminders")
        .setEmoji("📺"),
      new StringSelectMenuOptionBuilder()
        .setLabel(`Toggle Auto-Lock (${config.autoLock ? "Disable" : "Enable"})`)
        .setValue("br_opt_autolock")
        .setDescription("Automatically lock channel after bump until cooldown expires")
        .setEmoji("🔒"),
      new StringSelectMenuOptionBuilder()
        .setLabel(`Toggle Auto-Clean (${config.autoClean ? "Disable" : "Enable"})`)
        .setValue("br_opt_autoclean")
        .setDescription("Automatically delete non-bump messages sent in bump channel")
        .setEmoji("🧹"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Edit Thank You Message")
        .setValue("br_opt_thankyou")
        .setDescription("Customize the message sent when someone bumps the server")
        .setEmoji("💬"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Edit Reminder Message")
        .setValue("br_opt_reminder")
        .setDescription("Customize the 2-hour bump reminder notification card")
        .setEmoji("⏰"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View Bump Leaderboard & Stats")
        .setValue("br_opt_stats")
        .setDescription("Top bumpers ranking and server bump metrics")
        .setEmoji("📊"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Test Bump Trigger")
        .setValue("br_opt_test")
        .setDescription("Simulate a successful bump trigger to test messages & lock")
        .setEmoji("🚀")
    );

  const dropdownRow = new ActionRowBuilder().addComponents(selectMenu);

  // Direct Buttons
  const toggleBtn = new ButtonBuilder()
    .setCustomId("br_btn_toggle")
    .setLabel(config.enabled ? "Disable System" : "Enable System")
    .setEmoji(config.enabled ? "🛑" : "⚡")
    .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const statsBtn = new ButtonBuilder()
    .setCustomId("br_btn_stats")
    .setLabel("Leaderboard")
    .setEmoji("📊")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(toggleBtn, statsBtn);

  container.addActionRowComponents(dropdownRow, buttonRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Automated Bump Reminder Engine`)
  );

  return container;
}

async function handleBumpReminderInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isModal = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isModal) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("br_")) return false;

  // Permissions Check: Manage Channels or Bot Owner
  const isMemberPermitted = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
  const isBotOwner = noprefixManager.isOwner(interaction.user.id, client);

  if (!isMemberPermitted && !isBotOwner) {
    await interaction
      .reply({
        content: "❌ Access Denied: Manage Channels permission required.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const config = bumpReminderManager.getGuildBumpConfig(interaction.guild.id);

  // Buttons
  if (isBtn) {
    if (customId === "br_btn_toggle") {
      if (!config.channel && !config.enabled) {
        await interaction.reply({ content: "❌ Please set a bump channel first before enabling.", flags: MessageFlags.Ephemeral }).catch(() => null);
        return true;
      }
      config.enabled = !config.enabled;
      bumpReminderManager.setGuildBumpConfig(interaction.guild.id, config);

      const updated = buildBumpReminderContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (customId === "br_btn_stats") {
      return renderLeaderboard(interaction, config);
    }
  }

  // Select Menu
  if (isMenu && customId === "br_select_menu") {
    const selectedVal = interaction.values[0];

    if (selectedVal === "br_opt_toggle") {
      if (!config.channel && !config.enabled) {
        await interaction.reply({ content: "❌ Please set a bump channel first before enabling.", flags: MessageFlags.Ephemeral }).catch(() => null);
        return true;
      }
      config.enabled = !config.enabled;
      bumpReminderManager.setGuildBumpConfig(interaction.guild.id, config);

      const updated = buildBumpReminderContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (selectedVal === "br_opt_channel") {
      config.channel = interaction.channel.id;
      config.enabled = true;
      bumpReminderManager.setGuildBumpConfig(interaction.guild.id, config);

      const updated = buildBumpReminderContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (selectedVal === "br_opt_autolock") {
      config.autoLock = !config.autoLock;
      bumpReminderManager.setGuildBumpConfig(interaction.guild.id, config);

      const updated = buildBumpReminderContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (selectedVal === "br_opt_autoclean") {
      config.autoClean = !config.autoClean;
      bumpReminderManager.setGuildBumpConfig(interaction.guild.id, config);

      const updated = buildBumpReminderContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (selectedVal === "br_opt_thankyou") {
      const modal = new ModalBuilder()
        .setCustomId("br_modal_thankyou")
        .setTitle("💬 Edit Thank You Message")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_thankyou")
              .setLabel("Message (placeholders: {user}, {server})")
              .setStyle(TextInputStyle.Paragraph)
              .setValue(config.thankyouMessage || "Thanks {user} for bumping {server}! I'll remind you in 2 hours. 💚")
              .setRequired(true)
          )
        );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selectedVal === "br_opt_reminder") {
      const modal = new ModalBuilder()
        .setCustomId("br_modal_reminder")
        .setTitle("⏰ Edit Reminder Message")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_reminder")
              .setLabel("Message (placeholders: {user}, {server})")
              .setStyle(TextInputStyle.Paragraph)
              .setValue(config.reminderMessage || "It's time to /bump the server! {user} Use `/bump` now! ⏰")
              .setRequired(true)
          )
        );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selectedVal === "br_opt_stats") {
      return renderLeaderboard(interaction, config);
    }

    if (selectedVal === "br_opt_test") {
      await interaction.deferUpdate().catch(() => null);
      await bumpReminderManager.handleSuccessfulBump(client, interaction.guild, interaction.user.id);
      return true;
    }
  }

  // Modals
  if (isModal) {
    if (customId === "br_modal_thankyou") {
      const text = interaction.fields.getTextInputValue("input_thankyou").trim();
      config.thankyouMessage = text;
      bumpReminderManager.setGuildBumpConfig(interaction.guild.id, config);

      const updated = buildBumpReminderContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (customId === "br_modal_reminder") {
      const text = interaction.fields.getTextInputValue("input_reminder").trim();
      config.reminderMessage = text;
      bumpReminderManager.setGuildBumpConfig(interaction.guild.id, config);

      const updated = buildBumpReminderContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  return false;
}

async function renderLeaderboard(interaction, config) {
  const sorted = Object.entries(config.userStats || {}).sort((a, b) => b[1] - a[1]);

  let leaderStr = "";
  if (sorted.length === 0) {
    leaderStr = "*No server bumps logged yet.*";
  } else {
    sorted.slice(0, 10).forEach(([uid, count], idx) => {
      const badge = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "👤";
      leaderStr += `${badge} **#${idx + 1}** <@${uid}> — \`${count}\` bumps\n`;
    });
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 📊 **SERVER BUMP LEADERBOARD**`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(leaderStr))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Automated Bump Reminder Engine`));

  await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => null);
  return true;
}

module.exports = {
  buildBumpReminderContainer,
  handleBumpReminderInteraction,
};
