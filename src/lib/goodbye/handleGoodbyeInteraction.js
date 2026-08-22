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
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const goodbyeManager = require("../goodbyeManager");
const welcomeCanvas = require("../welcomeCanvas");

async function handleGoodbyeInteraction(client, interaction) {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return false;

  const customId = interaction.customId;
  if (!customId || !customId.startsWith("goodbye")) return false;

  const parts = customId.split("_");

  // Format: goodbye_toggle_<userId>
  if (customId.startsWith("goodbye_toggle_")) {
    const ownerId = parts[2];
    if (ownerId && interaction.user.id !== ownerId) {
      await interaction.reply({
        content: "❌ You cannot interact with someone else's dashboard.",
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    const config = goodbyeManager.getGuildGoodbye(interaction.guildId);
    if (!config.enabled && (!config.channels || config.channels.length === 0)) {
      await interaction.reply({
        content: "❌ Add at least one goodbye channel first using `.goodbyechannel #channel`.",
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    const newStatus = !config.enabled;
    goodbyeManager.updateGuildGoodbye(interaction.guildId, { enabled: newStatus });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${newStatus ? "<:red_star:1539875482680696834> Goodbye Engine Activated" : "⚠️ Goodbye Engine Deactivated"}\n` +
          `-# *Member departure greetings are now **${newStatus ? "ENABLED 🟢" : "DISABLED 🔴"}**.*`
      )
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return true;
  }

  // Format: goodbye_test_<userId> or goodbye_testch_<channelId>_<userId>
  if (customId.startsWith("goodbye_test_") || customId.startsWith("goodbye_testch_")) {
    const config = goodbyeManager.getGuildGoodbye(interaction.guildId);
    let targetChannels = [];

    if (customId.startsWith("goodbye_testch_")) {
      const channelId = parts[2];
      const chConfig = config.channels.find((c) => c.channelId === channelId);
      if (chConfig) targetChannels.push(chConfig);
    } else {
      targetChannels = config.channels || [];
    }

    if (targetChannels.length === 0) {
      await interaction.reply({
        content: "❌ No valid goodbye channel configured to test. Add one using `.goodbyechannel #channel`.",
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let sentCount = 0;
    for (const channelConfig of targetChannels) {
      const channel = interaction.guild.channels.cache.get(channelConfig.channelId);
      if (!channel) continue;

      const customButtons = goodbyeManager.buildGoodbyeButtons(channelConfig, interaction.member);

      const sendFiles = [];
      let mediaGallery = null;

      if (channelConfig.canvasEnabled !== false) {
        try {
          const cardBuffer = await welcomeCanvas.generateGoodbyeCard(interaction.member, channelConfig);
          const canvasAttachment = new AttachmentBuilder(cardBuffer, {
            name: "goodbye-card.png",
          });
          sendFiles.push(canvasAttachment);
          const mediaItem = new MediaGalleryItemBuilder().setURL("attachment://goodbye-card.png");
          mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
        } catch (e) {}
      }

      const websiteButton = new ButtonBuilder()
        .setEmoji("<:website:1539875380159184977>")
        .setLabel("Website")
        .setStyle(ButtonStyle.Link)
        .setURL("https://extremez.vercel.app/");

      const supportButton = new ButtonBuilder()
        .setEmoji("<:discord:1539875375981797596>")
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/FR9pXG2Mwb");

      const actionRow = customButtons || new ActionRowBuilder().addComponents(websiteButton, supportButton);

      const formattedDesc = goodbyeManager.formatGoodbyeText(
        channelConfig.description || channelConfig.content || "Goodbye **{username}**! We'll miss you. We now have {memberCount} members.",
        interaction.member,
        interaction.guild
      );

      let mainContent =
        `<:members:1539875392532512808> **Member Departure**\n` +
        `> -# <:prefix:1539875384080990228> **User:** \`${interaction.user.username}\` (<@${interaction.user.id}>)\n` +
        `> -# <:servers:1539875396546207795> **Remaining Members:** \`${interaction.guild.memberCount.toLocaleString()}\`\n\n` +
        `> -# <:clock:1539875400975388713> ${formattedDesc}`;

      if (channelConfig.title) {
        const titleFormatted = goodbyeManager.formatGoodbyeText(channelConfig.title, interaction.member, interaction.guild);
        mainContent = `# ${titleFormatted}\n\n` + mainContent;
      }

      const footerText = channelConfig.footer
        ? goodbyeManager.formatGoodbyeText(channelConfig.footer, interaction.member, interaction.guild)
        : `-# ASTRIXCODE™ Farewell Engine • User ID: \`${interaction.user.id}\``;

      const container = new ContainerBuilder();
      if (mediaGallery) container.addMediaGalleryComponents(mediaGallery);

      container
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText))
        .addActionRowComponents(actionRow);

      const payload = {
        components: [container],
        files: sendFiles,
        flags: MessageFlags.IsComponentsV2,
      };

      const sentMsg = await channel.send(payload).catch(() => null);
      if (sentMsg) {
        sentCount++;
        if (channelConfig.selfDestruct) {
          setTimeout(() => sentMsg.delete().catch(() => {}), channelConfig.selfDestruct * 1000);
        }
      }
    }

    await interaction.editReply(`✅ Dispatched live test goodbye card to **${sentCount}** channel(s).`);
    return true;
  }

  // List Pagination: goodbyelist_prev_<userId>_<page>, goodbyelist_next_<userId>_<page>
  if (customId.startsWith("goodbyelist_")) {
    const isNext = customId.startsWith("goodbyelist_next_");
    const currentPage = parseInt(parts[3]) || 0;
    const newPage = isNext ? currentPage + 1 : currentPage - 1;

    const config = goodbyeManager.getGuildGoodbye(interaction.guildId);
    const PER_PAGE = 3;
    const totalPages = Math.ceil(config.channels.length / PER_PAGE);

    const start = newPage * PER_PAGE;
    const end = Math.min(start + PER_PAGE, config.channels.length);
    const pageChannels = config.channels.slice(start, end);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# <:leave:1528311514065535007> Goodbye Channels Directory (${config.channels.length})\n` +
          `-# *Page ${newPage + 1} of ${totalPages}*\n` +
          `**System Status:** ${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}`
      )
    );

    for (let i = 0; i < pageChannels.length; i++) {
      const ch = pageChannels[i];
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <#${ch.channelId}>\n` +
            `> - **Title:** \`${ch.title || "Not set"}\`\n` +
            `> - **Description:** \`${ch.description ? (ch.description.length > 40 ? ch.description.slice(0, 40) + "..." : ch.description) : "Not set"}\`\n` +
            `> - **Self-Destruct:** \`${ch.selfDestruct ? `${ch.selfDestruct}s` : "Off"}\` | **Canvas:** \`${ch.canvasEnabled !== false ? "ON" : "OFF"}\``
        )
      );
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`goodbyelist_prev_${interaction.user.id}_${newPage}`)
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(newPage <= 0),
      new ButtonBuilder()
        .setCustomId(`goodbyelist_next_${interaction.user.id}_${newPage}`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(newPage >= totalPages - 1)
    );

    container.addActionRowComponents(row);

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    return true;
  }

  // Dashboard modal openers: goodbye_cfg_<option>_<channelId>_<userId>
  if (customId.startsWith("goodbye_cfg_")) {
    const option = parts[2];
    const channelId = parts[3];

    const modal = new ModalBuilder()
      .setCustomId(`goodbyemodal_${option}_${channelId}`)
      .setTitle(`Configure Goodbye ${option.toUpperCase()}`);

    const input = new TextInputBuilder()
      .setCustomId("modal_input_value")
      .setLabel(`Enter ${option} value (or "clear")`)
      .setStyle(option === "description" || option === "content" || option === "fields" ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(false);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
    return true;
  }

  // Modal Submission Handler: goodbyemodal_<option>_<channelId>
  if (customId.startsWith("goodbyemodal_")) {
    const option = parts[1];
    const channelId = parts[2];
    let val = interaction.fields.getTextInputValue("modal_input_value")?.trim();

    if (!val || val.toLowerCase() === "clear" || val.toLowerCase() === "none") {
      val = null;
    }

    const config = goodbyeManager.getGuildGoodbye(interaction.guildId);
    const chIndex = config.channels.findIndex((c) => c.channelId === channelId);

    if (chIndex !== -1) {
      if (option === "color" && val) {
        let hex = val.replace("#", "");
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
          config.channels[chIndex].color = parseInt(hex, 16);
        }
      } else if (option === "selfdestruct") {
        if (!val || val.toLowerCase() === "off") {
          config.channels[chIndex].selfDestruct = null;
        } else {
          const sec = parseInt(val);
          if (!isNaN(sec) && sec >= 6 && sec <= 60) {
            config.channels[chIndex].selfDestruct = sec;
          }
        }
      } else {
        config.channels[chIndex][option] = val;
      }
      goodbyeManager.updateGuildGoodbye(interaction.guildId, { channels: config.channels });
    }

    await interaction.reply({
      content: `✅ Updated **${option}** for <#${channelId}> successfully!`,
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  return false;
}

module.exports = { handleGoodbyeInteraction };
