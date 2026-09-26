const {
  ContainerBuilder,
  TextDisplayBuilder,
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
const path = require("path");
const allCategories = require("../lib/categories.json");
const prefixManager = require("../lib/prefixManager");
const {
  generateCategoryCard,
  generateCommandDetailCard,
  CATEGORY_EMOJIS,
} = require("../lib/helpCanvas");

// Main Banner Attachment Setup
const logoPath = path.join(__dirname, "../assets/helpmenu.png");
function createBannerAttachment() {
  return new AttachmentBuilder(logoPath, { name: "helpmenu.png" });
}

function createMediaGallery(attachmentName = "helpmenu.png") {
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

  return categoryGroups
    .filter((group) => group.categories.length > 0)
    .map((group) => {
      const options = [
        new StringSelectMenuOptionBuilder()
          .setLabel("Home Overview")
          .setValue("home")
          .setDescription("Return to the main category overview.")
          .setEmoji("🏠"),
        ...group.categories.slice(0, 24).map((cat) => {
          const cmds = categoryMap.get(cat) || [];
          return new StringSelectMenuOptionBuilder()
            .setLabel(cat)
            .setValue(`cat_${cat.toLowerCase()}`)
            .setDescription(`${cmds.length} command(s)`)
            .setEmoji(CATEGORY_EMOJIS[cat] || allCategories[cat]?.emoji || "📁");
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
 * Build external link buttons row with clean Unicode emojis
 */
function buildLinkButtonsRow(client) {
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

  const inviteBtn = new ButtonBuilder()
    .setEmoji("🔗")
    .setLabel("Invite")
    .setStyle(ButtonStyle.Link)
    .setURL(inviteUrl);

  const supportBtn = new ButtonBuilder()
    .setEmoji("💬")
    .setLabel("Support Server")
    .setStyle(ButtonStyle.Link)
    .setURL("https://discord.gg/FR9pXG2Mwb");

  const hostingBtn = new ButtonBuilder()
    .setEmoji("🌐")
    .setLabel("Website")
    .setStyle(ButtonStyle.Link)
    .setURL("https://extremez.vercel.app/");

  return new ActionRowBuilder().addComponents(inviteBtn, supportBtn, hostingBtn);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MAIN CONTAINER (Clean Canvas Banner Image UI + Dropdowns & Buttons)
// ─────────────────────────────────────────────────────────────────────────────
function buildMainContainer(client, guildId, userId, disabled = false) {
  const { sortedCategories } = getCategoryData(client, userId);
  const totalCommands = client.messageCommands.size;
  const prefix = guildId ? prefixManager.getPrefix(guildId) : ".";

  const categoryRows = buildCategoryActionRows(client, userId, disabled);
  const linkRow = buildLinkButtonsRow(client);

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(createMediaGallery("helpmenu.png"))
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> **Prefix:** \`${prefix}\` • **Commands:** \`${totalCommands}\` • **Categories:** \`${sortedCategories.length}\``
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addActionRowComponents(...categoryRows, linkRow);

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATEGORY CANVAS CONTAINER (Dynamic Visual Card + Command Dropdown)
// ─────────────────────────────────────────────────────────────────────────────
async function buildCategoryContainerPayload(client, categoryQuery, userId, guildId, page = 0) {
  const { categoryMap, sortedCategories } = getCategoryData(client, userId);
  const prefix = guildId ? prefixManager.getPrefix(guildId) : ".";

  // Match category name case-insensitively
  const categoryName =
    sortedCategories.find(
      (c) => c.toLowerCase() === categoryQuery.toLowerCase()
    ) || "General";

  const categoryEmoji = CATEGORY_EMOJIS[categoryName] || "📁";
  const cmds = categoryMap.get(categoryName) || [];

  // Generate crisp 2x High-DPI Category Canvas Card
  const categoryBuffer = await generateCategoryCard(
    categoryName,
    cmds,
    prefix,
    sortedCategories.length
  );
  const attachment = new AttachmentBuilder(categoryBuffer, {
    name: "category_card.png",
  });

  // Build paginated command select menu options
  const pageSize = 23;
  const totalPages = Math.ceil(cmds.length / pageSize) || 1;
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));

  const startIdx = currentPage * pageSize;
  const endIdx = startIdx + pageSize;
  const currentCmds = cmds.slice(startIdx, endIdx);

  const options = [];

  if (currentPage > 0) {
    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(`Previous Page (${currentPage}/${totalPages})`)
        .setValue(`page_${categoryName.toLowerCase()}_${currentPage - 1}`)
        .setDescription(`Browse previous commands in ${categoryName}`)
        .setEmoji("⬅️")
    );
  }

  currentCmds.forEach((cmd) => {
    const primaryName = cmd.alias?.[0] || cmd.name;
    const desc = cmd.desc || cmd.description || `Command details for ${primaryName}`;
    const truncatedDesc = desc.length > 70 ? desc.slice(0, 67) + "..." : desc;

    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(`${prefix}${primaryName}`)
        .setValue(`cmd_${primaryName}`)
        .setDescription(truncatedDesc)
        .setEmoji(categoryEmoji)
    );
  });

  if (currentPage < totalPages - 1) {
    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(`Next Page (${currentPage + 2}/${totalPages})`)
        .setValue(`page_${categoryName.toLowerCase()}_${currentPage + 1}`)
        .setDescription(`Browse more commands in ${categoryName}`)
        .setEmoji("➡️")
    );
  }

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(createMediaGallery("category_card.png"))
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    );

  // Command select menu row
  if (options.length > 0) {
    const commandSelectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_command_select")
      .setPlaceholder(`🔍 Select a ${categoryName} command...`)
      .addOptions(options);

    const commandSelectRow = new ActionRowBuilder().addComponents(commandSelectMenu);
    container.addActionRowComponents(commandSelectRow);
  }

  // Action buttons: [📁 Home] [❌ Close]
  const homeBtn = new ButtonBuilder()
    .setCustomId("help_btn_home")
    .setLabel("Home")
    .setEmoji("📁")
    .setStyle(ButtonStyle.Secondary);

  const closeBtn = new ButtonBuilder()
    .setCustomId("help_btn_close")
    .setLabel("Close")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger);

  const buttonRow = new ActionRowBuilder().addComponents(homeBtn, closeBtn);
  container.addActionRowComponents(buttonRow);

  return { container, attachment };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMAND DETAIL CANVAS CONTAINER (Dynamic Visual Card + Navigation Buttons)
// ─────────────────────────────────────────────────────────────────────────────
async function buildCommandContainerPayload(client, commandQuery, userId, guildId) {
  const prefix = guildId ? prefixManager.getPrefix(guildId) : ".";
  const exactCmd = findCommand(client, commandQuery);

  if (!exactCmd) {
    const notFoundContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⭐ Command Not Found\n` +
          `-# *No command or alias matching \`${commandQuery}\` was found in the database.*\n\n` +
          `> - **Tip:** Type \`.help\` without arguments to explore all categories.`
      )
    );

    const homeBtn = new ButtonBuilder()
      .setCustomId("help_btn_home")
      .setLabel("Home")
      .setEmoji("📁")
      .setStyle(ButtonStyle.Primary);

    notFoundContainer.addActionRowComponents(new ActionRowBuilder().addComponents(homeBtn));
    return { container: notFoundContainer, attachment: null };
  }

  const primaryName = exactCmd.alias ? exactCmd.alias[0] : (exactCmd.name || commandQuery);
  const categoryName = exactCmd.category || "General";
  const slashCmd = client.slashCommands.get(primaryName) || client.slashCommands.get(exactCmd.name);

  // Generate crisp 2x High-DPI Command Detail Canvas Card
  const cmdBuffer = await generateCommandDetailCard(exactCmd, prefix, slashCmd);
  const attachment = new AttachmentBuilder(cmdBuffer, {
    name: "command_card.png",
  });

  // Buttons inside container: [⬅ Back] [📁 Home] [ℹ Slash Info]
  const backBtn = new ButtonBuilder()
    .setCustomId(`help_btn_back_${categoryName.toLowerCase()}`)
    .setLabel("Back")
    .setEmoji("⬅️")
    .setStyle(ButtonStyle.Secondary);

  const homeBtn = new ButtonBuilder()
    .setCustomId("help_btn_home")
    .setLabel("Home")
    .setEmoji("📁")
    .setStyle(ButtonStyle.Primary);

  const slashBtn = new ButtonBuilder()
    .setCustomId(`help_btn_slash_${primaryName}`)
    .setLabel("Slash Info")
    .setEmoji("ℹ️")
    .setStyle(ButtonStyle.Success);

  const buttonRow = new ActionRowBuilder().addComponents(backBtn, homeBtn, slashBtn);

  const container = new ContainerBuilder()
    .addMediaGalleryComponents(createMediaGallery("command_card.png"))
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addActionRowComponents(buttonRow);

  return { container, attachment };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. INTERACTIVE COLLECTOR CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
function setupHelpCollector({ client, messageOrInteraction, initialContainer, userId, guildId }) {
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
        ephemeral: true,
      });
    }

    try {
      const customId = i.customId;

      // 1. Category Select Menus (from Main Container)
      if (
        i.isStringSelectMenu() &&
        (customId === "help_category_select_main" || customId === "help_category_select_extra")
      ) {
        const val = i.values[0];

        if (val === "home") {
          const bannerAttachment = createBannerAttachment();
          const mainContainer = buildMainContainer(client, guildId, userId);
          return await i.update({
            components: [mainContainer],
            files: [bannerAttachment],
            flags: MessageFlags.IsComponentsV2,
          });
        }

        const categoryName = val.replace("cat_", "");
        const { container, attachment } = await buildCategoryContainerPayload(
          client,
          categoryName,
          userId,
          guildId,
          0
        );

        return await i.update({
          components: [container],
          files: [attachment],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      // 2. Command Select Menu (from Category Container)
      if (i.isStringSelectMenu() && customId === "help_command_select") {
        const selectedVal = i.values[0];

        // Pagination inside category
        if (selectedVal.startsWith("page_")) {
          const parts = selectedVal.split("_");
          const catName = parts[1];
          const pageNum = parseInt(parts[2], 10);
          const { container, attachment } = await buildCategoryContainerPayload(
            client,
            catName,
            userId,
            guildId,
            pageNum
          );
          return await i.update({
            components: [container],
            files: [attachment],
            flags: MessageFlags.IsComponentsV2,
          });
        }

        // Command details selected
        if (selectedVal.startsWith("cmd_")) {
          const cmdName = selectedVal.replace("cmd_", "");
          const { container, attachment } = await buildCommandContainerPayload(
            client,
            cmdName,
            userId,
            guildId
          );
          return await i.update({
            components: [container],
            files: attachment ? [attachment] : [],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }

      // 3. Buttons inside Container
      if (i.isButton()) {
        // [📁 Home]
        if (customId === "help_btn_home") {
          const bannerAttachment = createBannerAttachment();
          const mainContainer = buildMainContainer(client, guildId, userId);
          return await i.update({
            components: [mainContainer],
            files: [bannerAttachment],
            flags: MessageFlags.IsComponentsV2,
          });
        }

        // [❌ Close]
        if (customId === "help_btn_close") {
          collector.stop("user_closed");
          return await i.message.delete().catch(() => {
            i.update({
              content: "🔒 Help menu closed.",
              components: [],
            }).catch(() => null);
          });
        }

        // [⬅ Back] -> returns to Category Container
        if (customId.startsWith("help_btn_back_")) {
          const catName = customId.replace("help_btn_back_", "");
          const { container, attachment } = await buildCategoryContainerPayload(
            client,
            catName,
            userId,
            guildId,
            0
          );
          return await i.update({
            components: [container],
            files: [attachment],
            flags: MessageFlags.IsComponentsV2,
          });
        }

        // [ℹ Slash Info]
        if (customId.startsWith("help_btn_slash_")) {
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

          return await i.reply({
            content: infoText,
            ephemeral: true,
          });
        }
      }
    } catch (err) {
      console.error("[Help Container Collector Error]:", err);
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason === "user_closed") return;

    try {
      const disabledContainer = buildMainContainer(client, guildId, userId, true);
      await messageOrInteraction
        .edit({
          components: [disabledContainer],
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
  const guildId = message.guild?.id;
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
        guildId,
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
        guildId,
      });
      return;
    }

    const { container, attachment } = await buildCommandContainerPayload(
      client,
      query,
      userId,
      guildId
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
      guildId,
    });
    return;
  }

  // Main Dashboard View in Container
  const bannerAttachment = createBannerAttachment();
  const mainContainer = buildMainContainer(client, guildId, userId);

  const sentMsg = await message.reply({
    components: [mainContainer],
    files: [bannerAttachment],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [], repliedUser: false },
  });

  setupHelpCollector({
    client,
    messageOrInteraction: sentMsg,
    initialContainer: mainContainer,
    userId,
    guildId,
  });
}

async function handleSlashHelp(client, interaction) {
  const guildId = interaction.guild?.id;
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
        guildId,
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
        guildId,
      });
      return;
    }

    const { container, attachment } = await buildCommandContainerPayload(
      client,
      commandQuery,
      userId,
      guildId
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
      guildId,
    });
    return;
  }

  // Main Dashboard View in Container
  const bannerAttachment = createBannerAttachment();
  const mainContainer = buildMainContainer(client, guildId, userId);

  const replyMsg = await interaction.editReply({
    components: [mainContainer],
    files: [bannerAttachment],
    flags: MessageFlags.IsComponentsV2,
  });

  setupHelpCollector({
    client,
    messageOrInteraction: replyMsg,
    initialContainer: mainContainer,
    userId,
    guildId,
  });
}

module.exports = {
  buildMainContainer,
  buildCategoryContainerPayload,
  buildCommandContainerPayload,
  handlePrefixHelp,
  handleSlashHelp,
};
