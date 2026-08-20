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
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const path = require("path");
const allCategories = require("../../lib/categories.json");

module.exports = {
  name: "help",
  category: "Information",
  description:
    "Show all available commands, categories, or details for a specific command.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "command",
      description: "Search for a specific command or keyword.",
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async autocomplete(client, interaction) {
    const focusedValue = interaction.options.getFocused()?.toLowerCase() || "";

    const results = [];
    const seen = new Set();

    // Search message commands and slash commands
    if (client.messageCommands) {
      client.messageCommands.forEach((cmd) => {
        const name = cmd.alias ? cmd.alias[0] : cmd.name;
        if (!name || seen.has(name)) return;

        const matchesName = name.toLowerCase().includes(focusedValue);
        const matchesAlias = cmd.alias?.some((a) => a.toLowerCase().includes(focusedValue));
        const matchesDesc = (cmd.desc || cmd.description || "").toLowerCase().includes(focusedValue);
        const matchesCat = (cmd.category || "").toLowerCase().includes(focusedValue);

        if (!focusedValue || matchesName || matchesAlias || matchesDesc || matchesCat) {
          seen.add(name);
          const cat = cmd.category || "General";
          const desc = (cmd.desc || cmd.description || "Command").slice(0, 50);
          results.push({
            name: `.${name} (${cat}) ─ ${desc}`.slice(0, 100),
            value: name,
          });
        }
      });
    }

    await interaction.respond(results.slice(0, 25)).catch(() => null);
  },

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => null);

    const commandQuery = interaction.options
      .getString("command")
      ?.toLowerCase()
      ?.trim();

    if (commandQuery) {
      // 1. Exact Match
      const exactCmd =
        client.messageCommands?.get(commandQuery) ||
        client.messageCommands?.find((c) => c.alias && c.alias.includes(commandQuery)) ||
        client.slashCommands?.get(commandQuery);

      if (exactCmd) {
        const primaryName =
          exactCmd.name || (exactCmd.alias ? exactCmd.alias[0] : commandQuery);
        const aliasesList = exactCmd.alias
          ? exactCmd.alias.map((a) => `\`.${a}\``).join(", ")
          : `\`/${primaryName}\``;
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

        return interaction
          .editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          })
          .catch(() => null);
      }

      // 2. Keyword Search across all commands
      const matches = [];
      const seen = new Set();

      if (client.messageCommands) {
        client.messageCommands.forEach((cmd) => {
          const name = cmd.alias ? cmd.alias[0] : cmd.name;
          if (!name || seen.has(name)) return;

          const matchesName = name.toLowerCase().includes(commandQuery);
          const matchesAlias = cmd.alias?.some((a) => a.toLowerCase().includes(commandQuery));
          const matchesDesc = (cmd.desc || cmd.description || "").toLowerCase().includes(commandQuery);
          const matchesCat = (cmd.category || "").toLowerCase().includes(commandQuery);

          if (matchesName || matchesAlias || matchesDesc || matchesCat) {
            seen.add(name);
            matches.push({
              name,
              category: cmd.category || "General",
              desc: cmd.desc || cmd.description || "No description",
            });
          }
        });
      }

      if (matches.length > 0) {
        const matchLines = matches.slice(0, 15).map((m) => {
          return `> - \`.${m.name}\` (\`${m.category}\`) ── ${m.desc}`;
        });

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🔍 **Search Results for "${commandQuery}"**\n` +
              `-# *Found ${matches.length} matching command(s):*\n\n` +
              matchLines.join("\n") +
              (matches.length > 15 ? `\n\n*...and ${matches.length - 15} more.*` : "") +
              `\n\n-# *Tip: Type \`/help command:<name>\` to view details for a specific command.*`
            )
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE`)
          );

        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const notFoundContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> No Commands Found\n` +
          `-# *No commands matching search query \`${commandQuery}\` were found.*\n\n` +
          `> - **Tip:** Run \`/help\` without arguments to explore all categories.`,
        ),
      );
      return interaction
        .editReply({
          components: [notFoundContainer],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    }

    if (client.application.commands.cache.size === 0) {
      try {
        await client.application.commands.fetch();
      } catch (e) {}
    }
    const totalCommands = client.messageCommands?.size || client.slashCommands?.size || 0;

    const getCommandsForCategory = (categoryName) => {
      const list = [];
      client.messageCommands?.forEach((cmd) => {
        const cat = cmd.category || "Miscellaneous";
        if (cat.toLowerCase() === categoryName.toLowerCase()) {
          list.push(
            `\`.${cmd.alias[0]}\` - ${cmd.desc || "No description provided."}`,
          );
        }
      });
      return [...new Set(list)];
    };

    const getAliasesForCategory = (categoryName) => {
      const list = [];
      client.messageCommands?.forEach((cmd) => {
        const cat = cmd.category || "Miscellaneous";
        if (cat.toLowerCase() === categoryName.toLowerCase()) {
          list.push(`\`${cmd.alias[0]}\``);
        }
      });
      return [...new Set(list)];
    };

    const categories = {};
    for (const [name, data] of Object.entries(allCategories)) {
      if (getCommandsForCategory(name).length > 0) {
        categories[name] = data;
      }
    }

    const logoPath = path.join(__dirname, "../../assets/helpmenu.png");
    const bannerAttachment = new AttachmentBuilder(logoPath, {
      name: "helpmenu.png",
    });

    const mediaItem = new MediaGalleryItemBuilder().setURL(
      "attachment://helpmenu.png",
    );
    const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

    const menuOptions = [
      {
        label: "Home Overview",
        value: "home",
        description: "Return to the main category overview.",
        emoji: "<:home:1528317590848540762>",
      },
      ...Object.keys(categories).map((cat) => {
        const cmds = getCommandsForCategory(cat);
        return {
          label: cat,
          value: cat.toLowerCase(),
          description: `${cmds.length} command(s)`,
          emoji: categories[cat].emoji,
        };
      }),
    ].slice(0, 25);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_category_select")
      .setPlaceholder("Choose a category to explore...")
      .addOptions(menuOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const buildContainer = (
      categoryName,
      categoryEmoji,
      commandsListText,
      menuRow,
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
        .addActionRowComponents(menuRow);
    };

    const buildMainContainer = (menuRow) => {
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
            ` > **Prefix:** \`.\` | **Commands:** \`${totalCommands}\`\n` +
            ` > **Search:** Type \`/help command:<keyword>\` for instant search`,
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
        .addActionRowComponents(menuRow);
    };

    const response = await interaction.editReply({
      components: [buildMainContainer(row)],
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
          components: [buildMainContainer(row)],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        const selectedCategoryName = Object.keys(categories).find(
          (c) => c.toLowerCase() === selectedValue,
        );
        const categoryEmoji = categories[selectedCategoryName]?.emoji || "📁";
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
            buildContainer(
              selectedCategoryName,
              categoryEmoji,
              commandsListText,
              row,
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    });

    collector.on("end", () => {
      selectMenu.setDisabled(true);
      const disabledRow = new ActionRowBuilder().addComponents(selectMenu);
      interaction
        .editReply({ components: [buildMainContainer(disabledRow)] })
        .catch(() => {});
    });
  },
};
