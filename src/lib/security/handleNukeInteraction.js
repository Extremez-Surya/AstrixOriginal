const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const nukeManager = require("../nukeManager");
const noprefixManager = require("../noprefixManager");
const EMOJIS = require("../emojis");

function buildNukeContainer(guild, channel, authorUser) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ${EMOJIS.nuke || "💣"} **Confirm Channel Nuke**`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `Are you sure you want to nuke (clone and delete) this channel?\n\n` +
      `**This action is irreversible.**\n\n` +
      `> **Target Channel:** <#${channel.id}>`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const confirmBtn = new ButtonBuilder()
    .setCustomId(`nuke_confirm_${authorUser.id}_${channel.id}`)
    .setLabel("Confirm")
    .setEmoji("💣")
    .setStyle(ButtonStyle.Danger);

  const cancelBtn = new ButtonBuilder()
    .setCustomId(`nuke_cancel_${authorUser.id}_${channel.id}`)
    .setLabel("Cancel")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);
  container.addActionRowComponents(buttonRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Nuke Engine`)
  );

  return container;
}

async function handleNukeInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  if (!isBtn) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("nuke_")) return false;

  const parts = customId.split("_");
  const action = parts[1]; // confirm or cancel
  const authorId = parts[2];
  const channelId = parts[3];

  const isMemberAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
  const isBotOwner = noprefixManager.isOwner(interaction.user.id, client);

  if (interaction.user.id !== authorId && !isBotOwner && !isMemberAdmin) {
    await interaction
      .reply({
        content: "❌ You cannot use this button.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  if (action === "cancel") {
    const cancelContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ❌ **Nuke Cancelled**`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("Nuke operation has been cancelled."))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Nuke Engine`));

    await interaction.update({ components: [cancelContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    return true;
  }

  if (action === "confirm") {
    const guild = interaction.guild;
    const channel = guild.channels.cache.get(channelId) || interaction.channel;

    if (!channel) {
      await interaction.reply({ content: "❌ Channel not found.", flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }

    await interaction.deferUpdate().catch(() => null);
    await nukeManager.nukeChannelFast(guild, channel, interaction.user);
    return true;
  }

  return false;
}

module.exports = {
  buildNukeContainer,
  handleNukeInteraction,
};
