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

  const defaultConfig = getDefaultConfig();
  return {
    triggers: Array.isArray(raw.triggers) ? raw.triggers : [],
    reactionTriggers: Array.isArray(raw.reactionTriggers) ? raw.reactionTriggers : [],
    channelReactions: Array.isArray(raw.channelReactions) ? raw.channelReactions : [],
  };
}

function setGuildConfig(guildId, config) {
  if (!isInitialized) initCache();
  if (!guildId) return false;

  configCache.set(guildId, config);
  saveDiskAsync();
  return true;
}

function processPlaceholders(template, message, extraArgs = "") {
  if (!template || typeof template !== "string") return "";

  const member = message.member;
  const guild = message.guild;
  const channel = message.channel;
  const user = message.author;

  return template
    .replace(/\{user\}/g, `<@${user.id}>`)
    .replace(/\{user_id\}/g, user.id)
    .replace(/\{user_name\}/g, user.username)
    .replace(/\{user_tag\}/g, user.tag || user.username)
    .replace(/\{user_displayname\}/g, member?.displayName || user.username)
    .replace(/\{user_avatar\}/g, user.displayAvatarURL({ size: 4096 }))
    .replace(/\{server\}/g, guild.name)
    .replace(/\{server_id\}/g, guild.id)
    .replace(/\{server_icon\}/g, guild.iconURL({ size: 4096 }) || "")
    .replace(/\{server_members\}/g, guild.memberCount.toString())
    .replace(/\{channel\}/g, `<#${channel.id}>`)
    .replace(/\{channel_id\}/g, channel.id)
    .replace(/\{channel_name\}/g, channel.name)
    .replace(/\{args\}/g, extraArgs || "")
    .replace(/\{message\}/g, message.content)
    .replace(/\{message_id\}/g, message.id)
    .replace(/\{time\}/g, new Date().toLocaleTimeString())
    .replace(/\{date\}/g, new Date().toLocaleDateString())
    .replace(/\{timestamp\}/g, `<t:${Math.floor(Date.now() / 1000)}:F>`);
}

async function evaluateTriggersAndReactions(message, client) {
  if (!message.guild || message.author.bot) return;

  try {
    const config = getGuildConfig(message.guild.id);

    // 1. Evaluate Channel Auto-Reactions
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

    // 2. Evaluate Reaction Triggers
    if (config.reactionTriggers && config.reactionTriggers.length > 0) {
      const contentLower = message.content.toLowerCase();

      for (const rt of config.reactionTriggers) {
        const triggerLower = (rt.trigger || "").toLowerCase();
        const mode = rt.matchMode || MATCH_MODES.INCLUDES;
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

    // 3. Evaluate Auto-Responders (Triggers)
    if (config.triggers && config.triggers.length > 0) {
      const contentLower = message.content.toLowerCase();

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

        const triggerLower = (t.trigger || "").toLowerCase();
        const mode = t.matchMode || MATCH_MODES.EXACT;
        let matched = false;
        let extraArgs = "";

        if (mode === MATCH_MODES.EXACT) matched = contentLower === triggerLower;
        else if (mode === MATCH_MODES.STARTSWITH) {
          if (contentLower.startsWith(triggerLower)) {
            matched = true;
            extraArgs = message.content.slice(t.trigger.length).trim();
          }
        } else if (mode === MATCH_MODES.ENDSWITH) matched = contentLower.endsWith(triggerLower);
        else if (mode === MATCH_MODES.INCLUDES) matched = contentLower.includes(triggerLower);
        else if (mode === MATCH_MODES.REGEX) {
          try {
            const rx = new RegExp(t.trigger, "i");
            matched = rx.test(message.content);
          } catch (_) {}
        }

        if (matched && t.response) {
          const formattedResponse = processPlaceholders(t.response, message, extraArgs);

          if (t.useComponentsV2 !== false) {
            const container = new ContainerBuilder()
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(formattedResponse));

            await message.channel.send({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
              allowedMentions: { parse: ["users", "roles"] },
            }).catch(() => null);
          } else {
            await message.channel.send({
              content: formattedResponse,
              allowedMentions: { parse: ["users", "roles"] },
            }).catch(() => null);
          }

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
  evaluateTriggersAndReactions,
};
