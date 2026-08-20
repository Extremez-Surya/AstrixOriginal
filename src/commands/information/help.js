const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  AttachmentBuilder,
  ComponentType,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const path = require("path");
const allCategories = require("../../lib/categories.json");

module.exports = {
  alias: ["help", "h", "commands", "cmds"],
  category: "Information",
  desc: "Show all available commands, categories, or details for a specific command.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    // 1. Direct Command Lookup / Details (e.g. .help snipe or .help ban)
    if (args[0]) {
      const query = args[0].toLowerCase().trim();

      const exactCmd =
        client.messageCommands.get(query) ||
        client.messageCommands.find((c) => c.alias && c.alias.includes(query));

      if (!exactCmd) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Command Not Found\n` +
            `-# *No command or alias matching \`${args[0]}\` was found in the database.*\n\n` +
            `> - **Tip:** Type \`.help\` without arguments to explore all categories.`,
          ),
        );
        return message
          .reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [], repliedUser: false },
          })
          .catch(() => null);
      }

      const primaryName = exactCmd.alias[0];
      const aliasesList = exactCmd.alias.map((a) => `\`.${a}\``).join(", ");
      const description =
        exactCmd.desc || exactCmd.description || "No description provided.";
      const category = exactCmd.category || "General";

      const detailsContent = [
        `### <:astrix:1527205612205903973> Command Info ── \`.${primaryName}\``,
        `-# *${description}*\n`,
        `> -# 📁 **Category:** \`${category}\``,
        `> -# <:prefix:1528309903972892772> **Aliases:** ${aliasesList}`,
      ].join("\n");

      const footerText = `-# Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE`;

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(detailsContent),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(footerText),
        );

      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    // 2. 100% Dynamic Auto-Fetch System for All Categories
    const categoryMap = new Map();

    client.messageCommands.forEach((cmd) => {
      const cat = cmd.category || "Miscellaneous";
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat).push(cmd);
    });

    const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) =>
      a.localeCompare(b),
    );

    const totalCommands = client.messageCommands.size;

    const getAliasesForCategory = (categoryName) => {
      const cmds = categoryMap.get(categoryName) || [];
      const list = cmds.map((cmd) => `\`${cmd.alias[0]}\``);
      return [...new Set(list)];
    };

    const logoPath = path.join(__dirname, "../../assets/helpmenu.png");
    const bannerAttachment = new AttachmentBuilder(logoPath, {
      name: "helpmenu.png",
    });

    const mediaItem = new MediaGalleryItemBuilder().setURL(
      "attachment://helpmenu.png",
    );
    const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

    // Auto-chunk categories into batches of 24 to adhere to Discord's 25-item limit (+ 1 Home item)
    const CHUNK_SIZE = 24;
    const categoryChunks = [];
    for (let i = 0; i < sortedCategories.length; i += CHUNK_SIZE) {
      categoryChunks.push(sortedCategories.slice(i, i + CHUNK_SIZE));
    }

    const buildActionRows = (disabled = false) => {
      return categoryChunks.map((chunk, index) => {
        const options = [
          {
            label: "Home Overview",
            value: "home",
            description: "Return to the main category overview.",
            emoji: "<:home:1528317590848540762>",
          },
          ...chunk.map((cat) => {
            const cmds = categoryMap.get(cat) || [];
            const uniqueAliases = [...new Set(cmds.map((c) => c.alias[0]))];
            return {
              label: cat,
              value: cat.toLowerCase(),
              description: `${uniqueAliases.length} command(s)`,
              emoji: allCategories[cat]?.emoji || "📁",
            };
          }),
        ];

        const placeholder =
          categoryChunks.length > 1
            ? `Explore Categories (Part ${index + 1}/${categoryChunks.length})...`
            : `Choose a category to explore...`;

        const menu = new StringSelectMenuBuilder()
          .setCustomId(`help_category_select_${index}`)
          .setPlaceholder(placeholder)
          .setDisabled(disabled)
          .addOptions(options);

        return new ActionRowBuilder().addComponents(menu);
      });
    };

    const actionRows = buildActionRows(false);

    const buildCategoryContainer = (
      categoryName,
      categoryEmoji,
      commandsListText,
    ) => {
      return new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${categoryEmoji} ${categoryName} Commands`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(commandsListText),
        )
        .addActionRowComponents(...actionRows);
    };

    const buildMainContainer = (menuRows = actionRows) => {
      return new ContainerBuilder()
        .addMediaGalleryComponents(mediaGallery)
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *Your ultimate network diagnostics companion — powerful, clean & always accurate.*\n` +
              `[Support](https://discord.gg/FR9pXG2Mwb) • [Website](https://extremez.vercel.app/)`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            ` > **Prefix:** \`.\` | **Commands:** \`${totalCommands}\` | **Categories:** \`${sortedCategories.length}\``,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *<:astrix:1527205612205903973> Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        )
        .addActionRowComponents(...menuRows);
    };

    const response = await message.reply({
      components: [buildMainContainer()],
      files: [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "You cannot interact with this menu.",
          ephemeral: true,
        });
      }

      const selectedValue = interaction.values[0];

      if (selectedValue === "home") {
        await interaction.update({
          components: [buildMainContainer()],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        const selectedCategoryName = sortedCategories.find(
          (c) => c.toLowerCase() === selectedValue,
        );
        const categoryEmoji = allCategories[selectedCategoryName]?.emoji || "📁";
        const categoryAliases = getAliasesForCategory(selectedCategoryName);

        let commandsListText = "";
        if (categoryAliases.length === 0) {
          commandsListText = `*No commands available in this category yet.*\n\n**Total:** \`0\` commands`;
        } else {
          commandsListText =
            categoryAliases.join(" , ") +
            `\n\n**Total:** ${categoryAliases.length} commands`;
        }

        await interaction.update({
          components: [
            buildCategoryContainer(
              selectedCategoryName,
              categoryEmoji,
              commandsListText,
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    });

    collector.on("end", () => {
      const disabledRows = buildActionRows(true);
      response
        .edit({ components: [buildMainContainer(disabledRows)] })
        .catch(() => {});
    });
  },
};
