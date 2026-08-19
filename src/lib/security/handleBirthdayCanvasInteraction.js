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
} = require("discord.js");
const birthdayManager = require("../birthdayManager");
const birthdayCanvas = require("../birthdayCanvas");

/**
 * Builds the interactive payload (live canvas image attachment + select menus + buttons) for Birthday Card Config Studio
 */
async function buildBdayCardConfigPayload(member) {
  const guild = member.guild;
  const config = birthdayManager.getGuildBirthday(guild.id);

  // 1. Generate live card buffer with active settings
  const cardBuffer = await birthdayCanvas.generateBirthdayCanvas(member.user, guild, config);
  const canvasAttachment = new AttachmentBuilder(cardBuffer, {
    name: "birthday-card.png",
  });

  // 2. Select Menu for Canvas Templates
  const currentTmplKey = config.canvasTemplate || "celebration";
  const templateOptions = Object.entries(birthdayCanvas.BIRTHDAY_TEMPLATES).map(([key, tmpl]) => ({
    label: tmpl.name,
    value: key,
    description: `Accent: ${tmpl.accent} • Text: ${tmpl.text}`,
    default: key === currentTmplKey,
  }));

  const templateSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("bcc_select_template")
    .setPlaceholder("🎨 Select Birthday Canvas Theme/Template...")
    .addOptions(templateOptions);

  const rowTemplates = new ActionRowBuilder().addComponents(templateSelectMenu);

  // 3. Select Menu for Avatar Frame Shapes
  const currentShape = config.avatarShape || "circle";
  const shapeSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("bcc_select_avatarshape")
    .setPlaceholder("👤 Select Avatar Frame Shape...")
    .addOptions(
      { label: "Circle Frame (Classic)", value: "circle", description: "Round circular avatar frame", default: currentShape === "circle" },
      { label: "Square Frame (Soft)", value: "square", description: "Square frame with smooth rounded corners", default: currentShape === "square" },
      { label: "Hexagon Frame (Futuristic)", value: "hexagon", description: "Sci-fi 6-sided hexagonal avatar frame", default: currentShape === "hexagon" },
      { label: "Rounded Pill (Modern)", value: "rounded", description: "Extra smooth pill rounded frame", default: currentShape === "rounded" }
    );

  const rowShapes = new ActionRowBuilder().addComponents(shapeSelectMenu);

  // 4. Action Buttons
  const textColorBtn = new ButtonBuilder()
    .setCustomId("bcc_btn_textcolor")
    .setEmoji("🎨")
    .setLabel("Text Color")
    .setStyle(ButtonStyle.Secondary);

  const accentColorBtn = new ButtonBuilder()
    .setCustomId("bcc_btn_accentcolor")
    .setEmoji("⚡")
    .setLabel("Accent Color")
    .setStyle(ButtonStyle.Secondary);

  const bgUrlBtn = new ButtonBuilder()
    .setCustomId("bcc_btn_bgurl")
    .setEmoji("🖼️")
    .setLabel("BG Image URL")
    .setStyle(ButtonStyle.Secondary);

  const watermarkBtn = new ButtonBuilder()
    .setCustomId("bcc_btn_watermark")
    .setEmoji("✏️")
    .setLabel("Watermark Text")
    .setStyle(ButtonStyle.Secondary);

  const customWishBtn = new ButtonBuilder()
    .setCustomId("bcc_btn_customwish")
    .setEmoji("🎁")
    .setLabel("Wish Quote")
    .setStyle(ButtonStyle.Secondary);

  const rowCustomButtons = new ActionRowBuilder().addComponents(textColorBtn, accentColorBtn, bgUrlBtn, watermarkBtn, customWishBtn);

  const testBtn = new ButtonBuilder()
    .setCustomId("bcc_btn_test")
    .setEmoji("🧪")
    .setLabel("Test Wish Send")
    .setStyle(ButtonStyle.Primary);

  const resetBtn = new ButtonBuilder()
    .setCustomId("bcc_btn_reset")
    .setEmoji("🔄")
    .setLabel("Reset Canvas Config")
    .setStyle(ButtonStyle.Danger);

  const rowControlButtons = new ActionRowBuilder().addComponents(testBtn, resetBtn);

  return {
    content: "🎨 **ASTRIX BIRTHDAY CANVAS CARD STUDIO**\n-# Customize your server's birthday announcement canvas card below. Changes render live in real-time!",
    files: [canvasAttachment],
    components: [rowTemplates, rowShapes, rowCustomButtons, rowControlButtons],
  };
}

/**
 * Main interaction handler for Birthday Card Studio
 */
