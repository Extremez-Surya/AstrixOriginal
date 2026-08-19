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
const birthdayManager = require("../birthdayManager");
const EMOJIS = require("../emojis");

function buildBirthdayWishCard(config, userTag = "User", avatarUrl = null) {
  const msg = config.wishMessage || birthdayManager.DEFAULT_WISH;
  const container = new ContainerBuilder();

  if (msg.accentColor && msg.accentColor !== "none") {
    const colorInt = parseInt(msg.accentColor.replace("#", ""), 16);
    if (!isNaN(colorInt)) {
      container.setAccentColor(colorInt);
    }
  }

  const titleText = (msg.title || "🎂 Happy Birthday!").replace(/{user}/g, userTag);
  const descText = (msg.description || "Wishing you a fabulous day!").replace(/{user}/g, userTag);

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${titleText}`));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(descText));

  if (msg.footer) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${msg.footer.replace(/{user}/g, userTag)}`)
    );
  }

  return container;
}

function buildBirthdayContainer(config) {
  const container = new ContainerBuilder();

  // Minimal Header
  const headerText = `### ${EMOJIS.tada || "🎂"} **Astrix Birthday System**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Status Summary
  const masterStatus = config.enabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`";
  const wishChan = config.wishChannel ? `<#${config.wishChannel}>` : "`Not Set`";
  const cmdChan = config.commandChannel ? `<#${config.commandChannel}>` : "`Not Set`";
  const bdayRole = config.birthdayRole ? `<@&${config.birthdayRole}>` : "`Not Set`";
  const tz = config.timezone || "Asia/Kolkata";
  const totalRegistered = Object.keys(config.birthdays || {}).length;

  const bodyText =
    `> - **Master System:** ${masterStatus} • **Timezone:** \`${tz}\`\n` +
    `> - **Wish Channel:** ${wishChan} • **Command Channel:** ${cmdChan}\n` +
    `> - **Birthday Role:** ${bdayRole} *(Assigned for 24h)*\n` +
    `> - **Registered Birthdays:** \`${totalRegistered}\` member(s) • **Wishes Sent:** \`⚡ ${config.stats?.totalWishesSent || 0}\``;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Creative Dropdown Select Menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("birthday_select_menu")
    .setPlaceholder("⚙️ Select a birthday option to configure...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(config.enabled ? "Disable Master System" : "Enable Master System")
        .setValue("birthday_opt_toggle")
        .setDescription(config.enabled ? "Turn off birthday system" : "Turn on birthday automation")
        .setEmoji(config.enabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Wish Channel")
        .setValue("birthday_opt_wishchannel")
        .setDescription("Channel where birthday announcements are posted")
        .setEmoji("📣"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Command Channel")
        .setValue("birthday_opt_cmdchannel")
        .setDescription("Restrict birthday commands to a specific channel")
        .setEmoji("💬"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Birthday Role")
        .setValue("birthday_opt_role")
        .setDescription("Temporary 24-hour role given to birthday celebrants")
        .setEmoji("👑"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Change Server Timezone")
        .setValue("birthday_opt_timezone")
        .setDescription(`Current Timezone: ${tz}`)
        .setEmoji("🌐"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Preview Wish Card")
        .setValue("birthday_opt_preview")
        .setDescription("Preview the custom birthday wish card")
        .setEmoji("🎁"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View Upcoming Birthdays")
        .setValue("birthday_opt_upcoming")
        .setDescription("View upcoming member birthdays in next 30 days")
        .setEmoji("📋")
    );

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  // Minimal Buttons
  const toggleBtn = new ButtonBuilder()
    .setCustomId("birthday_toggle")
    .setLabel(config.enabled ? "Disable" : "Enable")
    .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const previewBtn = new ButtonBuilder()
    .setCustomId("birthday_preview")
    .setLabel("Preview Card")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("birthday_refresh")
    .setLabel("Refresh")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(toggleBtn, previewBtn, refreshBtn);

  container.addActionRowComponents(menuRow);
  container.addActionRowComponents(buttonRow);

  const footerText = `-# ASTRIXCODE™ Security • Sub-0.1s Birthday Automation Engine`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

  return container;
}

async function handleBirthdayInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();

  if (!isBtn && !isMenu) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("birthday_")) return false;

  if (!interaction.guild) return false;

  // Permissions Check: Manage Server required
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction
      .reply({
        content: "❌ You need **Manage Server** permission to configure Birthday settings.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const guildId = interaction.guild.id;
  const config = birthdayManager.getGuildBirthday(guildId);

  // Handle StringSelectMenu Interactions
  if (isMenu && customId === "birthday_select_menu") {
    const selected = interaction.values[0];

    if (selected === "birthday_opt_toggle") {
      birthdayManager.toggleMaster(guildId);
    } else if (selected === "birthday_opt_preview") {
      const { AttachmentBuilder } = require("discord.js");
      const { generateBirthdayCanvas } = require("../birthdayCanvas");
      const buffer = await generateBirthdayCanvas(interaction.user, interaction.guild, {
        customWish: config.wishMessage?.description,
      });
      const attachment = new AttachmentBuilder(buffer, { name: "birthday-preview.png" });

      await interaction
        .reply({
          content: `🎉 Preview Birthday Wish for <@${interaction.user.id}>! 🎂❤️`,
          files: [attachment],
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    } else if (selected === "birthday_opt_upcoming") {
      const upcoming = birthdayManager.getUpcomingBirthdays(guildId, 10);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const listText =
        upcoming.length > 0
          ? upcoming
              .map((item, i) => {
                const daysText = item.daysUntil === 0 ? "**Today!**" : item.daysUntil === 1 ? "Tomorrow" : `in ${item.daysUntil} days`;
                return `\`${i + 1}.\` <@${item.userId}> - ${item.day} ${monthNames[item.month - 1]} (${daysText})`;
              })
              .join("\n")
          : "*No birthdays in the next 30 days.*";

      const upcomingContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🎂 **UPCOMING BIRTHDAYS**\n\n${listText}`)
      );

      await interaction
        .reply({
          components: [upcomingContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    } else if (selected === "birthday_opt_timezone") {
      const tzOptions = birthdayManager.TIMEZONES.map((tz) =>
        new StringSelectMenuOptionBuilder().setLabel(tz.label).setValue(`birthday_tz_${tz.value}`).setEmoji("🌐")
      );

      const tzMenu = new StringSelectMenuBuilder()
        .setCustomId("birthday_timezone_select")
        .setPlaceholder("Select server timezone...")
        .addOptions(tzOptions);

      const tzContainer = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🌐 **SELECT TIMEZONE**\nCurrent: \`${config.timezone}\``))
        .addActionRowComponents(new ActionRowBuilder().addComponents(tzMenu));

      await interaction
        .reply({
          components: [tzContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => null);
      return true;
    }

    const updated = buildBirthdayContainer(birthdayManager.getGuildBirthday(guildId));
    await interaction
      .update({
        components: [updated],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
    return true;
  }

  // Handle Timezone Select
  if (isMenu && customId === "birthday_timezone_select") {
    const selectedVal = interaction.values[0];
    const newTz = selectedVal.replace("birthday_tz_", "");
    config.timezone = newTz;
    birthdayManager.setGuildBirthday(guildId, config);

    await interaction
      .reply({
        content: `✅ Server birthday timezone updated to **${newTz}**.`,
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  // Handle Buttons
  if (customId === "birthday_toggle") {
    birthdayManager.toggleMaster(guildId);
  } else if (customId === "birthday_preview") {
    const { AttachmentBuilder } = require("discord.js");
    const { generateBirthdayCanvas } = require("../birthdayCanvas");
    const buffer = await generateBirthdayCanvas(interaction.user, interaction.guild, {
      customWish: config.wishMessage?.description,
    });
    const attachment = new AttachmentBuilder(buffer, { name: "birthday-preview.png" });

    await interaction
      .reply({
        content: `🎉 Preview Birthday Wish for <@${interaction.user.id}>! 🎂❤️`,
        files: [attachment],
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const updatedMain = buildBirthdayContainer(birthdayManager.getGuildBirthday(guildId));
  await interaction
    .update({
      components: [updatedMain],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch(() => null);
  return true;
}

module.exports = {
  buildBirthdayContainer,
  buildBirthdayWishCard,
  handleBirthdayInteraction,
};
