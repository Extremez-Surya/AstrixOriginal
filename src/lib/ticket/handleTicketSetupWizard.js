const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const ticketManager = require("../ticketManager");
const { buildTicketPanelPayload } = require("./handleTicketInteraction");

// In-memory wizard sessions: "guildId_userId" -> { panelChannelId, categoryChannelId, supportRoleId, logsChannelId }
const wizardSessions = new Map();

function getSessionKey(guildId, userId) {
  return `${guildId}_${userId}`;
}

/**
 * Step 1: Select Panel Channel
 */
function buildStep1Payload() {
  const embed = new EmbedBuilder()
    .setTitle("Step 1: Select Panel Channel")
    .setDescription("Where should the ticket panel be sent?")
    .setColor("#5865F2");

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId("tkt_setup_step1_channel")
    .setPlaceholder("Select panel channel...")
    .setChannelTypes(ChannelType.GuildText);

  const row = new ActionRowBuilder().addComponents(channelSelect);

  return {
    embeds: [embed],
    components: [row],
  };
}

/**
 * Step 2: Select Ticket Category
 */
function buildStep2Payload() {
  const embed = new EmbedBuilder()
    .setTitle("Step 2: Select Ticket Category")
    .setDescription("Where should new tickets be created?")
    .setColor("#5865F2");

  const categorySelect = new ChannelSelectMenuBuilder()
    .setCustomId("tkt_setup_step2_category")
    .setPlaceholder("Select ticket category...")
    .setChannelTypes(ChannelType.GuildCategory);

  const skipBtn = new ButtonBuilder()
    .setCustomId("tkt_setup_step2_skip")
    .setLabel("Skip Category")
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder().addComponents(categorySelect);
  const row2 = new ActionRowBuilder().addComponents(skipBtn);

  return {
    embeds: [embed],
    components: [row1, row2],
  };
}

/**
 * Step 3: Select Support Role
 */
function buildStep3Payload() {
  const embed = new EmbedBuilder()
    .setTitle("Step 3: Select Support Role")
    .setDescription("Which role should have access to tickets?")
    .setColor("#5865F2");

  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId("tkt_setup_step3_role")
    .setPlaceholder("Select support role...");

  const skipBtn = new ButtonBuilder()
    .setCustomId("tkt_setup_step3_skip")
    .setLabel("Skip Support Role")
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder().addComponents(roleSelect);
  const row2 = new ActionRowBuilder().addComponents(skipBtn);

  return {
    embeds: [embed],
    components: [row1, row2],
  };
}

/**
 * Step 4: Select Logging Channel
 */
function buildStep4Payload() {
  const embed = new EmbedBuilder()
    .setTitle("Step 4: Select Logging Channel")
    .setDescription("Where should ticket logs be sent?")
    .setColor("#5865F2");

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId("tkt_setup_step4_logs")
    .setPlaceholder("Select logging channel (Optional)")
    .setChannelTypes(ChannelType.GuildText);

  const skipBtn = new ButtonBuilder()
    .setCustomId("tkt_setup_step4_skip")
    .setLabel("Skip Logging")
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder().addComponents(channelSelect);
  const row2 = new ActionRowBuilder().addComponents(skipBtn);

  return {
    embeds: [embed],
    components: [row1, row2],
  };
}

/**
 * Popup Modal: Customize Panel (Matching Screenshots 3 & 4)
 */
function showCustomizePanelModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("tkt_setup_modal_customize")
    .setTitle("Customize Panel");

  const titleInput = new TextInputBuilder()
    .setCustomId("panel_title")
    .setLabel("Panel Title (emojis supported)")
    .setPlaceholder("Tickets")
    .setValue("Tickets")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const descInput = new TextInputBuilder()
    .setCustomId("panel_desc")
    .setLabel("Panel Description (emojis supported)")
    .setPlaceholder("Click the button below to open a ticket.")
    .setValue("Click the button below to open a ticket.")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const labelInput = new TextInputBuilder()
    .setCustomId("button_label")
    .setLabel("Button Label")
    .setPlaceholder("Create Ticket")
    .setValue("Create Ticket")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const emojiInput = new TextInputBuilder()
    .setCustomId("button_emoji")
    .setLabel("Button Emoji (Unicode or <:name:id>)")
    .setPlaceholder("🎟️")
    .setValue("🎟️")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const colorInput = new TextInputBuilder()
    .setCustomId("panel_color")
    .setLabel("Panel Color (Hex)")
    .setPlaceholder("#5865F2")
    .setValue("#5865F2")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(labelInput),
    new ActionRowBuilder().addComponents(emojiInput),
    new ActionRowBuilder().addComponents(colorInput)
  );

  return interaction.showModal(modal);
}

