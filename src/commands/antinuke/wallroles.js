const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildWallRolesView } = require("../../lib/security/handleAntiNukeInteraction");

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
  alias: ["wallroles", "wallrole", "securitywall"],
  category: "Anti Nuke",
  desc: "View and manage Security Wall barrier roles.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const sub = args[0]?.toLowerCase();

    // 1. ADD SUBCOMMAND
    if (sub === "add" || sub === "set" || sub === "create") {
      if (!hasPermission(client, message, config)) {
        return message.reply({
          content: "❌ Only the **Server Owner** or authorized **Extra Owners** can configure security wall roles.",
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const roleInput = args.slice(1).join(" ");
      const role = resolveRole(message.guild, roleInput, message.mentions);

      if (!role) {
        const freshConfig = antinukeManager.getGuildAntinuke(message.guild.id);
        const container = buildWallRolesView(freshConfig, message.guild, "add");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
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
          `> • **Status:** Successfully registered in Astrix Security Wall barrier.`
        )
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 2. REMOVE SUBCOMMAND
    if (sub === "remove" || sub === "rem" || sub === "delete" || sub === "del") {
      if (!hasPermission(client, message, config)) {
        return message.reply({
          content: "❌ Only the **Server Owner** or authorized **Extra Owners** can configure security wall roles.",
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const roleInput = args.slice(1).join(" ");
      const role = resolveRole(message.guild, roleInput, message.mentions);

      if (!role) {
        const freshConfig = antinukeManager.getGuildAntinuke(message.guild.id);
        const container = buildWallRolesView(freshConfig, message.guild, "remove");
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
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
    }

    // 3. RESET / CLEAR SUBCOMMAND
    if (sub === "reset" || sub === "clear") {
      if (!hasPermission(client, message, config)) {
        return message.reply({
          content: "❌ Only the **Server Owner** or authorized **Extra Owners** can reset security wall roles.",
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      antinukeManager.clearWallRoles(message.guild.id);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🗑️ **Security Wall Roles Reset**\n\n` +
          `> • **Status:** All Security Wall barrier roles have been cleared.`
        )
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 4. DIRECT ROLE MENTION (e.g. wallroles @Role)
    if (sub && !["list", "show", "view", "config"].includes(sub)) {
      const directRole = resolveRole(message.guild, args.join(" "), message.mentions);
      if (directRole) {
        if (!hasPermission(client, message, config)) {
          return message.reply({
            content: "❌ Only the **Server Owner** or authorized **Extra Owners** can configure security wall roles.",
            allowedMentions: { repliedUser: false },
          }).catch(() => null);
        }

        const added = antinukeManager.addWallRole(message.guild.id, directRole.id);
        if (!added) {
          return message.reply({
            content: `⚠️ <@&${directRole.id}> is already registered as a Security Wall role.`,
            allowedMentions: { repliedUser: false },
          }).catch(() => null);
        }

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ **Security Wall Role Added**\n\n` +
            `> • **Role:** <@&${directRole.id}> (\`${directRole.name}\`)\n` +
            `> • **Status:** Successfully registered in Astrix Security Wall barrier.`
          )
        );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    // 5. DEFAULT / LIST VIEW (Minimal Interactive View)
    const freshConfig = antinukeManager.getGuildAntinuke(message.guild.id);
    const container = buildWallRolesView(freshConfig, message.guild, "main");

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
