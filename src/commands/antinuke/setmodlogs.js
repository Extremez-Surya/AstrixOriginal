const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");

module.exports = {
  alias: ["setmodlogs", "setmodlog", "modlogs"],
  category: "Anti Nuke",
  desc: "Configure the dedicated moderation and security log channel.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isOwner = message.guild.ownerId === message.author.id;
    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(message.author.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(message.author.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      return message.reply({
        content: "❌ Only the **Server Owner** or authorized **Extra Owners** can configure log channels.",
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const channel = message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]) ||
      message.guild.channels.cache.find((c) => c.name.toLowerCase() === args[0]?.toLowerCase());

    if (!channel) {
      const currentChan = config.modLogsChannel;
      const chanText = currentChan ? `<#${currentChan}>` : "*None configured*";

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📋 **Moderation • Audit Log Configuration**\n` +
            `-# Select a channel below to receive real-time moderation and member enforcement logs\n\n` +
            `> **Current Log Channel:** ${chanText}\n` +
            `> **Event Dispatch:** Logs warns, mutes, kicks, bans, unbans and timeout actions.\n\n` +
            `-# Select a text channel from the menu below to update.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

      const channelMenu = new ChannelSelectMenuBuilder()
        .setCustomId("antinuke_set_modlog_channel_select")
        .setPlaceholder("📋 Select text channel for Moderation logs...")
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

      const menuRow = new ActionRowBuilder().addComponents(channelMenu);

      const cpBtn = new ButtonBuilder()
        .setCustomId("antinuke_nav_overview")
        .setLabel("Control Center")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Primary);

      const homeBtn = new ButtonBuilder()
        .setCustomId("antinuke_nav_home")
        .setLabel("Main Menu")
        .setEmoji("🏠")
        .setStyle(ButtonStyle.Secondary);

      const btnRow = new ActionRowBuilder().addComponents(cpBtn, homeBtn);

      container.addActionRowComponents(menuRow);
      container.addActionRowComponents(btnRow);
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Moderation Log Dispatcher`)
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    antinukeManager.setModLogs(message.guild.id, channel.id);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ **Moderation Log Channel Configured**\n\n` +
        `> • **Channel:** <#${channel.id}> (\`${channel.id}\`)\n` +
        `> • **Telemetry:** Security alerts and moderation actions will be logged here.`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
