const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
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
const EMOJIS = require("../../lib/emojis");

module.exports = {
  name: "help",
  category: "Information",
  description:
    "Show all available commands, categories, or details for a specific command.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "command",
      description: "Specific command to view details for.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => null);

    const commandQuery = interaction.options
      .getString("command")
      ?.toLowerCase()
      ?.trim();

    if (commandQuery) {
      const targetCmd =
        client.messageCommands?.get(commandQuery) ||
        client.messageCommands?.find(
          (c) => c.alias && c.alias.includes(commandQuery),
        ) ||
        client.slashCommands?.get(commandQuery);

      if (!targetCmd) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.red_star || "⭐"} Command Not Found\n` +
              `-# *No command matching \`${commandQuery}\` was found in the database.*\n\n` +
              `> - **Tip:** Run \`/help\` without arguments to explore all command categories.`,
          ),
        );
        return interaction
          .editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          })
          .catch(() => null);
      }

      const primaryName =
        targetCmd.name || (targetCmd.alias ? targetCmd.alias[0] : commandQuery);
      const aliasesList = targetCmd.alias
        ? targetCmd.alias.map((a) => `\`.${a}\``).join(", ")
        : `\`/${primaryName}\``;
      const description =
        targetCmd.desc || targetCmd.description || "No description provided.";
      const category = targetCmd.category || "General";

      const detailsContent = [
        `### ${EMOJIS.astrix || "✨"} Command Info ── \`.${primaryName}\``,
        `-# *${description}*\n`,
        `> -# 📁 **Category:** \`${category}\``,
        `> -# ${EMOJIS.prefix || "⚡"} **Aliases:** ${aliasesList}`,
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

      return interaction
        .editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    }

    // Dynamic Auto-Fetch System for All Categories
    const categoryMap = new Map();

    client.messageCommands?.forEach((cmd) => {
      const cat = cmd.category || "Miscellaneous";
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat).push(cmd);
    });

    const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) =>
      a.localeCompare(b),
    );

    const totalCommands =
      client.messageCommands?.size || client.slashCommands?.size || 0;

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

    // Group categories into Main Modules and Extra Modules
    const MAIN_CATEGORY_NAMES = [
      "Anti Nuke",
      "Anti Raid",
      "Automod",
      "Security",
      "Moderation",
      "Logging",
      "Server",
      "Configuration",
      "Utility",
      "Custom Roles",
      "Information",
      "General",
      "Owner",
    ];

    const mainCategories = [];
    const extraCategories = [];

    sortedCategories.forEach((cat) => {
      if (MAIN_CATEGORY_NAMES.includes(cat)) {
        mainCategories.push(cat);
      } else {
        extraCategories.push(cat);
      }
    });

    const categoryGroups = [
      {
        id: "main",
        placeholder: "Explore Main Modules...",
        categories: mainCategories,
      },
      {
        id: "extra",
        placeholder: "Explore Extra Modules...",
        categories: extraCategories,
      },
    ];

    const buildActionRows = (disabled = false) => {
      return categoryGroups
        .filter((group) => group.categories.length > 0)
        .map((group) => {
          const options = [
            {
              label: "Home Overview",
              value: "home",
              description: "Return to the main category overview.",
              emoji: "🏠",
            },
            ...group.categories.map((cat) => {
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

          const menu = new StringSelectMenuBuilder()
            .setCustomId(`help_category_select_${group.id}`)
            .setPlaceholder(group.placeholder)
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
            `-# *${EMOJIS.astrix || "✨"} Built with ${EMOJIS.Red_heart || "❤️"} by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        )
        .addActionRowComponents(...menuRows);
    };

    const response = await interaction.editReply({
      components: [buildMainContainer()],
      files: [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "You cannot interact with this menu.",
          ephemeral: true,
        });
      }

      const selectedValue = i.values[0];

      if (selectedValue === "home") {
        await i.update({
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

        await i.update({
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
      interaction
        .editReply({ components: [buildMainContainer(disabledRows)] })
        .catch(() => {});
    });
  },
};
