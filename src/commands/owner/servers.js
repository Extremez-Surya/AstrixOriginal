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

module.exports = {
  alias: ["servers", "guilds", "serverlist", "guildlist"],
  category: "Owner",
  desc: "List connected servers with interactive pagination or force leave a guild.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Bot Owner command.").catch(() => null);
    }

    const action = args[0]?.toLowerCase();

    // Direct Leave Action: .servers leave <guildId>
    if (action === "leave") {
      const targetGuildId = args[1];
      if (!targetGuildId) return message.reply("❌ Usage: `.servers leave <guildId>`").catch(() => null);

      const targetGuild = client.guilds.cache.get(targetGuildId);
      if (!targetGuild) return message.reply(`❌ Guild \`${targetGuildId}\` not found in cache.`).catch(() => null);

      const guildName = targetGuild.name;
      await targetGuild.leave().catch(() => null);

      const confirmContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🚪 **Left Guild Successfully**\n\n` +
            `> • **Guild Name:** **${guildName}**\n` +
            `> • **Guild ID:** \`${targetGuildId}\`\n` +
            `> • **Action By:** <@${message.author.id}>`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

      return message.reply({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // Default: Paginated Server Explorer
    const guilds = Array.from(client.guilds.cache.values());
    guilds.sort((a, b) => b.memberCount - a.memberCount);

    const totalMembers = guilds.reduce((sum, g) => sum + (g.memberCount || 0), 0);
    const page = parseInt(args[0], 10) || 1;
    const perPage = 8;
    const totalPages = Math.ceil(guilds.length / perPage) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * perPage;
    const pageItems = guilds.slice(start, start + perPage);

    const listText = pageItems
      .map((g, i) => `> \`${start + i + 1}.\` **${g.name}** (\`${g.id}\`)\n> 👥 \`${g.memberCount.toLocaleString()}\` members • 👑 Owner: <@${g.ownerId}>`)
      .join("\n\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🏠 **Astrix Global Guilds Explorer**\n` +
          `-# *Total Connected: ${guilds.length} servers • ${totalMembers.toLocaleString()} members*\n\n` +
          `${listText || "> *No servers found.*"}`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`owner_servers_page:${safePage - 1}`)
            .setLabel("Previous")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(safePage <= 1),
          new ButtonBuilder()
            .setCustomId(`owner_servers_page:${safePage + 1}`)
            .setLabel("Next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(safePage >= totalPages),
          new ButtonBuilder()
            .setCustomId("owner_btn_leave_server")
            .setLabel("Leave Guild")
            .setEmoji("🚪")
            .setStyle(ButtonStyle.Danger)
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page ${safePage} of ${totalPages} • Use \`.servers leave <guildId>\` to leave a guild`)
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
