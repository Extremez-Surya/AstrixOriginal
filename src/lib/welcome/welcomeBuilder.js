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

/**
 * Builds the initial setup hub where user chooses Premade vs Custom
 */
function buildWelcomeHubPayload(guild, member) {
  const config = welcomeManager.getGuildWelcome(guild.id);
  const channelMention = config.channelId ? `<#${config.channelId}>` : "`Not Configured`";
  const typeLabel =
    config.welcomeType === "custom_embed"
      ? "Custom (Classic Embed)"
      : config.welcomeType === "custom_container"
        ? "Custom (Components V2 Container)"
        : "Astrix Premade (Canvas UI)";

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("👋 Welcome System Setup & Manager")
    .setDescription(
      `*Configure how new members are greeted when joining ${guild.name}.*\n\n` +
      `### ⚙️ Current Configuration\n` +
      `> - **Module State:** \`${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
      `> - **Active Mode:** \`${typeLabel}\`\n` +
      `> - **Welcome Channel:** ${channelMention}\n\n` +
      `### 🚀 Choose Setup Method\n` +
      `> 🎨 **Astrix Premade Welcome**\n` +
      `> Instant setup using Astrix's signature Cyber-Metallic Canvas Card, live member overview stats, buttons, and custom studio themes.\n\n` +
      `> 🛠️ **Custom Welcome (Build Your Own)**\n` +
      `> Build your own custom greeting from scratch! Choose between **Classic Embed** or **Modern Container (Components V2)**, with full dropdown-based editing and variables!`
    )
    .setFooter({ text: "Astrix Welcome Engine • Select an option below to proceed" });

  const btnPremade = new ButtonBuilder()
    .setCustomId("wlcm_hub_premade")
    .setEmoji("🎨")
    .setLabel("Astrix Premade Welcome")
    .setStyle(ButtonStyle.Success);

  const btnCustom = new ButtonBuilder()
    .setCustomId("wlcm_hub_custom")
    .setEmoji("🛠️")
    .setLabel("Custom Welcome (Build Your Own)")
    .setStyle(ButtonStyle.Primary);

  const btnStatus = new ButtonBuilder()
    .setCustomId("wlcm_hub_status")
    .setEmoji("⚙️")
    .setLabel("Current Config")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(btnPremade, btnCustom, btnStatus);

  return {
    embeds: [embed],
    components: [row],
  };
}

/**
 * Builds the format selection screen: EMBED vs CONTAINER
 */
function buildFormatChoicePayload(guild, member) {
  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("🛠️ Select Custom Welcome Format")
    .setDescription(
      `*Choose the message format style for your custom welcome greetings.*\n\n` +
      `Please select which format version you would like to build:\n\n` +
      `> 📑 **Classic Embed**\n` +
      `> Beautiful Discord rich embed with colored border, title, description, author, thumbnail, banner image, and footer.\n\n` +
      `> 📦 **Modern Container (Components V2)**\n` +
      `> Discord's next-gen full-width container format with sleek divider lines, media gallery banners, and styled text displays.\n\n` +
      `*Both formats support full dropdown editing, interactive modals, and real-time live preview.*`
    )
    .setFooter({ text: "Astrix Welcome Engine • Click an option below" });

  const btnEmbed = new ButtonBuilder()
    .setCustomId("wlcm_choose_embed")
    .setEmoji("📑")
    .setLabel("Classic Embed")
    .setStyle(ButtonStyle.Primary);

  const btnContainer = new ButtonBuilder()
    .setCustomId("wlcm_choose_container")
    .setEmoji("📦")
    .setLabel("Modern Container (V2)")
    .setStyle(ButtonStyle.Success);

  const btnBack = new ButtonBuilder()
    .setCustomId("wlcm_hub_back")
    .setEmoji("⬅️")
    .setLabel("Back")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(btnEmbed, btnContainer, btnBack);

  return {
    embeds: [embed],
    components: [row],
  };
}

/**
 * Builds the Interactive Live Editor for Custom Welcome (Embed or Container)
 */
