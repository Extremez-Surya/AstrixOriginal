const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
} = require("discord.js");
const ticketManager = require("../ticketManager");
const { generateTranscript } = require("../ticketTranscript");

/**
 * Builds the Ticket Panel Payload (Dispatched to #tickets channel for users to create tickets)
 */
function buildTicketPanelPayload(guild, config = {}) {
  const title = config.title || "🎟️ Support Ticket Desk";
  const description =
    config.description ||
    "Need assistance? Select a ticket category below or click **Create Ticket** to open a private support room with our staff.";

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("ticket_select_category")
    .setPlaceholder("📩 Select Ticket Support Category...")
    .addOptions(
      { label: "General Support", value: "general", description: "General questions and server support", emoji: "❓" },
      { label: "Billing & Purchases", value: "billing", description: "Payment, shop, and store inquiries", emoji: "💳" },
      { label: "Report Bug / User", value: "report", description: "Report member rule violations or bugs", emoji: "🚨" },
      { label: "Player Appeals", value: "appeals", description: "Punishment and ban appeal requests", emoji: "📜" },
      { label: "Partnerships & Media", value: "partnership", description: "Sponsorship and partnership inquiries", emoji: "🤝" }
    );

  const createBtn = new ButtonBuilder()
    .setCustomId("ticket_btn_open_modal")
    .setEmoji("🎟️")
    .setLabel("Create Ticket")
    .setStyle(ButtonStyle.Success);

  const mainContent =
    `# ${title}\n` +
    `-# *Official Support Ticket Desk for ${guild.name}.*\n\n` +
    `${description}`;

  const footerText = `-# ASTRIXCODE™ Ticket Engine • Click below to open a ticket`;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText))
    .addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu))
    .addActionRowComponents(new ActionRowBuilder().addComponents(createBtn));

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Builds the Control Panel posted inside an open Ticket Channel
 */
function buildTicketChannelControlPayload(ticketData, user, claimedByStaff = null) {
  const claimedText = claimedByStaff ? `<@${claimedByStaff}>` : "`Unclaimed`";

  const mainContent =
    `# 🎟️ Support Ticket #${ticketData.ticketId.toString().padStart(4, "0")}\n` +
    `-# *Private support channel created for ${user.username}.*\n\n` +
    `> - **Ticket Opener:** <@${user.id}>\n` +
    `> - **Reason / Category:** \`${ticketData.reason || "General Support"}\` \n` +
    `> - **Staff Handler:** ${claimedText}\n\n` +
    `Welcome <@${user.id}>! Please describe your inquiry in detail. Our support team will assist you shortly.`;

  const closeBtn = new ButtonBuilder()
    .setCustomId("ticket_btn_close")
    .setEmoji("🔒")
    .setLabel("Close Ticket")
    .setStyle(ButtonStyle.Danger);

  const claimBtn = new ButtonBuilder()
    .setCustomId("ticket_btn_claim")
    .setEmoji("👑")
    .setLabel(claimedByStaff ? "Unclaim" : "Claim Ticket")
    .setStyle(claimedByStaff ? ButtonStyle.Secondary : ButtonStyle.Primary);

  const transcriptBtn = new ButtonBuilder()
    .setCustomId("ticket_btn_transcript")
    .setEmoji("📜")
    .setLabel("Transcript")
    .setStyle(ButtonStyle.Secondary);

  const addBtn = new ButtonBuilder()
    .setCustomId("ticket_btn_add")
    .setEmoji("👤")
    .setLabel("Add Member")
    .setStyle(ButtonStyle.Secondary);

  const rowControls = new ActionRowBuilder().addComponents(closeBtn, claimBtn, transcriptBtn, addBtn);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents(rowControls);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Executes creation of a new ticket channel
 */
async function createTicketChannel(guild, member, categoryName = "General Support", reason = "General Inquiry") {
  const guildId = guild.id;

  // Check blacklist
  if (ticketManager.isBlacklisted(guildId, member.id, Array.from(member.roles.cache.keys()))) {
    return { error: "❌ You are blacklisted from opening support tickets in this server." };
  }

  const config = ticketManager.getGuildTicketConfig(guildId);
  const ticketIdNum = ticketManager.getNextTicketId(guildId);
  const formattedId = ticketIdNum.toString().padStart(4, "0");

  const cleanUsername = member.user.username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15) || "ticket";
  const channelName = `ticket-${formattedId}`;

  const parentCategoryId = config.parentCategoryId;

  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    {
      id: guild.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  if (config.supportRoleId) {
    permissionOverwrites.push({
      id: config.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    });
  }

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: parentCategoryId || null,
    permissionOverwrites,
    topic: `Ticket #${formattedId} | User: ${member.user.tag} (${member.id}) | Category: ${categoryName} | Reason: ${reason}`,
    reason: `Support Ticket created by ${member.user.tag}`,
  });

  const ticketData = ticketManager.createTicketRecord(guildId, {
    ticketId: formattedId,
    channelId: ticketChannel.id,
    userId: member.id,
    categoryId: parentCategoryId,
    reason: `${categoryName}: ${reason}`,
  });

  const controlPayload = buildTicketChannelControlPayload(ticketData, member.user);
  await ticketChannel.send(controlPayload);

  return { success: true, channel: ticketChannel, ticketData };
}

/**
 * Main Ticket Interactions Handler (Buttons, Select Menus, Modals)
 */
