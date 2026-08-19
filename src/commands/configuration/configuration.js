const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const { buildConfigurationContainer } = require("../../lib/security/handleConfigurationInteraction");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  name: "configuration",
  alias: ["configuration", "config", "serverconfig"],
  category: "Configuration",
  desc: "Server auto-responders, reaction triggers, channel auto-emojis & custom server configuration.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message) {
    if (!message.guild) return;

    const isMemberPermitted = message.member?.permissions.has(PermissionFlagsBits.ManageGuild);
    const isBotOwner = noprefixManager.isOwner(message.author.id, client);

    if (!isMemberPermitted && !isBotOwner) {
      return message.reply({
        content: "❌ Manage Server permission required to view or edit configuration.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const configContainer = buildConfigurationContainer(message.guild, message.author);

    return message.reply({
      components: [configContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    });
  },
};
