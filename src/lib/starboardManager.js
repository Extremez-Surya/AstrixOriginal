const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const CONFIG_FILE = path.join(__dirname, "starboardConfig.json");
const starboardCache = new Map();
let isInitialized = false;

function getDefaultConfig() {
  return {
    enabled: false,
    channelId: null,
    emojis: [{ emoji: "⭐", threshold: 3 }],
    selfStar: false,
    color: "#FFD700",
    timestamp: true,
    jumpUrl: true,
    attachments: true,
    ignoredChannels: [],
    ignoredRoles: [],
    ignoredMembers: [],
    starredMessages: [],
  };
}

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      const parsed = JSON.parse(data);
      if (parsed.guilds) {
        for (const [guildId, cfg] of Object.entries(parsed.guilds)) {
          starboardCache.set(guildId, cfg);
        }
      }
    }
  } catch (e) {
    console.error("[StarboardManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      const obj = { guilds: {} };
      for (const [guildId, cfg] of starboardCache.entries()) {
        obj.guilds[guildId] = cfg;
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[StarboardManager] Save disk error:", e);
    }
  });
}

function getGuildConfig(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultConfig();

  const raw = starboardCache.get(guildId);
  if (!raw) return getDefaultConfig();

  const def = getDefaultConfig();
  return {
    enabled: Boolean(raw.enabled),
    channelId: raw.channelId || null,
    emojis: Array.isArray(raw.emojis) && raw.emojis.length > 0 ? raw.emojis : def.emojis,
    selfStar: Boolean(raw.selfStar),
    color: raw.color || def.color,
    timestamp: raw.timestamp !== undefined ? raw.timestamp : true,
    jumpUrl: raw.jumpUrl !== undefined ? raw.jumpUrl : true,
    attachments: raw.attachments !== undefined ? raw.attachments : true,
    ignoredChannels: Array.isArray(raw.ignoredChannels) ? raw.ignoredChannels : [],
    ignoredRoles: Array.isArray(raw.ignoredRoles) ? raw.ignoredRoles : [],
    ignoredMembers: Array.isArray(raw.ignoredMembers) ? raw.ignoredMembers : [],
    starredMessages: Array.isArray(raw.starredMessages) ? raw.starredMessages : [],
  };
}

