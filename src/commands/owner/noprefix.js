const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const EMOJIS = require("../../lib/emojis");

function buildSuccessNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.ticky_red || "✅"} ${title}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

function buildErrorNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.cross || "❌"} ${title}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

module.exports = {
  alias: ["noprefix", "nop", "nonprefix"],
  category: "Owner",
  desc: "Manage no-prefix access for users, servers, or roles.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply({
        components: [buildErrorNotice("Access Denied", "Only bot owners can manage No-Prefix access.")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Check target user shorthand: .np @User or .noprefix @User
    let targetUser = message.mentions.users.first();
    if (!targetUser && args[0]) {
      const cleanId = args[0].replace(/[<@!>]/g, "");
      if (/^\d{17,20}$/.test(cleanId)) {
        targetUser = await client.users.fetch(cleanId).catch(() => null);
      }
    }
    if (!targetUser && args[1]) {
      const cleanId = args[1].replace(/[<@!>]/g, "");
      if (/^\d{17,20}$/.test(cleanId)) {
        targetUser = await client.users.fetch(cleanId).catch(() => null);
      }
    }
    if (!targetUser && args[2]) {
      const cleanId = args[2].replace(/[<@!>]/g, "");
      if (/^\d{17,20}$/.test(cleanId)) {
        targetUser = await client.users.fetch(cleanId).catch(() => null);
      }
    }

    const action = args[0]?.toLowerCase();
    const type = args[1]?.toLowerCase();
    const store = noprefixManager.getStore();
    const now = Date.now();

    // Direct User Shorthand: .np @User or .np add @User (without explicit action/type)
    if (targetUser && (action.startsWith("<@") || /^\d{17,20}$/.test(action) || action === "add")) {
      let durationArg = null;
      for (const a of args) {
        if (a.match(/^\d+[dhms]$/i) || a.toLowerCase() === "lifetime" || a.toLowerCase() === "perm") {
          durationArg = a;
          break;
        }
      }

      if (!durationArg) {
        const { buildDurationSelectionContainer } = require("../../lib/security/handleOwnerInteraction");
        const selectionContainer = buildDurationSelectionContainer(targetUser);
        return message.reply({
          components: [selectionContainer],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      } else {
        const durationMs = noprefixManager.parseDuration(durationArg);
        const durationLabel = noprefixManager.getDurationLabel(durationArg);

        noprefixManager.addNoPrefixUser(targetUser.id, durationMs, message.author.id);
        await noprefixManager.sendNoPrefixDM(client, targetUser.id, durationLabel, true);

        return message.reply({
          components: [buildSuccessNotice("No-Prefix Granted", `Granted No-Prefix access to <@${targetUser.id}> for **${durationLabel}**.\n\n-# Direct Message notification sent to user.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    if (!action || !["add", "remove", "list", "status"].includes(action)) {
      const helpContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.info || "📋"} NO-PREFIX SYSTEM COMMANDS\n\n` +
            `**➕ Add Access:**\n` +
            `\`\`\`\n.noprefix add user <@user|id> [duration|lifetime]\n.noprefix add server [id] [duration|lifetime]\n.noprefix add role <@role|id> [duration|lifetime]\n\`\`\`\n` +
            `**➖ Remove Access:**\n` +
            `\`\`\`\n.noprefix remove user <@user|id>\n.noprefix remove server [id]\n.noprefix remove role <@role|id>\n\`\`\`\n` +
            `**📊 Status & List:**\n` +
            `\`\`\`\n.noprefix list\n.noprefix status user <@user|id>\n\`\`\`\n` +
            `> **Duration Examples:** \`30d\`, \`7d\`, \`12h\`, \`lifetime\` (default: 90d)`
        )
      );
      return message.reply({
        components: [helpContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // List Grants
    if (action === "list") {
      const activeUsers = (store.users || []).filter((u) => u.expiresAt > now);
      const activeServers = (store.servers || []).filter((s) => s.expiresAt > now);
      const activeRoles = (store.roles || []).filter((r) => r.expiresAt > now);

      let content = "";

      if (activeUsers.length > 0) {
        content += "**👤 Users**\n";
        for (const u of activeUsers) {
          content += `> <@${u.id}> — ${noprefixManager.formatExpiry(u.expiresAt)}\n`;
        }
        content += "\n";
      }

      if (activeServers.length > 0) {
        content += "**🏠 Servers**\n";
        for (const s of activeServers) {
          const guild = client.guilds.cache.get(s.id);
          content += `> ${guild?.name || s.id} — ${noprefixManager.formatExpiry(s.expiresAt)}\n`;
        }
        content += "\n";
      }

      if (activeRoles.length > 0) {
        content += "**🎭 Roles**\n";
        for (const r of activeRoles) {
          const guild = client.guilds.cache.get(r.guildId);
          const role = guild?.roles.cache.get(r.roleId);
          content += `> ${role?.name || r.roleId} in *${guild?.name || r.guildId}* — ${noprefixManager.formatExpiry(r.expiresAt)}\n`;
        }
      }

      if (!content) content = "*No active no-prefix grants.*";

      const listContainer = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 📋 **ACTIVE NO-PREFIX GRANTS**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

      return message.reply({
        components: [listContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Status Check
    if (action === "status") {
      const targetArg = args[2] || message.author.id;
      const userId = targetArg.replace(/[<@!>]/g, "");

      if (noprefixManager.isOwner(userId, client)) {
        return message.reply({
          components: [buildSuccessNotice("Bot Owner", `<@${userId}> has **Lifetime No-Prefix** access automatically as a Bot Owner.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const userEntry = (store.users || []).find((u) => u.id === userId && u.expiresAt > now);
      if (userEntry) {
        return message.reply({
          components: [buildSuccessNotice("No-Prefix Active", `<@${userId}> has active No-Prefix access.\n> **Expires:** ${noprefixManager.formatExpiry(userEntry.expiresAt)}`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      } else {
        return message.reply({
          components: [buildErrorNotice("No Access", `<@${userId}> does not have active No-Prefix access.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    // Add / Remove Operations
    if (!type || !["user", "server", "role"].includes(type)) {
      return message.reply({
        components: [buildErrorNotice("Invalid Type", "Type must be `user`, `server`, or `role`.")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const targetArg = args[2];
    const durationArg = args[3];

    if (type === "user") {
      if (!targetArg) {
        return message.reply({
          components: [buildErrorNotice("Missing User", "Please mention a user or provide their ID.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const userId = targetArg.replace(/[<@!>]/g, "");

      if (action === "add") {
        const durationMs = noprefixManager.parseDuration(durationArg) || 90 * 24 * 60 * 60 * 1000;
        const durationLabel = noprefixManager.getDurationLabel(durationArg || durationMs);
        noprefixManager.addNoPrefixUser(userId, durationMs, message.author.id);
        await noprefixManager.sendNoPrefixDM(client, userId, durationLabel, true);

        return message.reply({
          components: [buildSuccessNotice("No-Prefix Granted", `Granted No-Prefix access to <@${userId}> for **${durationLabel}**.\n\n-# Direct Message notification sent to user.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = noprefixManager.removeNoPrefixUser(userId);
        if (removed) {
          await noprefixManager.sendNoPrefixDM(client, userId, "Expired", false);
        }
        return message.reply({
          components: [
            removed
              ? buildSuccessNotice("No-Prefix Revoked", `<@${userId}>'s No-Prefix access has been removed.\n\n-# Direct Message notification sent to user.`)
              : buildErrorNotice("Not Found", `<@${userId}> didn't have active No-Prefix access.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    if (type === "server") {
      const serverId = targetArg || message.guild.id;

      if (action === "add") {
        const durationMs = noprefixManager.parseDuration(durationArg) || 90 * 24 * 60 * 60 * 1000;
        const result = noprefixManager.addNoPrefixServer(serverId, durationMs, message.author.id);

        return message.reply({
          components: [buildSuccessNotice("No-Prefix Granted", `Granted No-Prefix access to Server \`${serverId}\` for **${noprefixManager.formatExpiry(result.expiresAt)}**.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = noprefixManager.removeNoPrefixServer(serverId);
        return message.reply({
          components: [
            removed
              ? buildSuccessNotice("No-Prefix Revoked", `Server \`${serverId}\` No-Prefix access has been removed.`)
              : buildErrorNotice("Not Found", `Server \`${serverId}\` didn't have active No-Prefix access.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    if (type === "role") {
      if (!targetArg) {
        return message.reply({
          components: [buildErrorNotice("Missing Role", "Please mention a role or provide its ID.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const roleId = targetArg.replace(/[<@&>]/g, "");

      if (action === "add") {
        const durationMs = noprefixManager.parseDuration(durationArg) || 90 * 24 * 60 * 60 * 1000;
        const result = noprefixManager.addNoPrefixRole(message.guild.id, roleId, durationMs, message.author.id);

        return message.reply({
          components: [buildSuccessNotice("No-Prefix Granted", `Granted No-Prefix access to Role <@&${roleId}> for **${noprefixManager.formatExpiry(result.expiresAt)}**.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = noprefixManager.removeNoPrefixRole(message.guild.id, roleId);
        return message.reply({
          components: [
            removed
              ? buildSuccessNotice("No-Prefix Revoked", `Role <@&${roleId}> No-Prefix access has been removed.`)
              : buildErrorNotice("Not Found", `Role <@&${roleId}> didn't have active No-Prefix access.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }
  },
};
