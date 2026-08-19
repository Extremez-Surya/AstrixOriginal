const {
  Events,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const birthdayManager = require("../lib/birthdayManager");
const { buildBirthdayWishCard } = require("../lib/security/handleBirthdayInteraction");

const wishedToday = new Map();

function isMidnightInTimezone(timezone) {
  try {
    const now = new Date();
    const options = { timeZone: timezone, hour: "numeric", hour12: false };
    const hour = parseInt(new Intl.DateTimeFormat("en-US", options).format(now), 10);
    return hour === 0;
  } catch {
    return false;
  }
}

function getTodayInTimezone(timezone) {
  try {
    const now = new Date();
    const options = { timeZone: timezone };
    const formatter = new Intl.DateTimeFormat("en-US", { ...options, day: "numeric", month: "numeric" });
    const parts = formatter.formatToParts(now);
    const day = parseInt(parts.find((p) => p.type === "day")?.value, 10);
    const month = parseInt(parts.find((p) => p.type === "month")?.value, 10);
    return { day, month };
  } catch {
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth() + 1 };
  }
}

async function triggerBirthdayCheckGuild(client, guild, forceRun = false) {
  const config = birthdayManager.getGuildBirthday(guild.id);
  if (!config.enabled || !config.wishChannel) return 0;

  const timezone = config.timezone || "Asia/Kolkata";
  if (!forceRun && !isMidnightInTimezone(timezone)) return 0;

  const { day, month } = getTodayInTimezone(timezone);
  const birthdays = config.birthdays || {};

  const wishChan = guild.channels.cache.get(config.wishChannel);
  if (!wishChan || !wishChan.isTextBased()) return 0;

  if (!wishedToday.has(guild.id)) wishedToday.set(guild.id, new Set());
  const wishedSet = wishedToday.get(guild.id);

  let count = 0;

  for (const [userId, bday] of Object.entries(birthdays)) {
    const bDayVal = parseInt(bday.day, 10);
    const bMonthVal = parseInt(bday.month, 10);

    if (bDayVal !== day || bMonthVal !== month) continue;
    if (!forceRun && wishedSet.has(userId)) continue;

    try {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) continue;

      const { AttachmentBuilder } = require("discord.js");
      const { generateBirthdayCanvas } = require("../lib/birthdayCanvas");

      const buffer = await generateBirthdayCanvas(member.user, guild, {
        customWish: config.wishMessage?.description,
      });
      const attachment = new AttachmentBuilder(buffer, { name: "birthday.png" });

      await wishChan.send({
        content: `🎉 Happy Birthday <@${userId}>! 🎂❤️`,
        files: [attachment],
        allowedMentions: { users: [userId] },
      }).catch(() => null);

      // Give temporary birthday role for 24h
      if (config.birthdayRole) {
        const role = guild.roles.cache.get(config.birthdayRole);
        if (role && role.position < guild.members.me.roles.highest.position) {
          await member.roles.add(role).catch(() => null);
          setTimeout(async () => {
            try {
              const freshMember = await guild.members.fetch(userId).catch(() => null);
              if (freshMember && freshMember.roles.cache.has(role.id)) {
                await freshMember.roles.remove(role).catch(() => null);
              }
            } catch (_) {}
          }, 24 * 60 * 60 * 1000);
        }
      }

      wishedSet.add(userId);
      count++;
    } catch (e) {
      console.error(`[BirthdayScheduler] Error wishing user ${userId}:`, e);
    }
  }

  if (count > 0) {
    config.stats = config.stats || {};
    config.stats.totalWishesSent = (config.stats.totalWishesSent || 0) + count;
    config.stats.lastCheckTimestamp = Date.now();
    birthdayManager.setGuildBirthday(guild.id, config);
  }

  return count;
}

module.exports = {
  name: "onBirthdayScheduler",
  event: Events.ClientReady,
  once: true,
  triggerBirthdayCheckGuild,
  getTodayInTimezone,

  async execute(client) {
    console.log("🎂 [Birthday Scheduler] Automated Timezone Wish Scheduler Active");

    const checkAll = async () => {
      for (const guild of client.guilds.cache.values()) {
        try {
          await triggerBirthdayCheckGuild(client, guild, false);
        } catch (_) {}
      }
    };

    // Check every 15 minutes
    setInterval(checkAll, 15 * 60 * 1000);

    // Initial check after 30 seconds
    setTimeout(checkAll, 30 * 1000);

    // Reset daily cache at UTC midnight
    setInterval(() => {
      const now = new Date();
      if (now.getUTCHours() === 0 && now.getUTCMinutes() < 5) {
        wishedToday.clear();
      }
    }, 5 * 60 * 1000);
  },
};
