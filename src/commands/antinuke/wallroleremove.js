const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const noprefixManager = require("../../lib/noprefixManager");

function resolveRole(guild, roleArg, mentions) {
  if (mentions && mentions.roles && mentions.roles.size > 0) {
    return mentions.roles.first();
  }
  if (!roleArg) return null;
  const cleanId = String(roleArg).replace(/[<@&>]/g, "").trim();
  if (cleanId && guild.roles.cache.has(cleanId)) {
    return guild.roles.cache.get(cleanId);
  }
  const cleanLower = cleanId.toLowerCase();
  const byExact = guild.roles.cache.find((r) => r.name.toLowerCase() === cleanLower);
  if (byExact) return byExact;
  const byPartial = guild.roles.cache.find((r) => r.name.toLowerCase().includes(cleanLower));
  if (byPartial) return byPartial;
  return null;
}

function hasPermission(client, message, config) {
  const isOwner = message.guild.ownerId === message.author.id;
  const isExtraOwner = (config.extraOwners || []).includes(message.author.id);
  const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(message.author.id);
  const isNoprefix = noprefixManager && typeof noprefixManager.isOwner === "function" ? noprefixManager.isOwner(message.author.id, client) : false;
  return isOwner || isExtraOwner || isDev || isNoprefix;
}

module.exports = {
  alias: ["wallrole_remove", "wallroleremove", "removewallrole", "wallrolesremove", "wallroles_remove", "delwallrole", "wallroledel"],
  category: "Anti Nuke",
  desc: "Remove a role from the Security Wall barrier.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const config = antinukeManager.getGuildAntinuke(message.guild.id);

    if (!hasPermission(client, message, config)) {
      return message.reply({
        content: "❌ Only the **Server Owner** or authorized **Extra Owners** can configure security wall roles.",
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const roleInput = args.join(" ");
    const role = resolveRole(message.guild, roleInput, message.mentions);

    if (!role) {
      return message.reply({
        content: "⚠️ **Usage:** `wallroles remove <@role | roleId | roleName>`",
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
        `> • **Status:** Successfully removed from Astrix Security Wall barrier.`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
