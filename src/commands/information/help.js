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
  alias: ["help", "h"],
  category: "Information",
  desc: "Show all available commands, categories, or details for a specific command.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    // If a specific command is requested via argument e.g. .help afk
    if (args[0]) {
      const query = args[0].toLowerCase();
      const targetCmd =
        client.messageCommands.get(query) ||
        client.messageCommands.find((c) => c.alias && c.alias.includes(query));

      if (!targetCmd) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Command Not Found\n` +
              `-# *No command or alias matching \`${args[0]}\` was found in the database.*\n\n` +
              `> - **Tip:** Type \`.help\` without arguments to view all categories.`,
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

      const primaryName = targetCmd.alias[0];
      const aliasesList = targetCmd.alias.map((a) => `\`.${a}\``).join(", ");
      const description =
        targetCmd.desc || targetCmd.description || "No description provided.";

      const detailsContent = [
        `### <:astrix:1527205612205903973> Command Info ── \`.${primaryName}\``,
        `-# *${description}*`,
        "",
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

    // Default: Show full categories overview
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

    const response = await message.reply({
      components: [buildMainContainer(row)],
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

        await interaction.update({
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
      response
        .edit({ components: [buildMainContainer(disabledRow)] })
        .catch(() => {});
    });
  },
};
