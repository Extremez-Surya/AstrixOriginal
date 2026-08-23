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

function buildNotice(emoji, title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${emoji} **${title}**\n\n${description}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
}

module.exports = {
  alias: ["blacklist", "bl", "unblacklist", "unbl"],
  category: "Owner",
  desc: "Global blacklist quarantine management for users and servers.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply({
        components: [buildNotice("❌", "Access Denied", "Only bot owners can manage global blacklists.")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const action = args[0]?.toLowerCase();

    // Default: Help Menu & Action Hub
    if (!action || !["add", "remove", "list", "show"].includes(action)) {
      const store = noprefixManager.getStore();
      const users = store.blacklistedUsers || [];
      const servers = store.blacklistedServers || [];

      const helpContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🚫 **Global Blacklist Quarantine Suite**\n` +
            `-# *Permanent Network-Wide Command & Feature Lockdown*\n\n` +
            `**➕ Add Blacklist:**\n` +
            `\`\`\`\n.blacklist add user <@user|id> [reason]\n.blacklist add server <id> [reason]\n\`\`\`\n` +
            `**➖ Remove Blacklist:**\n` +
            `\`\`\`\n.blacklist remove user <@user|id>\n.blacklist remove server <id>\n\`\`\`\n` +
            `**📋 View Blacklist Directory:**\n` +
            `\`\`\`\n.blacklist list\n\`\`\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> • **Blacklisted Users:** \`${users.length}\`\n` +
            `> • **Blacklisted Servers:** \`${servers.length}\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("owner_btn_blacklist").setLabel("Blacklist User").setEmoji("🚫").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("owner_btn_unblacklist_user").setLabel("Unblacklist User").setEmoji("🔓").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("owner_btn_blacklist_server").setLabel("Blacklist Server").setEmoji("⛔").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("owner_tab_overview_btn").setLabel("Owner Hub").setEmoji("👑").setStyle(ButtonStyle.Secondary)
          )
        );

      return message.reply({
        components: [helpContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const store = noprefixManager.getStore();

    // List Action
    if (action === "list" || action === "show") {
      const users = store.blacklistedUsers || [];
      const servers = store.blacklistedServers || [];

      const userText = users.length > 0
        ? users.slice(0, 10).map((u, i) => `> \`${i + 1}.\` <@${u.id}> (\`${u.id}\`)\n> 📝 *Reason: ${u.reason}*`).join("\n")
        : "> *No blacklisted users.*";

      const serverText = servers.length > 0
        ? servers.slice(0, 5).map((s, i) => `> \`${i + 1}.\` ID: \`${s.id}\` — Reason: *${s.reason}*`).join("\n")
        : "> *No blacklisted servers.*";

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🚫 **Global Blacklist Directory**\n\n` +
            `**👤 Blacklisted Users (${users.length}):**\n` +
            `${userText}\n\n` +
            `**🏠 Blacklisted Servers (${servers.length}):**\n` +
            `${serverText}`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security Quarantine Directory`)
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const targetType = args[1]?.toLowerCase();
    const entityArg = args[2] || (["user", "server"].includes(targetType) ? null : args[1]);
    const reason = args.slice(3).join(" ") || "Violated bot terms of service.";

    if (!entityArg) {
      return message.reply({
        components: [buildNotice("❌", "Invalid Usage", "Usage: `.blacklist add <user|server> <id> [reason]`")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    const targetId = entityArg.replace(/[<@!>]/g, "");

    // User Blacklisting
    if (targetType === "user" || !["user", "server"].includes(targetType)) {
      if (action === "add") {
        if (noprefixManager.isOwner(targetId, client)) {
          return message.reply({
            components: [buildNotice("❌", "Action Blocked", "You cannot blacklist a Bot Owner.")],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => null);
        }

        noprefixManager.addBlacklistUser(targetId, reason, message.author.id);
        return message.reply({
          components: [
            buildNotice(
              "🚫",
              "User Blacklisted Globally",
              `> • **User:** <@${targetId}> (\`${targetId}\`)\n` +
              `> • **Reason:** *${reason}*\n` +
              `> • **Authorizer:** <@${message.author.id}>`
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = noprefixManager.removeBlacklistUser(targetId);
        return message.reply({
          components: [
            removed
              ? buildNotice("✅", "Blacklist Revoked", `User <@${targetId}> has been unblacklisted from Astrix.`)
              : buildNotice("❌", "Not Found", `User <@${targetId}> is not in the blacklist directory.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }

    // Server Blacklisting
    if (targetType === "server") {
      if (action === "add") {
        noprefixManager.addBlacklistServer(targetId, reason, message.author.id);
        return message.reply({
          components: [
            buildNotice(
              "⛔",
              "Server Blacklisted Globally",
              `> • **Server ID:** \`${targetId}\`\n` +
              `> • **Reason:** *${reason}*\n` +
              `> • **Authorizer:** <@${message.author.id}>`
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = noprefixManager.removeBlacklistServer(targetId);
        return message.reply({
          components: [
            removed
              ? buildNotice("✅", "Blacklist Revoked", `Server \`${targetId}\` has been unblacklisted.`)
              : buildNotice("❌", "Not Found", `Server \`${targetId}\` is not in the blacklist directory.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }
  },
};