function buildCustomEditorPayload(guild, member, format, notice = null) {
  const config = welcomeManager.getGuildWelcome(guild.id);
  const custom = config.customData || {};
  const currentFormat = format || config.welcomeType || "custom_embed";

  const channelObj = config.channelId ? guild.channels.cache.get(config.channelId) : null;
  const channelName = channelObj ? channelObj.name : "Not Set";

  // 1. Build the Live Preview
  if (currentFormat === "custom_embed") {
    const embed = new EmbedBuilder();

    // Color
    try {
      embed.setColor(custom.color && custom.color.startsWith("#") ? custom.color : "#5865F2");
    } catch (_) {
      embed.setColor("#5865F2");
    }

    // Title
    if (custom.title && custom.title.trim()) {
      embed.setTitle(welcomeManager.formatWelcomeText(custom.title, member, guild).substring(0, 256));
    }

    // Description (empty draft if blank)
    if (custom.description && custom.description.trim()) {
      embed.setDescription(welcomeManager.formatWelcomeText(custom.description, member, guild).substring(0, 4096));
    } else {
      embed.setDescription("*✨ Empty welcome embed description. Use the dropdown menu below to add text, title, or images.*");
    }

    // Author
    if (custom.authorName && custom.authorName.trim()) {
      const authName = welcomeManager.formatWelcomeText(custom.authorName, member, guild).substring(0, 256);
      const authIcon = custom.authorIcon ? welcomeManager.formatWelcomeText(custom.authorIcon, member, guild) : null;
      const authUrl = custom.authorUrl || null;
      embed.setAuthor({
        name: authName,
        iconURL: authIcon && authIcon.startsWith("http") ? authIcon : undefined,
        url: authUrl && authUrl.startsWith("http") ? authUrl : undefined,
      });
    }

    // Thumbnail
    if (custom.thumbnail && custom.thumbnail.trim()) {
      const thumbUrl = welcomeManager.formatWelcomeText(custom.thumbnail, member, guild);
      if (thumbUrl && thumbUrl.startsWith("http")) {
        embed.setThumbnail(thumbUrl);
      }
    }

    // Banner Image
    if (custom.image && custom.image.trim()) {
      const imgUrl = welcomeManager.formatWelcomeText(custom.image, member, guild);
      if (imgUrl && imgUrl.startsWith("http")) {
        embed.setImage(imgUrl);
      }
    }

    // Footer
    if (custom.footerText && custom.footerText.trim()) {
      const footText = welcomeManager.formatWelcomeText(custom.footerText, member, guild).substring(0, 2048);
      const footIcon = custom.footerIcon ? welcomeManager.formatWelcomeText(custom.footerIcon, member, guild) : null;
      embed.setFooter({
        text: footText,
        iconURL: footIcon && footIcon.startsWith("http") ? footIcon : undefined,
      });
    }

    // Timestamp
    if (custom.timestamp) {
      embed.setTimestamp();
    }

    // Controls Action Rows
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("wlcm_custom_dropdown")
      .setPlaceholder("⚙️ Choose an element to edit or configure...")
      .addOptions(
        {
          label: "Edit Description / Message Body",
          value: "edit_desc",
          description: "Main message text (supports {user}, {server}, {memberCount}, etc.)",
          emoji: "📝",
        },
        {
          label: "Edit Title",
          value: "edit_title",
          description: "Greeting headline title",
          emoji: "🏷️",
        },
        {
          label: "Edit Accent Color",
          value: "edit_color",
          description: `Current: ${custom.color || "#5865F2"} (HEX format)`,
          emoji: "🎨",
        },
        {
          label: "Edit Author Info",
          value: "edit_author",
          description: "Author header text, icon URL & link",
          emoji: "👤",
        },
        {
          label: "Edit Main Banner Image",
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
          description: "Footer text note and small footer icon",
          emoji: "📌",
        },
        {
          label: `Toggle Timestamp (${custom.timestamp ? "ENABLED ✅" : "DISABLED ❌"})`,
          value: "toggle_time",
          description: "Toggle join date & time timestamp on/off",
          emoji: "🕒",
        },
        {
          label: `Set Welcome Channel (${config.channelId ? `#${channelName}` : "Not Set"})`,
          value: "set_channel",
          description: "Choose where welcome messages will be sent",
          emoji: "📢",
        },
        {
          label: "Reset to Empty Draft",
          value: "reset_draft",
          description: "Clear all fields back to blank",
          emoji: "🗑️",
        }
      );

    const rowDropdown = new ActionRowBuilder().addComponents(selectMenu);

    const btnSave = new ButtonBuilder()
      .setCustomId("wlcm_custom_save")
      .setEmoji("💾")
      .setLabel("Save & Enable")
      .setStyle(ButtonStyle.Success);

    const btnTest = new ButtonBuilder()
      .setCustomId("wlcm_custom_test")
      .setEmoji("🧪")
      .setLabel("Send Live Test")
      .setStyle(ButtonStyle.Primary);

    const btnSwitch = new ButtonBuilder()
      .setCustomId("wlcm_custom_switch_fmt")
      .setEmoji("🔄")
      .setLabel("Switch to Container")
      .setStyle(ButtonStyle.Secondary);

    const btnBack = new ButtonBuilder()
      .setCustomId("wlcm_hub_back")
      .setEmoji("⬅️")
      .setLabel("Main Menu")
      .setStyle(ButtonStyle.Secondary);

    const rowButtons = new ActionRowBuilder().addComponents(btnSave, btnTest, btnSwitch, btnBack);

    let contentNotice = `### 🛠️ Welcome Embed Studio (Live Preview)\n` +
      `-# *Format: **Classic Embed** • Channel: ${config.channelId ? `<#${config.channelId}>` : "`Not Set`"} • Status: \`${config.enabled ? "ACTIVE" : "INACTIVE"}\`*`;
    if (notice) {
      contentNotice = `${notice}\n\n${contentNotice}`;
    }

    return {
      content: contentNotice,
      embeds: [embed],
      components: [rowDropdown, rowButtons],
    };
  }

  // Modern Container (Components V2) Mode
  const container = new ContainerBuilder();

  let headerText = `### 🛠️ Welcome Container Studio (Live Preview)\n` +
    `-# *Format: **Modern Container (Components V2)** • Channel: ${config.channelId ? `<#${config.channelId}>` : "`Not Set`"} • Status: \`${config.enabled ? "ACTIVE" : "INACTIVE"}\`*`;
  if (notice) {
    headerText = `${notice}\n\n${headerText}`;
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // Media Gallery Banner if set
  if (custom.image && custom.image.trim()) {
    const imgUrl = welcomeManager.formatWelcomeText(custom.image, member, guild);
    if (imgUrl && imgUrl.startsWith("http")) {
      const mediaItem = new MediaGalleryItemBuilder().setURL(imgUrl);
      container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(mediaItem));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    }
  }

  // Title & Body
  let bodyText = "";
  if (custom.title && custom.title.trim()) {
    bodyText += `# ${welcomeManager.formatWelcomeText(custom.title, member, guild)}\n\n`;
  }
  if (custom.description && custom.description.trim()) {
    bodyText += welcomeManager.formatWelcomeText(custom.description, member, guild);
  } else {
    bodyText += "*✨ Empty welcome container text. Use the dropdown menu below to add text, title, or images.*";
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));

  // Footer Note if set
  if (custom.footerText && custom.footerText.trim()) {
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    const footText = `-# ${welcomeManager.formatWelcomeText(custom.footerText, member, guild)}`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footText));
  }

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // Controls Dropdown
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("wlcm_custom_dropdown")
    .setPlaceholder("⚙️ Choose an element to edit or configure...")
    .addOptions(
      {
        label: "Edit Description / Message Body",
        value: "edit_desc",
        description: "Main message text (supports {user}, {server}, {memberCount}, etc.)",
        emoji: "📝",
      },
      {
        label: "Edit Title",
        value: "edit_title",
        description: "Greeting headline title",
        emoji: "🏷️",
      },
      {
        label: "Edit Banner Image",
        value: "edit_image",
        description: "Banner image URL (or {guild.banner})",
        emoji: "🖼️",
      },
      {
        label: "Edit Footer Note",
        value: "edit_footer",
        description: "Footer text note",
        emoji: "📌",
      },
      {
        label: `Set Welcome Channel (${config.channelId ? `#${channelName}` : "Not Set"})`,
        value: "set_channel",
        description: "Choose where welcome messages will be sent",
        emoji: "📢",
      },
      {
        label: "Reset to Empty Draft",
        value: "reset_draft",
        description: "Clear all fields back to blank",
        emoji: "🗑️",
      }
    );

  const rowDropdown = new ActionRowBuilder().addComponents(selectMenu);

  const btnSave = new ButtonBuilder()
    .setCustomId("wlcm_custom_save")
    .setEmoji("💾")
    .setLabel("Save & Enable")
    .setStyle(ButtonStyle.Success);

  const btnTest = new ButtonBuilder()
    .setCustomId("wlcm_custom_test")
    .setEmoji("🧪")
    .setLabel("Send Live Test")
    .setStyle(ButtonStyle.Primary);

  const btnSwitch = new ButtonBuilder()
    .setCustomId("wlcm_custom_switch_fmt")
    .setEmoji("🔄")
    .setLabel("Switch to Embed")
    .setStyle(ButtonStyle.Secondary);

  const btnBack = new ButtonBuilder()
    .setCustomId("wlcm_hub_back")
    .setEmoji("⬅️")
    .setLabel("Main Menu")
    .setStyle(ButtonStyle.Secondary);

  const rowButtons = new ActionRowBuilder().addComponents(btnSave, btnTest, btnSwitch, btnBack);

  container.addActionRowComponents(rowDropdown);
  container.addActionRowComponents(rowButtons);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Builds the Premade Welcome Dashboard Payload
 */
