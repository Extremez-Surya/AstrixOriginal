const {
  ContainerBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const allCategories = require("../lib/categories.json");
const prefixManager = require("../lib/prefixManager");
const {
  generateMainHelpCard,
  generateCategoryCard,
  generateCommandDetailCard,
  CATEGORY_EMOJIS,
} = require("../lib/helpCanvas");

function createMediaGallery(attachmentName) {
  const mediaItem = new MediaGalleryItemBuilder().setURL(`attachment://${attachmentName}`);
  return new MediaGalleryBuilder().addItems(mediaItem);
}

const MAIN_CATEGORY_NAMES = [
  "Anti Nuke",
  "Anti Raid",
  "Automod",
  "Security",
  "Moderation",
  "Music",
  "Logging",
  "Server",
  "Configuration",
  "Utility",
  "Custom Roles",
  "Information",
  "General",
  "Owner",
];

/**
 * Get category map and sorted list of categories
 */
function getCategoryData(client, userId) {
  const categoryMap = new Map();
  const isDev = client.developer?.includes(userId);

  client.messageCommands.forEach((cmd) => {
    const cat = cmd.category || "Miscellaneous";
    if (cat === "Owner" && !isDev) return;

    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat).push(cmd);
  });

  // Deduplicate and sort commands inside each category
  categoryMap.forEach((cmds, catName) => {
    const seen = new Set();
    const uniqueCmds = [];
    cmds.forEach((c) => {
      const primary = c.alias?.[0] || c.name;
      if (primary && !seen.has(primary)) {
        seen.add(primary);
        uniqueCmds.push(c);
      }
    });
    uniqueCmds.sort((a, b) => (a.alias?.[0] || a.name).localeCompare(b.alias?.[0] || b.name));
    categoryMap.set(catName, uniqueCmds);
  });

  const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  return { categoryMap, sortedCategories };
}

/**
 * Find a command by query or alias
 */
function findCommand(client, query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  return (
    client.messageCommands.get(q) ||
    client.messageCommands.find(
      (c) => c.alias && c.alias.map((a) => a.toLowerCase()).includes(q)
    ) ||
    client.slashCommands.get(q)
  );
}

/**
 * Build Category Select Dropdown Rows for the Main Container
 */
function buildCategoryActionRows(client, userId, disabled = false) {
  const { categoryMap, sortedCategories } = getCategoryData(client, userId);

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

  const CUSTOM_CATEGORY_EMOJIS = {
    "Anti Nuke": "<:astrix_shield:1554036155001995406>",
    "Anti Raid": "<:astrix_lock:1554036087905849376>",
    Automod: "<:astrix_hammer:1554036048940503112>",
    Security: "<:astrix_shield:1554036155001995406>",
    Moderation: "<:astrix_hammer:1554036048940503112>",
    Music: "<:astrix_music:1554036107979653150>",
    Filters: "<:astrix_music:1554036107979653150>",
    Logging: "<:astrix_terminal:1554036196714348584>",
    Server: "<:astrix_server:1554036150325481474>",
    Configuration: "<:astrix_gear:1554036035111886888>",
    Utility: "<:astrix_gear:1554036035111886888>",
    "Custom Roles": "<:astrix_sparkle:1554036176258732102>",
    Information: "<:astrix_info:1554036070411280515>",
    General: "<:astrix_chat:1554035975615807558>",
    Owner: "<:astrix_crown:1554036003751067650>",
    Giveaway: "<:astrix_gift:1554036039855898654>",
    Leveling: "<:astrix_star:1554036186652221573>",
    Ticket: "<:astrix_ticket:1554036201432813618>",
    Booster: "<:astrix_boost:1554035956107976735>",
    "Join To Create": "<:astrix_mic:1554036103147823124>",
    Voice: "<:astrix_mic:1554036103147823124>",
  };

  return categoryGroups
    .filter((group) => group.categories.length > 0)
    .map((group) => {
      const options = [
        new StringSelectMenuOptionBuilder()
          .setLabel("Home Overview")
          .setValue("home")
          .setDescription("Return to the main directory overview.")
          .setEmoji("<:astrix_home:1554036059937968190>"),
        ...group.categories.slice(0, 24).map((cat) => {
          const cmds = categoryMap.get(cat) || [];
          const emojiToUse = CUSTOM_CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS[cat] || allCategories[cat]?.emoji || "📁";
          return new StringSelectMenuOptionBuilder()
            .setLabel(cat)
            .setValue(`cat_${cat.toLowerCase()}`)
            .setDescription(`${cmds.length} command(s)`)
            .setEmoji(emojiToUse);
        }),
      ];

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`help_category_select_${group.id}`)
        .setPlaceholder(group.placeholder)
        .setDisabled(disabled)
        .addOptions(options);

      return new ActionRowBuilder().addComponents(menu);
    });
}

