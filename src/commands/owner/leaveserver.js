const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["leaveserver", "guildleave", "forceleave", "gleave"],
  category: "Owner",
  desc: "Force the bot to leave a specified server by Guild ID.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    const guildId = args[0] || message.guild?.id;
    if (!guildId) {
      return message.reply("❌ Usage: `.leaveserver <guildId>`").catch(() => null);
    }

    const targetGuild = client.guilds.cache.get(guildId);
    if (!targetGuild) {
      return message.reply(`❌ Guild \`${guildId}\` not found in cache.`).catch(() => null);
    }

    const guildName = targetGuild.name;
    const memberCount = targetGuild.memberCount;
    const ownerId = targetGuild.ownerId;

    await targetGuild.leave().catch((err) => {
      return message.reply(`❌ Failed to leave guild: ${err.message}`).catch(() => null);
    });

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚪 **Force Guild Departure**\n\n` +
          `> • **Guild Name:** **${guildName}**\n` +
          `> • **Guild ID:** \`${guildId}\`\n` +
          `> • **Members:** \`${memberCount}\` users\n` +
          `> • **Server Owner:** <@${ownerId}>\n` +
          `> • **Authorizer:** <@${message.author.id}>`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Successfully disconnected bot from target guild.`)
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
