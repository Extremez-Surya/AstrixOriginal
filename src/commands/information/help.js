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
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const path = require("path");
const allCategories = require("../../lib/categories.json");

module.exports = {
  alias: ["help", "h", "commands", "cmds"],
  category: "Information",
  desc: "Show all available commands, categories, or search for commands.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    // 1. Direct Search / Help Query (e.g. .help snipe or .help ban or .help leveling)
    if (args[0]) {
      const query = args.join(" ").toLowerCase().trim();

      // Exact match check
      const exactCmd =
        client.messageCommands.get(query) ||
        client.messageCommands.find((c) => c.alias && c.alias.includes(query));

      if (exactCmd) {
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

      // Keyword / Fuzzy Search across all commands
      const matches = [];
      const seen = new Set();

      client.messageCommands.forEach((cmd) => {
        const name = cmd.alias ? cmd.alias[0] : "";
        if (!name || seen.has(name)) return;

        const matchesName = name.toLowerCase().includes(query);
        const matchesAlias = cmd.alias?.some((a) => a.toLowerCase().includes(query));
        const matchesDesc = (cmd.desc || cmd.description || "").toLowerCase().includes(query);
        const matchesCat = (cmd.category || "").toLowerCase().includes(query);

        if (matchesName || matchesAlias || matchesDesc || matchesCat) {
          seen.add(name);
          matches.push({
            name,
            category: cmd.category || "General",
            desc: cmd.desc || cmd.description || "No description",
          });
        }
      });

      if (matches.length > 0) {
        const matchLines = matches.slice(0, 15).map((m) => {
          return `> - \`.${m.name}\` (\`${m.category}\`) ── ${m.desc}`;
        });

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🔍 **Search Results for "${query}"**\n` +
              `-# *Found ${matches.length} matching command(s):*\n\n` +
              matchLines.join("\n") +
              (matches.length > 15 ? `\n\n*...and ${matches.length - 15} more.*` : "") +
              `\n\n-# *Tip: Type \`.help <command_name>\` to view details for a specific command.*`
            )
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE`)
          );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const notFoundContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> No Commands Found\n` +
          `-# *No commands matching search query \`${query}\` were found.*\n\n` +
          `> - **Tip:** Type \`.help\` without arguments to explore all categories.`,
        ),
      );
      return message
        .reply({
          components: [notFoundContainer],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    // 2. Default Full Interactive Categories & Search Menu
    const totalCommands = client.messageCommands.size;

    const getCommandsForCategory = (categoryName) => {
      const list = [];
      client.messageCommands.forEach((cmd) => {
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
      client.messageCommands.forEach((cmd) => {
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
      {
        label: "🔍 Search Commands",
        value: "search",
        description: "Search commands by keyword or name.",
        emoji: "🔍",
      },
      ...Object.keys(categories).map((cat) => {
        const cmds = getCommandsForCategory(cat);
        return {
          label: cat,
          value: cat.toLowerCase(),
          description: `${cmds.length} command(s)`,
          emoji: categories[cat].emoji || "📁",
        };
      }),
    ].slice(0, 25);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_category_select")
      .setPlaceholder("Choose a category or search commands...")
      .addOptions(menuOptions);

    const searchBtn = new ButtonBuilder()
      .setCustomId("help_search_btn")
      .setLabel("Search Commands")
      .setEmoji("🔍")
      .setStyle(ButtonStyle.Primary);

    const homeBtn = new ButtonBuilder()
      .setCustomId("help_home_btn")
      .setLabel("Home")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Secondary);

    const menuRow = new ActionRowBuilder().addComponents(selectMenu);
    const btnRow = new ActionRowBuilder().addComponents(searchBtn, homeBtn);

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
        .addActionRowComponents(menuRow, btnRow);
    };

    const buildMainContainer = () => {
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
            ` > **Search:** Click \`🔍 Search Commands\` or type \`.help <keyword>\``,
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
        .addActionRowComponents(menuRow, btnRow);
    };

    const response = await message.reply({
      components: [buildMainContainer()],
      files: [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = response.createMessageComponentCollector({
      time: 300000,
    });

    const triggerSearchPrompt = async (interaction) => {
      const promptContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔍 **Search Astrix Commands**\n` +
            `-# *Please send a message with your search keyword in this channel within 30 seconds...*\n\n` +
            `> *Example: \`ban\`, \`snipe\`, \`voice\`, \`level\`*`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addActionRowComponents(menuRow, btnRow);

      await interaction.update({
        components: [promptContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      const msgFilter = (m) => m.author.id === message.author.id;
      const msgCollector = message.channel.createMessageCollector({
        filter: msgFilter,
        time: 30000,
        max: 1,
      });

      msgCollector.on("collect", async (userMsg) => {
        const query = userMsg.content.toLowerCase().trim();
        userMsg.delete().catch(() => null);

        const matches = [];
        const seen = new Set();

        client.messageCommands.forEach((cmd) => {
          const name = cmd.alias ? cmd.alias[0] : "";
          if (!name || seen.has(name)) return;

          const matchesName = name.toLowerCase().includes(query);
          const matchesAlias = cmd.alias?.some((a) => a.toLowerCase().includes(query));
          const matchesDesc = (cmd.desc || cmd.description || "").toLowerCase().includes(query);
          const matchesCat = (cmd.category || "").toLowerCase().includes(query);

          if (matchesName || matchesAlias || matchesDesc || matchesCat) {
            seen.add(name);
            matches.push({
              name,
              category: cmd.category || "General",
              desc: cmd.desc || cmd.description || "No description",
            });
          }
        });

        let searchResultText = "";
        if (matches.length === 0) {
          searchResultText = `*No commands found matching \`${query}\`.*`;
        } else {
          searchResultText =
            matches.slice(0, 15).map((m) => `> - \`.${m.name}\` (\`${m.category}\`) ── ${m.desc}`).join("\n") +
            (matches.length > 15 ? `\n\n*...and ${matches.length - 15} more matches.*` : "");
        }

        const resultContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🔍 **Search Results for "${query}"** (${matches.length} found)\n` +
              `-# *Matching commands in Astrix command database:*\n\n` +
              searchResultText
            )
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
          )
          .addActionRowComponents(menuRow, btnRow);

        await response.edit({
          components: [resultContainer],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      });
    };

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "You cannot interact with this menu.",
          ephemeral: true,
        });
      }

      if (interaction.customId === "help_home_btn") {
        return interaction.update({
          components: [buildMainContainer()],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      if (interaction.customId === "help_search_btn") {
        return triggerSearchPrompt(interaction);
      }

      if (interaction.customId === "help_category_select") {
        const selectedValue = interaction.values[0];

        if (selectedValue === "home") {
          await interaction.update({
            components: [buildMainContainer()],
            flags: MessageFlags.IsComponentsV2,
          });
        } else if (selectedValue === "search") {
          await triggerSearchPrompt(interaction);
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
      }
    });

    collector.on("end", () => {
      selectMenu.setDisabled(true);
      searchBtn.setDisabled(true);
      homeBtn.setDisabled(true);
      const disabledMenuRow = new ActionRowBuilder().addComponents(selectMenu);
      const disabledBtnRow = new ActionRowBuilder().addComponents(searchBtn, homeBtn);
      const disabledContainer = new ContainerBuilder()
        .addMediaGalleryComponents(mediaGallery)
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# *Help menu session timed out. Type \`.help\` to open a new menu.*`))
        .addActionRowComponents(disabledMenuRow, disabledBtnRow);

      response
        .edit({ components: [disabledContainer] })
        .catch(() => {});
    });
  },
};
