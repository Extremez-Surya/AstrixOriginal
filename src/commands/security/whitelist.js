const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const {
  buildUnifiedWhitelistTargetCard,
  buildUnifiedWhitelistOverviewCard,
} = require("../../lib/security/handleUnifiedWhitelist");
const noprefixManager = require("../../lib/noprefixManager");
const antinukeManager = require("../../lib/antinukeManager");

function isAuthorized(client, message) {
  if (!message.guild) return false;
  if (message.author.id === message.guild.ownerId) return true;
  if (noprefixManager.isOwner(message.author.id, client)) return true;
  if (antinukeManager.isExtraOwner(message.guild.id, message.author.id)) return true;
  if (message.member?.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (message.member?.permissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  return false;
}

function resolveUser(message, arg) {
  if (!arg) return null;
  const mentionMatch = arg.match(/^<@!?(\d+)>$/);
  const id = mentionMatch ? mentionMatch[1] : arg;
  return message.guild.members.cache.get(id)?.user || clientUsersFind(message.client, id);
}

function clientUsersFind(client, id) {
  if (!/^\d{17,20}$/.test(id)) return null;
  return client.users.cache.get(id) || null;
}

module.exports = {
  alias: ["whitelist", "wl"],
  category: "Security",
  desc: "Unified multi-system security whitelist hub (Anti-Nuke, Anti-Raid & AutoMod).",
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!isAuthorized(client, message)) {
      return message.reply({
        content: "❌ You need **Manage Server** or **Administrator** permissions to manage security whitelists.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const action = args[0]?.toLowerCase();
    const targetUser = resolveUser(message, args[1]) || message.mentions.users.first();

    // 1. .whitelist add @user OR .whitelist @user
    if (action === "add" || action === "trust" || action === "set" || action === "config") {
      if (!targetUser) {
        return message.reply({
          content: "⚠️ Please mention a valid user or provide a User ID.\n*Usage:* `.whitelist add @user`",
        }).catch(() => null);
      }

      const card = buildUnifiedWhitelistTargetCard(message.guild, targetUser);
      return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 2. Direct user mention/ID without "add": e.g. .whitelist @user
    if (targetUser && !["show", "list", "view", "reset", "clear"].includes(action)) {
      const card = buildUnifiedWhitelistTargetCard(message.guild, targetUser);
      return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 3. .whitelist remove @user
    if (action === "remove" || action === "delete" || action === "del") {
      if (!targetUser) {
        return message.reply({
          content: "⚠️ Please mention a valid user or provide a User ID.\n*Usage:* `.whitelist remove @user`",
        }).catch(() => null);
      }

      const card = buildUnifiedWhitelistTargetCard(message.guild, targetUser);
      return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 4. Default / .whitelist show / .whitelist list
    const overview = buildUnifiedWhitelistOverviewCard(message.guild, "main");
    return message.reply({ components: [overview], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
