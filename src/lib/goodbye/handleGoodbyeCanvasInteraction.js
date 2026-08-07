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
const goodbyeManager = require("../goodbyeManager");
const welcomeCanvas = require("../welcomeCanvas");

/**
 * Builds the interactive container, media gallery, select menus, and buttons for Goodbye Card Config Studio
 */
async function buildGoodbyeCardConfigPayload(member) {
  const guild = member.guild;
  const config = goodbyeManager.getGuildGoodbye(guild.id);
  const firstCh = config.channels && config.channels[0] ? config.channels[0] : {};

  // 1. Generate live card buffer with active settings
  const cardBuffer = await welcomeCanvas.generateGoodbyeCard(member, firstCh);
  const canvasAttachment = new AttachmentBuilder(cardBuffer, {
    name: "goodbye-card.png",
  });

  const mediaItem = new MediaGalleryItemBuilder().setURL(
    "attachment://goodbye-card.png"
  );
  const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

  // 2. Select Menu for Templates
  const currentTmplKey = firstCh.canvasTemplate || "crimson";
  const templateOptions = Object.entries(welcomeCanvas.CANVAS_TEMPLATES).map(([key, tmpl]) => ({
    label: tmpl.name,
    value: key,
    description: `Accent: ${tmpl.accent} • Text: ${tmpl.text}`,
    default: key === currentTmplKey,
  }));

  const templateSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("gcc_select_template")
    .setPlaceholder("🎨 Select Goodbye Canvas Theme/Template...")
    .addOptions(templateOptions);

  const rowTemplates = new ActionRowBuilder().addComponents(templateSelectMenu);

  // 3. Select Menu for Avatar Shapes
  const currentShape = firstCh.avatarShape || "circle";
  const shapeSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("gcc_select_avatarshape")
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
    .setCustomId("gcc_btn_textcolor")
    .setEmoji("🎨")
    .setLabel("Text Color")
    .setStyle(ButtonStyle.Secondary);

  const accentColorBtn = new ButtonBuilder()
    .setCustomId("gcc_btn_accentcolor")
    .setEmoji("⚡")
    .setLabel("Accent Color")
    .setStyle(ButtonStyle.Secondary);

  const bgUrlBtn = new ButtonBuilder()
    .setCustomId("gcc_btn_bgurl")
    .setEmoji("🖼️")
    .setLabel("BG Image URL")
    .setStyle(ButtonStyle.Secondary);

  const watermarkBtn = new ButtonBuilder()
    .setCustomId("gcc_btn_watermark")
    .setEmoji("✏️")
    .setLabel("Watermark Text")
    .setStyle(ButtonStyle.Secondary);

  const rowCustomButtons = new ActionRowBuilder().addComponents(textColorBtn, accentColorBtn, bgUrlBtn, watermarkBtn);

  const saveBtn = new ButtonBuilder()
    .setCustomId("gcc_btn_save")
    .setEmoji("💾")
    .setLabel("Save Config")
    .setStyle(ButtonStyle.Success);

  const toggleBtn = new ButtonBuilder()
    .setCustomId("gcc_btn_toggle")
    .setEmoji(firstCh.canvasEnabled !== false ? "🔴" : "🟢")
    .setLabel(firstCh.canvasEnabled !== false ? "Disable Card" : "Enable Card")
    .setStyle(firstCh.canvasEnabled !== false ? ButtonStyle.Danger : ButtonStyle.Primary);

  const resetBtn = new ButtonBuilder()
    .setCustomId("gcc_btn_reset")
    .setEmoji("🔄")
    .setLabel("Reset Studio")
    .setStyle(ButtonStyle.Secondary);

  const rowActionButtons = new ActionRowBuilder().addComponents(saveBtn, toggleBtn, resetBtn);

  // 5. Minimal Container Footer
  const footerText = `-# Powered by ASTRIXCODE™ Goodbye Canvas Studio • © 2026 ASTRIXCODE`;

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(mediaGallery)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText))
    .addActionRowComponents(rowTemplates)
    .addActionRowComponents(rowShapes)
    .addActionRowComponents(rowCustomButtons)
    .addActionRowComponents(rowActionButtons);

  return {
    components: [container],
    files: [canvasAttachment],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Handles Goodbye Canvas Studio Interactions (Select Menus, Buttons, Modals)
 */
async function handleGoodbyeCanvasInteraction(client, interaction) {
  if (!interaction.guild) return false;

  const customId = interaction.customId;
  if (!customId || !customId.startsWith("gcc_")) return false;

  const guildId = interaction.guild.id;
  const config = goodbyeManager.getGuildGoodbye(guildId);
  const channels = config.channels || [];

  const updateAllChannels = (updates) => {
    if (channels.length === 0) {
      goodbyeManager.addGoodbyeChannel(guildId, { channelId: interaction.channelId, ...updates });
    } else {
      for (const ch of channels) {
        Object.assign(ch, updates);
      }
      goodbyeManager.updateGuildGoodbye(guildId, { channels });
    }
  };

  // 1. Template Select Menu
  if (interaction.isStringSelectMenu() && customId === "gcc_select_template") {
    const selectedTemplate = interaction.values[0];
    updateAllChannels({ canvasTemplate: selectedTemplate });

    const payload = await buildGoodbyeCardConfigPayload(interaction.member);
    await interaction.update(payload).catch(() => null);
    return true;
  }

  // 2. Avatar Shape Select Menu
  if (interaction.isStringSelectMenu() && customId === "gcc_select_avatarshape") {
    const selectedShape = interaction.values[0];
    updateAllChannels({ avatarShape: selectedShape });

    const payload = await buildGoodbyeCardConfigPayload(interaction.member);
    await interaction.update(payload).catch(() => null);
    return true;
  }

  // 3. Button Interactions
  if (interaction.isButton()) {
    if (customId === "gcc_btn_textcolor") {
      const modal = new ModalBuilder()
        .setCustomId("gcc_modal_textcolor")
        .setTitle("Customize Goodbye Text Color");
      const input = new TextInputBuilder()
        .setCustomId("text_color_input")
        .setLabel("Enter Hex Color Code (e.g. #ffffff)")
        .setPlaceholder("#ffffff")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return true;
    }

    if (customId === "gcc_btn_accentcolor") {
      const modal = new ModalBuilder()
        .setCustomId("gcc_modal_accentcolor")
        .setTitle("Customize Goodbye Accent Color");
      const input = new TextInputBuilder()
        .setCustomId("accent_color_input")
        .setLabel("Enter Hex Color Code (e.g. #e11d48)")
        .setPlaceholder("#e11d48")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return true;
    }

    if (customId === "gcc_btn_bgurl") {
      const modal = new ModalBuilder()
        .setCustomId("gcc_modal_bgurl")
        .setTitle("Customize Goodbye Background Image");
      const input = new TextInputBuilder()
        .setCustomId("bg_url_input")
        .setLabel("Enter Image URL (or type 'reset')")
        .setPlaceholder("https://example.com/banner.png")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return true;
    }

    if (customId === "gcc_btn_watermark") {
      const modal = new ModalBuilder()
        .setCustomId("gcc_modal_watermark")
        .setTitle("Customize Overlay Watermark Text");
      const input = new TextInputBuilder()
        .setCustomId("watermark_input")
        .setLabel("Enter Watermark Text (or type 'reset')")
        .setPlaceholder("MY SERVER COMMUNITY")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return true;
    }

    if (customId === "gcc_btn_toggle") {
      const currentVal = channels[0]?.canvasEnabled !== false;
      updateAllChannels({ canvasEnabled: !currentVal });
      const payload = await buildGoodbyeCardConfigPayload(interaction.member);
      await interaction.update(payload).catch(() => null);
      return true;
    }

    if (customId === "gcc_btn_save") {
      await interaction.reply({
        content: "✅ Goodbye Canvas Card configuration saved successfully!",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (customId === "gcc_btn_reset") {
      updateAllChannels({
        canvasTemplate: "crimson",
        textColor: null,
        accentColor: null,
        avatarShape: "circle",
        canvasBgUrl: null,
        customWatermark: null,
        canvasEnabled: true,
      });
      const payload = await buildGoodbyeCardConfigPayload(interaction.member);
      await interaction.update(payload).catch(() => null);
      return true;
    }
  }

  // 4. Modal Submissions
  if (interaction.isModalSubmit()) {
    if (customId === "gcc_modal_textcolor") {
      const hex = interaction.fields.getTextInputValue("text_color_input").trim();
      updateAllChannels({ textColor: hex.startsWith("#") ? hex : `#${hex}` });
      await interaction.deferUpdate();
      const payload = await buildGoodbyeCardConfigPayload(interaction.member);
      await interaction.editReply(payload).catch(() => null);
      return true;
    }

    if (customId === "gcc_modal_accentcolor") {
      const hex = interaction.fields.getTextInputValue("accent_color_input").trim();
      updateAllChannels({ accentColor: hex.startsWith("#") ? hex : `#${hex}` });
      await interaction.deferUpdate();
      const payload = await buildGoodbyeCardConfigPayload(interaction.member);
      await interaction.editReply(payload).catch(() => null);
      return true;
    }

    if (customId === "gcc_modal_bgurl") {
      const val = interaction.fields.getTextInputValue("bg_url_input").trim();
      if (val.toLowerCase() === "reset" || val.toLowerCase() === "none") {
        updateAllChannels({ canvasBgUrl: null });
      } else if (val.startsWith("http://") || val.startsWith("https://")) {
        updateAllChannels({ canvasBgUrl: val, canvasEnabled: true });
      }
      await interaction.deferUpdate();
      const payload = await buildGoodbyeCardConfigPayload(interaction.member);
      await interaction.editReply(payload).catch(() => null);
      return true;
    }

    if (customId === "gcc_modal_watermark") {
      const val = interaction.fields.getTextInputValue("watermark_input").trim();
      if (val.toLowerCase() === "reset" || val.toLowerCase() === "none") {
        updateAllChannels({ customWatermark: null });
      } else {
        updateAllChannels({ customWatermark: val.toUpperCase() });
      }
      await interaction.deferUpdate();
      const payload = await buildGoodbyeCardConfigPayload(interaction.member);
      await interaction.editReply(payload).catch(() => null);
      return true;
    }
  }

  return false;
}

module.exports = {
  buildGoodbyeCardConfigPayload,
  handleGoodbyeCanvasInteraction,
};