/**
 * Build external link buttons row with clean custom Astrix emojis
 */
function buildLinkButtonsRow(client) {
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

  const inviteBtn = new ButtonBuilder()
    .setEmoji("<:astrix_link:1554036077801766972>")
    .setLabel("Invite")
    .setStyle(ButtonStyle.Link)
    .setURL(inviteUrl);

  const supportBtn = new ButtonBuilder()
    .setEmoji("<:astrix_chat:1554035975615807558>")
    .setLabel("Support Server")
    .setStyle(ButtonStyle.Link)
    .setURL("https://discord.gg/FR9pXG2Mwb");

  const hostingBtn = new ButtonBuilder()
    .setEmoji("<:astrix_globe:1554036044368711703>")
    .setLabel("Website")
    .setStyle(ButtonStyle.Link)
    .setURL("https://extremez.vercel.app/");

  return new ActionRowBuilder().addComponents(inviteBtn, supportBtn, hostingBtn);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MAIN CONTAINER (Pure Canvas Image UI + Dropdowns & Buttons, Zero Text)
// ─────────────────────────────────────────────────────────────────────────────
async function buildMainContainerPayload(client, guild, userId, disabled = false) {
  const { sortedCategories } = getCategoryData(client, userId);
  const totalCommands = client.messageCommands.size;
  const prefix = guild ? prefixManager.getPrefix(guild.id) : ".";

  const cardBuffer = await generateMainHelpCard({
    client,
    guild,
    prefix,
    totalCommands,
    totalCategories: sortedCategories.length,
    latency: client.ws?.ping || 24,
  });

  const attachment = new AttachmentBuilder(cardBuffer, { name: "help_home.png" });
  const categoryRows = buildCategoryActionRows(client, userId, disabled);
  const linkRow = buildLinkButtonsRow(client);

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(createMediaGallery("help_home.png"))
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addActionRowComponents(...categoryRows, linkRow);

  return { container, attachment };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATEGORY CANVAS CONTAINER (Pure Canvas Image UI + Command Dropdown & Buttons)
// ─────────────────────────────────────────────────────────────────────────────
async function buildCategoryContainerPayload(client, categoryQuery, userId, guild, page = 0) {
  const { categoryMap, sortedCategories } = getCategoryData(client, userId);
  const prefix = guild ? prefixManager.getPrefix(guild.id) : ".";

  // Match category name case-insensitively
  const categoryName =
    sortedCategories.find(
      (c) => c.toLowerCase() === categoryQuery.toLowerCase()
    ) || "General";

  const categoryEmoji = CATEGORY_EMOJIS[categoryName] || "📁";
  const cmds = categoryMap.get(categoryName) || [];

  const pageSize = 18;
  const totalPages = Math.ceil(cmds.length / pageSize) || 1;
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));

  // Generate crisp 2x High-DPI Category Canvas Card with full command grid
  const categoryBuffer = await generateCategoryCard(
    categoryName,
    cmds,
    prefix,
    sortedCategories.length,
    currentPage,
    totalPages
  );
  const attachment = new AttachmentBuilder(categoryBuffer, {
    name: "category_card.png",
  });

  // Build paginated command select menu options (up to 25 Discord dropdown limit)
  const dropdownPageSize = 25;
  const dropdownCmds = cmds.slice(0, dropdownPageSize);

  const options = dropdownCmds.map((cmd) => {
    const primaryName = cmd.alias?.[0] || cmd.name;
    const desc = cmd.desc || cmd.description || `Command details for ${primaryName}`;
    const truncatedDesc = desc.length > 70 ? desc.slice(0, 67) + "..." : desc;

    return new StringSelectMenuOptionBuilder()
      .setLabel(`${prefix}${primaryName}`)
      .setValue(`cmd_${primaryName}`)
      .setDescription(truncatedDesc)
      .setEmoji(categoryEmoji);
  });

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(createMediaGallery("category_card.png"))
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

  // Command select menu row
  if (options.length > 0) {
    const commandSelectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_command_select")
      .setPlaceholder(`🔍 Select a ${categoryName} command for syntax & details...`)
      .addOptions(options);

    container.addActionRowComponents(new ActionRowBuilder().addComponents(commandSelectMenu));
  }

  // Button Rows
  const buttonComponents = [];

  // Multi-page navigation if category has > 28 commands (e.g. Moderation, Music)
  if (totalPages > 1) {
    const prevBtn = new ButtonBuilder()
      .setCustomId(`help_btn_page_${categoryName.toLowerCase()}_${currentPage - 1}`)
      .setLabel("Prev Page")
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0);

    const nextBtn = new ButtonBuilder()
      .setCustomId(`help_btn_page_${categoryName.toLowerCase()}_${currentPage + 1}`)
      .setLabel("Next Page")
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages - 1);

    buttonComponents.push(prevBtn, nextBtn);
  }

  const homeBtn = new ButtonBuilder()
    .setCustomId("help_btn_home")
    .setLabel("Home")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Primary);

  const closeBtn = new ButtonBuilder()
    .setCustomId("help_btn_close")
    .setLabel("Close")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger);

  buttonComponents.push(homeBtn, closeBtn);

  if (totalPages === 1) {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    const inviteBtn = new ButtonBuilder()
      .setEmoji("🔗")
      .setLabel("Invite")
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl);
    buttonComponents.push(inviteBtn);
  }

  const buttonRow = new ActionRowBuilder().addComponents(buttonComponents);
  container.addActionRowComponents(buttonRow);

  return { container, attachment };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMAND DETAIL CANVAS CONTAINER (Pure Canvas Image UI + Action Buttons)
