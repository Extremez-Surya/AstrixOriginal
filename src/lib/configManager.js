const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

const CONFIG_FILE = path.join(__dirname, "configManagerConfig.json");

const MATCH_MODES = {
  EXACT: "exact",
  STARTSWITH: "startswith",
  ENDSWITH: "endswith",
  INCLUDES: "includes",
  REGEX: "regex",
};

const configCache = new Map();
let isInitialized = false;

function getDefaultConfig() {
  return {
    triggers: [],
    reactionTriggers: [],
    channelReactions: [],
    stickyMessages: [],
    mediaOnlyChannels: [],
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
          configCache.set(guildId, cfg);
        }
      }
    }
  } catch (e) {
    console.error("[ConfigManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      const obj = { guilds: {} };
      for (const [guildId, cfg] of configCache.entries()) {
        obj.guilds[guildId] = cfg;
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[ConfigManager] Save disk error:", e);
    }
  });
}

function getGuildConfig(guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultConfig();

  const raw = configCache.get(guildId);
  if (!raw) return getDefaultConfig();

  return {
    triggers: Array.isArray(raw.triggers) ? raw.triggers : [],
    reactionTriggers: Array.isArray(raw.reactionTriggers) ? raw.reactionTriggers : [],
    channelReactions: Array.isArray(raw.channelReactions) ? raw.channelReactions : [],
    stickyMessages: Array.isArray(raw.stickyMessages) ? raw.stickyMessages : [],
    mediaOnlyChannels: Array.isArray(raw.mediaOnlyChannels) ? raw.mediaOnlyChannels : [],
  };
}

