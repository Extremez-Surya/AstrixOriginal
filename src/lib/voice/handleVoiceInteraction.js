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

function generateVCPagePayload(channel, page = 1) {
  const members = Array.from(channel.members.values()).filter((m) => !m.user.bot);
  const total = members.length;
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const currentMembers = members.slice(start, end);

  const container = new ContainerBuilder();

  if (total === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔊 ${channel.name}\n` +
          `-# *Voice Channel Member Directory*\n\n` +
          `ℹ️ No human members currently connected to this voice channel.`
      )
    );
    return { components: [container], flags: MessageFlags.IsComponentsV2 };
  }

  const list = currentMembers
    .map((m, i) => {
      const flags = [];
      if (m.voice.serverMute) flags.push("🚫🎙️");
      if (m.voice.serverDeaf) flags.push("🚫🎧");
      if (m.voice.selfMute) flags.push("🎙️");
      if (m.voice.selfDeaf) flags.push("🎧");
      if (m.voice.streaming) flags.push("📺");
      if (m.voice.selfVideo) flags.push("📹");

      const badgeStr = flags.length > 0 ? ` [${flags.join(" ")}]` : "";
      return `\`${start + i + 1}.\` **${m.user.username}** (<@${m.id}>)${badgeStr}`;
    })
    .join("\n");

  const headerText =
    `# 🔊 ${channel.name}\n` +
    `-# *Connected Human Members: **${total}** • Page ${currentPage} of ${totalPages}*\n\n` +
    `${list}`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

  if (totalPages > 1) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`vclist_page:${channel.id}:${currentPage - 1}`)
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage <= 1),
        new ButtonBuilder()
          .setCustomId(`vclist_page:${channel.id}:${currentPage + 1}`)
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage >= totalPages),
        new ButtonBuilder()
          .setCustomId(`vclist_refresh:${channel.id}:${currentPage}`)
          .setEmoji("🔄")
          .setLabel("Refresh")
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

async function handleVoiceInteraction(client, interaction) {
  if (!interaction.isButton()) return false;
  const customId = interaction.customId;
  if (!customId || (!customId.startsWith("vclist_") && !customId.startsWith("voice_"))) return false;

  const parts = customId.split(":");
  const action = parts[0];

  if (action === "vclist_page" || action === "vclist_refresh") {
    const channelId = parts[1];
    const targetPage = parseInt(parts[2]) || 1;

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel || !channel.isVoiceBased()) {
      await interaction.reply({
        content: "❌ Voice channel no longer exists or is inaccessible.",
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    const payload = generateVCPagePayload(channel, targetPage);
    await interaction.update(payload).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  generateVCPagePayload,
  handleVoiceInteraction,
};
