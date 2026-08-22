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

module.exports = {
  alias: ["emojilist"],
  category: "Information",
  desc: "View all custom emojis and stickers on this server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;

    // Helper to build page layout
    const buildAssetPage = (type, pageIndex, disableAll = false) => {
      let itemsList = [];
      let pageSize = 45;
      let displayTitle = "";

      if (type === "static") {
        itemsList = [...guild.emojis.cache.filter((e) => !e.animated).values()];
        pageSize = 45;
        displayTitle = "Static Emojis";
      } else if (type === "animated") {
        itemsList = [...guild.emojis.cache.filter((e) => e.animated).values()];
        pageSize = 45;
        displayTitle = "Animated Emojis";
      }

      const totalItems = itemsList.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const currentPage = Math.min(pageIndex, totalPages - 1);

      const start = currentPage * pageSize;
      const end = start + pageSize;
      const sliced = itemsList.slice(start, end);

      let gridContent = "";
      if (totalItems === 0) {
        gridContent = `*No ${displayTitle.toLowerCase()} registered in this server.*`;
      } else {
        gridContent = sliced.map((e) => e.toString()).join(" ");
      }

      const content = [
        `### <:assetemoji:1539875495271731250> Server Emojis: ${guild.name}`,
        `-# *Directory of custom server emojis.*`,
        "",
        gridContent,
        "",
        `> <:stats:1539875420256866314> **Current View:** \`${displayTitle}\``,
        `> <:clock:1539875400975388713> **Page:** \`${currentPage + 1} of ${totalPages}\` (Total Items: \`${totalItems}\`)`,
      ].join("\n");

      // Buttons
      const prevBtn = new ButtonBuilder()
        .setCustomId("emojilist_prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableAll || currentPage === 0);

      const nextBtn = new ButtonBuilder()
        .setCustomId("emojilist_next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableAll || currentPage >= totalPages - 1);

      const staticBtn = new ButtonBuilder()
        .setCustomId("emojilist_static")
        .setLabel("Static")
        .setStyle(
          type === "static" ? ButtonStyle.Primary : ButtonStyle.Secondary,
        )
        .setDisabled(disableAll);

      const animatedBtn = new ButtonBuilder()
        .setCustomId("emojilist_animated")
        .setLabel("Animated")
        .setStyle(
          type === "animated" ? ButtonStyle.Primary : ButtonStyle.Secondary,
        )
        .setDisabled(disableAll);

      const row = new ActionRowBuilder().addComponents(
        prevBtn,
        nextBtn,
        staticBtn,
        animatedBtn,
      );

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *<:astrix:1539875362945900574> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        )
        .addActionRowComponents(row);

      return { container, totalPages, currentPage };
    };

    let currentType = "static";
    let currentPage = 0;
    let pageData = buildAssetPage(currentType, currentPage);

    const replyMsg = await message.reply({
      components: [pageData.container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const filter = (i) => i.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "emojilist_prev" && currentPage > 0) {
        currentPage--;
      } else if (
        i.customId === "emojilist_next" &&
        currentPage < pageData.totalPages - 1
      ) {
        currentPage++;
      } else if (i.customId === "emojilist_static") {
        currentType = "static";
        currentPage = 0;
      } else if (i.customId === "emojilist_animated") {
        currentType = "animated";
        currentPage = 0;
      }

      pageData = buildAssetPage(currentType, currentPage);
      await i.editReply({
        components: [pageData.container],
        allowedMentions: { parse: [], repliedUser: false },
      });
    });

    collector.on("end", async () => {
      try {
        const finalData = buildAssetPage(currentType, currentPage, true);
        await replyMsg.edit({
          components: [finalData.container],
          allowedMentions: { parse: [], repliedUser: false },
        });
      } catch (e) {}
    });
  },
};
