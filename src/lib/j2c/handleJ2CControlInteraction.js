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
  PermissionFlagsBits,
  StringSelectMenuBuilder,
} = require("discord.js");
const j2cManager = require("../j2cManager");

/**
 * Builds the exact Astrix Interface (Static Interface & Dynamic In-VC Panel)
 */
function buildAstrixInterfacePayload(title = "Astrix Interface") {
  const mainContent =
    `# 🎙️ ${title}\n` +
    `-# *Manage your dynamic Join-To-Create voice channel in real-time.*\n\n` +
    `You can use this interface to manage your voice channel.\n` +
    `You can also use \`.vc\` commands!\n\n` +
    `-# Use the buttons below to manage your voice channel`;

  // Row 1: Privacy Controls
  const lockBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_lock")
    .setEmoji("🔒")
    .setLabel("Lock")
    .setStyle(ButtonStyle.Secondary);

  const unlockBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_unlock")
    .setEmoji("🔓")
    .setLabel("Unlock")
    .setStyle(ButtonStyle.Secondary);

  const hideBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_hide")
    .setEmoji("🙈")
    .setLabel("Hide")
    .setStyle(ButtonStyle.Secondary);

  const unhideBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_unhide")
    .setEmoji("👀")
    .setLabel("Unhide")
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder().addComponents(lockBtn, unlockBtn, hideBtn, unhideBtn);

  // Row 2: Access & Capacity
  const limitBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_limit")
    .setEmoji("👥")
    .setLabel("Limit")
    .setStyle(ButtonStyle.Secondary);

  const inviteBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_invite")
    .setEmoji("📩")
    .setLabel("Invite")
    .setStyle(ButtonStyle.Secondary);

  const rejectBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_reject")
    .setEmoji("🚫")
    .setLabel("Ban")
    .setStyle(ButtonStyle.Secondary);

  const permitBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_permit")
    .setEmoji("✅")
    .setLabel("Permit")
    .setStyle(ButtonStyle.Secondary);

  const row2 = new ActionRowBuilder().addComponents(limitBtn, inviteBtn, rejectBtn, permitBtn);

  // Row 3: Room Customization
  const renameBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_rename")
    .setEmoji("📝")
    .setLabel("Rename")
    .setStyle(ButtonStyle.Secondary);

  const bitrateBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_bitrate")
    .setEmoji("🎧")
    .setLabel("Bitrate")
    .setStyle(ButtonStyle.Secondary);

  const regionBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_region")
    .setEmoji("🌐")
    .setLabel("Region")
    .setStyle(ButtonStyle.Secondary);

  const templateBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_template")
    .setEmoji("📋")
    .setLabel("Template")
    .setStyle(ButtonStyle.Secondary);

  const row3 = new ActionRowBuilder().addComponents(renameBtn, bitrateBtn, regionBtn, templateBtn);

  // Row 4: Utility & Ownership
  const chatBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_chat")
    .setEmoji("💬")
    .setLabel("Chat")
    .setStyle(ButtonStyle.Secondary);

  const waitingBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_waiting")
    .setEmoji("⏳")
    .setLabel("Waiting")
    .setStyle(ButtonStyle.Secondary);

  const claimBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_claim")
    .setEmoji("👑")
    .setLabel("Claim")
    .setStyle(ButtonStyle.Secondary);

  const transferBtn = new ButtonBuilder()
    .setCustomId("j2c_btn_transfer")
    .setEmoji("🚀")
    .setLabel("Transfer")
    .setStyle(ButtonStyle.Secondary);

  const row4 = new ActionRowBuilder().addComponents(chatBtn, waitingBtn, claimBtn, transferBtn);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents(row1)
    .addActionRowComponents(row2)
    .addActionRowComponents(row3)
    .addActionRowComponents(row4);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Handles Astrix J2C Interface Button & Modal Interactions
 */
async function handleJ2CControlInteraction(client, interaction) {
  if (!interaction.guild) return false;

  const customId = interaction.customId;
  if (!customId || (!customId.startsWith("j2c_btn_") && !customId.startsWith("j2c_modal_") && !customId.startsWith("j2c_select_"))) return false;

  const parts = customId.split(":");
  const action = parts[0];
  const guild = interaction.guild;
  const guildId = guild.id;

  // 1. Locate user's voice channel
  const userVC = interaction.member.voice?.channel;

  // For claim button, check if user is in VC
  if (action === "j2c_btn_claim") {
    if (!userVC || !j2cManager.isTempChannel(guildId, userVC.id)) {
      await interaction.reply({
        content: "❌ You must be connected to a temporary Join-To-Create voice channel to claim ownership.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const currentOwnerId = j2cManager.getTempChannelOwner(guildId, userVC.id);
    if (currentOwnerId === interaction.user.id) {
      await interaction.reply({
        content: "ℹ️ You are already the owner of this voice channel.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    const isOwnerInVC = userVC.members.has(currentOwnerId);
    if (isOwnerInVC) {
      await interaction.reply({
        content: `❌ The current room owner (<@${currentOwnerId}>) is still connected to the voice channel!`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    j2cManager.setTempChannelOwner(guildId, userVC.id, interaction.user.id);
    await interaction.reply({
      content: `👑 <@${interaction.user.id}> has claimed ownership of **${userVC.name}**!`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // General VC Check for all other room controls
  if (!userVC || !j2cManager.isTempChannel(guildId, userVC.id)) {
    await interaction.reply({
      content: "❌ You must be connected to your Join-To-Create temp voice channel to use the Astrix Interface!",
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  const ownerId = j2cManager.getTempChannelOwner(guildId, userVC.id);
  const isOwner = interaction.user.id === ownerId;
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  const checkOwnerRights = async () => {
    if (!isOwner && !isAdmin) {
      await interaction.reply({
        content: `❌ Only the room owner (<@${ownerId || "None"}>) or an Administrator can modify this voice channel.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return false;
    }
    return true;
  };

  // 2. Lock Room
  if (action === "j2c_btn_lock") {
    if (!(await checkOwnerRights())) return true;
    await userVC.permissionOverwrites.edit(guild.id, { Connect: false }).catch(() => null);
    await interaction.reply({
      content: `🔒 **${userVC.name}** has been locked! Non-permitted members can no longer join.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 3. Unlock Room
  if (action === "j2c_btn_unlock") {
    if (!(await checkOwnerRights())) return true;
    await userVC.permissionOverwrites.edit(guild.id, { Connect: null }).catch(() => null);
    await interaction.reply({
      content: `🔓 **${userVC.name}** is now unlocked! Members can join freely.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 4. Hide Room
  if (action === "j2c_btn_hide") {
    if (!(await checkOwnerRights())) return true;
    await userVC.permissionOverwrites.edit(guild.id, { ViewChannel: false }).catch(() => null);
    await interaction.reply({
      content: `👁️‍🗨️ **${userVC.name}** is now hidden from the server channel list.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 5. Unhide Room
  if (action === "j2c_btn_unhide") {
    if (!(await checkOwnerRights())) return true;
    await userVC.permissionOverwrites.edit(guild.id, { ViewChannel: null }).catch(() => null);
    await interaction.reply({
      content: `👁️ **${userVC.name}** is now visible to everyone.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 6. Modals & Options Setup
  if (action === "j2c_btn_rename") {
    if (!(await checkOwnerRights())) return true;
    const modal = new ModalBuilder()
      .setCustomId(`j2c_modal_rename:${userVC.id}`)
      .setTitle("Rename Voice Channel");
    const input = new TextInputBuilder()
      .setCustomId("rename_input")
      .setLabel("Enter New Room Name")
      .setPlaceholder(userVC.name)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  if (action === "j2c_btn_limit") {
    if (!(await checkOwnerRights())) return true;
    const modal = new ModalBuilder()
      .setCustomId(`j2c_modal_limit:${userVC.id}`)
      .setTitle("Set Voice Channel User Limit");
    const input = new TextInputBuilder()
      .setCustomId("limit_input")
      .setLabel("Enter Capacity Limit (0 for Unlimited)")
      .setPlaceholder("0 - 99")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  if (action === "j2c_btn_permit") {
    if (!(await checkOwnerRights())) return true;
    const modal = new ModalBuilder()
      .setCustomId(`j2c_modal_permit:${userVC.id}`)
      .setTitle("Permit Member to Join Room");
    const input = new TextInputBuilder()
      .setCustomId("permit_input")
      .setLabel("Enter User ID or Mention")
      .setPlaceholder("User ID (e.g. 123456789)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  if (action === "j2c_btn_reject") {
    if (!(await checkOwnerRights())) return true;
    const modal = new ModalBuilder()
      .setCustomId(`j2c_modal_reject:${userVC.id}`)
      .setTitle("Reject & Kick Member from Room");
    const input = new TextInputBuilder()
      .setCustomId("reject_input")
      .setLabel("Enter User ID or Mention")
      .setPlaceholder("User ID (e.g. 123456789)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  if (action === "j2c_btn_invite") {
    if (!(await checkOwnerRights())) return true;
    const modal = new ModalBuilder()
      .setCustomId(`j2c_modal_invite:${userVC.id}`)
      .setTitle("Invite Member to Voice Channel");
    const input = new TextInputBuilder()
      .setCustomId("invite_input")
      .setLabel("Enter User ID to Send Voice Invite")
      .setPlaceholder("User ID (e.g. 123456789)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  if (action === "j2c_btn_transfer") {
    if (!(await checkOwnerRights())) return true;
    const modal = new ModalBuilder()
      .setCustomId(`j2c_modal_transfer:${userVC.id}`)
      .setTitle("Transfer Room Ownership");
    const input = new TextInputBuilder()
      .setCustomId("transfer_input")
      .setLabel("Enter New Owner User ID")
      .setPlaceholder("User ID (e.g. 123456789)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  if (action === "j2c_btn_bitrate") {
    if (!(await checkOwnerRights())) return true;
    const modal = new ModalBuilder()
      .setCustomId(`j2c_modal_bitrate:${userVC.id}`)
      .setTitle("Adjust Audio Bitrate");
    const input = new TextInputBuilder()
      .setCustomId("bitrate_input")
      .setLabel("Enter Bitrate in kbps (e.g. 64, 96, 128, 256, 384)")
      .setPlaceholder("96")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  if (action === "j2c_btn_template") {
    if (!(await checkOwnerRights())) return true;
    const select = new StringSelectMenuBuilder()
      .setCustomId(`j2c_select_template:${userVC.id}`)
      .setPlaceholder("📑 Choose Preset Room Template...")
      .addOptions(
        { label: "🎮 Gaming Lounge", value: "🎮 {user}'s Gaming Lounge" },
        { label: "🎧 Chill Zone", value: "🎧 {user}'s Chill Zone" },
        { label: "🔒 Secret Vault", value: "🔒 {user}'s Vault" },
        { label: "🎵 Music Studio", value: "🎵 {user}'s Music Studio" },
        { label: "💬 Stream / Talk", value: "💬 {user}'s Stream Room" }
      );

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("### 📑 Select Room Name Template"))
      .addActionRowComponents(new ActionRowBuilder().addComponents(select));

    await interaction.reply({ components: [container], flags: MessageFlags.Ephemeral }).catch(() => null);
    return true;
  }

  if (action === "j2c_btn_chat") {
    if (!(await checkOwnerRights())) return true;
    await interaction.reply({
      content: `💬 Voice chat text channel for <#${userVC.id}> is enabled and ready!`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  if (action === "j2c_btn_waiting") {
    if (!(await checkOwnerRights())) return true;
    await interaction.reply({
      content: `⏰ Waiting Room status: Members can wait in <#${userVC.id}> or be permitted individually.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  if (action === "j2c_btn_region") {
    if (!(await checkOwnerRights())) return true;
    await interaction.reply({
      content: `🖥️ Voice Region for **${userVC.name}** is managed automatically by Discord for lowest latency.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  // 7. Handle Modal & Select Submissions
  if (interaction.isStringSelectMenu() && action === "j2c_select_template") {
    const selectedTemplate = interaction.values[0];
    const newName = selectedTemplate.replace(/\{user\}/gi, interaction.user.username);
    await userVC.setName(newName).catch(() => null);
    await interaction.reply({
      content: `📑 Room template applied! Channel renamed to **${newName}**.`,
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return true;
  }

  if (interaction.isModalSubmit()) {
    if (action === "j2c_modal_rename") {
      const newName = interaction.fields.getTextInputValue("rename_input").trim();
      if (newName) await userVC.setName(newName).catch(() => null);
      await interaction.reply({
        content: `✏️ Room renamed to **${newName}**!`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
      return true;
    }

    if (action === "j2c_modal_limit") {
      const limitVal = parseInt(interaction.fields.getTextInputValue("limit_input").trim());
      if (!isNaN(limitVal) && limitVal >= 0 && limitVal <= 99) {
        await userVC.setUserLimit(limitVal).catch(() => null);
        await interaction.reply({
          content: `🔢 User limit set to **${limitVal === 0 ? "Unlimited" : `${limitVal} members`}**!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
      return true;
    }

    if (action === "j2c_modal_bitrate") {
      const kbps = parseInt(interaction.fields.getTextInputValue("bitrate_input").trim());
      if (!isNaN(kbps) && kbps >= 8 && kbps <= 384) {
        await userVC.setBitrate(kbps * 1000).catch(() => null);
        await interaction.reply({
          content: `🎧 Room audio bitrate set to **${kbps} kbps**!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
      return true;
    }

    if (action === "j2c_modal_permit") {
      const inputVal = interaction.fields.getTextInputValue("permit_input").trim();
      const userId = inputVal.replace(/\D/g, "");
      if (userId) {
        await userVC.permissionOverwrites.edit(userId, {
          ViewChannel: true,
          Connect: true,
        }).catch(() => null);
        await interaction.reply({
          content: `👤 <@${userId}> permitted to join **${userVC.name}**!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
      return true;
    }

    if (action === "j2c_modal_reject") {
      const inputVal = interaction.fields.getTextInputValue("reject_input").trim();
      const userId = inputVal.replace(/\D/g, "");
      if (userId) {
        await userVC.permissionOverwrites.edit(userId, { Connect: false }).catch(() => null);
        const targetMember = userVC.members.get(userId);
        if (targetMember) await targetMember.voice.disconnect().catch(() => null);
        await interaction.reply({
          content: `🚫 <@${userId}> rejected and blocked from **${userVC.name}**!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
      return true;
    }

    if (action === "j2c_modal_invite") {
      const inputVal = interaction.fields.getTextInputValue("invite_input").trim();
      const userId = inputVal.replace(/\D/g, "");
      if (userId) {
        const targetUser = await client.users.fetch(userId).catch(() => null);
        if (targetUser) {
          const invite = await userVC.createInvite({ maxAge: 3600, maxUses: 1 }).catch(() => null);
          await targetUser.send({
            content: `📬 **${interaction.user.username}** invited you to join their voice channel **${userVC.name}** in **${guild.name}**!\n${invite ? invite.url : ""}`,
          }).catch(() => null);
          await interaction.reply({
            content: `📩 Voice invite sent to **${targetUser.username}**!`,
            flags: MessageFlags.Ephemeral,
          }).catch(() => null);
        }
      }
      return true;
    }

    if (action === "j2c_modal_transfer") {
      const inputVal = interaction.fields.getTextInputValue("transfer_input").trim();
      const userId = inputVal.replace(/\D/g, "");
      if (userId) {
        j2cManager.setTempChannelOwner(guildId, userVC.id, userId);
        await interaction.reply({
          content: `👑 Ownership of **${userVC.name}** transferred to <@${userId}>!`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
      return true;
    }
  }

  return false;
}

module.exports = {
  buildAstrixInterfacePayload,
  handleJ2CControlInteraction,
};
