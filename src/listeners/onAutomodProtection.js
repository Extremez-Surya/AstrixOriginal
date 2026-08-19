const {
  Events,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const automodManager = require("../lib/automodManager");
const EMOJIS = require("../lib/emojis");

// Pre-compiled regex filters
const DISCORD_INVITE_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
const URL_REGEX = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/gi;
const ZALGO_REGEX = /[\u0300-\u036f\u0489]/g;
const EVERYONE_HERE_REGEX = /@(everyone|here)/i;

const COPYPASTAS = [
  "did you just seriously think",
  "navy seal copypasta",
  "gorilla warfare",
  "i am trained in",
  "over 300 confirmed",
  "my dad works at",
  "unregistered hypercam",
  "free robux",
  "free nitro",
  "claim your gift",
  "steam gift",
  "discord nitro for free",
  "you have been gifted",
  "airdrop claim",
  "click here to claim",
];

const HomoglyphMap = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i",
  "ⓘ": "i", "c": "c", "о": "o", "е": "e", "а": "a", "р": "p", "с": "c", "∪": "u",
};

function normalizeText(text) {
  if (!text) return "";
  let str = text.toLowerCase();
  for (const [sub, target] of Object.entries(HomoglyphMap)) {
    str = str.split(sub).join(target);
  }
  return str;
}

const spamCache = new Map();

function checkAntiInvite(message) {
  const norm = normalizeText(message.content);
  return DISCORD_INVITE_REGEX.test(message.content) || DISCORD_INVITE_REGEX.test(norm);
}

function checkAntiLink(message) {
  URL_REGEX.lastIndex = 0;
  const urls = message.content.match(URL_REGEX);
  if (!urls) return false;
  return urls.some((url) => !url.includes("discord.com") && !url.includes("discord.gg"));
}

function checkAntiSpam(message, config) {
  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const windowMs = (config.modules.antispam?.window || 5) * 1000;
  const threshold = config.modules.antispam?.threshold || 5;

  if (!spamCache.has(key)) spamCache.set(key, []);
  const timestamps = spamCache.get(key);
  timestamps.push({ time: now, content: message.content });

  const recent = timestamps.filter((t) => now - t.time < windowMs);
  spamCache.set(key, recent);

  if (recent.length >= threshold) return true;

  const duplicates = recent.filter((t) => t.content === message.content);
  if (duplicates.length >= 3) return true;

  return false;
}

function checkAntiCaps(message, config) {
  const text = message.content.replace(/[^a-zA-Z]/g, "");
  if (text.length < 8) return false;

  const capsCount = (text.match(/[A-Z]/g) || []).length;
  const capsPercentage = (capsCount / text.length) * 100;
  const threshold = config.modules.anticaps?.threshold || 70;

  return capsPercentage >= threshold;
}

function checkAntiMention(message, config) {
  const threshold = config.modules.antimention?.threshold || 5;
  return message.mentions.users.size >= threshold;
}

