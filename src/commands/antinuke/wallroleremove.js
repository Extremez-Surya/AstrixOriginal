const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");

module.exports = {
  alias: ["wallrole_remove", "wallroleremove", "removewallrole"],
  category: "Anti Nuke",
  desc: "Remove a role from the Security Wall barrier.",
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
        content: "❌ Only the **Server Owner** or authorized **Extra Owners** can configure security wall roles.",
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const role = message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]) ||
      message.guild.roles.cache.find((r) => r.name.toLowerCase() === args.join(" ").toLowerCase());

    if (!role) {
      return message.reply({
        content: "⚠️ **Usage:** `wallrole_remove <@role | roleId | roleName>`",
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const removed = antinukeManager.removeWallRole(message.guild.id, role.id);
    if (!removed) {
      return message.reply({
        content: `⚠️ <@&${role.id}> was not registered as a Security Wall role.`,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ **Security Wall Role Removed**\n\n` +
        `> • **Role:** <@&${role.id}> (\`${role.name}\`)\n` +
        `> • **Status:** Removed from Astrix Security Wall barrier.`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