function buildPremadeDashboardPayload(guild, member, notice = null) {
  const config = welcomeManager.getGuildWelcome(guild.id);
  const channelMention = config.channelId ? `<#${config.channelId}>` : "`Not Configured`";
  const roleMention = config.autoRoleId ? `<@&${config.autoRoleId}>` : "`None`";

  const astrixPath = path.join(__dirname, "../../assets/astrix.png");
  const bannerAttachment = new AttachmentBuilder(astrixPath, {
    name: "astrix.png",
  });

  const mediaItem = new MediaGalleryItemBuilder().setURL("attachment://astrix.png");
  const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

  let mainContent =
    `# 🎨 Astrix Premade Welcome Engine\n` +
    `-# *Active Cyber-Metallic Canvas Card & Live Member Stats for ${guild.name}.*\n\n` +
    `### 📌 Status & Channels\n` +
    `> - **Module State:** \`${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
    `> - **Target Channel:** ${channelMention}\n` +
    `> - **Canvas Card:** \`${config.canvasEnabled ? "ENABLED" : "DISABLED"}\`\n` +
    `> - **Active Theme:** \`${config.canvasTemplate || "emerald"}\`\n` +
    `> - **Auto-Assign Role:** ${roleMention}\n\n` +
    `### 💬 Channel Message Template\n` +
    `\`\`\`\n${config.messageText}\n\`\`\``;

  if (notice) {
    mainContent = `${notice}\n\n${mainContent}`;
  }

  const btnStudio = new ButtonBuilder()
    .setCustomId("wcc_btn_open_studio")
    .setEmoji("🎨")
    .setLabel("Canvas Studio")
    .setStyle(ButtonStyle.Primary);

  const btnChannel = new ButtonBuilder()
    .setCustomId("wlcm_premade_channel")
    .setEmoji("📢")
    .setLabel("Set Channel")
    .setStyle(ButtonStyle.Secondary);

  const btnToggle = new ButtonBuilder()
    .setCustomId("wlcm_premade_toggle")
    .setEmoji(config.enabled ? "⏸️" : "▶️")
    .setLabel(config.enabled ? "Disable" : "Enable")
    .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const btnTest = new ButtonBuilder()
    .setCustomId("wlcm_btn_test_premade")
    .setEmoji("🧪")
    .setLabel("Send Test")
    .setStyle(ButtonStyle.Secondary);

  const btnBack = new ButtonBuilder()
    .setCustomId("wlcm_hub_back")
    .setEmoji("⬅️")
    .setLabel("Main Menu")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(btnStudio, btnChannel, btnToggle, btnTest, btnBack);

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(mediaGallery)
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addActionRowComponents(row);

  return {
    components: [container],
    files: [bannerAttachment],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Builds the Channel Selector Screen
 */
function buildChannelSelectPayload(guild, origin = "custom") {
  const mainContent =
    `# 📢 Set Welcome Channel\n` +
    `-# *Select the text channel where new member welcome messages will be dispatched.*\n\n` +
    `Choose a channel from the selector below:`;

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId(`wlcm_channel_picked_${origin}`)
    .setPlaceholder("📍 Select a text channel...")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const rowSelect = new ActionRowBuilder().addComponents(channelSelect);

  const btnBack = new ButtonBuilder()
    .setCustomId(origin === "premade" ? "wlcm_hub_premade" : "wlcm_return_editor")
    .setEmoji("⬅️")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const rowButtons = new ActionRowBuilder().addComponents(btnBack);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addActionRowComponents(rowSelect)
    .addActionRowComponents(rowButtons);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Unified message renderer for live member join and live tests
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
    `> -# <:list:1539875411780042802> **Member Count:** \`#${member.guild.memberCount.toLocaleString()}\``;

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
 * Safely updates an interaction without failing on Discord V2 flag conflicts
 */
async function safeUpdate(interaction, payload) {
  const isV2 = Boolean(interaction.message?.flags?.has(MessageFlags.IsComponentsV2));
  const hasEmbeds = Array.isArray(payload.embeds) && payload.embeds.length > 0;
  const isV2Payload = Boolean(payload.flags && (payload.flags & MessageFlags.IsComponentsV2));

  // Incompatible transition: Components V2 message cannot be edited to have embeds
  if (isV2 && hasEmbeds) {
    await interaction.deferUpdate().catch(() => null);
    await interaction.message.delete().catch(() => null);
    return interaction.channel.send(payload).catch((err) =>
      console.error("[WelcomeBuilder] Failed to send embed editor:", err)
    );
  }

  // If currently Embed message and transitioning to Components V2
  if (!isV2 && isV2Payload) {
    try {
      return await interaction.update(payload);
    } catch (_) {
      await interaction.deferUpdate().catch(() => null);
      await interaction.message.delete().catch(() => null);
      return interaction.channel.send(payload).catch((err) =>
        console.error("[WelcomeBuilder] Failed to send container editor:", err)
      );
    }
  }

  return interaction.update(payload).catch(async (err) => {
    console.error("[WelcomeBuilder] Update error, fallback to delete & send:", err);
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(() => null);
      }
      await interaction.message.delete().catch(() => null);
      return interaction.channel.send(payload).catch(() => null);
    } catch (_) {}
  });
}

/**
 * Main Interaction Handler for all Welcome Builder actions, selects, and modals
 */
async function handleWelcomeBuilderInteraction(client, interaction) {
  const { customId } = interaction;
  if (!customId) return false;

  const guild = interaction.guild;
  const member = interaction.member;

  // 1. Hub Navigation
  if (customId === "wlcm_hub_premade") {
    welcomeManager.updateGuildWelcome(guild.id, { welcomeType: "premade" });
    const payload = buildPremadeDashboardPayload(guild, member, "✅ Switched to **Astrix Premade Canvas UI**.");
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId === "wlcm_hub_custom") {
    const payload = buildFormatChoicePayload(guild, member);
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

  if (customId === "wlcm_hub_status") {
    const config = welcomeManager.getGuildWelcome(guild.id);
    const channelMention = config.channelId ? `<#${config.channelId}>` : "`Not Configured`";
    const statusEmbed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("⚙️ Welcome System Status")
      .setDescription(
        `> - **Enabled:** \`${config.enabled ? "YES 🟢" : "NO 🔴"}\`\n` +
        `> - **Welcome Mode:** \`${config.welcomeType}\`\n` +
        `> - **Channel:** ${channelMention}\n` +
        `> - **Auto-Role:** ${config.autoRoleId ? `<@&${config.autoRoleId}>` : "`None`"}\n` +
        `> - **Join DM:** \`${config.joinDmEnabled ? "YES" : "NO"}\``
      );

    const btnBack = new ButtonBuilder()
      .setCustomId("wlcm_hub_back")
      .setEmoji("⬅️")
      .setLabel("Back to Setup")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(btnBack);

    await safeUpdate(interaction, { embeds: [statusEmbed], components: [row] });
    return true;
  }

  // 2. Format Selection: Embed vs Container
  if (customId === "wlcm_choose_embed") {
    welcomeManager.updateGuildWelcome(guild.id, { welcomeType: "custom_embed" });
    const payload = buildCustomEditorPayload(guild, member, "custom_embed", "✨ Welcome mode set to **Classic Embed**.");
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId === "wlcm_choose_container") {
    welcomeManager.updateGuildWelcome(guild.id, { welcomeType: "custom_container" });
    const payload = buildCustomEditorPayload(guild, member, "custom_container", "✨ Welcome mode set to **Modern Container (Components V2)**.");
    await safeUpdate(interaction, payload);
    return true;
  }

  // 3. Switch Format in Editor
  if (customId === "wlcm_custom_switch_fmt") {
    const config = welcomeManager.getGuildWelcome(guild.id);
    const newFmt = config.welcomeType === "custom_container" ? "custom_embed" : "custom_container";
    welcomeManager.updateGuildWelcome(guild.id, { welcomeType: newFmt });
    const payload = buildCustomEditorPayload(guild, member, newFmt, `🔄 Format switched to **${newFmt === "custom_embed" ? "Classic Embed" : "Modern Container (V2)"}**.`);
    await safeUpdate(interaction, payload);
    return true;
  }

  // 4. Custom Editor Dropdown Selection (Opens Modals or toggles)
  if (customId === "wlcm_custom_dropdown" && interaction.isStringSelectMenu()) {
    const selected = interaction.values[0];
    const config = welcomeManager.getGuildWelcome(guild.id);
    const custom = config.customData || {};

    if (selected === "edit_desc") {
      const modal = new ModalBuilder()
        .setCustomId("wlcm_modal_desc")
        .setTitle("Edit Message Description");

      const input = new TextInputBuilder()
        .setCustomId("input_desc")
        .setLabel("Welcome Text (Supports Variables)")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Welcome {user} to **{server}**! Member #{memberCount}!")
        .setValue(custom.description || "")
        .setMaxLength(3000)
        .setRequired(false);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_title") {
      const modal = new ModalBuilder()
        .setCustomId("wlcm_modal_title")
        .setTitle("Edit Greeting Title");

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
      const modal = new ModalBuilder()
        .setCustomId("wlcm_modal_color")
        .setTitle("Edit Accent HEX Color");

      const input = new TextInputBuilder()
        .setCustomId("input_color")
        .setLabel("HEX Color Code")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("#5865F2, #22C55E, #FF3131, etc.")
        .setValue(custom.color || "#5865F2")
        .setMaxLength(7)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_author") {
      const modal = new ModalBuilder()
        .setCustomId("wlcm_modal_author")
        .setTitle("Edit Author Header");

      const inputName = new TextInputBuilder()
        .setCustomId("input_author_name")
        .setLabel("Author Name")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("👋 New Member Joined!")
        .setValue(custom.authorName || "")
        .setRequired(false);

      const inputIcon = new TextInputBuilder()
        .setCustomId("input_author_icon")
        .setLabel("Author Icon URL (e.g. {user.avatar})")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("{user.avatar} or image URL")
        .setValue(custom.authorIcon || "")
        .setRequired(false);

      const inputUrl = new TextInputBuilder()
        .setCustomId("input_author_url")
        .setLabel("Author Click Link (Optional)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("https://discord.gg/...")
        .setValue(custom.authorUrl || "")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(inputName),
        new ActionRowBuilder().addComponents(inputIcon),
        new ActionRowBuilder().addComponents(inputUrl)
      );
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_image") {
      const modal = new ModalBuilder()
        .setCustomId("wlcm_modal_image")
        .setTitle("Edit Main Banner Image");

      const input = new TextInputBuilder()
        .setCustomId("input_image")
        .setLabel("Image URL (or {guild.banner})")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("https://... or {guild.banner}")
        .setValue(custom.image || "")
        .setRequired(false);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_thumb") {
      const modal = new ModalBuilder()
        .setCustomId("wlcm_modal_thumb")
        .setTitle("Edit Thumbnail Image");

      const input = new TextInputBuilder()
        .setCustomId("input_thumb")
        .setLabel("Thumbnail URL (or {user.avatar})")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("{user.avatar} or https://...")
        .setValue(custom.thumbnail || "")
        .setRequired(false);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "edit_footer") {
      const modal = new ModalBuilder()
        .setCustomId("wlcm_modal_footer")
        .setTitle("Edit Footer Note");

      const inputText = new TextInputBuilder()
        .setCustomId("input_footer_text")
        .setLabel("Footer Note Text")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Member #{memberCount} • Enjoy your stay!")
        .setValue(custom.footerText || "")
        .setRequired(false);

      const inputIcon = new TextInputBuilder()
        .setCustomId("input_footer_icon")
        .setLabel("Footer Icon URL (Optional)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("{guild.icon} or https://...")
        .setValue(custom.footerIcon || "")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(inputText),
        new ActionRowBuilder().addComponents(inputIcon)
      );
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selected === "toggle_time") {
      const newTime = !custom.timestamp;
      welcomeManager.updateGuildWelcome(guild.id, {
        customData: { timestamp: newTime },
      });
      const payload = buildCustomEditorPayload(
        guild,
        member,
        config.welcomeType,
        `🕒 Timestamp display is now **${newTime ? "ENABLED ✅" : "DISABLED ❌"}**.`
      );
      await safeUpdate(interaction, payload);
      return true;
    }

    if (selected === "set_channel") {
      const payload = buildChannelSelectPayload(guild, "custom");
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
      const payload = buildCustomEditorPayload(
        guild,
        member,
        config.welcomeType,
        "🗑️ Welcome draft reset to empty."
      );
      await safeUpdate(interaction, payload);
      return true;
    }
  }

  // 5. Channel Picker Interaction
  if (customId === "wlcm_premade_channel") {
    const payload = buildChannelSelectPayload(guild, "premade");
    await safeUpdate(interaction, payload);
    return true;
  }

  if (customId.startsWith("wlcm_channel_picked_") && interaction.isChannelSelectMenu()) {
    const origin = customId.replace("wlcm_channel_picked_", "");
    const pickedId = interaction.values[0];
    welcomeManager.updateGuildWelcome(guild.id, { channelId: pickedId, enabled: true });

    if (origin === "premade") {
      const payload = buildPremadeDashboardPayload(
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

  // 6. Premade Toggle Button
  if (customId === "wlcm_premade_toggle") {
    const config = welcomeManager.getGuildWelcome(guild.id);
    const newState = !config.enabled;
    welcomeManager.updateGuildWelcome(guild.id, { enabled: newState });
    const payload = buildPremadeDashboardPayload(
      guild,
      member,
      newState
        ? "✅ Astrix Premade Welcome greetings are now **ENABLED**!"
        : "⚠️ Astrix Premade Welcome greetings are now **DISABLED**."
    );
    await safeUpdate(interaction, payload);
    return true;
  }

  // 7. Save & Enable Button
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
      `🎉 **Saved & Enabled!** Custom welcome greetings are now active in <#${config.channelId}>.`
    );
    await safeUpdate(interaction, payload);
    return true;
  }

  // 8. Live Test Buttons
  if (customId === "wlcm_custom_test" || customId === "wlcm_btn_test_premade") {
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

  // 9. Modal Submissions
  if (interaction.isModalSubmit()) {
    const config = welcomeManager.getGuildWelcome(guild.id);

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
      welcomeManager.updateGuildWelcome(guild.id, {
        customData: { authorName: authName, authorIcon: authIcon, authorUrl: authUrl },
      });
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
      welcomeManager.updateGuildWelcome(guild.id, {
        customData: { footerText: footText, footerIcon: footIcon },
      });
      const payload = buildCustomEditorPayload(guild, member, config.welcomeType, "✅ Updated footer note.");
      await safeUpdate(interaction, payload);
      return true;
    }
  }

  // 10. Open Studio Button from Premade Dashboard
  if (customId === "wcc_btn_open_studio") {
    const { buildCardConfigPayload } = require("./handleWelcomeCanvasInteraction");
    const payload = await buildCardConfigPayload(member);
    await safeUpdate(interaction, payload);
    return true;
  }

  return false;
}

module.exports = {
  buildWelcomeHubPayload,
  buildFormatChoicePayload,
  buildCustomEditorPayload,
  buildPremadeDashboardPayload,
  renderWelcomeMessage,
  handleWelcomeBuilderInteraction,
};