async function handleBirthdayCanvasInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isModal = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isModal) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("bcc_")) return false;

  if (!interaction.guild) return false;

  const guildId = interaction.guild.id;
  const config = birthdayManager.getGuildBirthday(guildId);

  // 1. Template Select Menu
  if (isMenu && customId === "bcc_select_template") {
    config.canvasTemplate = interaction.values[0];
    birthdayManager.setGuildBirthday(guildId, config);

    const payload = await buildBdayCardConfigPayload(interaction.member);
    await interaction.update(payload).catch(() => null);
    return true;
  }

  // 2. Avatar Shape Select Menu
  if (isMenu && customId === "bcc_select_avatarshape") {
    config.avatarShape = interaction.values[0];
    birthdayManager.setGuildBirthday(guildId, config);

    const payload = await buildBdayCardConfigPayload(interaction.member);
    await interaction.update(payload).catch(() => null);
    return true;
  }

  // 3. Modals Trigger Buttons
  if (isBtn && customId === "bcc_btn_textcolor") {
    const modal = new ModalBuilder()
      .setCustomId("bcc_modal_textcolor")
      .setTitle("Set Canvas Text Color")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_textcolor")
            .setLabel("HEX Color Code (e.g. #fde047 or #ffffff)")
            .setStyle(TextInputStyle.Short)
            .setValue(config.canvasTextColor || "")
            .setRequired(true)
        )
      );
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "bcc_btn_accentcolor") {
    const modal = new ModalBuilder()
      .setCustomId("bcc_modal_accentcolor")
      .setTitle("Set Canvas Accent & Glow Color")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_accentcolor")
            .setLabel("HEX Color Code (e.g. #f59e0b or #00f0ff)")
            .setStyle(TextInputStyle.Short)
            .setValue(config.canvasAccentColor || "")
            .setRequired(true)
        )
      );
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "bcc_btn_bgurl") {
    const modal = new ModalBuilder()
      .setCustomId("bcc_modal_bgurl")
      .setTitle("Set Custom Background Image URL")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_bgurl")
            .setLabel("Direct Image URL (PNG/JPG) or 'none'")
            .setStyle(TextInputStyle.Short)
            .setValue(config.canvasBgUrl || "")
            .setRequired(true)
        )
      );
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "bcc_btn_watermark") {
    const modal = new ModalBuilder()
      .setCustomId("bcc_modal_watermark")
      .setTitle("Set Custom Card Watermark")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_watermark")
            .setLabel("Watermark Text (e.g. ASTRIX CELEBRATIONS)")
            .setStyle(TextInputStyle.Short)
            .setValue(config.canvasWatermark || "")
            .setRequired(true)
        )
      );
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  if (isBtn && customId === "bcc_btn_customwish") {
    const modal = new ModalBuilder()
      .setCustomId("bcc_modal_customwish")
      .setTitle("Set Default Birthday Wish Quote")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("input_customwish")
            .setLabel("Wish Quote Text")
            .setStyle(TextInputStyle.Paragraph)
            .setValue(config.customWish || config.wishMessage?.description || "")
            .setRequired(true)
        )
      );
    await interaction.showModal(modal).catch(() => null);
    return true;
  }

  // 4. Reset & Test Buttons
  if (isBtn && customId === "bcc_btn_reset") {
    config.canvasTemplate = "celebration";
    config.avatarShape = "circle";
    delete config.canvasTextColor;
    delete config.canvasAccentColor;
    delete config.canvasBgUrl;
    delete config.canvasWatermark;
    delete config.customWish;
    birthdayManager.setGuildBirthday(guildId, config);

    const payload = await buildBdayCardConfigPayload(interaction.member);
    await interaction.update(payload).catch(() => null);
    return true;
  }

  if (isBtn && customId === "bcc_btn_test") {
    const cardBuffer = await birthdayCanvas.generateBirthdayCanvas(interaction.user, interaction.guild, config);
    const canvasAttachment = new AttachmentBuilder(cardBuffer, {
      name: "birthday.png",
    });

    await interaction.reply({
      content: `🎉 Happy Birthday <@${interaction.user.id}>! 🎂❤️`,
      files: [canvasAttachment],
    }).catch(() => null);
    return true;
  }

  // 5. Modal Submits
  if (isModal) {
    if (customId === "bcc_modal_textcolor") {
      const val = interaction.fields.getTextInputValue("input_textcolor").trim();
      config.canvasTextColor = val === "none" ? null : val;
    } else if (customId === "bcc_modal_accentcolor") {
      const val = interaction.fields.getTextInputValue("input_accentcolor").trim();
      config.canvasAccentColor = val === "none" ? null : val;
    } else if (customId === "bcc_modal_bgurl") {
      const val = interaction.fields.getTextInputValue("input_bgurl").trim();
      config.canvasBgUrl = val === "none" ? null : val;
    } else if (customId === "bcc_modal_watermark") {
      const val = interaction.fields.getTextInputValue("input_watermark").trim();
      config.canvasWatermark = val === "none" ? null : val;
    } else if (customId === "bcc_modal_customwish") {
      const val = interaction.fields.getTextInputValue("input_customwish").trim();
      config.customWish = val === "none" ? null : val;
    }

    birthdayManager.setGuildBirthday(guildId, config);
    const payload = await buildBdayCardConfigPayload(interaction.member);

    // Update original message
    await interaction.deferUpdate().catch(() => null);
    await interaction.editReply(payload).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  buildBdayCardConfigPayload,
  handleBirthdayCanvasInteraction,
};
