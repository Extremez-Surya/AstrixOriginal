const { MessageFlags } = require("discord.js");
const { buildConfigurationContainer } = require("../../lib/security/handleConfigurationInteraction");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["prefix", "showprefix", "currentprefix"],
  category: "Server",
  desc: "Display the server's active command prefix and global settings.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const container = buildConfigurationContainer(message.guild, "prefix");
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
