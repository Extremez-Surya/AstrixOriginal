const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["blacklistlist", "bllist", "blacklistshow"],
  category: "Owner",
  desc: "List all blacklisted users and servers.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    const store = noprefixManager.getStore();
    const users = store.blacklistedUsers || [];
    const servers = store.blacklistedServers || [];

    const userText = users.length > 0
      ? users.map((u, i) => `> \`${i + 1}.\` <@${u.id}> (\`${u.id}\`)\n> 📝 *Reason: ${u.reason}*`).join("\n")
      : "> *No blacklisted users.*";

    const serverText = servers.length > 0
      ? servers.map((s, i) => `> \`${i + 1}.\` ID: \`${s.id}\` — Reason: *${s.reason}*`).join("\n")
      : "> *No blacklisted servers.*";

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 **Global Blacklist Directory**\n` +
          `-# *Total: ${users.length} users • ${servers.length} servers*\n\n` +
          `**👤 Blacklisted Users:**\n${userText}\n\n` +
          `**🏠 Blacklisted Servers:**\n${serverText}`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Global Access Security`)
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
