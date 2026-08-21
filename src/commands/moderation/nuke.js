const { MessageFlags, PermissionFlagsBits, ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
const nukeManager = require("../../lib/nukeManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildNukeContainer } = require("../../lib/security/handleNukeInteraction");
const EMOJIS = require("../../lib/emojis");

function buildNotice(title, description) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${title}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Nuke Engine`));
  return { components: [container], flags: MessageFlags.IsComponentsV2, allowedMentions: { repliedUser: false } };
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  name: "nuke",
  alias: ["nuke", "channelnuke", "nukechannel", "clonenuke", "nukeadd", "nukeremove"],
  category: "Moderation",
  desc: "Hardened Sub-0.1s Channel Clone & Nuke system with scheduled auto-nuke & pins backup.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isMemberAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator);
    const isBotOwner = noprefixManager.isOwner(message.author.id, client);

    if (!isMemberAdmin && !isBotOwner) {
      return message.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Permissions`, "Administrator permission required to use Nuke commands."));
    }

    const sub = args[0]?.toLowerCase();

    // 1. Subcommand: archive <#channel> <on|off>
    if (sub === "archive") {
      const channelMention = args[1];
      const settingRaw = args[2]?.toLowerCase();
      const channelId = channelMention ? channelMention.replace(/[^0-9]/g, "") : message.channel.id;
      const channel = message.guild.channels.cache.get(channelId);

      if (!channel || channel.type !== ChannelType.GuildText) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Channel`, "Please specify a valid text channel."));
      }

      if (settingRaw !== "on" && settingRaw !== "off") {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Setting`, "Setting must be `on` or `off`.\nExample: `.nuke archive #general on`"));
      }

      const enabled = settingRaw === "on";
      nukeManager.setArchiveSetting(message.guild.id, channel.id, enabled);

      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Pins Backup Archiver Updated`, `Channel: <#${channel.id}>\nPins backup before nuke: **${enabled ? "Enabled ✅" : "Disabled ❌"}**`));
    }

    // 2. Subcommand: view / list
    if (sub === "view" || sub === "list") {
      const scheduled = nukeManager.getScheduledNukes();
      const entries = Object.values(scheduled).filter((e) => e.guildId === message.guild.id);

      if (entries.length === 0) {
        return message.reply(buildNotice(`${EMOJIS.info || "📋"} Scheduled Nukes Directory`, "*No scheduled channel nukes active in this server.*"));
      }

      let contentStr = "";
      entries.forEach((e) => {
        contentStr += `> - **Channel:** <#${e.channelId}> • **Interval:** \`${e.intervalRaw}\` • **By:** <@${e.scheduledBy}>\n`;
      });

      return message.reply(buildNotice(`${EMOJIS.info || "📋"} Scheduled Nukes Directory`, contentStr));
    }

    // 3. Subcommand: add <channel> <interval> <message>
    if (sub === "add") {
      if (args.length < 3) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Arguments`, "Usage: `.nuke add <#channel> <interval> [message...]`\nExample: `.nuke add #chat 10m Auto-purged every 10 mins!`"));
      }

      const channelMention = args[1];
      const intervalRaw = args[2];
      const nukeMsg = args.slice(3).join(" ") || "Scheduled channel nuke executed.";
      const channelId = channelMention.replace(/[^0-9]/g, "");
      const channel = message.guild.channels.cache.get(channelId);

      if (!channel || channel.type !== ChannelType.GuildText) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Channel`, "Please specify a valid text channel."));
      }

      const intervalMs = nukeManager.parseInterval(intervalRaw);
      if (!intervalMs || intervalMs < 1000) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Interval`, "Interval must be e.g. `30s`, `10m`, `1h`, `1d` (min 1 second)."));
      }

      nukeManager.scheduleNuke(client, message.guild.id, channel.id, intervalMs, intervalRaw, nukeMsg, message.author.id);

      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Auto-Nuke Scheduled`, `Target: <#${channel.id}>\nInterval: \`${intervalRaw}\` (${nukeManager.formatInterval(intervalMs)})\nMessage: ${nukeMsg}`));
    }

    // 4. Subcommand: remove / cancel <channel>
    if (sub === "remove" || sub === "cancel") {
      const channelMention = args[1] || message.channel.id;
      const channelId = channelMention.replace(/[^0-9]/g, "");

      const cancelled = nukeManager.cancelScheduledNuke(channelId);
      if (cancelled) {
        return message.reply(buildNotice(`${EMOJIS.success || "✅"} Scheduled Nuke Cancelled`, `Cancelled scheduled auto-nuke for <#${channelId}>.`));
      } else {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Not Scheduled`, `No scheduled nuke active for <#${channelId}>.`));
      }
    }

    // Default: Open Interactive Nuke Control Card
    let targetChannel = message.channel;
    if (args[0]) {
      const channelId = args[0].replace(/[^0-9]/g, "");
      if (channelId) {
        const fetched = message.guild.channels.cache.get(channelId);
        if (fetched && fetched.isTextBased()) targetChannel = fetched;
      }
    }

    const nukeContainer = buildNukeContainer(message.guild, targetChannel, message.author);

    return message.reply({
      components: [nukeContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    });
  },
};
