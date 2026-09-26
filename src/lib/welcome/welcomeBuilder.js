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
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const path = require("path");
const welcomeManager = require("../welcomeManager");
const welcomeCanvas = require("../welcomeCanvas");

// Helper to format short badges
function badge(text, active) {
  return `\`${text}\` ${active ? "🟢" : "🔴"}`;
}

/**
 * 1. MAIN WELCOME HUB (Clean Small V2 Container with Professional Dropdown)
 */
function buildWelcomeHubPayload(guild, member, notice = null) {
  const config = welcomeManager.getGuildWelcome(guild.id);
  const channelMention = config.channelId ? `<#${config.channelId}>` : "`None`";
  const typeLabel =
    config.welcomeType === "custom_embed"
      ? "Custom Embed"
      : config.welcomeType === "custom_container"
        ? "Custom Container"
        : "Astrix Premade";

  let header =
    `### <:astrix:1539875362945900574> Welcome Management Hub\n` +
    `-# Status: ${badge(config.enabled ? "Active" : "Disabled", config.enabled)} • Channel: ${channelMention} • Mode: \`${typeLabel}\``;

  if (notice) {
    header = `> **${notice}**\n\n` + header;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("wlcm_hub_dropdown")
    .setPlaceholder("⚙️ Choose action or configuration...")
    .addOptions(
      {
        label: "Astrix Premade Welcome",
        value: "wlcm_act_premade",
        description: "Signature canvas card greeting & studio themes",
        emoji: "🎨",
      },
      {
        label: "Custom Channel Welcome",
        value: "wlcm_act_custom",
        description: "Build your own Embed or Container greeting",
        emoji: "🛠️",
      },
      {
        label: "Join DM Greetings Setup",
        value: "wlcm_act_joindm",
        description: "Configure direct message greetings for new joins",
        emoji: "✉️",
      },
      {
        label: `Set Channel (${config.channelId ? `#${guild.channels.cache.get(config.channelId)?.name || "set"}` : "None"})`,
        value: "wlcm_act_channel",
        description: "Pick destination text channel for greetings",
        emoji: "📢",
      },
      {
        label: config.enabled ? "Disable Welcome Module" : "Enable Welcome Module",
        value: "wlcm_act_toggle",
        description: config.enabled ? "Turn off all channel welcome greetings" : "Activate channel welcome greetings",
        emoji: config.enabled ? "🔴" : "🟢",
      },
      {
        label: "Send Live Preview Test",
        value: "wlcm_act_test",
        description: "Dispatch test greeting to this channel",
        emoji: "🧪",
      }
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents(row);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 2. CUSTOM FORMAT CHOICE (Embed vs Container)
 */
function buildFormatChoicePayload(guild, member) {
  const header =
    `### 🛠️ Select Custom Welcome Format\n` +
    `-# Choose your desired message format style for channel greetings:`;

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("wlcm_format_dropdown")
    .setPlaceholder("Select message format...")
    .addOptions(
      {
        label: "Classic Discord Embed",
        value: "fmt_embed",
        description: "Rich embed with colored border, title, fields & images",
        emoji: "📑",
      },
      {
        label: "Modern Container (Components V2)",
        value: "fmt_container",
        description: "Full-width Discord container with text & media dividers",
        emoji: "📦",
      },
      {
        label: "Back to Main Hub",
        value: "fmt_back",
        description: "Return to the welcome management hub",
        emoji: "⬅️",
      }
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents(row);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 3. CUSTOM CHANNEL WELCOME EDITOR (Live Draft Preview inside sleek Container with Dropdown)
 */
function buildCustomEditorPayload(guild, member, format, notice = null) {
  const config = welcomeManager.getGuildWelcome(guild.id);
  const custom = config.customData || {};
  const currentFormat = format || config.welcomeType || "custom_embed";
  const channelObj = config.channelId ? guild.channels.cache.get(config.channelId) : null;
  const channelName = channelObj ? channelObj.name : "None";

  let header =
    `### 🛠️ Custom Welcome Studio (${currentFormat === "custom_embed" ? "Classic Embed" : "Modern Container"})\n` +
    `-# Status: ${badge(config.enabled ? "Active" : "Disabled", config.enabled)} • Channel: ${config.channelId ? `<#${config.channelId}>` : "`None`"}`;

  if (notice) {
    header = `> **${notice}**\n\n` + header;
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // Banner image if configured
  if (custom.image && custom.image.trim()) {
    const imgUrl = welcomeManager.formatWelcomeText(custom.image, member, guild);
    if (imgUrl && imgUrl.startsWith("http")) {
      const mediaItem = new MediaGalleryItemBuilder().setURL(imgUrl);
      container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(mediaItem));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    }
  }

  // Live draft preview representation
  let previewText = "";
  if (currentFormat === "custom_embed") {
    previewText += `**📑 Embed Draft Preview:**\n`;
    if (custom.authorName) {
      previewText += `-# 👤 ${welcomeManager.formatWelcomeText(custom.authorName, member, guild)}\n`;
    }
    if (custom.title) {
      previewText += `### ${welcomeManager.formatWelcomeText(custom.title, member, guild)}\n`;
    }
    if (custom.description) {
      previewText += `${welcomeManager.formatWelcomeText(custom.description, member, guild)}\n`;
    } else {
      previewText += `-# *(Empty description — select option below to add)*\n`;
    }
    previewText += `-# Color: \`${custom.color || "#5865F2"}\``;
    if (custom.thumbnail) previewText += ` • Thumbnail: \`Set\``;
    if (custom.timestamp) previewText += ` • Timestamp: \`Active\``;
    if (custom.footerText) {
      previewText += `\n-# 📌 ${welcomeManager.formatWelcomeText(custom.footerText, member, guild)}`;
    }
  } else {
    previewText += `**📦 Container Draft Preview:**\n`;
    if (custom.title) {
      previewText += `### ${welcomeManager.formatWelcomeText(custom.title, member, guild)}\n`;
    }
    if (custom.description) {
      previewText += `${welcomeManager.formatWelcomeText(custom.description, member, guild)}\n`;
    } else {
      previewText += `-# *(Empty container body — select option below to add)*\n`;
    }
    if (custom.footerText) {
      previewText += `-# 📌 ${welcomeManager.formatWelcomeText(custom.footerText, member, guild)}`;
    }
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(previewText));
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // Professional Select Menu for all editing options
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("wlcm_custom_dropdown")
    .setPlaceholder("⚙️ Select field or action...")
    .addOptions(
      {
        label: "Edit Message Body / Description",
        value: "edit_desc",
        description: "Main text (supports {user}, {server}, {memberCount})",
        emoji: "📝",
      },
      {
        label: "Edit Title Headline",
        value: "edit_title",
        description: "Greeting title headline",
        emoji: "🏷️",
      },
      {
        label: "Edit Accent Color",
        value: "edit_color",
        description: `Current: ${custom.color || "#5865F2"} (HEX)`,
        emoji: "🎨",
      },
      {
        label: "Edit Author Info",
        value: "edit_author",
        description: "Author header text, icon URL & link",
        emoji: "👤",
      },
      {
        label: "Edit Banner Image",
        value: "edit_image",
        description: "Large banner image URL (or {guild.banner})",
        emoji: "🖼️",
      },
      {
        label: "Edit Thumbnail Image",
        value: "edit_thumb",
        description: "Small thumbnail icon URL (or {user.avatar})",
        emoji: "🔍",
      },
      {
        label: "Edit Footer Note",
        value: "edit_footer",
        description: "Footer text note & icon",
        emoji: "📌",
      },
      {
        label: `Toggle Timestamp (${custom.timestamp ? "ON" : "OFF"})`,
        value: "toggle_time",
        description: "Display current timestamp in footer",
        emoji: "⏱️",
      },
      {
        label: `Set Welcome Channel (#${channelName})`,
        value: "set_channel",
        description: "Choose destination text channel",
        emoji: "📢",
      },
      {
        label: `Switch to ${currentFormat === "custom_embed" ? "Modern Container" : "Classic Embed"}`,
        value: "switch_fmt",
        description: "Change message format style",
        emoji: "🔄",
      },
      {
        label: "Save & Enable Greeting",
        value: "save_enable",
        description: "Save custom draft and activate greetings",
        emoji: "💾",
      },
      {
        label: "Send Live Preview Test",
        value: "send_test",
        description: "Dispatch test greeting to channel",
        emoji: "🧪",
      },
      {
        label: "Reset to Empty Draft",
        value: "reset_draft",
        description: "Clear all draft fields back to blank",
        emoji: "🗑️",
      },
      {
        label: "Back to Main Hub",
        value: "back_hub",
        description: "Return to welcome management hub",
        emoji: "⬅️",
      }
    );

  const rowDropdown = new ActionRowBuilder().addComponents(selectMenu);
  container.addActionRowComponents(rowDropdown);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 4. PREMADE CANVAS DASHBOARD
 * NOTE: If disabled or not setup, preview canvas card is NOT rendered as requested!
 */
async function buildPremadeDashboardPayload(guild, member, notice = null) {
  const config = welcomeManager.getGuildWelcome(guild.id);
  const channelMention = config.channelId ? `<#${config.channelId}>` : "`None`";
  const roleMention = config.autoRoleId ? `<@&${config.autoRoleId}>` : "`None`";
  const isReady = config.enabled && config.channelId;

  let header =
    `### 🎨 Astrix Premade Welcome\n` +
    `-# Status: ${badge(config.enabled ? "Active" : "Disabled", config.enabled)} • Channel: ${channelMention} • Role: ${roleMention}`;

  if (notice) {
    header = `> **${notice}**\n\n` + header;
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  const sendFiles = [];

  // ONLY render preview image if module is enabled and channel is set!
  if (isReady && config.canvasEnabled) {
    try {
      const cardBuffer = await welcomeCanvas.generateWelcomeCard(member, config);
      const canvasAttachment = new AttachmentBuilder(cardBuffer, { name: "welcome-preview.png" });
      sendFiles.push(canvasAttachment);
      const mediaItem = new MediaGalleryItemBuilder().setURL("attachment://welcome-preview.png");
      container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(mediaItem));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    } catch (_) {}
  } else {
    // Clean compact notice when disabled or not setup
    const disabledNote =
      `> ℹ️ **Module is currently DISABLED / Not Configured.**\n` +
      `> *Select an action below to set a channel, customize canvas themes, or enable greetings.*`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(disabledNote));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("wlcm_premade_dropdown")
    .setPlaceholder("⚙️ Manage Premade Welcome...")
    .addOptions(
      {
        label: `Set Welcome Channel (${config.channelId ? "Configured" : "None"})`,
        value: "premade_channel",
        description: "Choose where welcome greetings will be sent",
        emoji: "📢",
      },
      {
        label: "Open Canvas Studio (Card Customizer)",
        value: "premade_studio",
        description: "Customize templates, shapes, colors & background",
        emoji: "🎨",
      },
      {
        label: config.enabled ? "Disable Welcome Module" : "Enable Welcome Module",
        value: "premade_toggle",
        description: config.enabled ? "Turn off welcome module" : "Activate welcome module",
        emoji: config.enabled ? "🔴" : "🟢",
      },
      {
        label: "Send Live Preview Test",
        value: "premade_test",
        description: "Send live welcome card in current channel",
        emoji: "🧪",
      },
      {
        label: "Back to Main Hub",
        value: "premade_back",
        description: "Return to the main setup hub",
        emoji: "⬅️",
      }
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);
  container.addActionRowComponents(row);

  return {
    components: [container],
    files: sendFiles,
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 5. CHANNEL SELECTOR SCREEN
 */
function buildChannelSelectPayload(guild, origin = "custom") {
  const header =
    `### 📢 Select Welcome Channel\n` +
    `-# Pick the text channel where member greetings will be dispatched:`;

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId(`wlcm_channel_picked_${origin}`)
    .setPlaceholder("📍 Select text channel...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const rowSelect = new ActionRowBuilder().addComponents(channelSelect);

  const btnBack = new ButtonBuilder()
    .setCustomId(origin === "premade" ? "wlcm_hub_premade" : "wlcm_return_editor")
    .setEmoji("⬅️")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const rowButtons = new ActionRowBuilder().addComponents(btnBack);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents(rowSelect)
    .addActionRowComponents(rowButtons);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 6. JOIN DM HUB (Clean Small V2 Container with Professional Dropdown)
 */
function buildJoinDmHubPayload(guild, member, notice = null) {
  const config = welcomeManager.getGuildWelcome(guild.id);
  const dmTypeLabel =
    config.joinDmType === "custom_embed"
      ? "Custom Embed"
      : config.joinDmType === "custom_container"
        ? "Custom Container"
        : "Astrix Premade";

  let header =
    `### ✉️ Join DM Management Hub\n` +
    `-# Status: ${badge(config.joinDmEnabled ? "Active" : "Disabled", config.joinDmEnabled)} • Format: \`${dmTypeLabel}\``;

  if (notice) {
    header = `> **${notice}**\n\n` + header;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("jdm_hub_dropdown")
    .setPlaceholder("⚙️ Choose action or configuration...")
    .addOptions(
      {
        label: "Astrix Premade DM Card",
        value: "jdm_act_premade",
        description: "Send signature canvas card in new member's DM",
        emoji: "🎨",
      },
      {
        label: "Custom Join DM (Embed / Container)",
        value: "jdm_act_custom",
        description: "Build your own custom direct message greeting",
        emoji: "🛠️",
      },
      {
        label: config.joinDmEnabled ? "Disable Join DM" : "Enable Join DM",
        value: "jdm_act_toggle",
        description: config.joinDmEnabled ? "Turn off direct message greetings" : "Activate direct message greetings",
        emoji: config.joinDmEnabled ? "🔴" : "🟢",
      },
      {
        label: "Test My Direct Messages",
        value: "jdm_act_test",
        description: "Send a live preview greeting directly to your DMs",
        emoji: "🧪",
      },
      {
        label: "Back to Main Hub",
        value: "jdm_act_back",
        description: "Return to the main welcome hub",
        emoji: "⬅️",
      }
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  if (!config.joinDmEnabled) {
    const disabledNote =
      `> ℹ️ **Join DM is currently DISABLED.**\n` +
      `> *Preview and greetings are inactive until enabled below.*`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(disabledNote));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
  }

  container.addActionRowComponents(row);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 7. JOIN DM FORMAT CHOICE
 */
function buildJoinDmFormatChoicePayload(guild, member) {
  const header =
    `### 🛠️ Select Custom Join DM Format\n` +
    `-# Choose your desired style for private direct message greetings:`;

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("jdm_format_dropdown")
    .setPlaceholder("Select DM format style...")
    .addOptions(
      {
        label: "Classic Discord Embed",
        value: "jdm_fmt_embed",
        description: "Rich embed greeting sent to member's DM",
        emoji: "📑",
      },
      {
        label: "Modern Container (Components V2)",
        value: "jdm_fmt_container",
        description: "Components V2 container greeting in DM",
        emoji: "📦",
      },
      {
        label: "Back to Join DM Hub",
        value: "jdm_fmt_back",
        description: "Return to the Join DM hub",
        emoji: "⬅️",
      }
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents(row);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 8. JOIN DM STUDIO EDITOR (Small Clean V2 Container with Dropdown)
 */
function buildJoinDmEditorPayload(guild, member, format, notice = null) {
  const config = welcomeManager.getGuildWelcome(guild.id);
  const custom = config.joinDmCustomData || {};
  const currentFormat = format || config.joinDmType || "custom_embed";

  let header =
    `### ✉️ Join DM Studio (${currentFormat === "custom_embed" ? "Classic Embed" : "Modern Container"})\n` +
    `-# Status: ${badge(config.joinDmEnabled ? "Active" : "Disabled", config.joinDmEnabled)} • Target: \`Direct Messages (DM)\``;

  if (notice) {
    header = `> **${notice}**\n\n` + header;
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // Banner image if configured
  if (custom.image && custom.image.trim()) {
    const imgUrl = welcomeManager.formatWelcomeText(custom.image, member, guild);
    if (imgUrl && imgUrl.startsWith("http")) {
      const mediaItem = new MediaGalleryItemBuilder().setURL(imgUrl);
      container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(mediaItem));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    }
  }

  // Live draft preview representation
  let previewText = "";
  if (currentFormat === "custom_embed") {
    previewText += `**📑 Join DM Embed Draft Preview:**\n`;
    if (custom.authorName) {
      previewText += `-# 👤 ${welcomeManager.formatWelcomeText(custom.authorName, member, guild)}\n`;
    }
    if (custom.title) {
      previewText += `### ${welcomeManager.formatWelcomeText(custom.title, member, guild)}\n`;
    }
    if (custom.description) {
      previewText += `${welcomeManager.formatWelcomeText(custom.description, member, guild)}\n`;
    } else {
      previewText += `-# *(Empty DM text — select option below to add)*\n`;
    }
    previewText += `-# Color: \`${custom.color || "#5865F2"}\``;
    if (custom.thumbnail) previewText += ` • Thumbnail: \`Set\``;
    if (custom.timestamp) previewText += ` • Timestamp: \`Active\``;
    if (custom.footerText) {
      previewText += `\n-# 📌 ${welcomeManager.formatWelcomeText(custom.footerText, member, guild)}`;
    }
  } else {
    previewText += `**📦 Join DM Container Draft Preview:**\n`;
    if (custom.title) {
      previewText += `### ${welcomeManager.formatWelcomeText(custom.title, member, guild)}\n`;
    }
    if (custom.description) {
      previewText += `${welcomeManager.formatWelcomeText(custom.description, member, guild)}\n`;
    } else {
      previewText += `-# *(Empty container DM text — select option below to add)*\n`;
    }
    if (custom.footerText) {
      previewText += `-# 📌 ${welcomeManager.formatWelcomeText(custom.footerText, member, guild)}`;
    }
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(previewText));
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // Professional Select Menu for all editing options
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("jdm_custom_dropdown")
    .setPlaceholder("⚙️ Select DM field or action...")
    .addOptions(
      {
        label: "Edit DM Message Body",
        value: "edit_desc",
        description: "Main text (supports {user}, {server}, {memberCount})",
        emoji: "📝",
      },
      {
        label: "Edit DM Title Headline",
        value: "edit_title",
        description: "Greeting title headline in DM",
        emoji: "🏷️",
      },
      {
        label: "Edit Accent Color",
        value: "edit_color",
        description: `Current: ${custom.color || "#5865F2"} (HEX)`,
        emoji: "🎨",
      },
      {
        label: "Edit Author Info",
        value: "edit_author",
        description: "Author header text, icon URL & link",
        emoji: "👤",
      },
      {
        label: "Edit Banner Image",
        value: "edit_image",
        description: "Large banner image URL (or {guild.banner})",
        emoji: "🖼️",
      },
      {
        label: "Edit Thumbnail Image",
        value: "edit_thumb",
        description: "Small thumbnail icon URL (or {user.avatar})",
        emoji: "🔍",
      },
      {
        label: "Edit Footer Note",
        value: "edit_footer",
        description: "Footer text note & icon in DM",
        emoji: "📌",
      },
      {
        label: `Toggle Timestamp (${custom.timestamp ? "ON" : "OFF"})`,
        value: "toggle_time",
        description: "Display timestamp at bottom of DM",
        emoji: "⏱️",
      },
      {
        label: `Switch to ${currentFormat === "custom_embed" ? "Modern Container" : "Classic Embed"}`,
        value: "switch_fmt",
        description: "Change DM message format style",
        emoji: "🔄",
      },
      {
        label: "Save & Enable Join DM",
        value: "save_enable",
        description: "Save custom draft and activate Join DM",
        emoji: "💾",
      },
      {
        label: "Test My Direct Messages",
        value: "send_test",
        description: "Dispatch test greeting to your DM",
        emoji: "🧪",
      },
      {
        label: "Reset to Empty Draft",
        value: "reset_draft",
        description: "Clear all Join DM draft fields back to blank",
        emoji: "🗑️",
      },
      {
        label: "Back to Join DM Hub",
        value: "back_hub",
        description: "Return to Join DM management hub",
        emoji: "⬅️",
      }
    );

  const rowDropdown = new ActionRowBuilder().addComponents(selectMenu);
  container.addActionRowComponents(rowDropdown);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 9. DISPATCH RENDERER FOR CHANNEL WELCOME
 */
async function renderWelcomeMessage(member, config) {
  const guild = member.guild;
  const type = config.welcomeType || "premade";

  // 1. Custom Embed Mode
  if (type === "custom_embed") {
    const custom = config.customData || {};
    const embed = new EmbedBuilder();

    try {
      embed.setColor(custom.color && custom.color.startsWith("#") ? custom.color : "#5865F2");
    } catch (_) {
      embed.setColor("#5865F2");
    }

    if (custom.title && custom.title.trim()) {
      embed.setTitle(welcomeManager.formatWelcomeText(custom.title, member, guild).substring(0, 256));
    }

    if (custom.description && custom.description.trim()) {
      embed.setDescription(welcomeManager.formatWelcomeText(custom.description, member, guild).substring(0, 4096));
    } else {
      embed.setDescription(`Welcome ${member} to **${guild.name}**!`);
    }

    if (custom.authorName && custom.authorName.trim()) {
      const authName = welcomeManager.formatWelcomeText(custom.authorName, member, guild).substring(0, 256);
      const authIcon = custom.authorIcon ? welcomeManager.formatWelcomeText(custom.authorIcon, member, guild) : null;
      embed.setAuthor({
        name: authName,
        iconURL: authIcon && authIcon.startsWith("http") ? authIcon : undefined,
        url: custom.authorUrl && custom.authorUrl.startsWith("http") ? custom.authorUrl : undefined,
      });
    }

    if (custom.thumbnail && custom.thumbnail.trim()) {
      const thumbUrl = welcomeManager.formatWelcomeText(custom.thumbnail, member, guild);
      if (thumbUrl && thumbUrl.startsWith("http")) embed.setThumbnail(thumbUrl);
    }

    if (custom.image && custom.image.trim()) {
      const imgUrl = welcomeManager.formatWelcomeText(custom.image, member, guild);
      if (imgUrl && imgUrl.startsWith("http")) embed.setImage(imgUrl);
    }

    if (custom.footerText && custom.footerText.trim()) {
      const footText = welcomeManager.formatWelcomeText(custom.footerText, member, guild).substring(0, 2048);
      const footIcon = custom.footerIcon ? welcomeManager.formatWelcomeText(custom.footerIcon, member, guild) : null;
      embed.setFooter({
        text: footText,
        iconURL: footIcon && footIcon.startsWith("http") ? footIcon : undefined,
      });
    }

    if (custom.timestamp) {
      embed.setTimestamp();
    }

    return { embeds: [embed] };
  }

  // 2. Custom Components V2 Container Mode
  if (type === "custom_container") {
    const custom = config.customData || {};
    const container = new ContainerBuilder();

    if (custom.image && custom.image.trim()) {
      const imgUrl = welcomeManager.formatWelcomeText(custom.image, member, guild);
      if (imgUrl && imgUrl.startsWith("http")) {
        const mediaItem = new MediaGalleryItemBuilder().setURL(imgUrl);
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(mediaItem));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
      }
    }

    let bodyText = "";
    if (custom.title && custom.title.trim()) {
      bodyText += `# ${welcomeManager.formatWelcomeText(custom.title, member, guild)}\n\n`;
    }
    if (custom.description && custom.description.trim()) {
      bodyText += welcomeManager.formatWelcomeText(custom.description, member, guild);
    } else {
      bodyText += `Welcome ${member} to **${guild.name}**!`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

    if (custom.footerText && custom.footerText.trim()) {
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ${welcomeManager.formatWelcomeText(custom.footerText, member, guild)}`)
      );
    }

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  // 3. Astrix Premade Canvas Card Mode
  const sendFiles = [];
  let mediaGallery = null;

  if (config.canvasEnabled) {
    try {
      const cardBuffer = await welcomeCanvas.generateWelcomeCard(member, config);
      const canvasAttachment = new AttachmentBuilder(cardBuffer, {
        name: "welcome-card.png",
      });
      sendFiles.push(canvasAttachment);

      const mediaItem = new MediaGalleryItemBuilder().setURL("attachment://welcome-card.png");
      mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
    } catch (_) {
      const astrixPath = path.join(__dirname, "../../assets/astrix.png");
      const bannerAttachment = new AttachmentBuilder(astrixPath, {
        name: "astrix.png",
      });
      sendFiles.push(bannerAttachment);

      const mediaItem = new MediaGalleryItemBuilder().setURL("attachment://astrix.png");
      mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
    }
  }

  const websiteButton = new ButtonBuilder()
    .setEmoji("🌐")
    .setLabel("Website")
    .setStyle(ButtonStyle.Link)
    .setURL("https://extremez.vercel.app/");

  const supportButton = new ButtonBuilder()
    .setEmoji("💬")
    .setLabel("Support")
    .setStyle(ButtonStyle.Link)
    .setURL("https://discord.gg/FR9pXG2Mwb");

  const row = new ActionRowBuilder().addComponents(websiteButton, supportButton);

  const mainContent =
    `<:members:1539875392532512808> **Member Overview**\n` +
    `> -# <:prefix:1539875384080990228> **Member:** <@${member.id}>\n` +
    `> -# <:servers:1539875396546207795> **Username:** \`${member.user.username}\`\n` +
    `> -# <:list:1539875411780042802> **Member Count:** \`#${guild.memberCount.toLocaleString()}\``;

  const footerText = `-# Built with <:Red_heart:1539875406671388683> by ASTRIXCODE™ • User ID: \`${member.id}\``;

  const container = new ContainerBuilder();
  if (mediaGallery) {
    container.addMediaGalleryComponents(mediaGallery);
  }
  container
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText))
    .addActionRowComponents(row);

  return {
    components: [container],
    files: sendFiles,
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * 10. DISPATCH RENDERER FOR JOIN DM
 */
async function renderJoinDmMessage(member, config) {
  const guild = member.guild;
  const type = config.joinDmType || "premade";

  // 1. Custom Embed Mode
  if (type === "custom_embed") {
    const custom = config.joinDmCustomData || {};
    const embed = new EmbedBuilder();

    try {
      embed.setColor(custom.color && custom.color.startsWith("#") ? custom.color : "#5865F2");
    } catch (_) {
      embed.setColor("#5865F2");
    }

    if (custom.title && custom.title.trim()) {
      embed.setTitle(welcomeManager.formatWelcomeText(custom.title, member, guild).substring(0, 256));
    }

    if (custom.description && custom.description.trim()) {
      embed.setDescription(welcomeManager.formatWelcomeText(custom.description, member, guild).substring(0, 4096));
    } else {
      embed.setDescription(welcomeManager.formatWelcomeText(config.joinDmText || `Welcome to **{server}**!`, member, guild));
    }

    if (custom.authorName && custom.authorName.trim()) {
      const authName = welcomeManager.formatWelcomeText(custom.authorName, member, guild).substring(0, 256);
      const authIcon = custom.authorIcon ? welcomeManager.formatWelcomeText(custom.authorIcon, member, guild) : null;
      embed.setAuthor({
        name: authName,
        iconURL: authIcon && authIcon.startsWith("http") ? authIcon : undefined,
        url: custom.authorUrl && custom.authorUrl.startsWith("http") ? custom.authorUrl : undefined,
      });
    }

    if (custom.thumbnail && custom.thumbnail.trim()) {
      const thumbUrl = welcomeManager.formatWelcomeText(custom.thumbnail, member, guild);
      if (thumbUrl && thumbUrl.startsWith("http")) embed.setThumbnail(thumbUrl);
    }

    if (custom.image && custom.image.trim()) {
      const imgUrl = welcomeManager.formatWelcomeText(custom.image, member, guild);
      if (imgUrl && imgUrl.startsWith("http")) embed.setImage(imgUrl);
    }

    if (custom.footerText && custom.footerText.trim()) {
      const footText = welcomeManager.formatWelcomeText(custom.footerText, member, guild).substring(0, 2048);
      const footIcon = custom.footerIcon ? welcomeManager.formatWelcomeText(custom.footerIcon, member, guild) : null;
      embed.setFooter({
        text: footText,
        iconURL: footIcon && footIcon.startsWith("http") ? footIcon : undefined,
      });
    }

    if (custom.timestamp) {
      embed.setTimestamp();
    }

    return { embeds: [embed] };
  }

  // 2. Custom Components V2 Container Mode
  if (type === "custom_container") {
    const custom = config.joinDmCustomData || {};
    const container = new ContainerBuilder();

    if (custom.image && custom.image.trim()) {
      const imgUrl = welcomeManager.formatWelcomeText(custom.image, member, guild);
      if (imgUrl && imgUrl.startsWith("http")) {
        const mediaItem = new MediaGalleryItemBuilder().setURL(imgUrl);
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(mediaItem));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
      }
    }

    let bodyText = "";
    if (custom.title && custom.title.trim()) {
      bodyText += `# ${welcomeManager.formatWelcomeText(custom.title, member, guild)}\n\n`;
    }
    if (custom.description && custom.description.trim()) {
      bodyText += welcomeManager.formatWelcomeText(custom.description, member, guild);
    } else {
      bodyText += welcomeManager.formatWelcomeText(config.joinDmText || `Welcome to **${guild.name}**!`, member, guild);
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

    if (custom.footerText && custom.footerText.trim()) {
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ${welcomeManager.formatWelcomeText(custom.footerText, member, guild)}`)
      );
    }

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  // 3. Astrix Premade Canvas Card DM Mode
  const dmContent = welcomeManager.formatWelcomeText(
    config.joinDmText,
    member,
    guild
  );

  const sendFiles = [];
  let mediaGallery = null;

  if (config.canvasEnabled) {
    try {
      const cardBuffer = await welcomeCanvas.generateWelcomeCard(member, config);
      const canvasAttachment = new AttachmentBuilder(cardBuffer, {
        name: "welcome-card.png",
      });
      sendFiles.push(canvasAttachment);

      const mediaItem = new MediaGalleryItemBuilder().setURL("attachment://welcome-card.png");
      mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
    } catch (_) {
      const astrixPath = path.join(__dirname, "../../assets/astrix.png");
      const bannerAttachment = new AttachmentBuilder(astrixPath, {
        name: "astrix.png",
      });
      sendFiles.push(bannerAttachment);

      const mediaItem = new MediaGalleryItemBuilder().setURL("attachment://astrix.png");
      mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
    }
  }

  const websiteButton = new ButtonBuilder()
    .setEmoji("🌐")
    .setLabel("Website")
    .setStyle(ButtonStyle.Link)
    .setURL("https://extremez.vercel.app/");

  const supportButton = new ButtonBuilder()
    .setEmoji("💬")
    .setLabel("Support")
    .setStyle(ButtonStyle.Link)
    .setURL("https://discord.gg/FR9pXG2Mwb");

  const row = new ActionRowBuilder().addComponents(websiteButton, supportButton);

  const mainContent =
    `<:members:1539875392532512808> **Member Overview**\n` +
    `> -# <:prefix:1539875384080990228> **Member:** <@${member.id}>\n` +
    `> -# <:servers:1539875396546207795> **Username:** \`${member.user.username}\`\n` +
    `> -# <:list:1539875411780042802> **Member Count:** \`#${guild.memberCount.toLocaleString()}\`\n\n` +
    `> ${dmContent}`;

  const footerText = `-# Built with <:Red_heart:1539875406671388683> by ASTRIXCODE™ • User ID: \`${member.id}\``;

  const container = new ContainerBuilder();
  if (mediaGallery) {
    container.addMediaGalleryComponents(mediaGallery);
  }
  container
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText))
    .addActionRowComponents(row);

  return {
    components: [container],
    files: sendFiles,
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Safe in-place update for all V2 containers
 */
async function safeUpdate(interaction, payload) {
  return interaction.update(payload).catch(async (err) => {
    console.error("[WelcomeBuilder] Update error, fallback to editReply:", err);
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(() => null);
      }
      return interaction.message.edit(payload).catch(() => null);
    } catch (_) {}
  });
}

/**
 * MAIN INTERACTION ROUTER
 */
async function handleWelcomeBuilderInteraction(client, interaction) {
  const { customId } = interaction;
  if (!customId) return false;

  const guild = interaction.guild;
  const member = interaction.member;

  // --- WELCOME MAIN HUB ACTIONS ---
  if (customId === "wlcm_hub_dropdown" && interaction.isStringSelectMenu()) {
    const action = interaction.values[0];

    if (action === "wlcm_act_premade") {
      welcomeManager.updateGuildWelcome(guild.id, { welcomeType: "premade" });
      const payload = await buildPremadeDashboardPayload(guild, member, "✅ Switched to **Astrix Premade Canvas**.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "wlcm_act_custom") {
      const payload = buildFormatChoicePayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "wlcm_act_joindm") {
      const payload = buildJoinDmHubPayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "wlcm_act_channel") {
      const payload = buildChannelSelectPayload(guild, "custom");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "wlcm_act_toggle") {
      const config = welcomeManager.getGuildWelcome(guild.id);
      const newState = !config.enabled;
      welcomeManager.updateGuildWelcome(guild.id, { enabled: newState });
      const payload = buildWelcomeHubPayload(
        guild,
        member,
        newState ? "✅ Welcome Module is now **ENABLED**!" : "⚠️ Welcome Module is now **DISABLED**."
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "wlcm_act_test") {
      const config = welcomeManager.getGuildWelcome(guild.id);
      if (!config.enabled || !config.channelId) {
        await interaction.reply({
          content: "⚠️ **Preview Unavailable:** Welcome greetings are currently **DISABLED** or welcome channel is not configured. Please set a channel and enable greetings first.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
        return true;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
      try {
        const testMsg = await renderWelcomeMessage(member, config);
        await interaction.channel.send(testMsg);
        await interaction.editReply("✅ Test welcome message sent to this channel!").catch(() => null);
      } catch (err) {
        console.error("[WelcomeBuilder] Test error:", err);
        await interaction.editReply("❌ Failed to send test welcome message. Check bot permissions.").catch(() => null);
      }
      return true;
    }
  }

  // --- PREMADE DASHBOARD ACTIONS ---
  if (customId === "wlcm_premade_dropdown" && interaction.isStringSelectMenu()) {
    const action = interaction.values[0];

    if (action === "premade_channel") {
      const payload = buildChannelSelectPayload(guild, "premade");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "premade_studio") {
      const { buildCardConfigPayload } = require("./handleWelcomeCanvasInteraction");
      const payload = await buildCardConfigPayload(member);
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "premade_toggle") {
      const config = welcomeManager.getGuildWelcome(guild.id);
      const newState = !config.enabled;
      welcomeManager.updateGuildWelcome(guild.id, { enabled: newState });
      const payload = await buildPremadeDashboardPayload(
        guild,
        member,
        newState ? "✅ Premade greetings are now **ENABLED**!" : "⚠️ Premade greetings are now **DISABLED**."
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "premade_test") {
      const config = welcomeManager.getGuildWelcome(guild.id);
      if (!config.enabled || !config.channelId) {
        await interaction.reply({
          content: "⚠️ **Preview Unavailable:** Welcome greetings are currently **DISABLED** or welcome channel is not configured. Please set a channel and enable greetings first.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
        return true;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
      try {
        const testMsg = await renderWelcomeMessage(member, config);
        await interaction.channel.send(testMsg);
        await interaction.editReply("✅ Test welcome card sent to this channel!").catch(() => null);
      } catch (err) {
        await interaction.editReply("❌ Failed to send test welcome card.").catch(() => null);
      }
      return true;
    }

    if (action === "premade_back") {
      const payload = buildWelcomeHubPayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }
  }

  // --- CUSTOM WELCOME FORMAT SELECTION ---
  if (customId === "wlcm_format_dropdown" && interaction.isStringSelectMenu()) {
    const selected = interaction.values[0];

    if (selected === "fmt_embed") {
      welcomeManager.updateGuildWelcome(guild.id, { welcomeType: "custom_embed" });
      const payload = buildCustomEditorPayload(guild, member, "custom_embed", "✨ Format set to **Classic Embed**.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "fmt_container") {
      welcomeManager.updateGuildWelcome(guild.id, { welcomeType: "custom_container" });
      const payload = buildCustomEditorPayload(guild, member, "custom_container", "✨ Format set to **Modern Container**.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "fmt_back") {
      const payload = buildWelcomeHubPayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }
  }

  // --- JOIN DM HUB ACTIONS ---
  if (customId === "jdm_hub_dropdown" && interaction.isStringSelectMenu()) {
    const action = interaction.values[0];

    if (action === "jdm_act_premade") {
      welcomeManager.updateGuildWelcome(guild.id, { joinDmType: "premade" });
      const payload = buildJoinDmHubPayload(guild, member, "✅ Join DM set to **Astrix Premade Canvas Card**.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "jdm_act_custom") {
      const payload = buildJoinDmFormatChoicePayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "jdm_act_toggle") {
      const config = welcomeManager.getGuildWelcome(guild.id);
      const newState = !config.joinDmEnabled;
      welcomeManager.updateGuildWelcome(guild.id, { joinDmEnabled: newState });
      const payload = buildJoinDmHubPayload(
        guild,
        member,
        newState ? "✅ Join DM greetings are now **ENABLED**!" : "⚠️ Join DM greetings are now **DISABLED**."
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (action === "jdm_act_test") {
      const config = welcomeManager.getGuildWelcome(guild.id);
      if (!config.joinDmEnabled) {
        await interaction.reply({
          content: "⚠️ **Preview Unavailable:** Join DM greetings are currently **DISABLED**. Please enable Join DM first.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
        return true;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
      try {
        const dmMsg = await renderJoinDmMessage(member, config);
        await member.send(dmMsg);
        await interaction.editReply("✅ Test Join DM sent directly to your DMs! Check your direct messages.").catch(() => null);
      } catch (err) {
        await interaction.editReply("❌ Failed to send DM. Please ensure your DMs from server members are open!").catch(() => null);
      }
      return true;
    }

    if (action === "jdm_act_back") {
      const payload = buildWelcomeHubPayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }
  }

  // --- JOIN DM FORMAT SELECTION ---
  if (customId === "jdm_format_dropdown" && interaction.isStringSelectMenu()) {
    const selected = interaction.values[0];

    if (selected === "jdm_fmt_embed") {
      welcomeManager.updateGuildWelcome(guild.id, { joinDmType: "custom_embed" });
      const payload = buildJoinDmEditorPayload(guild, member, "custom_embed", "✨ Join DM format set to **Classic Embed**.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "jdm_fmt_container") {
      welcomeManager.updateGuildWelcome(guild.id, { joinDmType: "custom_container" });
      const payload = buildJoinDmEditorPayload(guild, member, "custom_container", "✨ Join DM format set to **Modern Container**.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "jdm_fmt_back") {
      const payload = buildJoinDmHubPayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }
  }

  // --- BACKWARDS COMPATIBILITY BUTTONS ---
  if (customId === "wlcm_hub_premade") {
    welcomeManager.updateGuildWelcome(guild.id, { welcomeType: "premade" });
    const payload = await buildPremadeDashboardPayload(guild, member, "✅ Switched to **Astrix Premade Canvas**.");
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId === "wlcm_hub_custom") {
    const payload = buildFormatChoicePayload(guild, member);
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId === "wlcm_hub_joindm") {
    const payload = buildJoinDmHubPayload(guild, member);
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId === "wlcm_hub_back") {
    const payload = buildWelcomeHubPayload(guild, member);
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId === "wlcm_return_editor") {
    const config = welcomeManager.getGuildWelcome(guild.id);
    const payload = buildCustomEditorPayload(guild, member, config.welcomeType);
    await safeUpdate(interaction, payload);
    return true;
  }

  // --- CHANNEL SELECTOR PICKED ---
  if (customId.startsWith("wlcm_channel_picked_") && interaction.isChannelSelectMenu()) {
    const origin = customId.replace("wlcm_channel_picked_", "");
    const pickedId = interaction.values[0];
    welcomeManager.updateGuildWelcome(guild.id, { channelId: pickedId, enabled: true });

    if (origin === "premade") {
      const payload = await buildPremadeDashboardPayload(
        guild,
        member,
        `✅ Welcome channel set to <#${pickedId}> and enabled!`
      );
      await safeUpdate(interaction, payload);
    } else {
      const config = welcomeManager.getGuildWelcome(guild.id);
      const payload = buildCustomEditorPayload(
        guild,
        member,
        config.welcomeType,
        `✅ Welcome channel set to <#${pickedId}>!`
      );
      await safeUpdate(interaction, payload);
    }
    return true;
  }

  // --- CUSTOM WELCOME EDITOR BUTTONS ---
  if (customId === "wlcm_custom_save") {
    const config = welcomeManager.getGuildWelcome(guild.id);
    if (!config.channelId) {
      const payload = buildChannelSelectPayload(guild, "custom");
      await safeUpdate(interaction, payload);
      return true;
    }
    welcomeManager.updateGuildWelcome(guild.id, { enabled: true });
    const payload = buildCustomEditorPayload(
      guild,
      member,
      config.welcomeType,
      `🎉 **Saved & Enabled!** Custom welcome is now active in <#${config.channelId}>.`
    );
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId === "wlcm_custom_test") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
    const config = welcomeManager.getGuildWelcome(guild.id);
    try {
      const testMsg = await renderWelcomeMessage(member, config);
      await interaction.channel.send(testMsg);
      await interaction.editReply("✅ Test welcome message sent to this channel!").catch(() => null);
    } catch (err) {
      console.error("[WelcomeBuilder] Test error:", err);
      await interaction.editReply("❌ Failed to send test welcome message. Check bot permissions.").catch(() => null);
    }
    return true;
  }

  // --- CUSTOM WELCOME DROPDOWN MENU ---
  if (customId === "wlcm_custom_dropdown" && interaction.isStringSelectMenu()) {
    const selected = interaction.values[0];
    const config = welcomeManager.getGuildWelcome(guild.id);
    const custom = config.customData || {};

    if (selected === "switch_fmt") {
      const newFmt = config.welcomeType === "custom_container" ? "custom_embed" : "custom_container";
      welcomeManager.updateGuildWelcome(guild.id, { welcomeType: newFmt });
      const payload = buildCustomEditorPayload(
        guild,
        member,
        newFmt,
        `🔄 Format switched to **${newFmt === "custom_embed" ? "Classic Embed" : "Modern Container"}**.`
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "save_enable") {
      if (!config.channelId) {
        const payload = buildChannelSelectPayload(guild, "custom");
        await safeUpdate(interaction, payload);
        return true;
      }
      welcomeManager.updateGuildWelcome(guild.id, { enabled: true });
      const payload = buildCustomEditorPayload(
        guild,
        member,
        config.welcomeType,
        `🎉 **Saved & Enabled!** Custom welcome is active in <#${config.channelId}>.`
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "send_test") {
      if (!config.enabled || !config.channelId) {
        await interaction.reply({
          content: "⚠️ **Preview Unavailable:** Welcome greetings are currently **DISABLED** or welcome channel is not configured. Please set a channel and save/enable first.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
        return true;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
      try {
        const testMsg = await renderWelcomeMessage(member, config);
        await interaction.channel.send(testMsg);
        await interaction.editReply("✅ Test welcome message sent to this channel!").catch(() => null);
      } catch (err) {
        await interaction.editReply("❌ Failed to send test welcome message. Check permissions.").catch(() => null);
      }
      return true;
    }

    if (selected === "back_hub") {
      const payload = buildWelcomeHubPayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "set_channel") {
      const payload = buildChannelSelectPayload(guild, "custom");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "toggle_time") {
      const newTime = !custom.timestamp;
      welcomeManager.updateGuildWelcome(guild.id, { customData: { timestamp: newTime } });
      const payload = buildCustomEditorPayload(
        guild,
        member,
        config.welcomeType,
        `🕒 Timestamp display is now **${newTime ? "ENABLED ✅" : "DISABLED ❌"}**.`
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "reset_draft") {
      welcomeManager.updateGuildWelcome(guild.id, {
        customData: {
          title: "",
          description: "",
          color: "#5865F2",
          authorName: "",
          authorIcon: "",
          authorUrl: "",
          footerText: "",
          footerIcon: "",
          thumbnail: "",
          image: "",
          timestamp: false,
        },
      });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, "🗑️ Welcome draft reset to empty.");
      await safeUpdate(interaction, payload);
      return true;
    }

    // Modal Triggers for Welcome Editor
    if (selected === "edit_desc") {
      const modal = new ModalBuilder().setCustomId("wlcm_modal_desc").setTitle("Edit Welcome Description");
      const input = new TextInputBuilder()
        .setCustomId("input_desc")
        .setLabel("Message Body (Supports Variables)")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Welcome {user} to {server}! Member #{memberCount}")
        .setValue(custom.description || "")
        .setMaxLength(3000)
        .setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_title") {
      const modal = new ModalBuilder().setCustomId("wlcm_modal_title").setTitle("Edit Welcome Title");
      const input = new TextInputBuilder()
        .setCustomId("input_title")
        .setLabel("Title Headline")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("👋 Welcome to {server}!")
        .setValue(custom.title || "")
        .setMaxLength(250)
        .setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_color") {
      const modal = new ModalBuilder().setCustomId("wlcm_modal_color").setTitle("Edit Accent HEX Color");
      const input = new TextInputBuilder()
        .setCustomId("input_color")
        .setLabel("HEX Color Code")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("#5865F2, #22C55E, #FF3131")
        .setValue(custom.color || "#5865F2")
        .setMaxLength(7)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_author") {
      const modal = new ModalBuilder().setCustomId("wlcm_modal_author").setTitle("Edit Author Header");
      const inputName = new TextInputBuilder().setCustomId("input_author_name").setLabel("Author Name").setStyle(TextInputStyle.Short).setValue(custom.authorName || "").setRequired(false);
      const inputIcon = new TextInputBuilder().setCustomId("input_author_icon").setLabel("Author Icon URL").setStyle(TextInputStyle.Short).setValue(custom.authorIcon || "").setRequired(false);
      const inputUrl = new TextInputBuilder().setCustomId("input_author_url").setLabel("Author Click Link").setStyle(TextInputStyle.Short).setValue(custom.authorUrl || "").setRequired(false);
      modal.addComponents(
        new ActionRowBuilder().addComponents(inputName),
        new ActionRowBuilder().addComponents(inputIcon),
        new ActionRowBuilder().addComponents(inputUrl)
      );
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_image") {
      const modal = new ModalBuilder().setCustomId("wlcm_modal_image").setTitle("Edit Banner Image");
      const input = new TextInputBuilder().setCustomId("input_image").setLabel("Banner URL (or {guild.banner})").setStyle(TextInputStyle.Short).setValue(custom.image || "").setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_thumb") {
      const modal = new ModalBuilder().setCustomId("wlcm_modal_thumb").setTitle("Edit Thumbnail Image");
      const input = new TextInputBuilder().setCustomId("input_thumb").setLabel("Thumbnail URL (or {user.avatar})").setStyle(TextInputStyle.Short).setValue(custom.thumbnail || "").setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_footer") {
      const modal = new ModalBuilder().setCustomId("wlcm_modal_footer").setTitle("Edit Footer Note");
      const inputText = new TextInputBuilder().setCustomId("input_footer_text").setLabel("Footer Note Text").setStyle(TextInputStyle.Short).setValue(custom.footerText || "").setRequired(false);
      const inputIcon = new TextInputBuilder().setCustomId("input_footer_icon").setLabel("Footer Icon URL").setStyle(TextInputStyle.Short).setValue(custom.footerIcon || "").setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(inputText), new ActionRowBuilder().addComponents(inputIcon));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }
  }

  // --- JOIN DM EDITOR BUTTONS ---
  if (customId === "jdm_custom_save") {
    welcomeManager.updateGuildWelcome(guild.id, { joinDmEnabled: true });
    const config = welcomeManager.getGuildWelcome(guild.id);
    const payload = buildJoinDmEditorPayload(
      guild,
      member,
      config.joinDmType,
      "🎉 **Saved & Enabled!** Custom Join DM greetings are now active."
    );
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId === "jdm_custom_test") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
    const config = welcomeManager.getGuildWelcome(guild.id);
    try {
      const dmMsg = await renderJoinDmMessage(member, config);
      await member.send(dmMsg);
      await interaction.editReply("✅ Test Join DM sent directly to your DMs! Check your direct messages.").catch(() => null);
    } catch (err) {
      await interaction.editReply("❌ Failed to send DM. Please ensure your DMs from server members are open!").catch(() => null);
    }
    return true;
  }

  // --- JOIN DM DROPDOWN MENU ---
  if (customId === "jdm_custom_dropdown" && interaction.isStringSelectMenu()) {
    const selected = interaction.values[0];
    const config = welcomeManager.getGuildWelcome(guild.id);
    const custom = config.joinDmCustomData || {};

    if (selected === "switch_fmt") {
      const newFmt = config.joinDmType === "custom_container" ? "custom_embed" : "custom_container";
      welcomeManager.updateGuildWelcome(guild.id, { joinDmType: newFmt });
      const payload = buildJoinDmEditorPayload(
        guild,
        member,
        newFmt,
        `🔄 Format switched to **${newFmt === "custom_embed" ? "Classic Embed" : "Modern Container"}**.`
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "save_enable") {
      welcomeManager.updateGuildWelcome(guild.id, { joinDmEnabled: true });
      const payload = buildJoinDmEditorPayload(
        guild,
        member,
        config.joinDmType,
        "🎉 **Saved & Enabled!** Custom Join DM greetings are now active."
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "send_test") {
      if (!config.joinDmEnabled) {
        await interaction.reply({
          content: "⚠️ **Preview Unavailable:** Join DM greetings are currently **DISABLED**. Please save & enable first.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
        return true;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
      try {
        const dmMsg = await renderJoinDmMessage(member, config);
        await member.send(dmMsg);
        await interaction.editReply("✅ Test Join DM sent directly to your DMs! Check your direct messages.").catch(() => null);
      } catch (err) {
        await interaction.editReply("❌ Failed to send DM. Please ensure your DMs from server members are open!").catch(() => null);
      }
      return true;
    }

    if (selected === "back_hub") {
      const payload = buildJoinDmHubPayload(guild, member);
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "toggle_time") {
      const newTime = !custom.timestamp;
      welcomeManager.updateGuildWelcome(guild.id, { joinDmCustomData: { timestamp: newTime } });
      const payload = buildJoinDmEditorPayload(
        guild,
        member,
        config.joinDmType,
        `🕒 Timestamp display is now **${newTime ? "ENABLED ✅" : "DISABLED ❌"}**.`
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "reset_draft") {
      welcomeManager.updateGuildWelcome(guild.id, {
        joinDmCustomData: {
          title: "",
          description: "",
          color: "#5865F2",
          authorName: "",
          authorIcon: "",
          authorUrl: "",
          footerText: "",
          footerIcon: "",
          thumbnail: "",
          image: "",
          timestamp: false,
        },
      });
      const payload = buildJoinDmEditorPayload(guild, member, config.joinDmType, "🗑️ Join DM draft reset to empty.");
      await safeUpdate(interaction, payload);
      return true;
    }

    // Modal Triggers for Join DM Editor
    if (selected === "edit_desc") {
      const modal = new ModalBuilder().setCustomId("jdm_modal_desc").setTitle("Edit Join DM Description");
      const input = new TextInputBuilder()
        .setCustomId("input_desc")
        .setLabel("DM Text (Supports Variables)")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(custom.description || "")
        .setMaxLength(3000)
        .setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_title") {
      const modal = new ModalBuilder().setCustomId("jdm_modal_title").setTitle("Edit Join DM Title");
      const input = new TextInputBuilder()
        .setCustomId("input_title")
        .setLabel("Title Headline")
        .setStyle(TextInputStyle.Short)
        .setValue(custom.title || "")
        .setMaxLength(250)
        .setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_color") {
      const modal = new ModalBuilder().setCustomId("jdm_modal_color").setTitle("Edit Accent HEX Color");
      const input = new TextInputBuilder()
        .setCustomId("input_color")
        .setLabel("HEX Color Code")
        .setStyle(TextInputStyle.Short)
        .setValue(custom.color || "#5865F2")
        .setMaxLength(7)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_author") {
      const modal = new ModalBuilder().setCustomId("jdm_modal_author").setTitle("Edit DM Author Header");
      const inputName = new TextInputBuilder().setCustomId("input_author_name").setLabel("Author Name").setStyle(TextInputStyle.Short).setValue(custom.authorName || "").setRequired(false);
      const inputIcon = new TextInputBuilder().setCustomId("input_author_icon").setLabel("Author Icon URL").setStyle(TextInputStyle.Short).setValue(custom.authorIcon || "").setRequired(false);
      const inputUrl = new TextInputBuilder().setCustomId("input_author_url").setLabel("Author Click Link").setStyle(TextInputStyle.Short).setValue(custom.authorUrl || "").setRequired(false);
      modal.addComponents(
        new ActionRowBuilder().addComponents(inputName),
        new ActionRowBuilder().addComponents(inputIcon),
        new ActionRowBuilder().addComponents(inputUrl)
      );
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_image") {
      const modal = new ModalBuilder().setCustomId("jdm_modal_image").setTitle("Edit Banner Image");
      const input = new TextInputBuilder().setCustomId("input_image").setLabel("Banner URL (or {guild.banner})").setStyle(TextInputStyle.Short).setValue(custom.image || "").setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_thumb") {
      const modal = new ModalBuilder().setCustomId("jdm_modal_thumb").setTitle("Edit Thumbnail Image");
      const input = new TextInputBuilder().setCustomId("input_thumb").setLabel("Thumbnail URL (or {user.avatar})").setStyle(TextInputStyle.Short).setValue(custom.thumbnail || "").setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_footer") {
      const modal = new ModalBuilder().setCustomId("jdm_modal_footer").setTitle("Edit Footer Note");
      const inputText = new TextInputBuilder().setCustomId("input_footer_text").setLabel("Footer Note Text").setStyle(TextInputStyle.Short).setValue(custom.footerText || "").setRequired(false);
      const inputIcon = new TextInputBuilder().setCustomId("input_footer_icon").setLabel("Footer Icon URL").setStyle(TextInputStyle.Short).setValue(custom.footerIcon || "").setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(inputText), new ActionRowBuilder().addComponents(inputIcon));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }
  }

  // --- MODAL SUBMISSIONS ---
  if (interaction.isModalSubmit()) {
    const config = welcomeManager.getGuildWelcome(guild.id);

    // Welcome Editor Modals
    if (customId === "wlcm_modal_desc") {
      const val = interaction.fields.getTextInputValue("input_desc") || "";
      welcomeManager.updateGuildWelcome(guild.id, { customData: { description: val } });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, "✅ Updated message description.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "wlcm_modal_title") {
      const val = interaction.fields.getTextInputValue("input_title") || "";
      welcomeManager.updateGuildWelcome(guild.id, { customData: { title: val } });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, "✅ Updated title.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "wlcm_modal_color") {
      let val = interaction.fields.getTextInputValue("input_color") || "#5865F2";
      if (!val.startsWith("#")) val = `#${val}`;
      welcomeManager.updateGuildWelcome(guild.id, { customData: { color: val } });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, `✅ Updated color to \`${val}\`.`);
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "wlcm_modal_author") {
      const authName = interaction.fields.getTextInputValue("input_author_name") || "";
      const authIcon = interaction.fields.getTextInputValue("input_author_icon") || "";
      const authUrl = interaction.fields.getTextInputValue("input_author_url") || "";
      welcomeManager.updateGuildWelcome(guild.id, { customData: { authorName: authName, authorIcon: authIcon, authorUrl: authUrl } });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, "✅ Updated author info.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "wlcm_modal_image") {
      const val = interaction.fields.getTextInputValue("input_image") || "";
      welcomeManager.updateGuildWelcome(guild.id, { customData: { image: val } });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, "✅ Updated banner image URL.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "wlcm_modal_thumb") {
      const val = interaction.fields.getTextInputValue("input_thumb") || "";
      welcomeManager.updateGuildWelcome(guild.id, { customData: { thumbnail: val } });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, "✅ Updated thumbnail URL.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "wlcm_modal_footer") {
      const footText = interaction.fields.getTextInputValue("input_footer_text") || "";
      const footIcon = interaction.fields.getTextInputValue("input_footer_icon") || "";
      welcomeManager.updateGuildWelcome(guild.id, { customData: { footerText: footText, footerIcon: footIcon } });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, "✅ Updated footer note.");
      await safeUpdate(interaction, payload);
      return true;
    }

    // Join DM Editor Modals
    if (customId === "jdm_modal_desc") {
      const val = interaction.fields.getTextInputValue("input_desc") || "";
      welcomeManager.updateGuildWelcome(guild.id, { joinDmCustomData: { description: val } });
      const payload = buildJoinDmEditorPayload(guild, member, config.joinDmType, "✅ Updated DM message description.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "jdm_modal_title") {
      const val = interaction.fields.getTextInputValue("input_title") || "";
      welcomeManager.updateGuildWelcome(guild.id, { joinDmCustomData: { title: val } });
      const payload = buildJoinDmEditorPayload(guild, member, config.joinDmType, "✅ Updated DM title.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "jdm_modal_color") {
      let val = interaction.fields.getTextInputValue("input_color") || "#5865F2";
      if (!val.startsWith("#")) val = `#${val}`;
      welcomeManager.updateGuildWelcome(guild.id, { joinDmCustomData: { color: val } });
      const payload = buildJoinDmEditorPayload(guild, member, config.joinDmType, `✅ Updated color to \`${val}\`.`);
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "jdm_modal_author") {
      const authName = interaction.fields.getTextInputValue("input_author_name") || "";
      const authIcon = interaction.fields.getTextInputValue("input_author_icon") || "";
      const authUrl = interaction.fields.getTextInputValue("input_author_url") || "";
      welcomeManager.updateGuildWelcome(guild.id, { joinDmCustomData: { authorName: authName, authorIcon: authIcon, authorUrl: authUrl } });
      const payload = buildJoinDmEditorPayload(guild, member, config.joinDmType, "✅ Updated DM author info.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "jdm_modal_image") {
      const val = interaction.fields.getTextInputValue("input_image") || "";
      welcomeManager.updateGuildWelcome(guild.id, { joinDmCustomData: { image: val } });
      const payload = buildJoinDmEditorPayload(guild, member, config.joinDmType, "✅ Updated DM banner image URL.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "jdm_modal_thumb") {
      const val = interaction.fields.getTextInputValue("input_thumb") || "";
      welcomeManager.updateGuildWelcome(guild.id, { joinDmCustomData: { thumbnail: val } });
      const payload = buildJoinDmEditorPayload(guild, member, config.joinDmType, "✅ Updated DM thumbnail URL.");
      await safeUpdate(interaction, payload);
      return true;
    }

    if (customId === "jdm_modal_footer") {
      const footText = interaction.fields.getTextInputValue("input_footer_text") || "";
      const footIcon = interaction.fields.getTextInputValue("input_footer_icon") || "";
      welcomeManager.updateGuildWelcome(guild.id, { joinDmCustomData: { footerText: footText, footerIcon: footIcon } });
      const payload = buildJoinDmEditorPayload(guild, member, config.joinDmType, "✅ Updated DM footer note.");
      await safeUpdate(interaction, payload);
      return true;
    }
  }

  return false;
}

module.exports = {
  buildWelcomeHubPayload,
  buildFormatChoicePayload,
  buildCustomEditorPayload,
  buildPremadeDashboardPayload,
  buildChannelSelectPayload,
  buildJoinDmHubPayload,
  buildJoinDmFormatChoicePayload,
  buildJoinDmEditorPayload,
  renderWelcomeMessage,
  renderJoinDmMessage,
  handleWelcomeBuilderInteraction,
};
