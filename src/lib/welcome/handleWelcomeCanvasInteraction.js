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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const welcomeManager = require("../welcomeManager");
const welcomeCanvas = require("../welcomeCanvas");

/**
 * Builds the interactive container, media gallery, select menus, and buttons for Welcome Card Config
 */
async function buildCardConfigPayload(member) {
  const guild = member.guild;
  const config = welcomeManager.getGuildWelcome(guild.id);

  // 1. Generate live card buffer with active settings
  const cardBuffer = await welcomeCanvas.generateWelcomeCard(member, config);
  const canvasAttachment = new AttachmentBuilder(cardBuffer, {
    name: "welcome-card.png",
  });

  const mediaItem = new MediaGalleryItemBuilder().setURL(
    "attachment://welcome-card.png"
  );
  const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

  // 2. Select Menu for Templates
  const currentTmplKey = config.canvasTemplate || "emerald";
  const templateOptions = Object.entries(welcomeCanvas.CANVAS_TEMPLATES).map(([key, tmpl]) => ({
    label: tmpl.name,
    value: key,
    description: `Accent: ${tmpl.accent} • Text: ${tmpl.text}`,
    default: key === currentTmplKey,
  }));

  const templateSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("wcc_select_template")
    .setPlaceholder("🎨 Select Canvas Theme/Template...")
    .addOptions(templateOptions);

  const rowTemplates = new ActionRowBuilder().addComponents(templateSelectMenu);

  // 3. Select Menu for Avatar Shapes
  const currentShape = config.avatarShape || "circle";
  const shapeSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("wcc_select_avatarshape")
    .setPlaceholder("👤 Select Avatar Frame Shape...")
    .addOptions(
      { label: "Circle Frame (Classic)", value: "circle", description: "Round circular avatar frame", default: currentShape === "circle" },
      { label: "Square Frame (Soft)", value: "square", description: "Square frame with smooth rounded corners", default: currentShape === "square" },
      { label: "Hexagon Frame (Futuristic)", value: "hexagon", description: "Sci-fi 6-sided hexagonal avatar frame", default: currentShape === "hexagon" },
      { label: "Rounded Pill (Modern)", value: "rounded", description: "Extra smooth pill rounded frame", default: currentShape === "rounded" }
    );

  const rowShapes = new ActionRowBuilder().addComponents(shapeSelectMenu);

  // 4. Action Row Buttons for Custom Inputs & Controls
  const textColorBtn = new ButtonBuilder()
    .setCustomId("wcc_btn_textcolor")
    .setEmoji("🎨")
    .setLabel("Text Color")
    .setStyle(ButtonStyle.Secondary);

  const accentColorBtn = new ButtonBuilder()
    .setCustomId("wcc_btn_accentcolor")
    .setEmoji("⚡")
    .setLabel("Accent Color")
    .setStyle(ButtonStyle.Secondary);

  const bgUrlBtn = new ButtonBuilder()
    .setCustomId("wcc_btn_bgurl")
    .setEmoji("🖼️")
    .setLabel("BG Image URL")
    .setStyle(ButtonStyle.Secondary);

  const watermarkBtn = new ButtonBuilder()
    .setCustomId("wcc_btn_watermark")
    .setEmoji("✏️")
    .setLabel("Watermark Text")
    .setStyle(ButtonStyle.Secondary);

  const rowCustomButtons = new ActionRowBuilder().addComponents(textColorBtn, accentColorBtn, bgUrlBtn, watermarkBtn);

  const saveBtn = new ButtonBuilder()
    .setCustomId("wcc_btn_save")
    .setEmoji("💾")
    .setLabel("Save Config")
    .setStyle(ButtonStyle.Success);

  const refreshBtn = new ButtonBuilder()
    .setCustomId("wcc_btn_refresh")
    .setEmoji("👁️")
    .setLabel("Refresh Preview")
    .setStyle(ButtonStyle.Primary);

  const resetBtn = new ButtonBuilder()
    .setCustomId("wcc_btn_reset")
    .setEmoji("🔄")
    .setLabel("Reset Settings")
    .setStyle(ButtonStyle.Danger);

  const rowControlButtons = new ActionRowBuilder().addComponents(saveBtn, refreshBtn, resetBtn);

  // 5. Container Content
  const footerText = `-# Powered by ASTRIXCODE™ Canvas Studio • © 2026 ASTRIXCODE`;

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(mediaGallery)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText))
    .addActionRowComponents(rowTemplates)
    .addActionRowComponents(rowShapes)
    .addActionRowComponents(rowCustomButtons)
    .addActionRowComponents(rowControlButtons);

  return {
    components: [container],
    files: [canvasAttachment],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Main Interaction Handler for Welcome Card Customization Controls
 */
async function handleWelcomeCanvasInteraction(client, interaction) {
  if (!interaction.guild) return false;

  const customId = interaction.customId;

  // -------------------------------------------------------------
  // 1. SELECT MENU: TEMPLATE SELECTION
  // -------------------------------------------------------------
  if (interaction.isStringSelectMenu() && customId === "wcc_select_template") {
    await interaction.deferUpdate().catch(() => null);
    const selectedTemplate = interaction.values[0];
    welcomeManager.updateGuildWelcome(interaction.guildId, { canvasTemplate: selectedTemplate });

    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 2. SELECT MENU: AVATAR SHAPE SELECTION
  // -------------------------------------------------------------
  if (interaction.isStringSelectMenu() && customId === "wcc_select_avatarshape") {
    await interaction.deferUpdate().catch(() => null);
    const selectedShape = interaction.values[0];
    welcomeManager.updateGuildWelcome(interaction.guildId, { avatarShape: selectedShape });

    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 3. BUTTON CLICK: SAVE CONFIGURATION
  // -------------------------------------------------------------
  if (interaction.isButton() && customId === "wcc_btn_save") {
    await interaction.deferUpdate().catch(() => null);
    const currentConfig = welcomeManager.getGuildWelcome(interaction.guildId);
    welcomeManager.updateGuildWelcome(interaction.guildId, currentConfig);

    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    await interaction.followUp({
      content: "✅ **Welcome Card Configuration Saved Successfully!** Live greetings & test commands will now render this design.",
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 4. BUTTON CLICK: TEXT COLOR MODAL
  // -------------------------------------------------------------
  if (interaction.isButton() && customId === "wcc_btn_textcolor") {
    const modal = new ModalBuilder()
      .setCustomId("wcc_modal_textcolor")
      .setTitle("Set Custom Text Color");

    const input = new TextInputBuilder()
      .setCustomId("hex_input")
      .setLabel("Hex Text Color (e.g. #ffffff or reset)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("#ffffff")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 5. BUTTON CLICK: ACCENT COLOR MODAL
  // -------------------------------------------------------------
  if (interaction.isButton() && customId === "wcc_btn_accentcolor") {
    const modal = new ModalBuilder()
      .setCustomId("wcc_modal_accentcolor")
      .setTitle("Set Custom Accent Color");

    const input = new TextInputBuilder()
      .setCustomId("hex_input")
      .setLabel("Hex Accent Color (e.g. #22c55e or reset)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("#22c55e")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 6. BUTTON CLICK: BG IMAGE URL MODAL
  // -------------------------------------------------------------
  if (interaction.isButton() && customId === "wcc_btn_bgurl") {
    const modal = new ModalBuilder()
      .setCustomId("wcc_modal_bgurl")
      .setTitle("Set Background Image URL");

    const input = new TextInputBuilder()
      .setCustomId("url_input")
      .setLabel("Image URL (http://...) or reset")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("https://i.imgur.com/example.png")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 7. BUTTON CLICK: WATERMARK TEXT MODAL
  // -------------------------------------------------------------
  if (interaction.isButton() && customId === "wcc_btn_watermark") {
    const modal = new ModalBuilder()
      .setCustomId("wcc_modal_watermark")
      .setTitle("Set Watermark Text");

    const input = new TextInputBuilder()
      .setCustomId("watermark_input")
      .setLabel("Custom Overlay Watermark (or reset)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("MINECRAFT SERVER")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 8. BUTTON CLICK: REFRESH PREVIEW
  // -------------------------------------------------------------
  if (interaction.isButton() && customId === "wcc_btn_refresh") {
    await interaction.deferUpdate().catch(() => null);
    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 9. BUTTON CLICK: RESET CANVAS SETTINGS
  // -------------------------------------------------------------
  if (interaction.isButton() && customId === "wcc_btn_reset") {
    await interaction.deferUpdate().catch(() => null);
    welcomeManager.updateGuildWelcome(interaction.guildId, {
      canvasTemplate: "emerald",
      textColor: null,
      accentColor: null,
      avatarShape: "circle",
      canvasBgUrl: null,
      customWatermark: null,
    });

    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 10. MODAL SUBMIT: TEXT COLOR
  // -------------------------------------------------------------
  if (interaction.isModalSubmit() && customId === "wcc_modal_textcolor") {
    await interaction.deferUpdate().catch(() => null);
    const val = interaction.fields.getTextInputValue("hex_input").trim();
    const newColor = (val.toLowerCase() === "reset" || val.toLowerCase() === "default") ? null : (val.startsWith("#") ? val : `#${val}`);

    welcomeManager.updateGuildWelcome(interaction.guildId, { textColor: newColor });
    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 11. MODAL SUBMIT: ACCENT COLOR
  // -------------------------------------------------------------
  if (interaction.isModalSubmit() && customId === "wcc_modal_accentcolor") {
    await interaction.deferUpdate().catch(() => null);
    const val = interaction.fields.getTextInputValue("hex_input").trim();
    const newColor = (val.toLowerCase() === "reset" || val.toLowerCase() === "default") ? null : (val.startsWith("#") ? val : `#${val}`);

    welcomeManager.updateGuildWelcome(interaction.guildId, { accentColor: newColor });
    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 12. MODAL SUBMIT: BG IMAGE URL
  // -------------------------------------------------------------
  if (interaction.isModalSubmit() && customId === "wcc_modal_bgurl") {
    await interaction.deferUpdate().catch(() => null);
    let val = interaction.fields.getTextInputValue("url_input").trim();
    if (val.startsWith("<") && val.endsWith(">")) val = val.slice(1, -1).trim();

    let newUrl = (val.toLowerCase() === "reset" || val.toLowerCase() === "none" || val.toLowerCase() === "clear") ? null : val;
    if (newUrl && !newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
      newUrl = "https://" + newUrl;
    }

    welcomeManager.updateGuildWelcome(interaction.guildId, { canvasBgUrl: newUrl });
    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  // -------------------------------------------------------------
  // 13. MODAL SUBMIT: WATERMARK TEXT
  // -------------------------------------------------------------
  if (interaction.isModalSubmit() && customId === "wcc_modal_watermark") {
    await interaction.deferUpdate().catch(() => null);
    const val = interaction.fields.getTextInputValue("watermark_input").trim();
    const newWm = (val.toLowerCase() === "reset" || val.toLowerCase() === "none") ? null : val;

    welcomeManager.updateGuildWelcome(interaction.guildId, { customWatermark: newWm });
    const payload = await buildCardConfigPayload(interaction.member);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildCardConfigPayload,
  handleWelcomeCanvasInteraction,
};
