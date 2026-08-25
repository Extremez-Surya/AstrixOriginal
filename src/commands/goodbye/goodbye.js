const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

const parseSelfDestruct = (content) => {
  const match = content.match(/--self[_-]?destruct\s+(\d+)/i);
  if (match) {
    const seconds = parseInt(match[1]);
    if (seconds >= 6 && seconds <= 60) {
      return seconds;
    }
  }
  return null;
};

const resolveChannel = (guild, input) => {
  if (!input) return null;
  const clean = input.replace(/[<#>]/g, "");
  let channel = guild.channels.cache.get(clean);
  if (!channel) channel = guild.channels.cache.find((c) => c.name.toLowerCase() === input.toLowerCase());
  return channel || null;
};

const parseColor = (input) => {
  if (!input) return null;
  let hex = input.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return parseInt(hex, 16);
};

module.exports = {
  alias: ["goodbye", "farewell", "leavemessage", "leavesystem"],
  category: "Goodbye",
  desc: "Configure the multi-channel goodbye and leave message system.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const subcommand = args[0]?.toLowerCase();
    const rawContent = message.content;
    const config = goodbyeManager.getGuildGoodbye(message.guild.id);

    // -------------------------------------------------------------
    // DEFAULT / SHOW DASHBOARD
    // -------------------------------------------------------------
    if (!subcommand || subcommand === "show" || subcommand === "status") {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# <:leave:1528311514065535007> Goodbye & Leave System Control Engine\n` +
            `-# *Configure multi-channel departure greetings, custom cards, and auto-delete timers for ${message.guild.name}.*\n\n` +
            `### 📌 Status & Summary\n` +
            `> - **Module State:** \`${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
            `> - **Configured Channels:** ${config.channels.length > 0 ? config.channels.map((c) => `<#${c.channelId}>`).join(", ") : "`None`"}`
        )
      );

      if (config.channels.length > 0) {
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        for (let i = 0; i < Math.min(config.channels.length, 3); i++) {
          const ch = config.channels[i];
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### <#${ch.channelId}>\n` +
                `> - **Title:** \`${ch.title || "Not set"}\`\n` +
                `> - **Description:** \`${ch.description ? (ch.description.length > 40 ? ch.description.slice(0, 40) + "..." : ch.description) : "Not set"}\`\n` +
                `> - **Self-Destruct:** \`${ch.selfDestruct ? `${ch.selfDestruct}s` : "Off"}\` | **Fields:** \`${ch.fields ? goodbyeManager.parseFields(ch.fields).length : 0}\` | **Buttons:** \`${ch.buttons ? goodbyeManager.parseButtons(ch.buttons).length : 0}\``
            )
          );
        }
        if (config.channels.length > 3) {
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-*...and ${config.channels.length - 3} more configured channel(s)*`)
          );
        }
      }

      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 💡 Variable Placeholders\n` +
            `\`{user}\` \`{user.mention}\` \`{user.tag}\` \`{user.name}\` \`{user.id}\` \`{user.avatar}\` \`{user.created_at}\` \`{user.joined_at}\`\n` +
            `\`{server}\` \`{guild.name}\` \`{guild.id}\` \`{memberCount}\` \`{guild.icon}\` \`{guild.boost_count}\` \`{timestamp}\``
        )
      );

      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`goodbye_toggle_${message.author.id}`)
            .setLabel(config.enabled ? "Disable Module" : "Enable Module")
            .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`goodbye_test_${message.author.id}`)
            .setLabel("Live Test Send")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("✨")
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: ADD
    // -------------------------------------------------------------
    if (subcommand === "add") {
      const channelArg = args[1];
      if (!channelArg) {
        return message.reply({
          content: "❌ Please mention a valid channel to add.\n\n**Usage:** `.goodbye add #channel` or `.goodbye add #channel --self_destruct 10`",
        }).catch(() => null);
      }

      const channel = resolveChannel(message.guild, channelArg);
      if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
        return message.reply({ content: "❌ Goodbye channel must be a valid text channel." }).catch(() => null);
      }

      if (config.channels.some((c) => c.channelId === channel.id)) {
        return message.reply({ content: `❌ <#${channel.id}> is already configured as a goodbye channel.` }).catch(() => null);
      }

      if (config.channels.length >= 5) {
        return message.reply({ content: "❌ Maximum limit of 5 goodbye channels reached." }).catch(() => null);
      }

      const selfDestruct = parseSelfDestruct(rawContent);
      goodbyeManager.addGoodbyeChannel(message.guild.id, {
        channelId: channel.id,
        selfDestruct,
      });

      goodbyeManager.updateGuildGoodbye(message.guild.id, { enabled: true });

      let resp = `✅ Goodbye channel <#${channel.id}> added successfully and system activated!`;
      if (selfDestruct) {
        resp += `\n⏱️ Messages sent in <#${channel.id}> will auto-delete after **${selfDestruct} seconds**.`;
      }
      resp += `\n\nUse \`.goodbye config #${channel.name} <option> <value>\` to customize options!`;

      return message.reply({ content: resp }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: REMOVE
    // -------------------------------------------------------------
    if (subcommand === "remove") {
      const channelArg = args[1];
      if (!channelArg) {
        return message.reply({ content: "❌ Please specify a channel to remove.\n\n**Usage:** `.goodbye remove #channel`" }).catch(() => null);
      }

      const channel = resolveChannel(message.guild, channelArg);
      const channelId = channel?.id || channelArg.replace(/[<#>]/g, "");

      const success = goodbyeManager.removeGoodbyeChannel(message.guild.id, channelId);
      if (!success) {
        return message.reply({ content: "❌ That channel is not in the goodbye channels list." }).catch(() => null);
      }

      return message.reply({ content: `✅ Successfully removed <#${channelId}> from goodbye channels.` }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: LIST
    // -------------------------------------------------------------
    if (subcommand === "list") {
      if (config.channels.length === 0) {
        return message.reply({ content: "ℹ️ No goodbye channels configured yet. Use `.goodbye add #channel` to add one!" }).catch(() => null);
      }

      const PER_PAGE = 3;
      const totalPages = Math.ceil(config.channels.length / PER_PAGE);
      const page = 0;

      const pageChannels = config.channels.slice(0, PER_PAGE);
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# <:leave:1528311514065535007> Goodbye Channels Directory (${config.channels.length})\n` +
            `**System Status:** ${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}`
        )
      );

      for (const ch of pageChannels) {
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <#${ch.channelId}>\n` +
              `> - **Title:** \`${ch.title || "Not set"}\`\n` +
              `> - **Description:** \`${ch.description ? (ch.description.length > 40 ? ch.description.slice(0, 40) + "..." : ch.description) : "Not set"}\`\n` +
              `> - **Self-Destruct:** \`${ch.selfDestruct ? `${ch.selfDestruct}s` : "Off"}\` | **Fields:** \`${ch.fields ? goodbyeManager.parseFields(ch.fields).length : 0}\` | **Buttons:** \`${ch.buttons ? goodbyeManager.parseButtons(ch.buttons).length : 0}\``
          )
        );
      }

      if (totalPages > 1) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`goodbyelist_prev_${message.author.id}_0`)
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`goodbyelist_next_${message.author.id}_0`)
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(false)
        );
        container.addActionRowComponents(row);
      }

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: CONFIG
    // -------------------------------------------------------------
    if (subcommand === "config") {
      let channelArg = args[1];
      let option = args[2]?.toLowerCase();

      const validOptions = [
        "content",
        "title",
        "description",
        "desc",
        "author",
        "authoricon",
        "footer",
        "footericon",
        "thumbnail",
        "image",
        "color",
        "selfdestruct",
        "self_destruct",
        "fields",
        "buttons",
      ];

      const extractValueFromRaw = (optionName) => {
        const optionPattern = new RegExp(`\\b${optionName}\\b\\s*`, "i");
        const match = rawContent.match(optionPattern);
        if (match) {
          const optionIndex = rawContent.indexOf(match[0]) + match[0].length;
          return rawContent.slice(optionIndex).replace(/\\n/g, "\n").trim() || null;
        }
        return null;
      };

      let value;
      if (channelArg && validOptions.includes(channelArg.toLowerCase()) && config.channels.length === 1) {
        option = channelArg.toLowerCase();
        channelArg = null;
        value = extractValueFromRaw(option);
      } else if (option) {
        value = extractValueFromRaw(option);
      } else {
        value = null;
      }

      let channelId;
      let channelConfig;

      if (!channelArg && config.channels.length === 1) {
        channelConfig = config.channels[0];
        channelId = channelConfig.channelId;
      } else if (!channelArg) {
        return message.reply({ content: "❌ Please specify a channel. Usage: `.goodbye config #channel <option> <value>`" }).catch(() => null);
      } else {
        const channel = resolveChannel(message.guild, channelArg);
        channelId = channel?.id || channelArg.replace(/[<#>]/g, "");
        channelConfig = config.channels.find((c) => c.channelId === channelId);
      }

      if (!channelConfig) {
        return message.reply({ content: "❌ That channel is not in the goodbye channels list. Use `.goodbye add #channel` first." }).catch(() => null);
      }

      if (!option) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ⚙️ Configuration for <#${channelId}>\n` +
              `> - **Title:** \`${channelConfig.title || "Not set"}\`\n` +
              `> - **Description:** \`${channelConfig.description ? (channelConfig.description.length > 50 ? channelConfig.description.slice(0, 50) + "..." : channelConfig.description) : "Not set"}\`\n` +
              `> - **Color:** \`${channelConfig.color ? `#${channelConfig.color.toString(16).padStart(6, "0").toUpperCase()}` : "Not set"}\`\n` +
              `> - **Self-Destruct:** \`${channelConfig.selfDestruct ? `${channelConfig.selfDestruct}s` : "Off"}\` | **Canvas:** \`${channelConfig.canvasEnabled ? "ON" : "OFF"}\``
          )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`goodbye_cfg_title_${channelId}_${message.author.id}`).setLabel("Title").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`goodbye_cfg_description_${channelId}_${message.author.id}`).setLabel("Description").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`goodbye_cfg_color_${channelId}_${message.author.id}`).setLabel("Color").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`goodbye_cfg_selfdestruct_${channelId}_${message.author.id}`).setLabel("Self-Destruct").setStyle(ButtonStyle.Secondary)
          )
        );

        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`goodbye_cfg_author_${channelId}_${message.author.id}`).setLabel("Author").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`goodbye_cfg_footer_${channelId}_${message.author.id}`).setLabel("Footer").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`goodbye_cfg_thumbnail_${channelId}_${message.author.id}`).setLabel("Thumbnail").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`goodbye_cfg_image_${channelId}_${message.author.id}`).setLabel("Image").setStyle(ButtonStyle.Secondary)
          )
        );

        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`goodbye_testch_${channelId}_${message.author.id}`).setLabel("Test Channel").setStyle(ButtonStyle.Primary).setEmoji("✨")
          )
        );

        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }

      // Handle Option Update
      switch (option) {
        case "color": {
          if (!value) return message.reply({ content: "❌ Provide a hex color. Example: `.goodbye config #channel color #ED4245`" }).catch(() => null);
          const color = parseColor(value);
          if (color === null) return message.reply({ content: "❌ Invalid hex color. Use format `#ED4245`." }).catch(() => null);
          channelConfig.color = color;
          break;
        }
        case "selfdestruct":
        case "self_destruct": {
          if (!value || value.toLowerCase() === "off" || value === "0") {
            channelConfig.selfDestruct = null;
          } else {
            const sec = parseInt(value);
            if (isNaN(sec) || sec < 6 || sec > 60) return message.reply({ content: "❌ Self-destruct duration must be between 6 and 60 seconds." }).catch(() => null);
            channelConfig.selfDestruct = sec;
          }
          break;
        }
        case "desc":
        case "description": {
          channelConfig.description = value || null;
          break;
        }
        default: {
          if (validOptions.includes(option)) {
            channelConfig[option] = value || null;
          } else {
            return message.reply({ content: "❌ Unknown option. Options: `content`, `title`, `description`, `color`, `selfdestruct`, `author`, `footer`, `thumbnail`, `image`, `fields`, `buttons`" }).catch(() => null);
          }
        }
      }

      goodbyeManager.addGoodbyeChannel(message.guild.id, channelConfig);
      return message.reply({ content: `✅ Updated **${option}** for <#${channelId}> successfully!` }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: TOGGLE / ENABLE / DISABLE
    // -------------------------------------------------------------
    if (subcommand === "toggle" || subcommand === "enable" || subcommand === "disable" || subcommand === "on" || subcommand === "off") {
      let state;
      if (subcommand === "enable" || subcommand === "on") state = true;
      else if (subcommand === "disable" || subcommand === "off") state = false;
      else state = !config.enabled;

      if (state && config.channels.length === 0) {
        return message.reply({ content: "❌ Add a goodbye channel first with `.goodbye add #channel`." }).catch(() => null);
      }

      goodbyeManager.updateGuildGoodbye(message.guild.id, { enabled: state });
      return message.reply({ content: `✅ Goodbye leave system is now **${state ? "ENABLED 🟢" : "DISABLED 🔴"}**.` }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: TEST
    // -------------------------------------------------------------
    if (subcommand === "test") {
      const channelArg = args[1];
      let targetChannels = [];

      if (channelArg) {
        const ch = resolveChannel(message.guild, channelArg);
        const chId = ch?.id || channelArg.replace(/[<#>]/g, "");
        const chConfig = config.channels.find((c) => c.channelId === chId);
        if (!chConfig) {
          return message.reply({ content: "❌ That channel is not configured for goodbye messages." }).catch(() => null);
        }
        targetChannels.push(chConfig);
      } else {
        if (config.channels.length === 0) {
          return message.reply({ content: "❌ No goodbye channels configured. Use `.goodbye add #channel` first." }).catch(() => null);
        }
        targetChannels = config.channels;
      }

      const { handleGoodbyeInteraction } = require("../../lib/goodbye/handleGoodbyeInteraction");
      const fakeInteraction = {
        isButton: () => true,
        isModalSubmit: () => false,
        customId: targetChannels.length === 1 ? `goodbye_testch_${targetChannels[0].channelId}_${message.author.id}` : `goodbye_test_${message.author.id}`,
        user: message.author,
        member: message.member,
        guild: message.guild,
        guildId: message.guild.id,
        reply: (opts) => message.reply(opts),
        deferReply: () => Promise.resolve(),
        editReply: (opts) => message.reply(opts),
      };

      await handleGoodbyeInteraction(client, fakeInteraction);
      return;
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: RESET
    // -------------------------------------------------------------
    if (subcommand === "reset") {
      goodbyeManager.resetGuildGoodbye(message.guild.id);
      return message.reply({ content: "✅ Goodbye system configuration has been reset to defaults." }).catch(() => null);
    }
  },
};
