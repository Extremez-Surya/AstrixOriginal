const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["servers", "guilds", "serverlist"],
  category: "Owner",
  desc: "List all active guilds or force leave a guild.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    const action = args[0]?.toLowerCase();

    if (action === "leave") {
      const targetGuildId = args[1];
      if (!targetGuildId) return message.reply("❌ Usage: `.servers leave <guildId>`").catch(() => null);

      const targetGuild = client.guilds.cache.get(targetGuildId);
      if (!targetGuild) return message.reply(`❌ Guild \`${targetGuildId}\` not found in cache.`).catch(() => null);

      const guildName = targetGuild.name;
      await targetGuild.leave().catch(() => null);

      return message.reply(`✅ Successfully left guild **${guildName}** (\`${targetGuildId}\`).`).catch(() => null);
    }

    // Default: List servers
    const guilds = Array.from(client.guilds.cache.values());
    guilds.sort((a, b) => b.memberCount - a.memberCount);

    const page = parseInt(args[0], 10) || 1;
    const perPage = 10;
    const totalPages = Math.ceil(guilds.length / perPage) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * perPage;
    const pageItems = guilds.slice(start, start + perPage);

    const listText = pageItems
      .map((g, i) => `\`${start + i + 1}.\` **${g.name}** (\`${g.id}\`) — 👥 \`${g.memberCount}\` members`)
      .join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🏠 **ASTRIX SERVERS DIRECTORY** (${guilds.length} total)`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(listText))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page ${safePage} of ${totalPages} • Use \`.servers <page>\` or \`.servers leave <guildId>\``)
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
