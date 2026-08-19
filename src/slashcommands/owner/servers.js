const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  name: "servers",
  category: "Owner",
  description: "List all active guilds or force leave a guild (Bot Owner Only).",
  type: ApplicationCommandType.ChatInput,
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  options: [
    {
      name: "list",
      description: "List cached server guilds.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "page",
          description: "Page number.",
          type: ApplicationCommandOptionType.Integer,
          required: false,
          minValue: 1,
        },
      ],
    },
    {
      name: "leave",
      description: "Force leave a guild.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "guild_id",
          description: "Target Guild ID to leave.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],

  async execute(client, interaction) {
    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      return interaction.reply({ content: "❌ Access Denied: Bot Owner command.", ephemeral: true }).catch(() => null);
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "leave") {
      const targetGuildId = interaction.options.getString("guild_id");
      const targetGuild = client.guilds.cache.get(targetGuildId);
      if (!targetGuild) return interaction.reply({ content: `❌ Guild \`${targetGuildId}\` not found in cache.`, ephemeral: true }).catch(() => null);

      const guildName = targetGuild.name;
      await targetGuild.leave().catch(() => null);

      return interaction.reply({ content: `✅ Successfully left guild **${guildName}** (\`${targetGuildId}\`).` }).catch(() => null);
    }

    const guilds = Array.from(client.guilds.cache.values());
    guilds.sort((a, b) => b.memberCount - a.memberCount);

    const page = interaction.options.getInteger("page") || 1;
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
        new TextDisplayBuilder().setContent(`-# Page ${safePage} of ${totalPages}`)
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
