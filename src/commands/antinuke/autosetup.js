const { MessageFlags } = require("discord.js");
const { buildAutoSetupWallSelectionContainer } = require("../../lib/security/handleAutoSetup");
const antinukeManager = require("../../lib/antinukeManager");

module.exports = {
  alias: ["autosetup", "anautosetup", "ansetup"],
  category: "Anti Nuke",
  desc: "Automatically configure and harden server security, security wall roles, log channels and permission stripping.",
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
        content: "❌ Only the **Server Owner** or authorized **Extra Owners** can initiate Auto-Setup.",
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const view = buildAutoSetupWallSelectionContainer(message.guild, message.author);
    return message.reply({
      components: [view],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