// ─────────────────────────────────────────────────────────────────────────────
async function buildCommandContainerPayload(client, commandQuery, userId, guild) {
  const prefix = guild ? prefixManager.getPrefix(guild.id) : ".";
  const exactCmd = findCommand(client, commandQuery);

  if (!exactCmd) {
    const { container, attachment } = await buildMainContainerPayload(client, guild, userId);
    return { container, attachment };
  }

  const primaryName = exactCmd.alias ? exactCmd.alias[0] : (exactCmd.name || commandQuery);
  const categoryName = exactCmd.category || "General";
  const slashCmd = client.slashCommands.get(primaryName) || client.slashCommands.get(exactCmd.name);

  // Generate crisp 2x High-DPI Command Detail Canvas Card
  const cmdBuffer = await generateCommandDetailCard(exactCmd, prefix, slashCmd);
  const attachment = new AttachmentBuilder(cmdBuffer, {
    name: "command_card.png",
  });

  // Buttons inside container: [⬅ Back to Category] [🏠 Home] [ℹ Slash Info] [❌ Close]
  const backBtn = new ButtonBuilder()
    .setCustomId(`help_btn_back_${categoryName.toLowerCase()}`)
    .setLabel(`Back to ${categoryName}`)
    .setEmoji("⬅️")
    .setStyle(ButtonStyle.Secondary);

  const homeBtn = new ButtonBuilder()
    .setCustomId("help_btn_home")
    .setLabel("Home")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Primary);

  const slashBtn = new ButtonBuilder()
    .setCustomId(`help_btn_slash_${primaryName}`)
    .setLabel("Slash Info")
    .setEmoji("ℹ️")
    .setStyle(ButtonStyle.Success);

  const closeBtn = new ButtonBuilder()
    .setCustomId("help_btn_close")
    .setLabel("Close")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger);

  const buttonRow = new ActionRowBuilder().addComponents(backBtn, homeBtn, slashBtn, closeBtn);

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(createMediaGallery("command_card.png"))
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addActionRowComponents(buttonRow);

  return { container, attachment };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. INTERACTIVE COLLECTOR CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
