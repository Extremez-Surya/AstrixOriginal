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

module.exports = {
  name: "help",
  category: "Information",
  description: "Show all available commands, categories, or details for a specific command.",
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

    const commandQuery = interaction.options.getString("command")?.toLowerCase()?.trim();

    if (commandQuery) {
      const targetCmd =
        client.messageCommands.get(commandQuery) ||
        client.messageCommands.find((c) => c.alias && c.alias.includes(commandQuery)) ||
        client.slashCommands.get(commandQuery);

      if (!targetCmd) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Command Not Found\n` +
            `-# *No command matching \`${commandQuery}\` was found in the database.*\n\n` +
            `> - **Tip:** Run \`/help\` without arguments to explore all command categories.`
          )
        );
        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      const primaryName = targetCmd.name || (targetCmd.alias ? targetCmd.alias[0] : commandQuery);
      const aliasesList = targetCmd.alias ? targetCmd.alias.map((a) => `\`.${a}\``).join(", ") : `\`/${primaryName}\``;
      const description = targetCmd.desc || targetCmd.description || "No description provided.";

      const detailsContent = [
        `### <:astrix:1527205612205903973> Command Info ── \`.${primaryName}\``,
        `-# *${description}*`,
        "",
        `> -# <:prefix:1528309903972892772> **Aliases:** ${aliasesList}`,
      ].join("\n");

      const footerText = `-# Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE`;

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(detailsContent))
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (client.application.commands.cache.size === 0) {
      try {
        await client.application.commands.fetch();
      } catch (e) {}
    }
    const totalCommands = client.slashCommands.size;

    const getCommandsForCategory = (categoryName) => {
      const list = [];
      const registered = client.application.commands.cache;
      client.slashCommands.forEach((cmd) => {
        const cat = cmd.category || "Miscellaneous";
        if (cat.toLowerCase() === categoryName.toLowerCase()) {
          const cmdRef = registered.find((c) => c.name === cmd.name);
          if (cmdRef) {
            const subcommands = cmd.options?.filter(
              (opt) => opt.type === 1 || opt.type === "Subcommand" || opt.type === "SUB_COMMAND"
            );
            if (subcommands && subcommands.length > 0) {
              subcommands.forEach((sub) => {
                list.push(
                  `</${cmd.name} ${sub.name}:${cmdRef.id}> ─ ${sub.description || "No description provided."}`
                );
              });
            } else {
              list.push(
                `</${cmd.name}:${cmdRef.id}> ─ ${cmd.description || "No description provided."}`
              );
            }
          } else {
            list.push(
              `\`/${cmd.name}\` ─ ${cmd.description || "No description provided."}`
            );
          }
        }
      });
      return [...new Set(list)];
    };

    const getAliasesForCategory = (categoryName) => {
      const list = [];
      const registered = client.application.commands.cache;
      client.slashCommands.forEach((cmd) => {
        const cat = cmd.category || "Miscellaneous";
        if (cat.toLowerCase() === categoryName.toLowerCase()) {
          const cmdRef = registered.find((c) => c.name === cmd.name);
          if (cmdRef) {
            const subcommands = cmd.options?.filter(
              (opt) => opt.type === 1 || opt.type === "Subcommand" || opt.type === "SUB_COMMAND"
            );
            if (subcommands && subcommands.length > 0) {
              subcommands.forEach((sub) => {
                list.push(`</${cmd.name} ${sub.name}:${cmdRef.id}>`);
              });
            } else {
              list.push(`</${cmd.name}:${cmdRef.id}>`);
            }
          } else {
            list.push(`\`/${cmd.name}\``);
          }
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

    const logoPath = path.join(__dirname, "../../assets/logo.png");
    const bannerAttachment = new AttachmentBuilder(logoPath, {
      name: "logo.png",
    });

    const mediaItem = new MediaGalleryItemBuilder().setURL(
      "attachment://logo.png",
    );
    const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_category_select")
      .setPlaceholder("Choose a category to explore...")
      .addOptions([
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
      ]);

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
            ` > **Prefix:** \`.\` | **Commands:** \`${totalCommands}\``,
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
        const categoryEmoji = categories[selectedCategoryName].emoji;
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
