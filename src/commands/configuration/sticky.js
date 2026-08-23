const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const configManager = require("../../lib/configManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildConfigurationContainer } = require("../../lib/security/handleConfigurationInteraction");

module.exports = {
  name: "sticky",
  alias: ["sticky", "stickymessage", "stickmsg"],
  category: "Configuration",
  desc: "Configure dynamic sticky notices pinned automatically at the bottom of channels.",
  botPermissions: ["SendMessages", "ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isMemberPermitted = message.member?.permissions.has(PermissionFlagsBits.ManageGuild);
    const isBotOwner = noprefixManager.isOwner(message.author.id, client);

    if (!isMemberPermitted && !isBotOwner) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure sticky messages.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const sub = args[0]?.toLowerCase();

    // 1. .sticky add <#channel> <message>
    if (sub === "add" || sub === "create" || sub === "set") {
      const channelMention = args[1];
      const channelId = channelMention ? channelMention.replace(/[^0-9]/g, "") : message.channel.id;
      const channel = message.guild.channels.cache.get(channelId);

      if (!channel) {
        return message.reply({
          content: "⚠️ **Invalid Channel.**\n*Usage:* `.sticky add <#channel> <message>`",
        }).catch(() => null);
      }

      const stickyText = args.slice(2).join(" ").trim();
      if (!stickyText) {
        return message.reply({
          content: "⚠️ **Missing Content.**\n*Usage:* `.sticky add <#channel> <message>`\n*Example:* `.sticky add #rules Please follow Discord ToS and be respectful!`",
        }).catch(() => null);
      }

      configManager.setStickyMessage(message.guild.id, channelId, stickyText);
      const container = buildConfigurationContainer(message.guild, "sticky");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 2. .sticky remove <#channel>
    if (sub === "remove" || sub === "delete" || sub === "del") {
      const channelMention = args[1];
      const channelId = channelMention ? channelMention.replace(/[^0-9]/g, "") : message.channel.id;

      configManager.removeStickyMessage(message.guild.id, channelId);
      const container = buildConfigurationContainer(message.guild, "sticky");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 3. .sticky clear
    if (sub === "clear" || sub === "reset") {
      configManager.clearStickyMessages(message.guild.id);
      const container = buildConfigurationContainer(message.guild, "sticky");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Default: Open Sticky Tab
    const container = buildConfigurationContainer(message.guild, "sticky");
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
