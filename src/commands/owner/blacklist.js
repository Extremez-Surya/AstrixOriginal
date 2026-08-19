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
  alias: ["blacklist", "bl", "unblacklist"],
  category: "Owner",
  desc: "Blacklist or unblacklist users or servers from Astrix.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply({
        components: [buildErrorNotice("Access Denied", "Only bot owners can manage global blacklists.")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const action = args[0]?.toLowerCase();
    const targetArg = args[1];
    const reason = args.slice(2).join(" ") || "Violated terms of service.";

    if (!action || !["add", "remove", "list"].includes(action)) {
      const helpContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 **GLOBAL BLACKLIST SYSTEM**\n\n` +
            `**➕ Add Blacklist:**\n` +
            `\`\`\`\n.blacklist add user <@user|id> [reason]\n.blacklist add server <id> [reason]\n\`\`\`\n` +
            `**➖ Remove Blacklist:**\n` +
            `\`\`\`\n.blacklist remove user <@user|id>\n.blacklist remove server <id>\n\`\`\`\n` +
            `**📋 List Directory:**\n` +
            `\`\`\`\n.blacklist list\n\`\`\``
        )
      );
      return message.reply({
        components: [helpContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const store = noprefixManager.getStore();

    if (action === "list") {
      const users = store.blacklistedUsers || [];
      const servers = store.blacklistedServers || [];

      let userText = users.length > 0 ? users.map((u, i) => `\`${i + 1}.\` <@${u.id}> (\`${u.id}\`) — Reason: ${u.reason}`).join("\n") : "*No blacklisted users.*";
      let serverText = servers.length > 0 ? servers.map((s, i) => `\`${i + 1}.\` ID: \`${s.id}\` — Reason: ${s.reason}`).join("\n") : "*No blacklisted servers.*";

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🚫 **GLOBAL BLACKLIST DIRECTORY**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**👤 Blacklisted Users:**\n${userText}\n\n**🏠 Blacklisted Servers:**\n${serverText}`));

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const targetType = args[1]?.toLowerCase();
    const entityArg = args[2];

    if (!targetType || !["user", "server"].includes(targetType) || !entityArg) {
      return message.reply({
        components: [buildErrorNotice("Invalid Usage", "Usage: `.blacklist add <user|server> <id> [reason]`")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const targetId = entityArg.replace(/[<@!>]/g, "");

    if (targetType === "user") {
      if (action === "add") {
        if (noprefixManager.isOwner(targetId, client)) {
          return message.reply({
            components: [buildErrorNotice("Action Blocked", "You cannot blacklist a Bot Owner.")],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { repliedUser: false },
          }).catch(() => null);
        }

        noprefixManager.addBlacklistUser(targetId, reason, message.author.id);
        return message.reply({
          components: [buildSuccessNotice("User Blacklisted", `User <@${targetId}> has been blacklisted from using Astrix.\n> **Reason:** ${reason}`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = noprefixManager.removeBlacklistUser(targetId);
        return message.reply({
          components: [
            removed
              ? buildSuccessNotice("Blacklist Revoked", `User <@${targetId}> has been unblacklisted.`)
              : buildErrorNotice("Not Found", `User <@${targetId}> is not in the blacklist directory.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    if (targetType === "server") {
      if (action === "add") {
        noprefixManager.addBlacklistServer(targetId, reason, message.author.id);
        return message.reply({
          components: [buildSuccessNotice("Server Blacklisted", `Server \`${targetId}\` has been blacklisted.\n> **Reason:** ${reason}`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = noprefixManager.removeBlacklistServer(targetId);
        return message.reply({
          components: [
            removed
              ? buildSuccessNotice("Blacklist Revoked", `Server \`${targetId}\` has been unblacklisted.`)
              : buildErrorNotice("Not Found", `Server \`${targetId}\` is not in the blacklist directory.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }
  },
};