function setupHelpCollector({ client, messageOrInteraction, initialContainer, userId, guild }) {
  const filter = () => true;

  const collector = messageOrInteraction.createMessageComponentCollector({
    filter,
    time: 300000, // 5 minutes
  });

  collector.on("collect", async (i) => {
    // Author protection
    if (i.user.id !== userId) {
      return i.reply({
        content: "❌ You cannot interact with this menu.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    try {
      const customId = i.customId;

      // Handle Slash Info button with immediate ephemeral deferReply
      if (customId.startsWith("help_btn_slash_")) {
        await i.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
        const cmdName = customId.replace("help_btn_slash_", "");
        const slashCmd = client.slashCommands.get(cmdName);

        let infoText = "";
        if (slashCmd) {
          infoText =
            `### ℹ️ Slash Command: \`/${slashCmd.name}\`\n` +
            `> - **Description:** ${slashCmd.description || "N/A"}\n` +
            `> - **Options:** ${slashCmd.options?.length ? slashCmd.options.map((o) => `\`${o.name}\``).join(", ") : "None"}\n` +
            `> - **Permissions:** \`${slashCmd.userPermissions?.join(", ") || "None"}\`\n` +
            `> - **DM Permission:** \`${slashCmd.dmPermission ? "Yes" : "No"}\``;
        } else {
          infoText =
            `### ℹ️ Slash Command: \`/${cmdName}\`\n` +
            `> - *This command is primarily optimized as a prefix message command.* \n` +
            `> - **Usage:** \`.${cmdName}\``;
        }

        return await i.editReply({ content: infoText }).catch(() => null);
      }

      // Handle Close button immediately
      if (customId === "help_btn_close") {
        collector.stop("user_closed");
        return await i.message.delete().catch(() => {
          i.update({
            content: "🔒 Help menu closed.",
            components: [],
          }).catch(() => null);
        });
      }

      // 🛡️ CRITICAL: Defer update immediately within 15ms so interaction NEVER expires (prevents DiscordAPIError 10062)
      await i.deferUpdate().catch(() => null);

      // 1. Category Select Menus (from Main Container)
      if (
        i.isStringSelectMenu() &&
        (customId === "help_category_select_main" || customId === "help_category_select_extra")
      ) {
        const val = i.values[0];

        if (val === "home") {
          const { container, attachment } = await buildMainContainerPayload(client, guild, userId);
          return await i.editReply({
            components: [container],
            files: [attachment],
          }).catch(() => null);
        }

        const categoryName = val.replace("cat_", "");
        const { container, attachment } = await buildCategoryContainerPayload(
          client,
          categoryName,
          userId,
          guild,
          0
        );

        return await i.editReply({
          components: [container],
          files: [attachment],
        }).catch(() => null);
      }

      // 2. Command Select Menu (from Category Container)
      if (i.isStringSelectMenu() && customId === "help_command_select") {
        const selectedVal = i.values[0];

        if (selectedVal.startsWith("cmd_")) {
          const cmdName = selectedVal.replace("cmd_", "");
          const { container, attachment } = await buildCommandContainerPayload(
            client,
            cmdName,
            userId,
            guild
          );
          return await i.editReply({
            components: [container],
            files: attachment ? [attachment] : [],
          }).catch(() => null);
        }
      }

      // 3. Buttons inside Container
      if (i.isButton()) {
        // [🏠 Home]
        if (customId === "help_btn_home") {
          const { container, attachment } = await buildMainContainerPayload(client, guild, userId);
          return await i.editReply({
            components: [container],
            files: [attachment],
          }).catch(() => null);
        }

        // [⬅ Prev / Next Page]
        if (customId.startsWith("help_btn_page_")) {
          const parts = customId.replace("help_btn_page_", "").split("_");
          const catName = parts[0];
          const pageNum = parseInt(parts[1], 10);
          const { container, attachment } = await buildCategoryContainerPayload(
            client,
            catName,
            userId,
            guild,
            pageNum
          );
          return await i.editReply({
            components: [container],
            files: [attachment],
          }).catch(() => null);
        }

        // [⬅ Back] -> returns to Category Container
        if (customId.startsWith("help_btn_back_")) {
          const catName = customId.replace("help_btn_back_", "");
          const { container, attachment } = await buildCategoryContainerPayload(
            client,
            catName,
            userId,
            guild,
            0
          );
          return await i.editReply({
            components: [container],
            files: [attachment],
          }).catch(() => null);
        }
      }
    } catch (err) {
      console.error("[Help Container Collector Error]:", err);
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason === "user_closed") return;

    try {
      const { container } = await buildMainContainerPayload(client, guild, userId, true);
      await messageOrInteraction
        .edit({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    } catch (_) {}
  });

  return collector;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EXPORTED ENTRY POINTS
// ─────────────────────────────────────────────────────────────────────────────
async function handlePrefixHelp(client, message, args) {
  const guild = message.guild;
  const userId = message.author.id;

  // Direct lookup: .help <commandOrCategory>
  if (args[0]) {
    const query = args[0].toLowerCase().trim();
    const { sortedCategories } = getCategoryData(client, userId);
    const matchedCategory = sortedCategories.find((c) => c.toLowerCase() === query);

    if (matchedCategory) {
      const { container, attachment } = await buildCategoryContainerPayload(
        client,
        matchedCategory,
        userId,
        guild,
        0
      );
      const sentMsg = await message.reply({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
      setupHelpCollector({
        client,
        messageOrInteraction: sentMsg,
        initialContainer: container,
        userId,
        guild,
      });
      return;
    }

    const { container, attachment } = await buildCommandContainerPayload(
      client,
      query,
      userId,
      guild
    );
    const sentMsg = await message.reply({
      components: [container],
      files: attachment ? [attachment] : [],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
    setupHelpCollector({
      client,
      messageOrInteraction: sentMsg,
      initialContainer: container,
      userId,
      guild,
    });
    return;
  }

  // Main Dashboard View in Container
  const { container, attachment } = await buildMainContainerPayload(client, guild, userId);

  const sentMsg = await message.reply({
    components: [container],
    files: [attachment],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [], repliedUser: false },
  });

  setupHelpCollector({
    client,
    messageOrInteraction: sentMsg,
    initialContainer: container,
    userId,
    guild,
  });
}

async function handleSlashHelp(client, interaction) {
  const guild = interaction.guild;
  const userId = interaction.user.id;
  const commandQuery = interaction.options.getString("command")?.toLowerCase()?.trim();

  // Direct command lookup (e.g. /help command:ping)
  if (commandQuery) {
    const { sortedCategories } = getCategoryData(client, userId);
    const matchedCategory = sortedCategories.find((c) => c.toLowerCase() === commandQuery);

    if (matchedCategory) {
      const { container, attachment } = await buildCategoryContainerPayload(
        client,
        matchedCategory,
        userId,
        guild,
        0
      );
      const replyMsg = await interaction.editReply({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      });
      setupHelpCollector({
        client,
        messageOrInteraction: replyMsg,
        initialContainer: container,
        userId,
        guild,
      });
      return;
    }

    const { container, attachment } = await buildCommandContainerPayload(
      client,
      commandQuery,
      userId,
      guild
    );
    const replyMsg = await interaction.editReply({
      components: [container],
      files: attachment ? [attachment] : [],
      flags: MessageFlags.IsComponentsV2,
    });
    setupHelpCollector({
      client,
      messageOrInteraction: replyMsg,
      initialContainer: container,
      userId,
      guild,
    });
    return;
  }

  // Main Dashboard View in Container
  const { container, attachment } = await buildMainContainerPayload(client, guild, userId);

  const replyMsg = await interaction.editReply({
    components: [container],
    files: [attachment],
    flags: MessageFlags.IsComponentsV2,
  });

  setupHelpCollector({
    client,
    messageOrInteraction: replyMsg,
    initialContainer: container,
    userId,
    guild,
  });
}

module.exports = {
  buildMainContainerPayload,
  buildCategoryContainerPayload,
  buildCommandContainerPayload,
  handlePrefixHelp,
  handleSlashHelp,
};
