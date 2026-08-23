const { MessageFlags } = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const noprefixManager = require("../../lib/noprefixManager");
const {
  buildUnifiedWhitelistTargetCard,
  buildUnifiedWhitelistOverviewCard,
} = require("../../lib/security/handleUnifiedWhitelist");

module.exports = {
  alias: ["antinukewhitelist", "anwl"],
  category: "Anti Nuke",
  desc: "Manage immune whitelisted users for Anti-Nuke defense.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isOwner = message.guild.ownerId === message.author.id;
    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(message.author.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(message.author.id);
    const isNoprefix = noprefixManager.isOwner(message.author.id, client);

    if (!isOwner && !isExtraOwner && !isDev && !isNoprefix) {
      return message.reply({
        content: "❌ Only the **Guild Owner** or designated **Extra Owners** can configure the security whitelist.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const action = args[0]?.toLowerCase();
    const targetUser =
      message.mentions.users.first() ||
      (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null) ||
      (action && !["view", "list", "show", "clear", "reset", "add", "remove"].includes(action)
        ? await client.users.fetch(action).catch(() => null)
        : null);

    if (action === "add" || action === "trust" || action === "config") {
      if (!targetUser) {
        return message.reply({
          content: "⚠️ Please mention a valid user or provide a User ID.\n*Usage:* `.antinuke whitelist add @user`",
        }).catch(() => null);
      }
      const card = buildUnifiedWhitelistTargetCard(message.guild, targetUser);
      return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (targetUser && !["view", "list", "show", "clear", "reset"].includes(action)) {
      const card = buildUnifiedWhitelistTargetCard(message.guild, targetUser);
      return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (action === "remove" || action === "del") {
      if (!targetUser) {
        return message.reply({
          content: "⚠️ Please mention a valid user or provide a User ID.\n*Usage:* `.antinuke whitelist remove @user`",
        }).catch(() => null);
      }
      const card = buildUnifiedWhitelistTargetCard(message.guild, targetUser);
      return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const overview = buildUnifiedWhitelistOverviewCard(message.guild, "main");
    return message.reply({ components: [overview], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};