function checkAntiEmoji(message, config) {
  const threshold = config.modules.antiemoji?.threshold || 10;
  const customEmojis = (message.content.match(/<a?:\w+:\d+>/g) || []).length;
  const unicodeEmojis = (message.content.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  return customEmojis + unicodeEmojis >= threshold;
}

function checkBadWords(message, config) {
  const words = config.modules.badwords?.words || [];
  if (!words.length) return false;

  const raw = message.content.toLowerCase();
  const norm = normalizeText(message.content);

  return words.some((w) => {
    const wordClean = w.toLowerCase().trim();
    return raw.includes(wordClean) || norm.includes(wordClean);
  });
}

function checkMaxLines(message, config) {
  const threshold = config.modules.maxlines?.threshold || 15;
  const lines = message.content.split("\n").length;
  return lines > threshold;
}

function checkAntiEveryone(message, config) {
  if (message.member?.permissions.has(PermissionFlagsBits.MentionEveryone)) return false;
  if (EVERYONE_HERE_REGEX.test(message.content)) return true;

  const threshold = config.modules.antieveryone?.threshold || 5;
  const usePercent = config.modules.antieveryone?.usePercent !== false;
  const serverMembers = message.guild.memberCount;
  const minMembers = usePercent ? Math.ceil(serverMembers * (threshold / 100)) : threshold;

  if (message.mentions.roles.size > 0) {
    for (const [, role] of message.mentions.roles) {
      if (role.members.size >= minMembers) return true;
    }
  }
  return false;
}

function checkAntiRole(message, config) {
  const threshold = config.modules.antirole?.threshold || 5;
  const usePercent = config.modules.antirole?.usePercent !== false;
  const serverMembers = message.guild.memberCount;
  const minMembers = usePercent ? Math.ceil(serverMembers * (threshold / 100)) : threshold;

  if (message.mentions.roles.size > 0) {
    for (const [, role] of message.mentions.roles) {
      if (role.members.size >= minMembers) return true;
    }
  }
  return false;
}

function checkAntiZalgo(message) {
  const zalgoChars = message.content.match(ZALGO_REGEX);
  return zalgoChars && zalgoChars.length > 10;
}

function checkAntiNewlines(message, config) {
  const threshold = config.modules.antinewlines?.threshold || 5;
  const blankLines = (message.content.match(/\n\s*\n/g) || []).length;
  return blankLines >= threshold;
}

function checkAntiCopypasta(message) {
  const content = message.content.toLowerCase();
  return COPYPASTAS.some((pasta) => content.includes(pasta));
}

const MODULE_CHECKS = {
  antiinvite: { check: checkAntiInvite, violation: "Discord invite links are not permitted." },
  antilink: { check: checkAntiLink, violation: "External links are not permitted." },
  antispam: { check: checkAntiSpam, violation: "Please slow down! Spamming is not permitted." },
  anticaps: { check: checkAntiCaps, violation: "Excessive capital letters are not permitted." },
  antimention: { check: checkAntiMention, violation: "Mass user mentions are not permitted." },
  antiemoji: { check: checkAntiEmoji, violation: "Excessive emoji spam is not permitted." },
  badwords: { check: checkBadWords, violation: "Your message contained a banned word/phrase." },
  maxlines: { check: checkMaxLines, violation: "Your message exceeded vertical line limits." },
  antieveryone: { check: checkAntiEveryone, violation: "Mentioning @everyone or @here is not permitted." },
  antirole: { check: checkAntiRole, violation: "Mass role mentions are not permitted." },
  antizalgo: { check: checkAntiZalgo, violation: "Zalgo/glitched text is not permitted." },
  antinewlines: { check: checkAntiNewlines, violation: "Excessive blank lines are not permitted." },
  anticopypasta: { check: checkAntiCopypasta, violation: "Viral copypasta spam is not permitted." },
};

function logViolationAsync(guild, config, moduleName, violation, user, channel, content) {
  setImmediate(async () => {
    if (!config.logChannel) return;
    const logChan = guild.channels.cache.get(config.logChannel);
    if (!logChan || !logChan.isTextBased()) return;

    try {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### ${EMOJIS.automod || "🛡️"} AutoMod Violation Triggered`)
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> - **Offender:** ${user.tag} (\`${user.id}\`)\n` +
              `> - **Channel:** <#${channel.id}>\n` +
              `> - **Module:** \`${moduleName}\`\n` +
              `> - **Violation:** ${violation}`
          )
        );

      if (content && content.length < 1000) {
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Intercepted Message:**\n\`\`\`${content.substring(0, 900)}\`\`\``)
        );
      }

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ AutoMod Engine • Sub-0.1s Execution`)
      );

      await logChan.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } catch (_) {}
  });
}

async function applyPunishment(message, client, config, moduleName, violation) {
  const moduleConfig = config.modules[moduleName];
  let punishments = moduleConfig?.punishments || ["delete"];
  if (!Array.isArray(punishments)) punishments = [punishments];

  // 1. Delete message instantly (< 30ms)
  if (punishments.some((p) => ["delete", "warn", "mute", "kick", "ban"].includes(p))) {
    if (message.deletable) {
      await message.delete().catch(() => null);
    }
  }

  // 2. Punish member according to actions
  for (const p of punishments) {
    if (p === "mute" && message.member?.moderatable) {
      await message.member.timeout(10 * 60 * 1000, `AutoMod: ${violation}`).catch(() => null);
    } else if (p === "kick" && message.member?.kickable) {
      await message.member.kick(`AutoMod: ${violation}`).catch(() => null);
    } else if (p === "ban" && message.member?.bannable) {
      await message.member.ban({ reason: `AutoMod: ${violation}`, deleteMessageSeconds: 86400 }).catch(() => null);
    } else if (p === "protocol" && message.member?.moderatable) {
      const editableRoles = message.member.roles.cache.filter((r) => r.id !== message.guild.id && r.editable);
      await message.member.roles.remove(editableRoles, `AutoMod Protocol`).catch(() => null);
      await message.member.timeout(28 * 24 * 60 * 60 * 1000, `AutoMod Protocol`).catch(() => null);
    }
  }

  // 3. Stats increment
  automodManager.setGuildAutomod(message.guild.id, {
    ...config,
    stats: {
      ...config.stats,
      violationsIntercepted: (config.stats?.violationsIntercepted || 0) + 1,
      messagesDeleted: (config.stats?.messagesDeleted || 0) + 1,
    },
  });

  // 4. Async Log Alert
  logViolationAsync(message.guild, config, moduleName, violation, message.author, message.channel, message.content);

  // 5. User Notification in channel if enabled
  if (config.notifyUser !== false) {
    message.channel
      .send({
        content: `⚠️ <@${message.author.id}> ${violation}`,
        allowedMentions: { users: [message.author.id] },
      })
      .then((m) => setTimeout(() => m.delete().catch(() => null), 5000))
      .catch(() => null);
  }
}

module.exports = {
  name: "onAutomodProtection",
  event: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log("🤖 [AutoMod Engine] Sub-0.1s Unbypassable Filters Active");

    client.on(Events.MessageCreate, async (message) => {
      if (!message.guild || message.author.bot || !message.member) return;

      // Bypass Admins & Manage Messages
      if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
      if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

      const config = automodManager.getGuildAutomod(message.guild.id);
      if (!config.enabled) return;

      for (const [moduleName, { check, violation }] of Object.entries(MODULE_CHECKS)) {
        if (automodManager.isIgnored(message, config, moduleName)) continue;

        try {
          const triggered = check(message, config);
          if (triggered) {
            await applyPunishment(message, client, config, moduleName, violation);
            break;
          }
        } catch (e) {
          console.error(`[AutoMod] Error in ${moduleName} check:`, e);
        }
      }
    });
  },
};

// Cleanup spam cache every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of spamCache.entries()) {
    const filtered = timestamps.filter((t) => now - t.time < 60000);
    if (filtered.length === 0) spamCache.delete(key);
    else spamCache.set(key, filtered);
  }
}, 60000);