/**
 * Main Ticket Wizard Interaction Handler
 */
async function handleTicketSetupWizard(client, interaction) {
  if (!interaction.guild) return false;

  const customId = interaction.customId;
  if (!customId || !customId.startsWith("tkt_setup_")) return false;

  const sessionKey = getSessionKey(interaction.guild.id, interaction.user.id);
  let session = wizardSessions.get(sessionKey) || {
    panelChannelId: null,
    categoryChannelId: null,
    supportRoleId: null,
    logsChannelId: null,
  };

  // 1. Start Setup Button clicked from initial message
  if (interaction.isButton() && customId === "tkt_setup_start") {
    wizardSessions.set(sessionKey, session);
    await interaction.reply({
      ...buildStep1Payload(),
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  // 2. Step 1: Panel Channel Select
  if (interaction.isChannelSelectMenu() && customId === "tkt_setup_step1_channel") {
    session.panelChannelId = interaction.values[0];
    wizardSessions.set(sessionKey, session);
    await interaction.update(buildStep2Payload());
    return true;
  }

  // 3. Step 2: Category Select / Skip
  if (customId === "tkt_setup_step2_category" || customId === "tkt_setup_step2_skip") {
    if (interaction.isChannelSelectMenu()) {
      session.categoryChannelId = interaction.values[0];
    }
    wizardSessions.set(sessionKey, session);
    await interaction.update(buildStep3Payload());
    return true;
  }

  // 4. Step 3: Support Role Select / Skip
  if (customId === "tkt_setup_step3_role" || customId === "tkt_setup_step3_skip") {
    if (interaction.isRoleSelectMenu()) {
      session.supportRoleId = interaction.values[0];
    }
    wizardSessions.set(sessionKey, session);
    await interaction.update(buildStep4Payload());
    return true;
  }

  // 5. Step 4: Logging Channel Select / Skip -> Shows Modal
  if (customId === "tkt_setup_step4_logs" || customId === "tkt_setup_step4_skip") {
    if (interaction.isChannelSelectMenu()) {
      session.logsChannelId = interaction.values[0];
    }
    wizardSessions.set(sessionKey, session);
    await showCustomizePanelModal(interaction);
    return true;
  }

  // 6. Customize Panel Modal Submit
  if (interaction.isModalSubmit() && customId === "tkt_setup_modal_customize") {
    const title = interaction.fields.getTextInputValue("panel_title").trim() || "Tickets";
    const desc = interaction.fields.getTextInputValue("panel_desc").trim() || "Click the button below to open a ticket.";
    const btnLabel = interaction.fields.getTextInputValue("button_label").trim() || "Create Ticket";
    const btnEmoji = interaction.fields.getTextInputValue("button_emoji").trim() || "🎟️";
    const hexColor = interaction.fields.getTextInputValue("panel_color").trim() || "#5865F2";

    // Save settings in ticketManager
    ticketManager.updateGuildTicketConfig(interaction.guild.id, {
      parentCategoryId: session.categoryChannelId,
      supportRoleId: session.supportRoleId,
      logsChannelId: session.logsChannelId,
    });

    const targetChannel = interaction.guild.channels.cache.get(session.panelChannelId) || interaction.channel;

    // Send Ticket Panel into target channel
    const panelPayload = buildTicketPanelPayload(interaction.guild, {
      title,
      description: desc,
      buttonLabel: btnLabel,
      buttonEmoji: btnEmoji,
      color: hexColor,
    });

    await targetChannel.send(panelPayload).catch((err) => console.error("[tkt_setup] Panel send error:", err));

    // Clear session
    wizardSessions.delete(sessionKey);

    // Ephemeral response confirming completion
    await interaction.reply({
      content: `✅ **Ticket System Setup Complete!**\n> Panel has been created and sent to <#${targetChannel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  return false;
}

module.exports = {
  buildStep1Payload,
  handleTicketSetupWizard,
};
