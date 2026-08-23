const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["blacklistadd", "bladd", "bl-add"],
  category: "Owner",
  desc: "Directly blacklist a user or server globally.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    let targetUser = message.mentions.users.first();
    let targetId = args[0]?.replace(/[<@!>]/g, "");

    if (!targetId) {
      return message.reply("❌ Usage: `.bladd <@user|userId|guildId> [reason]`").catch(() => null);
    }

    const reason = args.slice(1).join(" ") || "Violated terms of service.";

    if (noprefixManager.isOwner(targetId, client)) {
      return message.reply("❌ You cannot blacklist a Bot Owner.").catch(() => null);
    }

    noprefixManager.addBlacklistUser(targetId, reason, message.author.id);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 **Global Blacklist Added**\n\n` +
          `> • **Target:** <@${targetId}> (\`${targetId}\`)\n` +
          `> • **Reason:** *${reason}*\n` +
          `> • **Authorizer:** <@${message.author.id}>`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Target has been quarantined across all bot instances.`)
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
