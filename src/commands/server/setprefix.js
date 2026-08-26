const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const prefixManager = require("../../lib/prefixManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildConfigurationContainer } = require("../../lib/security/handleConfigurationInteraction");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["setprefix", "changeprefix", "newprefix"],
  category: "Server",
  desc: "Set a custom command prefix for this server or reset to default.",

  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isOwner = message.author.id === message.guild.ownerId;
    const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator);
    const isDev = noprefixManager.isOwner(message.author.id, client);

    if (!isOwner && !isAdmin && !isDev) {
      return message.reply({
        content: "❌ You need **Administrator** permissions to change the server prefix.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const newPrefix = args[0]?.trim();
    if (newPrefix) {
      if (newPrefix.toLowerCase() === "reset") {
        prefixManager.resetPrefix(message.guild.id);
      } else {
        if (newPrefix.length > 5) {
          return message.reply({
            content: "⚠️ Prefix must be 5 characters or less.",
          }).catch(() => null);
        }
        if (newPrefix.includes(" ")) {
          return message.reply({
            content: "⚠️ Prefix cannot contain spaces.",
          }).catch(() => null);
        }
        prefixManager.setPrefix(message.guild.id, newPrefix);
      }
    }

    const container = buildConfigurationContainer(message.guild, "prefix");
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
