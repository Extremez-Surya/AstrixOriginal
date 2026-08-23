const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const { buildDurationSelectionContainer } = require("../../lib/security/handleOwnerInteraction");

function buildSuccessNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ✅ **${title}**\n\n${description}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
}

function buildErrorNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ❌ **${title}**\n\n${description}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
}

module.exports = {
  alias: ["noprefix", "np", "nonprefix"],
  category: "Owner",
  desc: "Manage zero-latency No-Prefix execution access for users, servers, or roles.",
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

    // Direct User Shorthand: .np @user or .np <userId>
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

    const action = args[0]?.toLowerCase();
    const type = args[1]?.toLowerCase();
    const store = noprefixManager.getStore();
    const now = Date.now();

    // 1. Direct interactive duration menu if targetUser provided without duration
    if (targetUser && (action.startsWith("<@") || /^\d{17,20}$/.test(action) || action === "add")) {
      let durationArg = null;
      for (const a of args) {
        if (a.match(/^\d+[dhms]$/i) || a.toLowerCase() === "lifetime" || a.toLowerCase() === "perm") {
          durationArg = a;
          break;
        }
      }

      if (!durationArg) {
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
          components: [
            buildSuccessNotice(
              "No-Prefix Access Granted",
              `> • **User:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
              `> • **Duration:** \`${durationLabel}\`\n` +
              `> • **Authorizer:** <@${message.author.id}>\n\n` +
              `-# Direct Message notification dispatched to recipient.`
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    // 2. Help Directory / Overview
    if (!action || !["add", "remove", "list", "check", "clean"].includes(action)) {
      const activeUsers = (store.users || []).filter((u) => u.expiresAt > now);
      const activeServers = (store.servers || []).filter((s) => s.expiresAt > now);

      const helpContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ⚡ **No-Prefix Management Suite**\n` +
            `-# *Zero-Latency Command Invocation Without Prefix*\n\n` +
            `**➕ Quick Grant Access:**\n` +
            `\`\`\`\n.np @user [duration]       (Opens duration selector if omitted)\n.np add server <guildId> [duration]\n.np add role <@role|id> [duration]\n\`\`\`\n` +
            `**➖ Revoke Access:**\n` +
            `\`\`\`\n.np remove user <@user|id>\n.np remove server <guildId>\n.np remove role <@role|id>\n\`\`\`\n` +
            `**📋 View Active Grants:**\n` +
            `\`\`\`\n.np list\n\`\`\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> • **Active Users:** \`${activeUsers.length}\`\n` +
            `> • **Active Servers:** \`${activeServers.length}\`\n` +
            `> • **Total Executions:** \`⚡ ${store.stats?.totalNoPrefixExecutions || 0}\` commands`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("owner_btn_add_user").setLabel("Grant User NP").setEmoji("⚡").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("owner_btn_add_server").setLabel("Grant Server NP").setEmoji("🏠").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("owner_tab_overview_btn").setLabel("Owner Hub").setEmoji("👑").setStyle(ButtonStyle.Secondary)
          )
        );

      return message.reply({
        components: [helpContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 3. List active grants
    if (action === "list") {
      const activeUsers = (store.users || []).filter((u) => u.expiresAt > now);
      const activeServers = (store.servers || []).filter((s) => s.expiresAt > now);

      const userText = activeUsers.length > 0
        ? activeUsers.slice(0, 10).map((u, i) => `> \`${i + 1}.\` <@${u.id}> (\`${u.id}\`) — ${noprefixManager.formatExpiry(u.expiresAt)}`).join("\n")
        : "> *No active no-prefix user grants.*";

      const serverText = activeServers.length > 0
        ? activeServers.slice(0, 5).map((s, i) => {
            const g = client.guilds.cache.get(s.id);
            return `> \`${i + 1}.\` **${g?.name || s.id}** (\`${s.id}\`) — ${noprefixManager.formatExpiry(s.expiresAt)}`;
          }).join("\n")
        : "> *No active no-prefix server grants.*";

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ⚡ **Active No-Prefix Grants Directory**\n\n` +
            `**👤 Active Users (${activeUsers.length}):**\n` +
            `${userText}\n\n` +
            `**🏠 Active Servers (${activeServers.length}):**\n` +
            `${serverText}`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# Total executions logged: ${store.stats?.totalNoPrefixExecutions || 0}`)
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 4. Remove actions
    if (action === "remove") {
      const removeType = args[1]?.toLowerCase();
      const entityArg = args[2] || args[1];

      if (!entityArg) {
        return message.reply({
          components: [buildErrorNotice("Usage Error", "Usage: `.np remove <user|server|role> <id>`")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      const targetId = entityArg.replace(/[<@!&>]/g, "");

      if (removeType === "server") {
        const removed = noprefixManager.removeNoPrefixServer(targetId);
        return message.reply({
          components: [
            removed
              ? buildSuccessNotice("Access Revoked", `No-Prefix access removed from Server \`${targetId}\`.`)
              : buildErrorNotice("Not Found", `Server \`${targetId}\` does not have active No-Prefix.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      // Default: Remove user
      const removed = noprefixManager.removeNoPrefixUser(targetId);
      return message.reply({
        components: [
          removed
            ? buildSuccessNotice("Access Revoked", `No-Prefix access removed from User <@${targetId}>.`)
            : buildErrorNotice("Not Found", `User <@${targetId}> does not have active No-Prefix.`),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
