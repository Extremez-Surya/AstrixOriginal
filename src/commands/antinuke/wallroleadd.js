const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");

module.exports = {
  alias: ["wallrole_add", "wallroleadd", "addwallrole"],
  category: "Anti Nuke",
  desc: "Add a role to the Security Wall barrier.",
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
        content: "⚠️ **Usage:** `wallrole_add <@role | roleId | roleName>`",
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const added = antinukeManager.addWallRole(message.guild.id, role.id);
    if (!added) {
      return message.reply({
        content: `⚠️ <@&${role.id}> is already registered as a Security Wall role.`,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ **Security Wall Role Added**\n\n` +
        `> • **Role:** <@&${role.id}> (\`${role.name}\`)\n` +
        `> • **Status:** Registered in Astrix Security Wall barrier.`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
