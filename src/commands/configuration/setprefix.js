const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const prefixManager = require("../../lib/prefixManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildConfigurationContainer } = require("../../lib/security/handleConfigurationInteraction");

module.exports = {
  name: "setprefix",
  alias: ["setprefix", "prefixset", "changeprefix"],
  category: "Configuration",
  desc: "Change the server command execution prefix.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isMemberPermitted = message.member?.permissions.has(PermissionFlagsBits.ManageGuild);
    const isBotOwner = noprefixManager.isOwner(message.author.id, client);

    if (!isMemberPermitted && !isBotOwner) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to change the server prefix.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const newPrefix = args[0]?.trim();
    if (newPrefix) {
      if (newPrefix.length > 5) {
        return message.reply({
          content: "⚠️ Prefix cannot be longer than 5 characters.",
        }).catch(() => null);
      }
      prefixManager.setPrefix(message.guild.id, newPrefix);
    }

    const container = buildConfigurationContainer(message.guild, "prefix");
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