function setGuildConfig(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function addMediaOnlyChannel(guildId, channelId) {
  const config = getGuildConfig(guildId);
  if (!config.mediaOnlyChannels) config.mediaOnlyChannels = [];
  if (!config.mediaOnlyChannels.includes(channelId)) {
    config.mediaOnlyChannels.push(channelId);
    setGuildConfig(guildId, config);
    return true;
  }
  return false;
}

function removeMediaOnlyChannel(guildId, channelId) {
  const config = getGuildConfig(guildId);
  if (config.mediaOnlyChannels && config.mediaOnlyChannels.includes(channelId)) {
    config.mediaOnlyChannels = config.mediaOnlyChannels.filter((id) => id !== channelId);
    setGuildConfig(guildId, config);
    return true;
  }
  return false;
}

function isMediaOnlyChannel(guildId, channelId) {
  const config = getGuildConfig(guildId);
  return Boolean(config.mediaOnlyChannels && config.mediaOnlyChannels.includes(channelId));
}

function processPlaceholders(template, message, extraArgs = "") {
  if (!template || typeof template !== "string") return "";

  const member = message.member;
  const guild = message.guild;
  const channel = message.channel;
  const user = message.author;

  const avatarUrl = typeof user?.displayAvatarURL === "function" ? user.displayAvatarURL({ size: 4096 }) : "";
  const serverIconUrl = typeof guild?.iconURL === "function" ? guild.iconURL({ size: 4096 }) : "";

  let result = template
    .replace(/\{user\}/g, user ? `<@${user.id}>` : "")
    .replace(/\{user_id\}/g, user?.id || "")
    .replace(/\{user_name\}/g, user?.username || "")
    .replace(/\{user_tag\}/g, user?.tag || user?.username || "")
    .replace(/\{user_displayname\}/g, member?.displayName || user?.username || "")
    .replace(/\{user_avatar\}/g, avatarUrl)
    .replace(/\{server\}/g, guild?.name || "Server")
    .replace(/\{server_id\}/g, guild?.id || "")
    .replace(/\{server_icon\}/g, serverIconUrl)
    .replace(/\{server_members\}/g, (guild?.memberCount || 0).toString())
    .replace(/\{channel\}/g, channel ? `<#${channel.id}>` : "")
    .replace(/\{channel_id\}/g, channel?.id || "")
    .replace(/\{channel_name\}/g, channel?.name || "")
    .replace(/\{args\}/g, extraArgs || "")
    .replace(/\{message\}/g, message.content || "")
    .replace(/\{message_id\}/g, message.id || "")
    .replace(/\{time\}/g, new Date().toLocaleTimeString())
    .replace(/\{date\}/g, new Date().toLocaleDateString())
    .replace(/\{timestamp\}/g, `<t:${Math.floor(Date.now() / 1000)}:F>`);

  // Random placeholder {random:min,max}
  result = result.replace(/\{random:(\d+),(\d+)\}/g, (_, min, max) => {
    const low = parseInt(min, 10);
    const high = parseInt(max, 10);
    return Math.floor(Math.random() * (high - low + 1) + low).toString();
  });

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY MESSAGES HELPER METHODS
// ─────────────────────────────────────────────────────────────────────────────
function setStickyMessage(guildId, channelId, stickyData) {
  const config = getGuildConfig(guildId);
  const existingIdx = config.stickyMessages.findIndex((s) => s.channelId === channelId);

  const stickyObj = typeof stickyData === "string"
    ? { content: stickyData, title: null, author: null, footer: null, thumbnail: null }
    : {
        content: stickyData.content || stickyData.description || "",
        title: stickyData.title || null,
        author: stickyData.author || null,
        footer: stickyData.footer || null,
        thumbnail: stickyData.thumbnail || null,
      };

  if (existingIdx !== -1) {
    config.stickyMessages[existingIdx] = {
      ...config.stickyMessages[existingIdx],
      ...stickyObj,
      enabled: true,
      updatedAt: Date.now(),
    };
  } else {
    config.stickyMessages.push({
      channelId,
      ...stickyObj,
      lastMessageId: null,
      enabled: true,
      createdAt: Date.now(),
    });
  }

  setGuildConfig(guildId, config);
  return true;
}

function editReaction(guildId, phrase, newEmoji) {
  const config = getGuildConfig(guildId);
  const targetLower = phrase.trim().toLowerCase();
  const reactionItem = (config.reactionTriggers || []).find(
    (r) => (r.trigger || "").trim().toLowerCase() === targetLower
  );

  if (reactionItem) {
    if (newEmoji) reactionItem.emoji = newEmoji;
    setGuildConfig(guildId, config);
    return true;
  }
  return false;
}

function removeStickyMessage(guildId, channelId) {
  const config = getGuildConfig(guildId);
  const initialLen = config.stickyMessages.length;
  config.stickyMessages = config.stickyMessages.filter((s) => s.channelId !== channelId);

  if (config.stickyMessages.length < initialLen) {
    setGuildConfig(guildId, config);
    return true;
  }
  return false;
}

function getStickyMessages(guildId) {
  const config = getGuildConfig(guildId);
  return config.stickyMessages || [];
}

function clearStickyMessages(guildId) {
  const config = getGuildConfig(guildId);
  config.stickyMessages = [];
  setGuildConfig(guildId, config);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE EVALUATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function editTrigger(guildId, phrase, newResponse, newMatchMode = "exact") {
  const config = getGuildConfig(guildId);
  const targetLower = phrase.trim().toLowerCase();
  const triggerItem = (config.triggers || []).find(
    (t) => (t.trigger || "").trim().toLowerCase() === targetLower
  );

  if (triggerItem) {
    if (newResponse) triggerItem.response = newResponse;
    if (newMatchMode) triggerItem.matchMode = newMatchMode;
    setGuildConfig(guildId, config);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE EVALUATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
async function evaluateTriggersAndReactions(message, client) {
  if (!message.guild || message.author.bot) return;

  try {
    const config = getGuildConfig(message.guild.id);

    // 1. Evaluate Sticky Messages
    if (config.stickyMessages && config.stickyMessages.length > 0) {
      const sticky = config.stickyMessages.find((s) => s.channelId === message.channel.id && s.enabled !== false);
      if (sticky && sticky.content) {
        // Delete previous sticky message if exists
        if (sticky.lastMessageId) {
          try {
            const oldMsg = await message.channel.messages.fetch(sticky.lastMessageId).catch(() => null);
            if (oldMsg) await oldMsg.delete().catch(() => null);
          } catch (_) {}
        }

        let header = sticky.title ? `### 📌 **${sticky.title}**\n` : `### 📌 **Sticky Message Notice**\n`;
        if (sticky.author) header = `**👤 ${sticky.author}**\n` + header;

        const body = sticky.content || "*No content provided*";
        const footerText = sticky.footer ? `-# ${sticky.footer}` : `-# Pinned via Astrix Configuration Engine • Automatically updated`;

        const stickyContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${header}\n${body}\n\n${footerText}`)
          );

        const newStickyMsg = await message.channel.send({
          components: [stickyContainer],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);

        if (newStickyMsg) {
          sticky.lastMessageId = newStickyMsg.id;
          setGuildConfig(message.guild.id, config);
        }
      }
    }

    // 2. Evaluate Channel Auto-Reactions
    if (config.channelReactions && config.channelReactions.length > 0) {
      const cr = config.channelReactions.find((item) => item.channelId === message.channel.id);
      if (cr && Array.isArray(cr.emojis)) {
        for (const emojiStr of cr.emojis) {
          try {
            await message.react(emojiStr).catch(() => null);
          } catch (_) {}
        }
      }
    }

    // 3. Evaluate Reaction Triggers
    if (config.reactionTriggers && config.reactionTriggers.length > 0) {
      const contentLower = message.content.trim().toLowerCase();

      for (const rt of config.reactionTriggers) {
        const triggerLower = (rt.trigger || "").trim().toLowerCase();
        const mode = rt.matchMode || MATCH_MODES.EXACT;
        let matched = false;

        if (mode === MATCH_MODES.EXACT) matched = contentLower === triggerLower;
        else if (mode === MATCH_MODES.STARTSWITH) matched = contentLower.startsWith(triggerLower);
        else if (mode === MATCH_MODES.ENDSWITH) matched = contentLower.endsWith(triggerLower);
        else if (mode === MATCH_MODES.INCLUDES) matched = contentLower.includes(triggerLower);
        else if (mode === MATCH_MODES.REGEX) {
          try {
            const rx = new RegExp(rt.trigger, "i");
            matched = rx.test(message.content);
          } catch (_) {}
        }

        if (matched && rt.emoji) {
          await message.react(rt.emoji).catch(() => null);
        }
      }
    }

    // 4. Evaluate Auto-Responders (Triggers)
    if (config.triggers && config.triggers.length > 0) {
      const contentTrimmed = message.content.trim();
      const contentLower = contentTrimmed.toLowerCase();

      for (const t of config.triggers) {
        if (t.enabled === false) continue;

        // Channel Scoping
        if (Array.isArray(t.channels) && t.channels.length > 0) {
          if (!t.channels.includes(message.channel.id)) continue;
        }

        // Allowed Roles Scoping
        if (Array.isArray(t.allowedRoles) && t.allowedRoles.length > 0) {
          const hasRole = t.allowedRoles.some((rid) => message.member?.roles.cache.has(rid));
          if (!hasRole) continue;
        }

        // Blacklisted Roles Scoping
        if (Array.isArray(t.blacklistedRoles) && t.blacklistedRoles.length > 0) {
          const hasBlack = t.blacklistedRoles.some((rid) => message.member?.roles.cache.has(rid));
          if (hasBlack) continue;
        }

        const triggerTrimmed = (t.trigger || "").trim();
        const triggerLower = triggerTrimmed.toLowerCase();
        const mode = t.matchMode || MATCH_MODES.EXACT;
        let matched = false;
        let extraArgs = "";

        if (mode === MATCH_MODES.EXACT) {
          // Exact match only: message must be equal to trigger phrase
          matched = contentLower === triggerLower;
        } else if (mode === MATCH_MODES.STARTSWITH) {
          if (contentLower.startsWith(triggerLower)) {
            matched = true;
            extraArgs = contentTrimmed.slice(triggerTrimmed.length).trim();
          }
        } else if (mode === MATCH_MODES.ENDSWITH) {
          matched = contentLower.endsWith(triggerLower);
        } else if (mode === MATCH_MODES.INCLUDES) {
          matched = contentLower.includes(triggerLower);
        } else if (mode === MATCH_MODES.REGEX) {
          try {
            const rx = new RegExp(t.trigger, "i");
            matched = rx.test(contentTrimmed);
          } catch (_) {}
        }

        if (matched && t.response) {
          const formattedResponse = processPlaceholders(t.response, message, extraArgs);

          await message.channel.send({
            content: formattedResponse,
            allowedMentions: { parse: ["users", "roles"] },
          }).catch(() => null);

          if (t.deleteMessage) {
            await message.delete().catch(() => null);
          }

          break; // Stop after first matched trigger
        }
      }
    }
  } catch (err) {
    console.error("[ConfigManager] Error in evaluateTriggersAndReactions:", err);
  }
}

initCache();

module.exports = {
  MATCH_MODES,
  getGuildConfig,
  setGuildConfig,
  processPlaceholders,
  setStickyMessage,
  removeStickyMessage,
  getStickyMessages,
  clearStickyMessages,
  editTrigger,
  editReaction,
  evaluateTriggersAndReactions,
};

