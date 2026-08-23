const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["blacklistremove", "blremove", "bldel", "unblacklistuser"],
  category: "Owner",
  desc: "Directly revoke a global user or server blacklist.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId) {
      return message.reply("❌ Usage: `.blremove <@user|userId|guildId>`").catch(() => null);
    }

    const userRemoved = noprefixManager.removeBlacklistUser(targetId);
    const serverRemoved = noprefixManager.removeBlacklistServer(targetId);

    if (userRemoved || serverRemoved) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ **Global Blacklist Revoked**\n\n` +
            `> • **Target:** <@${targetId}> (\`${targetId}\`)\n` +
            `> • **Status:** \`Quarantine Lifted\`\n` +
            `> • **Authorizer:** <@${message.author.id}>`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } else {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### ❌ **Target Not Found**\n\n> Target \`${targetId}\` is not in the blacklist directory.`)
        );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }
  },
};