function setGuildConfig(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  starboardCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function buildStarboardContainer(guild, authorUser) {
  const config = getGuildConfig(guild.id);
  const container = new ContainerBuilder();

  const emojiSummary =
    config.emojis && config.emojis.length > 0
      ? config.emojis.map((e) => `${e.emoji} (\`${e.threshold}+\`)`).join(", ")
      : "*None configured*";

  const totalStarred = config.starredMessages?.length || 0;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ⭐ **ASTRIX STARBOARD CONTROL CENTER**`,
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  const statusText =
    `> - **Status:** ${config.enabled ? "🟢 `Enabled & Active`" : "🔴 `Disabled / Inactive`"}\n` +
    `> - **Starboard Channel:** ${config.channelId ? `<#${config.channelId}>` : "`Not Configured`"}\n` +
    `> - **Star Emojis:** ${emojiSummary}\n` +
    `> - **Self-Star Allowed:** \`${config.selfStar ? "Yes" : "No"}\`\n` +
    `> - **Embed Theme Color:** \`${config.color || "#FFD700"}\`\n` +
    `> - **Total Showcased:** \`${totalStarred}\` messages starred\n` +
    `-# *Highlight and showcase server-favorite messages in a designated channel.*`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText));

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  // Creative Select Menu Dropdown
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("starboard_select_menu")
    .setPlaceholder("⭐ Select a Starboard configuration action...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(config.enabled ? "Disable Starboard" : "Enable Starboard")
        .setValue("sb_opt_toggle_enable")
        .setDescription(config.enabled ? "Pause starboard showcase" : "Activate starboard showcase")
        .setEmoji(config.enabled ? "🔴" : "🟢"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Starboard Channel")
        .setValue("sb_opt_set_channel")
        .setDescription("Designate the channel where starred posts appear")
        .setEmoji("📌"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Add Star Emoji & Threshold")
        .setValue("sb_opt_add_emoji")
        .setDescription("Add an emoji and required reaction count threshold")
        .setEmoji("➕"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Toggle Self-Starring")
        .setValue("sb_opt_toggle_selfstar")
        .setDescription("Allow or disallow authors to star their own messages")
        .setEmoji("👤"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Set Embed Accent Color")
        .setValue("sb_opt_set_color")
        .setDescription("Customize the hex color code of starboard cards")
        .setEmoji("🎨"),
      new StringSelectMenuOptionBuilder()
        .setLabel("View Starboard Statistics")
        .setValue("sb_opt_view_stats")
        .setDescription(`Browse top starred messages and server showcase stats`)
        .setEmoji("📊"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Reset Starboard Config")
        .setValue("sb_opt_reset_config")
        .setDescription("Restore starboard settings to defaults")
        .setEmoji("🧹"),
    );

  const dropdownRow = new ActionRowBuilder().addComponents(selectMenu);

  // Direct Buttons Row
  const btnToggle = new ButtonBuilder()
    .setCustomId("sb_btn_toggle")
    .setLabel(config.enabled ? "Active" : "Disabled")
    .setEmoji(config.enabled ? "🟢" : "🔴")
    .setStyle(config.enabled ? ButtonStyle.Success : ButtonStyle.Secondary);

  const btnSelf = new ButtonBuilder()
    .setCustomId("sb_btn_selfstar")
    .setLabel(`Self-Star: ${config.selfStar ? "ON" : "OFF"}`)
    .setEmoji("👤")
    .setStyle(config.selfStar ? ButtonStyle.Success : ButtonStyle.Secondary);

  const btnStats = new ButtonBuilder()
    .setCustomId("sb_btn_stats")
    .setLabel(`Stats (${totalStarred})`)
    .setEmoji("📊")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder().addComponents(btnToggle, btnSelf, btnStats);

  container.addActionRowComponents(dropdownRow, buttonRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ High Performance Starboard Engine`),
  );

  return container;
}

async function handleStarboardInteraction(client, interaction) {
  const isBtn = interaction.isButton();
  const isMenu = interaction.isStringSelectMenu();
  const isModal = interaction.isModalSubmit();

  if (!isBtn && !isMenu && !isModal) return false;

  const customId = interaction.customId;
  if (!customId.startsWith("sb_") && !customId.startsWith("starboard_")) return false;

  const isPermitted = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || client.developer?.includes(interaction.user.id);

  if (!isPermitted) {
    await interaction
      .reply({
        content: "❌ Manage Server permission required to configure Starboard.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);
    return true;
  }

  const config = getGuildConfig(interaction.guild.id);

  // Button handlers
  if (isBtn) {
    if (customId === "sb_btn_toggle") {
      config.enabled = !config.enabled;
      setGuildConfig(interaction.guild.id, config);
      const updated = buildStarboardContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (customId === "sb_btn_selfstar") {
      config.selfStar = !config.selfStar;
      setGuildConfig(interaction.guild.id, config);
      const updated = buildStarboardContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (customId === "sb_btn_stats") {
      return renderStarboardStats(interaction, config);
    }
  }

  // Select menu handlers
  if (isMenu && (customId === "starboard_select_menu" || customId === "sb_select_menu")) {
    const selectedVal = interaction.values[0];

    if (selectedVal === "sb_opt_toggle_enable") {
      config.enabled = !config.enabled;
      setGuildConfig(interaction.guild.id, config);
      const updated = buildStarboardContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (selectedVal === "sb_opt_toggle_selfstar") {
      config.selfStar = !config.selfStar;
      setGuildConfig(interaction.guild.id, config);
      const updated = buildStarboardContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (selectedVal === "sb_opt_view_stats") {
      return renderStarboardStats(interaction, config);
    }

    if (selectedVal === "sb_opt_set_channel") {
      const modal = new ModalBuilder()
        .setCustomId("sb_modal_set_channel")
        .setTitle("📌 Set Starboard Channel")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_channel")
              .setLabel("Channel Mention or ID")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("#starboard or channel ID")
              .setValue(config.channelId ? `<#${config.channelId}>` : "")
              .setRequired(true),
          ),
        );
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selectedVal === "sb_opt_add_emoji") {
      const modal = new ModalBuilder()
        .setCustomId("sb_modal_add_emoji")
        .setTitle("➕ Add Star Emoji & Threshold")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_emoji")
              .setLabel("Emoji (e.g. ⭐, 🌟, 🔥, or <:name:id>)")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("⭐")
              .setValue("⭐")
              .setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_threshold")
              .setLabel("Required Reactions Threshold (Number)")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("3")
              .setValue("3")
              .setRequired(true),
          ),
        );
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selectedVal === "sb_opt_set_color") {
      const modal = new ModalBuilder()
        .setCustomId("sb_modal_set_color")
        .setTitle("🎨 Set Embed Accent Color")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_color")
              .setLabel("Hex Color Code (e.g. #FFD700)")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("#FFD700")
              .setValue(config.color || "#FFD700")
              .setRequired(true),
          ),
        );
      await interaction.showModal(modal).catch(() => null);
      return true;
    }

    if (selectedVal === "sb_opt_reset_config") {
      const def = getDefaultConfig();
      setGuildConfig(interaction.guild.id, def);
      const updated = buildStarboardContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  // Modal submissions
  if (isModal) {
    if (customId === "sb_modal_set_channel") {
      const chanInput = interaction.fields.getTextInputValue("input_channel").trim();
      const rawId = chanInput.replace(/[<#>]/g, "");
      const channel = interaction.guild.channels.cache.get(rawId);

      if (!channel || !channel.isTextBased()) {
        return interaction.reply({
          content: "❌ Invalid channel specified. Please provide a valid text channel.",
          flags: MessageFlags.Ephemeral,
        });
      }

      config.channelId = channel.id;
      config.enabled = true;
      setGuildConfig(interaction.guild.id, config);

      const updated = buildStarboardContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (customId === "sb_modal_add_emoji") {
      const emojiInput = interaction.fields.getTextInputValue("input_emoji").trim();
      const threshInput = parseInt(interaction.fields.getTextInputValue("input_threshold").trim(), 10) || 3;
      const threshold = Math.max(1, Math.min(threshInput, 100));

      const existingIdx = config.emojis.findIndex((e) => e.emoji === emojiInput);
      if (existingIdx !== -1) {
        config.emojis[existingIdx].threshold = threshold;
      } else {
        config.emojis.push({ emoji: emojiInput, threshold });
      }

      setGuildConfig(interaction.guild.id, config);
      const updated = buildStarboardContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }

    if (customId === "sb_modal_set_color") {
      let colorInput = interaction.fields.getTextInputValue("input_color").trim();
      if (!colorInput.startsWith("#")) colorInput = `#${colorInput}`;
      if (/^#[0-9A-F]{6}$/i.test(colorInput)) {
        config.color = colorInput;
        setGuildConfig(interaction.guild.id, config);
      }
      const updated = buildStarboardContainer(interaction.guild, interaction.user);
      await interaction.update({ components: [updated], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      return true;
    }
  }

  return false;
}

function renderStarboardStats(interaction, config) {
  const total = config.starredMessages?.length || 0;
  const recent = (config.starredMessages || []).slice(-5).reverse();

  let desc = `**Total Showcase Posts:** \`${total}\`\n\n`;
  if (recent.length === 0) {
    desc += "*No messages have reached the starboard yet.*";
  } else {
    desc += "**Recent Showcase:**\n";
    recent.forEach((entry, i) => {
      desc += `> **${i + 1}.** <@${entry.authorId}> in <#${entry.channelId}> — \`${entry.starCount} stars\` (<t:${Math.floor((entry.createdAt || Date.now()) / 1000)}:R>)\n`;
    });
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 📊 **STARBOARD SHOWCASE STATS**`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ High Performance Starboard Engine`));

  return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => null);
}

function buildStarboardEmbed(message, starCount, config, emojiStr = "⭐") {
  const colorHex = config.color || "#FFD700";
  const colorInt = parseInt(colorHex.replace("#", ""), 16) || 0xffd700;

  const embed = new EmbedBuilder()
    .setColor(colorInt)
    .setAuthor({
      name: message.author.displayName || message.author.username,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    });

  let description = message.content || "";

  if (message.reference?.messageId) {
    description = `*[Replying to message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.reference.messageId})*\n\n${description}`;
  }

  if (description) {
    if (description.length > 4000) {
      description = description.substring(0, 3995) + "...";
    }
    embed.setDescription(description);
  }

  if (config.attachments !== false && message.attachments.size > 0) {
    const img = message.attachments.find(
      (a) => a.contentType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.name),
    );
    if (img) embed.setImage(img.url);

    const other = message.attachments.filter(
      (a) => !a.contentType?.startsWith("image/") && !/\.(jpg|jpeg|png|gif|webp)$/i.test(a.name),
    );
    if (other.size > 0) {
      const list = other.map((a) => `[${a.name}](${a.url})`).join("\n");
      embed.addFields({ name: "📎 Attachments", value: list, inline: false });
    }
  }

  if (config.attachments !== false && message.embeds.length > 0) {
    const embImg = message.embeds.find((e) => e.image || e.thumbnail);
    if (embImg && !embed.data.image) {
      embed.setImage(embImg.image?.url || embImg.thumbnail?.url);
    }
  }

  if (message.stickers?.size > 0) {
    const sticker = message.stickers.first();
    if (sticker.format !== 3 && !embed.data.thumbnail) {
      embed.setThumbnail(sticker.url);
    }
  }

  if (config.timestamp !== false) {
    embed.setTimestamp(message.createdAt);
  }

  embed.setFooter({
    text: `${emojiStr} ${starCount} • #${message.channel.name}`,
    iconURL: message.guild.iconURL({ dynamic: true }) || undefined,
  });

  return embed;
}

async function handleReactionAdd(client, reaction, user) {
  try {
    const message = reaction.message;
    const guild = message.guild;
    if (!guild || user.bot) return;

    if (message.partial) {
      await message.fetch().catch(() => null);
    }

    const config = getGuildConfig(guild.id);
    if (!config.enabled || !config.channelId) return;

    // Check emojis
    const reactionEmoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    const matched = config.emojis?.find((e) => e.emoji === reactionEmoji || e.emoji === reaction.emoji.name);
    if (!matched) return;

    // Ignored checks
    if (config.ignoredChannels?.includes(message.channel.id)) return;
    if (message.channel.id === config.channelId) return;
    if (config.ignoredMembers?.includes(message.author.id)) return;
    if (message.member) {
      const hasIgnoredRole = config.ignoredRoles?.some((rid) => message.member.roles.cache.has(rid));
      if (hasIgnoredRole) return;
    }

    // Self-star check
    if (!config.selfStar && user.id === message.author.id) {
      await reaction.users.remove(user.id).catch(() => null);
      return;
    }

    let starCount = reaction.count;
    try {
      const reactedUsers = await reaction.users.fetch();
      if (!config.selfStar && reactedUsers.has(message.author.id)) {
        starCount = Math.max(0, starCount - 1);
      }
      const botCount = reactedUsers.filter((u) => u.bot).size;
      starCount = Math.max(0, starCount - botCount);
    } catch (_) {}

    const existingEntry = config.starredMessages.find((e) => e.originalId === message.id);
    const threshold = matched.threshold || 3;

    if (starCount >= threshold) {
      const starboardChannel = guild.channels.cache.get(config.channelId);
      if (!starboardChannel) return;

      const botPerms = starboardChannel.permissionsFor(guild.members.me);
      if (!botPerms?.has(["ViewChannel", "SendMessages", "EmbedLinks"])) return;

      const embed = buildStarboardEmbed(message, starCount, config, matched.emoji);

      const components = [];
      if (config.jumpUrl !== false) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Jump to Message")
            .setStyle(ButtonStyle.Link)
            .setURL(message.url)
            .setEmoji("🔗"),
        );
        components.push(row);
      }

      if (existingEntry) {
        const starboardMsg = await starboardChannel.messages.fetch(existingEntry.starboardId).catch(() => null);
        if (starboardMsg) {
          await starboardMsg.edit({
            content: `${matched.emoji} **${starCount}** | <#${message.channel.id}>`,
            embeds: [embed],
            components,
          }).catch(() => null);

          existingEntry.starCount = starCount;
          setGuildConfig(guild.id, config);
        }
      } else {
        const post = await starboardChannel.send({
          content: `${matched.emoji} **#${starCount}** | <#${message.channel.id}>`,
          embeds: [embed],
          components,
        }).catch(() => null);

        if (post) {
          config.starredMessages.push({
            originalId: message.id,
            starboardId: post.id,
            channelId: message.channel.id,
            authorId: message.author.id,
            starCount,
            createdAt: Date.now(),
          });
          setGuildConfig(guild.id, config);
        }
      }
    }
  } catch (err) {
    console.error("[StarboardManager] ReactionAdd error:", err);
  }
}

