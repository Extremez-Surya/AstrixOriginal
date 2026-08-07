const fs = require("fs");
const path = require("path");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const GOODBYE_FILE = path.join(__dirname, "goodbyeConfig.json");
const WELCOME_FILE = path.join(__dirname, "welcomeConfig.json");

const defaultChannelConfig = {
  content: null,
  color: null,
  image: null,
  author: null,
  authorIcon: null,
  title: "Goodbye!",
  description: "**{user.tag}** has left the server.",
  footer: null,
  footerIcon: null,
  thumbnail: null,
  selfDestruct: null,
  fields: null,
  buttons: null,
  canvasEnabled: true,
  canvasBgUrl: null,
  canvasTemplate: "crimson",
  avatarShape: "circle",
  textColor: null,
  accentColor: null,
  customWatermark: null,
};

const defaultConfig = {
  enabled: false,
  leaveDmEnabled: false,
  leaveDmText: "Goodbye from **{server}**! We are sad to see you leave our community. You are always welcome back!",
  channels: [],
};

function loadConfig() {
  try {
    if (fs.existsSync(GOODBYE_FILE)) {
      const data = fs.readFileSync(GOODBYE_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load goodbyeConfig.json:", e);
  }
  return {};
}

function saveConfig(data) {
  try {
    fs.writeFileSync(GOODBYE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save goodbyeConfig.json:", e);
  }
}

/**
 * Migration helper to import legacy goodbye config from welcomeConfig.json if present
 */
function migrateLegacyConfig(guildId, config) {
  if (config[guildId]) return config[guildId];

  try {
    if (fs.existsSync(WELCOME_FILE)) {
      const welcomeData = JSON.parse(fs.readFileSync(WELCOME_FILE, "utf8"));
      const legacyGoodbye = welcomeData[guildId]?.goodbye;
      if (legacyGoodbye) {
        const migrated = {
          enabled: legacyGoodbye.enabled ?? false,
          leaveDmEnabled: legacyGoodbye.leaveDmEnabled ?? false,
          leaveDmText: legacyGoodbye.leaveDmText ?? "Goodbye from **{server}**! We are sad to see you leave our community. You are always welcome back!",
          channels: [],
        };
        if (legacyGoodbye.channelId) {
          migrated.channels.push({
            ...defaultChannelConfig,
            channelId: legacyGoodbye.channelId,
            description: legacyGoodbye.messageText || defaultChannelConfig.description,
            canvasEnabled: legacyGoodbye.canvasEnabled ?? true,
            canvasBgUrl: legacyGoodbye.canvasBgUrl ?? null,
          });
        }
        config[guildId] = migrated;
        saveConfig(config);
        return config[guildId];
      }
    }
  } catch (e) {}

  return null;
}

function getGuildGoodbye(guildId) {
  if (!guildId) return { ...defaultConfig };
  const config = loadConfig();

  let guildData = config[guildId];
  if (!guildData) {
    guildData = migrateLegacyConfig(guildId, config);
  }

  if (!guildData) {
    guildData = { ...defaultConfig, channels: [] };
  }

  if (guildData && !Array.isArray(guildData.channels)) {
    const oldChannel = guildData.channelId || guildData.channel;
    const newChannels = [];
    if (oldChannel) {
      newChannels.push({
        ...defaultChannelConfig,
        channelId: oldChannel,
        description: guildData.messageText || defaultChannelConfig.description,
        canvasEnabled: guildData.canvasEnabled ?? true,
        canvasBgUrl: guildData.canvasBgUrl ?? null,
      });
    }
    guildData = {
      enabled: guildData.enabled ?? false,
      leaveDmEnabled: guildData.leaveDmEnabled ?? false,
      leaveDmText: guildData.leaveDmText ?? "Goodbye from **{server}**! We are sad to see you leave our community. You are always welcome back!",
      channels: newChannels,
    };
    config[guildId] = guildData;
    saveConfig(config);
  }

  guildData.leaveDmEnabled = guildData.leaveDmEnabled ?? false;
  guildData.leaveDmText = guildData.leaveDmText ?? "Goodbye from **{server}**! We are sad to see you leave our community. You are always welcome back!";

  return guildData;
}

function updateGuildGoodbye(guildId, newSettings) {
  if (!guildId) return false;
  const config = loadConfig();
  const current = getGuildGoodbye(guildId);
  config[guildId] = { ...current, ...newSettings };
  saveConfig(config);
  return config[guildId];
}

function addGoodbyeChannel(guildId, channelConfig) {
  if (!guildId || !channelConfig.channelId) return false;
  const config = loadConfig();
  const current = getGuildGoodbye(guildId);

  const existingIndex = current.channels.findIndex((c) => c.channelId === channelConfig.channelId);
  const newChannel = { ...defaultChannelConfig, ...channelConfig };

  if (existingIndex !== -1) {
    current.channels[existingIndex] = { ...current.channels[existingIndex], ...newChannel };
  } else {
    current.channels.push(newChannel);
  }

  config[guildId] = current;
  saveConfig(config);
  return current;
}

function removeGoodbyeChannel(guildId, channelId) {
  if (!guildId || !channelId) return false;
  const config = loadConfig();
  const current = getGuildGoodbye(guildId);

  const index = current.channels.findIndex((c) => c.channelId === channelId);
  if (index === -1) return false;

  current.channels.splice(index, 1);
  config[guildId] = current;
  saveConfig(config);
  return true;
}

function resetGuildGoodbye(guildId) {
  if (!guildId) return false;
  const config = loadConfig();
  config[guildId] = { ...defaultConfig, channels: [] };
  saveConfig(config);
  return config[guildId];
}

function isValidUrl(str) {
  if (!str || typeof str !== "string") return false;
  const lower = str.trim().toLowerCase();
  return lower.startsWith("http://") || lower.startsWith("https://");
}

function parseFields(fieldsStr) {
  if (!fieldsStr) return [];
  const fields = [];
  const fieldParts = fieldsStr
    .split(";;")
    .map((f) => f.trim())
    .filter((f) => f);
  for (const part of fieldParts) {
    const parts = part.split("&&").map((p) => p.trim());
    if (parts.length >= 2) {
      fields.push({
        name: parts[0],
        value: parts[1],
        inline: parts[2]?.toLowerCase() === "true" || parts[2]?.toLowerCase() === "yes",
      });
    }
  }
  return fields;
}

function parseButtons(buttonsStr) {
  if (!buttonsStr) return [];
  const buttons = [];
  const buttonParts = buttonsStr
    .split(";;")
    .map((b) => b.trim())
    .filter((b) => b);
  for (const part of buttonParts) {
    const parts = part.split("&&").map((p) => p.trim());
    if (parts.length >= 2 && isValidUrl(parts[1])) {
      buttons.push({
        label: parts[0].slice(0, 80),
        url: parts[1],
      });
    }
  }
  return buttons.slice(0, 5);
}

function formatGoodbyeText(text, member, guild) {
  if (!text) return "";
  const userObj = member.user || member;
  const guildObj = guild || member.guild || {};

  const memberId = userObj.id || "0";
  const username = userObj.username || "Member";
  const tag = userObj.tag || username;
  const avatar = typeof userObj.displayAvatarURL === "function" ? userObj.displayAvatarURL({ size: 512 }) : "";
  const createdTs = Math.floor((userObj.createdTimestamp || Date.now()) / 1000);
  const joinedTs = Math.floor((member.joinedTimestamp || Date.now()) / 1000);

  const guildName = guildObj.name || "Server";
  const guildId = guildObj.id || "0";
  const memberCount = guildObj.memberCount ? guildObj.memberCount.toLocaleString() : "1";
  const icon = typeof guildObj.iconURL === "function" ? guildObj.iconURL({ size: 512 }) || "" : "";
  const banner = typeof guildObj.bannerURL === "function" ? guildObj.bannerURL({ size: 1024 }) || "" : "";
  const splash = typeof guildObj.splashURL === "function" ? guildObj.splashURL({ size: 1024 }) || "" : "";
  const boostCount = guildObj.premiumSubscriptionCount ? guildObj.premiumSubscriptionCount.toString() : "0";
  const boostTier = guildObj.premiumTier ? `Level ${guildObj.premiumTier}` : "No Level";
  const ownerId = guildObj.ownerId || "0";
  const vanity = guildObj.vanityURLCode || "N/A";
  const roleCount = guildObj.roles?.cache ? guildObj.roles.cache.size.toString() : "0";
  const emojiCount = guildObj.emojis?.cache ? guildObj.emojis.cache.size.toString() : "0";
  const channelCount = guildObj.channels?.cache ? guildObj.channels.cache.size.toString() : "0";

  const nowTs = Math.floor(Date.now() / 1000);

  const replacements = {
    "{user}": `<@${memberId}>`,
    "{user.mention}": `<@${memberId}>`,
    "{user.tag}": tag,
    "{user.name}": username,
    "{user.id}": memberId,
    "{user.avatar}": avatar,
    "{user.created_at}": `<t:${createdTs}:F>`,
    "{user.created_at_timestamp}": `<t:${createdTs}:R>`,
    "{user.joined_at}": `<t:${joinedTs}:F>`,
    "{user.joined_at_timestamp}": `<t:${joinedTs}:R>`,

    "{username}": username,
    "{tag}": tag,

    "{server}": guildName,
    "{guild}": guildName,
    "{guild.name}": guildName,
    "{server.id}": guildId,
    "{guild.id}": guildId,
    "{memberCount}": memberCount,
    "{guild.count}": memberCount,
    "{server.icon}": icon,
    "{guild.icon}": icon,
    "{guild.banner}": banner,
    "{guild.splash}": splash,
    "{guild.owner_id}": ownerId,
    "{guild.created_at}": `<t:${Math.floor((guildObj.createdTimestamp || Date.now()) / 1000)}:F>`,
    "{guild.created_at_timestamp}": `<t:${Math.floor((guildObj.createdTimestamp || Date.now()) / 1000)}:R>`,
    "{guild.boost_count}": boostCount,
    "{guild.boost_tier}": boostTier,
    "{guild.vanity}": vanity,
    "{guild.role_count}": roleCount,
    "{guild.emoji_count}": emojiCount,
    "{guild.channel_count}": channelCount,

    "{timestamp}": `<t:${nowTs}:F>`,
    "{timestamp.relative}": `<t:${nowTs}:R>`,
    "{timestamp.date}": `<t:${nowTs}:D>`,
    "{timestamp.time}": `<t:${nowTs}:T>`,

    "{date}": new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    "{date.short}": new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    "{time}": new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    "{datetime}": new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  };

  let result = text;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }
  return result;
}

function buildGoodbyeEmbed(channelConfig, member) {
  const guild = member.guild || {};
  const hasEmbedContent =
    channelConfig.title ||
    channelConfig.description ||
    channelConfig.author ||
    channelConfig.footer ||
    channelConfig.thumbnail ||
    channelConfig.image ||
    channelConfig.fields ||
    channelConfig.color;

  if (!hasEmbedContent) return null;

  const embed = new EmbedBuilder();

  if (channelConfig.color) {
    embed.setColor(channelConfig.color);
  }

  if (channelConfig.author) {
    const authorText = formatGoodbyeText(channelConfig.author, member, guild);
    const authorIconUrl = channelConfig.authorIcon ? formatGoodbyeText(channelConfig.authorIcon, member, guild) : null;
    if (authorIconUrl && isValidUrl(authorIconUrl)) {
      embed.setAuthor({ name: authorText, iconURL: authorIconUrl });
    } else {
      embed.setAuthor({ name: authorText });
    }
  }

  if (channelConfig.title) {
    embed.setTitle(formatGoodbyeText(channelConfig.title, member, guild));
  }

  if (channelConfig.description) {
    embed.setDescription(formatGoodbyeText(channelConfig.description, member, guild));
  }

  if (channelConfig.fields) {
    const fields = parseFields(channelConfig.fields);
    for (const field of fields) {
      embed.addFields({
        name: formatGoodbyeText(field.name, member, guild),
        value: formatGoodbyeText(field.value, member, guild),
        inline: field.inline,
      });
    }
  }

  if (channelConfig.thumbnail) {
    const thumbUrl = formatGoodbyeText(channelConfig.thumbnail, member, guild);
    if (isValidUrl(thumbUrl)) {
      embed.setThumbnail(thumbUrl);
    }
  }

  if (channelConfig.image) {
    const imageUrl = formatGoodbyeText(channelConfig.image, member, guild);
    if (isValidUrl(imageUrl)) {
      embed.setImage(imageUrl);
    }
  }

  if (channelConfig.footer) {
    const footerText = formatGoodbyeText(channelConfig.footer, member, guild);
    const footerIconUrl = channelConfig.footerIcon ? formatGoodbyeText(channelConfig.footerIcon, member, guild) : null;
    if (footerIconUrl && isValidUrl(footerIconUrl)) {
      embed.setFooter({ text: footerText, iconURL: footerIconUrl });
    } else {
      embed.setFooter({ text: footerText });
    }
  }

  embed.setTimestamp();
  return embed;
}

function buildGoodbyeButtons(channelConfig, member) {
  if (!channelConfig.buttons) return null;
  const buttons = parseButtons(channelConfig.buttons);
  if (buttons.length === 0) return null;

  const guild = member.guild || {};
  const row = new ActionRowBuilder();
  for (const btn of buttons) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(formatGoodbyeText(btn.label, member, guild))
        .setURL(formatGoodbyeText(btn.url, member, guild))
        .setStyle(ButtonStyle.Link)
    );
  }
  return row;
}

module.exports = {
  defaultChannelConfig,
  defaultConfig,
  getGuildGoodbye,
  updateGuildGoodbye,
  addGoodbyeChannel,
  removeGoodbyeChannel,
  resetGuildGoodbye,
  parseFields,
  parseButtons,
  formatGoodbyeText,
  buildGoodbyeEmbed,
  buildGoodbyeButtons,
};
