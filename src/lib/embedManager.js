const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require("discord.js");
const noprefixManager = require("./noprefixManager");

const DATA_FILE = path.join(__dirname, "embedData.json");

const embedCache = new Map();
let isInitialized = false;

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.guilds) {
        for (const [guildId, data] of Object.entries(parsed.guilds)) {
          embedCache.set(guildId, {
            embeds: data.embeds || {},
            customColor: data.customColor || "#5865F2",
          });
        }
      }
    }
  } catch (e) {
    console.error("[EmbedManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDisk() {
  try {
    const obj = { guilds: {} };
    for (const [guildId, data] of embedCache.entries()) {
      if (data) obj.guilds[guildId] = data;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch (e) {
    console.error("[EmbedManager] Save error:", e);
  }
}

function getGuildData(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return { embeds: {}, customColor: "#5865F2" };

  const data = embedCache.get(guildId);
  if (!data) {
    const fresh = { embeds: {}, customColor: "#5865F2" };
    embedCache.set(guildId, fresh);
    return fresh;
  }
  return data;
}

function getGuildEmbeds(guildId) {
  const data = getGuildData(guildId);
  return data.embeds || {};
}

function getEmbed(guildId, name) {
  const embeds = getGuildEmbeds(guildId);
  return embeds[name.toLowerCase()] || null;
}

function saveEmbed(guildId, name, embedData) {
  const data = getGuildData(guildId);
  const cleanName = name.toLowerCase().trim();
  data.embeds[cleanName] = {
    name: cleanName,
    title: embedData.title || null,
    description: embedData.description || null,
    color: embedData.color || data.customColor || "#5865F2",
    authorName: embedData.authorName || null,
    authorIcon: embedData.authorIcon || null,
    authorUrl: embedData.authorUrl || null,
    footerText: embedData.footerText || null,
    footerIcon: embedData.footerIcon || null,
    thumbnail: embedData.thumbnail || null,
    image: embedData.image || null,
    timestamp: Boolean(embedData.timestamp),
    updatedAt: Date.now(),
  };
  saveDisk();
  return data.embeds[cleanName];
}

function deleteEmbed(guildId, name) {
  const data = getGuildData(guildId);
  const cleanName = name.toLowerCase().trim();
  if (data.embeds[cleanName]) {
    delete data.embeds[cleanName];
    saveDisk();
    return true;
  }
  return false;
}

function resetGuildEmbeds(guildId) {
  const data = getGuildData(guildId);
  data.embeds = {};
  saveDisk();
  return true;
}

function getGuildCustomColor(guildId) {
  const data = getGuildData(guildId);
  return data.customColor || "#5865F2";
}

function setGuildCustomColor(guildId, hexColor) {
  const data = getGuildData(guildId);
  data.customColor = hexColor.startsWith("#") ? hexColor : `#${hexColor}`;
  saveDisk();
  return data.customColor;
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIABLE PARSER
// ─────────────────────────────────────────────────────────────────────────────
function parseVariables(text, member = null, guild = null) {
  if (!text || typeof text !== "string") return "";

  let result = text;
  if (guild) {
    result = result
      .replace(/{server_name}/gi, guild.name)
      .replace(/{server_id}/gi, guild.id)
      .replace(/{member_count}/gi, `${guild.memberCount}`)
      .replace(/{guild_name}/gi, guild.name)
      .replace(/{server}/gi, guild.name);
  }

  if (member) {
    const user = member.user || member;
    result = result
      .replace(/{user}/gi, `<@${user.id}>`)
      .replace(/{user_name}/gi, user.username)
      .replace(/{user_tag}/gi, user.tag || user.username)
      .replace(/{user_id}/gi, user.id)
      .replace(/{user_avatar}/gi, user.displayAvatarURL?.({ dynamic: true }) || "");
  }

  const now = new Date();
  result = result
    .replace(/{date}/gi, now.toLocaleDateString())
    .replace(/{time}/gi, now.toLocaleTimeString());

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER TO DISCORD EMBED BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function renderEmbed(embedData, member = null, guild = null) {
  const embed = new EmbedBuilder();

  if (embedData.title) {
    embed.setTitle(parseVariables(embedData.title, member, guild).slice(0, 256));
  }

  if (embedData.description) {
    embed.setDescription(parseVariables(embedData.description, member, guild).slice(0, 4096));
  }

  let color = embedData.color;
  if (!color || color === "default") {
    color = guild ? getGuildCustomColor(guild.id) : "#5865F2";
  }
  if (!color.startsWith("#")) color = `#${color}`;
  try {
    embed.setColor(color);
  } catch {
    embed.setColor("#5865F2");
  }

  if (embedData.authorName) {
    embed.setAuthor({
      name: parseVariables(embedData.authorName, member, guild).slice(0, 256),
      iconURL: embedData.authorIcon ? parseVariables(embedData.authorIcon, member, guild) : undefined,
      url: embedData.authorUrl || undefined,
    });
  }

  if (embedData.footerText) {
    embed.setFooter({
      text: parseVariables(embedData.footerText, member, guild).slice(0, 2048),
      iconURL: embedData.footerIcon ? parseVariables(embedData.footerIcon, member, guild) : undefined,
    });
  }

  if (embedData.thumbnail && embedData.thumbnail.startsWith("http")) {
    embed.setThumbnail(parseVariables(embedData.thumbnail, member, guild));
  }

  if (embedData.image && embedData.image.startsWith("http")) {
    embed.setImage(parseVariables(embedData.image, member, guild));
  }

  if (embedData.timestamp) {
    embed.setTimestamp();
  }

  return embed;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD INTERACTIVE STUDIO VIEW (DROPDOWN + MINIMAL UI)
// ─────────────────────────────────────────────────────────────────────────────
function buildEmbedStudioMessage(guildId, embedName, member = null, guild = null) {
  const embedData = getEmbed(guildId, embedName) || {
    name: embedName,
    title: `Embed: ${embedName}`,
    description: "Use the action dropdown menu below to customize this embed!",
    color: getGuildCustomColor(guildId),
    timestamp: false,
  };

  const previewEmbed = renderEmbed(embedData, member, guild);

  // Action Select Dropdown Menu
  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId(`embed_action_select_${embedName}`)
    .setPlaceholder(`⚡ Customize & Dispatch "${embedName}"...`)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Edit Basic Info (Title, Desc, Color)")
        .setValue("edit_basic")
        .setDescription("Customize title, description body, and hex color")
        .setEmoji("📝"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Edit Author Header")
        .setValue("edit_author")
        .setDescription("Set author name, icon URL, and clickable link")
        .setEmoji("👤"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Edit Footer Details")
        .setValue("edit_footer")
        .setDescription("Set footer text and footer icon URL")
        .setEmoji("📄"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Edit Media & Images")
        .setValue("edit_images")
        .setDescription("Set top-right thumbnail and large banner image")
        .setEmoji("🖼️"),
      new StringSelectMenuOptionBuilder()
        .setLabel(`Toggle Timestamp (${embedData.timestamp ? "ON" : "OFF"})`)
        .setValue("toggle_timestamp")
        .setDescription(embedData.timestamp ? "Disable timestamp footer" : "Enable timestamp footer")
        .setEmoji("⏱️"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Dispatch to Channel")
        .setValue("send_channel")
        .setDescription("Send this embed to a text or announcement channel")
        .setEmoji("🚀"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Delete This Embed")
        .setValue("delete_embed")
        .setDescription("Permanently delete this saved embed")
        .setEmoji("🗑️")
    );

  const menuRow = new ActionRowBuilder().addComponents(actionMenu);

  // Clean 2-button row
  const sendBtn = new ButtonBuilder()
    .setCustomId(`embed_btn_send_${embedName}`)
    .setLabel("Send to Channel")
    .setEmoji("🚀")
    .setStyle(ButtonStyle.Primary);

  const refreshBtn = new ButtonBuilder()
    .setCustomId(`embed_btn_refresh_${embedName}`)
    .setLabel("Refresh Studio")
    .setEmoji("🔄")
    .setStyle(ButtonStyle.Secondary);

  const btnRow = new ActionRowBuilder().addComponents(sendBtn, refreshBtn);

  return {
    embeds: [previewEmbed],
    components: [menuRow, btnRow],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD EMBED LIST VIEW (MINIMAL COMPONENTS V2)
// ─────────────────────────────────────────────────────────────────────────────
function buildEmbedListView(guild) {
  const embedsObj = getGuildEmbeds(guild.id);
  const embedList = Object.keys(embedsObj);

  const container = new ContainerBuilder();
  const header =
    `### 🎨 **Embed Studio • Repository**\n` +
    `-# All saved and configured custom announcement embeds for **${guild.name}**`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  let body = "";
  if (embedList.length > 0) {
    const listStr = embedList.map((name) => {
      const emb = embedsObj[name];
      const titleStr = emb.title ? ` — *"${emb.title.slice(0, 40)}"*` : "";
      return `> • 🏷️ **\`${name}\`**${titleStr} \`[${emb.color || "Default"}]\``;
    });
    body = `> **Total Saved Embeds:** \`${embedList.length}\`\n\n` +
      `**Saved Embeds:**\n${listStr.join("\n")}\n\n` +
      `-# Select an embed from the dropdown below to launch the visual studio.`;
  } else {
    body = `> **Total Saved Embeds:** \`0\`\n\n` +
      `*No custom embeds saved in this server yet.*\n` +
      `-# Run \`.embed create <name>\` or \`/embed create <name>\` to build your first embed!`;
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  if (embedList.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("embed_select_from_list")
      .setPlaceholder("🎨 Select an embed to launch Interactive Studio...")
      .addOptions(
        embedList.slice(0, 25).map((name) => {
          const emb = embedsObj[name];
          return new StringSelectMenuOptionBuilder()
            .setLabel(`Embed: ${name}`)
            .setValue(`studio_${name}`)
            .setDescription(emb.title ? emb.title.slice(0, 50) : `Color: ${emb.color || "Default"}`)
            .setEmoji("🎨");
        })
      );
    container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Embed Studio Engine`));

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION ROUTER FOR EMBEDS
// ─────────────────────────────────────────────────────────────────────────────
async function handleEmbedInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isChanMenu = interaction.isChannelSelectMenu();
  const isModal = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isChanMenu && !isModal) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("embed_")) return false;

  if (!interaction.guild) return false;

  const isAdminOrManager =
    interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
    interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

  if (!isAdminOrManager) {
    await interaction.reply({
      content: "❌ You need **Manage Messages** or **Manage Server** permission to use Embed Studio.",
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  const guildId = interaction.guild.id;

  // 1. Dropdown select from list
  if (isMenu && customId === "embed_select_from_list") {
    const selected = interaction.values[0];
    if (selected.startsWith("studio_")) {
      const embedName = selected.replace("studio_", "");
      const studioMsg = buildEmbedStudioMessage(guildId, embedName, interaction.member, interaction.guild);
      await interaction.reply({
        ...studioMsg,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }
  }

  // 2. Action Select Menu in Studio (embed_action_select_<name>)
  if (isMenu && customId.startsWith("embed_action_select_")) {
    const embedName = customId.replace("embed_action_select_", "");
    const action = interaction.values[0];
    const embedData = getEmbed(guildId, embedName) || { name: embedName };

    // 2.1 Edit Basic Info
    if (action === "edit_basic") {
      const modal = new ModalBuilder()
        .setCustomId(`embed_modal_basic_${embedName}`)
        .setTitle(`Basic Info: ${embedName}`);

      const titleInput = new TextInputBuilder()
        .setCustomId("embed_input_title")
        .setLabel("Title")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. Server Welcome • {server_name}")
        .setValue(embedData.title || "")
        .setRequired(false)
        .setMaxLength(256);

      const descInput = new TextInputBuilder()
        .setCustomId("embed_input_desc")
        .setLabel("Description")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Welcome {user} to our community!\n\nCheck out the rules...")
        .setValue(embedData.description || "")
        .setRequired(false)
        .setMaxLength(4000);

      const colorInput = new TextInputBuilder()
        .setCustomId("embed_input_color")
        .setLabel("Hex Color")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("#5865F2 or #FF007F")
        .setValue(embedData.color || getGuildCustomColor(guildId))
        .setRequired(false)
        .setMaxLength(10);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(colorInput)
      );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    // 2.2 Edit Author
    if (action === "edit_author") {
      const modal = new ModalBuilder()
        .setCustomId(`embed_modal_author_${embedName}`)
        .setTitle(`Author Header: ${embedName}`);

      const nameInput = new TextInputBuilder()
        .setCustomId("embed_input_author_name")
        .setLabel("Author Name")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. From {server_name} Staff")
        .setValue(embedData.authorName || "")
        .setRequired(false)
        .setMaxLength(256);

      const iconInput = new TextInputBuilder()
        .setCustomId("embed_input_author_icon")
        .setLabel("Author Icon URL")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("https://example.com/icon.png or {user_avatar}")
        .setValue(embedData.authorIcon || "")
        .setRequired(false);

      const urlInput = new TextInputBuilder()
        .setCustomId("embed_input_author_url")
        .setLabel("Author Clickable Link URL")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("https://discord.gg/yourserver")
        .setValue(embedData.authorUrl || "")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(iconInput),
        new ActionRowBuilder().addComponents(urlInput)
      );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    // 2.3 Edit Footer
    if (action === "edit_footer") {
      const modal = new ModalBuilder()
        .setCustomId(`embed_modal_footer_${embedName}`)
        .setTitle(`Footer: ${embedName}`);

      const textInput = new TextInputBuilder()
        .setCustomId("embed_input_footer_text")
        .setLabel("Footer Text")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. We now have {member_count} Members!")
        .setValue(embedData.footerText || "")
        .setRequired(false)
        .setMaxLength(2048);

      const iconInput = new TextInputBuilder()
        .setCustomId("embed_input_footer_icon")
        .setLabel("Footer Icon URL")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("https://example.com/footer_icon.png")
        .setValue(embedData.footerIcon || "")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(textInput),
        new ActionRowBuilder().addComponents(iconInput)
      );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    // 2.4 Edit Images
    if (action === "edit_images") {
      const modal = new ModalBuilder()
        .setCustomId(`embed_modal_images_${embedName}`)
        .setTitle(`Media & Images: ${embedName}`);

      const thumbInput = new TextInputBuilder()
        .setCustomId("embed_input_thumb")
        .setLabel("Thumbnail URL (Top Right)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("https://example.com/thumbnail.png")
        .setValue(embedData.thumbnail || "")
        .setRequired(false);

      const imageInput = new TextInputBuilder()
        .setCustomId("embed_input_image")
        .setLabel("Large Banner Image URL (Bottom)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("https://example.com/banner.png")
        .setValue(embedData.image || "")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(thumbInput),
        new ActionRowBuilder().addComponents(imageInput)
      );

      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    // 2.5 Toggle Timestamp
    if (action === "toggle_timestamp") {
      embedData.timestamp = !embedData.timestamp;
      saveEmbed(guildId, embedName, embedData);

      const studioMsg = buildEmbedStudioMessage(guildId, embedName, interaction.member, interaction.guild);
      await interaction.update(studioMsg).catch(() => null);
      return true;
    }

    // 2.6 Send to Channel
    if (action === "send_channel") {
      const chanSelect = new ChannelSelectMenuBuilder()
        .setCustomId(`embed_select_channel_${embedName}`)
        .setPlaceholder("🚀 Select channel to dispatch this embed...")
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

      const row = new ActionRowBuilder().addComponents(chanSelect);

      await interaction.reply({
        content: `Select destination channel for embed **\`${embedName}\`**:`,
        components: [row],
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    // 2.7 Delete Embed
    if (action === "delete_embed") {
      deleteEmbed(guildId, embedName);

      await interaction.update({
        content: `🗑️ Embed **\`${embedName}\`** has been permanently deleted.`,
        embeds: [],
        components: [],
      }).catch(() => null);
      return true;
    }
  }

  // 3. Refresh Studio Button
  if (isBtn && customId.startsWith("embed_btn_refresh_")) {
    const embedName = customId.replace("embed_btn_refresh_", "");
    const studioMsg = buildEmbedStudioMessage(guildId, embedName, interaction.member, interaction.guild);
    await interaction.update(studioMsg).catch(() => null);
    return true;
  }

  // 4. Send to Channel button
  if (isBtn && customId.startsWith("embed_btn_send_")) {
    const embedName = customId.replace("embed_btn_send_", "");

    const chanSelect = new ChannelSelectMenuBuilder()
      .setCustomId(`embed_select_channel_${embedName}`)
      .setPlaceholder("🚀 Select channel to dispatch this embed...")
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

    const row = new ActionRowBuilder().addComponents(chanSelect);

    await interaction.reply({
      content: `Select destination channel for embed **\`${embedName}\`**:`,
      components: [row],
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 5. Channel Selection for dispatch
  if (isChanMenu && customId.startsWith("embed_select_channel_")) {
    const embedName = customId.replace("embed_select_channel_", "");
    const targetChanId = interaction.values[0];
    const targetChannel = interaction.guild.channels.cache.get(targetChanId);

    if (!targetChannel) {
      await interaction.reply({ content: "❌ Target channel not found.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    const embedData = getEmbed(guildId, embedName);
    if (!embedData) {
      await interaction.reply({ content: "❌ Embed not found.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    const rendered = renderEmbed(embedData, interaction.member, interaction.guild);
    const sent = await targetChannel.send({ embeds: [rendered] }).catch(() => null);

    if (sent) {
      await interaction.update({
        content: `✅ Embed **\`${embedName}\`** successfully dispatched to <#${targetChannel.id}>!`,
        components: [],
      }).catch(() => null);
    } else {
      await interaction.update({
        content: `❌ Failed to send embed to <#${targetChannel.id}>. Please check bot permissions.`,
        components: [],
      }).catch(() => null);
    }
    return true;
  }

  // 6. Handle Modal Submissions
  if (isModal) {
    if (customId.startsWith("embed_modal_basic_")) {
      const embedName = customId.replace("embed_modal_basic_", "");
      const title = interaction.fields.getTextInputValue("embed_input_title");
      const description = interaction.fields.getTextInputValue("embed_input_desc");
      let color = interaction.fields.getTextInputValue("embed_input_color")?.trim();

      if (color && !color.startsWith("#") && !color.startsWith("0x")) color = `#${color}`;

      const existing = getEmbed(guildId, embedName) || { name: embedName };
      existing.title = title || null;
      existing.description = description || null;
      if (color) existing.color = color;

      saveEmbed(guildId, embedName, existing);

      const studioMsg = buildEmbedStudioMessage(guildId, embedName, interaction.member, interaction.guild);
      await interaction.update(studioMsg).catch(() => null);
      return true;
    }

    if (customId.startsWith("embed_modal_author_")) {
      const embedName = customId.replace("embed_modal_author_", "");
      const authorName = interaction.fields.getTextInputValue("embed_input_author_name");
      const authorIcon = interaction.fields.getTextInputValue("embed_input_author_icon");
      const authorUrl = interaction.fields.getTextInputValue("embed_input_author_url");

      const existing = getEmbed(guildId, embedName) || { name: embedName };
      existing.authorName = authorName || null;
      existing.authorIcon = authorIcon || null;
      existing.authorUrl = authorUrl || null;

      saveEmbed(guildId, embedName, existing);

      const studioMsg = buildEmbedStudioMessage(guildId, embedName, interaction.member, interaction.guild);
      await interaction.update(studioMsg).catch(() => null);
      return true;
    }

    if (customId.startsWith("embed_modal_footer_")) {
      const embedName = customId.replace("embed_modal_footer_", "");
      const footerText = interaction.fields.getTextInputValue("embed_input_footer_text");
      const footerIcon = interaction.fields.getTextInputValue("embed_input_footer_icon");

      const existing = getEmbed(guildId, embedName) || { name: embedName };
      existing.footerText = footerText || null;
      existing.footerIcon = footerIcon || null;

      saveEmbed(guildId, embedName, existing);

      const studioMsg = buildEmbedStudioMessage(guildId, embedName, interaction.member, interaction.guild);
      await interaction.update(studioMsg).catch(() => null);
      return true;
    }

    if (customId.startsWith("embed_modal_images_")) {
      const embedName = customId.replace("embed_modal_images_", "");
      const thumb = interaction.fields.getTextInputValue("embed_input_thumb");
      const image = interaction.fields.getTextInputValue("embed_input_image");

      const existing = getEmbed(guildId, embedName) || { name: embedName };
      existing.thumbnail = thumb || null;
      existing.image = image || null;

      saveEmbed(guildId, embedName, existing);

      const studioMsg = buildEmbedStudioMessage(guildId, embedName, interaction.member, interaction.guild);
      await interaction.update(studioMsg).catch(() => null);
      return true;
    }
  }

  return false;
}

initCache();

module.exports = {
  getGuildEmbeds,
  getEmbed,
  saveEmbed,
  deleteEmbed,
  resetGuildEmbeds,
  getGuildCustomColor,
  setGuildCustomColor,
  parseVariables,
  renderEmbed,
  buildEmbedStudioMessage,
  buildEmbedListView,
  handleEmbedInteraction,
};