async function handleReactionRemove(client, reaction, user) {
  try {
    const message = reaction.message;
    const guild = message.guild;
    if (!guild || user.bot) return;

    if (message.partial) {
      await message.fetch().catch(() => null);
    }

    const config = getGuildConfig(guild.id);
    if (!config.enabled || !config.channelId) return;

    const reactionEmoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    const matched = config.emojis?.find((e) => e.emoji === reactionEmoji || e.emoji === reaction.emoji.name);
    if (!matched) return;

    const existingEntry = config.starredMessages.find((e) => e.originalId === message.id);
    if (!existingEntry) return;

    let starCount = reaction.count;
    try {
      const reactedUsers = await reaction.users.fetch();
      if (!config.selfStar && reactedUsers.has(message.author.id)) {
        starCount = Math.max(0, starCount - 1);
      }
      const botCount = reactedUsers.filter((u) => u.bot).size;
      starCount = Math.max(0, starCount - botCount);
    } catch (_) {}

    const threshold = matched.threshold || 3;
    const starboardChannel = guild.channels.cache.get(config.channelId);

    if (starCount < threshold) {
      if (starboardChannel) {
        const post = await starboardChannel.messages.fetch(existingEntry.starboardId).catch(() => null);
        if (post) await post.delete().catch(() => null);
      }
      config.starredMessages = config.starredMessages.filter((e) => e.originalId !== message.id);
      setGuildConfig(guild.id, config);
    } else {
      if (starboardChannel) {
        const post = await starboardChannel.messages.fetch(existingEntry.starboardId).catch(() => null);
        if (post) {
          const embed = buildStarboardEmbed(message, starCount, config, matched.emoji);
          const components = [];
          if (config.jumpUrl !== false) {
            components.push(
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setLabel("Jump to Message")
                  .setStyle(ButtonStyle.Link)
                  .setURL(message.url)
                  .setEmoji("🔗"),
              ),
            );
          }
          await post.edit({
            content: `${matched.emoji} **${starCount}** | <#${message.channel.id}>`,
            embeds: [embed],
            components,
          }).catch(() => null);

          existingEntry.starCount = starCount;
          setGuildConfig(guild.id, config);
        }
      }
    }
  } catch (err) {
    console.error("[StarboardManager] ReactionRemove error:", err);
  }
}

initCache();

module.exports = {
  getGuildConfig,
  setGuildConfig,
  buildStarboardContainer,
  handleStarboardInteraction,
  handleReactionAdd,
  handleReactionRemove,
};