async function handleTicketInteraction(client, interaction) {
  if (!interaction.guild) return false;

  const customId = interaction.customId;
  if (!customId || (!customId.startsWith("ticket_") && !customId.startsWith("tkt_"))) return false;

  const guild = interaction.guild;
  const guildId = guild.id;
  const member = interaction.member;

  // 1. Select Category from Panel
  if (interaction.isStringSelectMenu() && customId === "ticket_select_category") {
    const selectedCategory = interaction.values[0];
    const categoryNames = {
      general: "General Support",
      billing: "Billing & Purchases",
      report: "Report Bug / User",
      appeals: "Player Appeals",
      partnership: "Partnership & Media",
    };
    const catName = categoryNames[selectedCategory] || "General Support";

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await createTicketChannel(guild, member, catName, "Category Select");

    if (result.error) {
      await interaction.editReply({ content: result.error });
      return true;
    }

    await interaction.editReply({
      content: `✅ Support ticket created! Head over to <#${result.channel.id}> to speak with staff.`,
    });
    return true;
  }

  // 2. Open Ticket Modal Button
  if (interaction.isButton() && customId === "ticket_btn_open_modal") {
    const modal = new ModalBuilder()
      .setCustomId("ticket_modal_create")
      .setTitle("Create Support Ticket");
    const input = new TextInputBuilder()
      .setCustomId("reason_input")
      .setLabel("Describe your reason / issue")
      .setPlaceholder("e.g. Need assistance with server roles or billing")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  // 3. Modal Submission for Ticket Creation
  if (interaction.isModalSubmit() && customId === "ticket_modal_create") {
    const reasonText = interaction.fields.getTextInputValue("reason_input").trim();
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const result = await createTicketChannel(guild, member, "General Support", reasonText);
    if (result.error) {
      await interaction.editReply({ content: result.error });
      return true;
    }

    await interaction.editReply({
      content: `✅ Support ticket created! Head over to <#${result.channel.id}> to speak with staff.`,
    });
    return true;
  }

  // 4. In-Ticket Controls (Close, Claim, Transcript, Add Member)
  const channel = interaction.channel;
  const ticketRecord = ticketManager.getTicketRecord(guildId, channel.id);

  if (interaction.isButton()) {
    // Close Ticket
    if (customId === "ticket_btn_close") {
      await interaction.reply({
        content: "🔒 **Closing ticket...** Generating HTML transcript and deleting channel in **5 seconds**.",
      });

      // Generate Transcript
      const transcriptAttachment = await generateTranscript(channel, ticketRecord, guild);

      // Post transcript in logs channel if set
      const config = ticketManager.getGuildTicketConfig(guildId);
      if (config.logsChannelId) {
        const logsChannel = guild.channels.cache.get(config.logsChannelId);
        if (logsChannel && logsChannel.isTextBased()) {
          await logsChannel.send({
            content: `📜 **Ticket #${ticketRecord?.ticketId || "0000"} Closed** by <@${interaction.user.id}>\n> - **Opener:** <@${ticketRecord?.userId || "N/A"}>`,
            files: [transcriptAttachment],
          }).catch(() => null);
        }
      }

      // Mark record closed
      ticketManager.closeTicketRecord(guildId, channel.id, interaction.user.id);

      setTimeout(async () => {
        await channel.delete("Ticket closed").catch(() => null);
      }, 5000);

      return true;
    }

    // Claim / Unclaim Ticket
    if (customId === "ticket_btn_claim") {
      const currentClaim = ticketRecord?.claimedBy;
      if (currentClaim === interaction.user.id) {
        // Unclaim
        ticketManager.unclaimTicketRecord(guildId, channel.id);
        const opener = await client.users.fetch(ticketRecord.userId).catch(() => ({ username: "user" }));
        const updatedPayload = buildTicketChannelControlPayload(ticketRecord, opener, null);
        await interaction.update(updatedPayload).catch(() => null);
        await interaction.followUp({ content: `🔄 Ticket unclaimed by <@${interaction.user.id}>.` }).catch(() => null);
        return true;
      }

      // Claim
      ticketManager.claimTicketRecord(guildId, channel.id, interaction.user.id);
      const opener = await client.users.fetch(ticketRecord.userId).catch(() => ({ username: "user" }));
      const updatedPayload = buildTicketChannelControlPayload(ticketRecord, opener, interaction.user.id);
      await interaction.update(updatedPayload).catch(() => null);
      await interaction.followUp({ content: `👑 Ticket claimed by <@${interaction.user.id}>!` }).catch(() => null);
      return true;
    }

    // Generate Transcript On Demand
    if (customId === "ticket_btn_transcript") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const transcript = await generateTranscript(channel, ticketRecord, guild);
      await interaction.editReply({
        content: `📜 **HTML Transcript for Ticket #${ticketRecord?.ticketId || "0000"}**:`,
        files: [transcript],
      });
      return true;
    }

    // Add Member Modal
    if (customId === "ticket_btn_add") {
      const modal = new ModalBuilder()
        .setCustomId("ticket_modal_add")
        .setTitle("Add Member to Ticket");
      const input = new TextInputBuilder()
        .setCustomId("add_input")
        .setLabel("Enter User ID or Mention")
        .setPlaceholder("User ID (e.g. 123456789)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return true;
    }
  }

  // Handle Add Member Modal Submit
  if (interaction.isModalSubmit() && customId === "ticket_modal_add") {
    const inputVal = interaction.fields.getTextInputValue("add_input").trim();
    const userId = inputVal.replace(/\D/g, "");
    if (userId) {
      await channel.permissionOverwrites.edit(userId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      }).catch(() => null);
      await interaction.reply({
        content: `👤 <@${userId}> added to the ticket.`,
      });
    }
    return true;
  }

  return false;
}

module.exports = {
  buildTicketPanelPayload,
  buildTicketChannelControlPayload,
  createTicketChannel,
  handleTicketInteraction,
};
