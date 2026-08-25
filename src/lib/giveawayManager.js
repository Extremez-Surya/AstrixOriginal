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
} = require("discord.js");

const GIVEAWAYS_FILE = path.join(__dirname, "giveaways.json");
const timersMap = new Map();

function parseDuration(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return num * 1000;
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "d":
      return num * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

function loadData() {
  try {
    if (fs.existsSync(GIVEAWAYS_FILE)) {
      const data = fs.readFileSync(GIVEAWAYS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load giveaways.json:", e);
  }
  return {};
}

function saveData(data) {
  try {
    fs.writeFileSync(GIVEAWAYS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save giveaways.json:", e);
  }
}

function getGiveaway(messageId) {
  const data = loadData();
  return data[messageId] || null;
}

function getGuildGiveaways(guildId) {
  const data = loadData();
  return Object.values(data).filter((g) => g.guildId === guildId);
}

function saveGiveaway(g) {
  const data = loadData();
  data[g.messageId] = g;
  saveData(data);
}

function scheduleEndTimer(client, g) {
  if (timersMap.has(g.messageId)) {
    clearTimeout(timersMap.get(g.messageId));
    timersMap.delete(g.messageId);
  }

  if (g.ended || g.paused) return;

  const remaining = g.endTimestamp - Date.now();
  if (remaining <= 0) {
    endGiveaway(client, g.messageId).catch(() => {});
  } else {
    const timer = setTimeout(() => {
      endGiveaway(client, g.messageId).catch(() => {});
    }, remaining);
    timersMap.set(g.messageId, timer);
  }
}

function toggleEntry(messageId, userId) {
  const data = loadData();
  const g = data[messageId];
  if (!g || g.ended || g.paused) return null;

  if (!Array.isArray(g.entries)) g.entries = [];

  const index = g.entries.indexOf(userId);
  let entered = false;

  if (index === -1) {
    g.entries.push(userId);
    entered = true;
  } else {
    g.entries.splice(index, 1);
    entered = false;
  }

  saveData(data);
  return { entered, totalEntries: g.entries.length };
}

async function endGiveaway(client, messageId) {
  const data = loadData();
  const g = data[messageId];
  if (!g || g.ended) return null;

  g.ended = true;
  if (timersMap.has(messageId)) {
    clearTimeout(timersMap.get(messageId));
    timersMap.delete(messageId);
  }

  const entries = g.entries || [];
  const winnersCount = g.winnersCount || 1;
  const winners = [];

  if (entries.length > 0) {
    const pool = [...entries];
    for (let i = 0; i < winnersCount && pool.length > 0; i++) {
      const randIndex = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(randIndex, 1)[0]);
    }
  }

  g.winners = winners;
  saveData(data);

  // Update Discord message UI
  try {
    const channel = await client.channels.fetch(g.channelId).catch(() => null);
    if (channel) {
      const message = await channel.messages
        .fetch(g.messageId)
        .catch(() => null);
      if (message) {
        const winnerMentions =
          winners.length > 0
            ? winners.map((id) => `<@${id}>`).join(", ")
            : "No valid participants";

        const content = [
          `### <:tada2:1539875614440554597> Giveaway Ended ── ${g.prize}`,
          `-# *Host: <@${g.hostId}> • Total Entries: \`${entries.length}\`*`,
          "",
          `> <:Trophy:1539875620270641185> **Winner(s):** ${winnerMentions}`,
          `> <:red_yellow_gift:1539875626364698735> **Prize:** **${g.prize}**`,
          `> <:calender:1539875441274523649> **Ended:** <t:${Math.floor(Date.now() / 1000)}:R>`,
        ].join("\n");

        const disabledButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_ended_${g.messageId}`)
            .setLabel(`Giveaway Ended (${entries.length} Entries)`)
            .setEmoji("🎉")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        );

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content),
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
            ),
          )
          .addActionRowComponents(disabledButton);

        await message
          .edit({ components: [container], flags: MessageFlags.IsComponentsV2 })
          .catch((e) => {
            console.error("Failed to edit ended giveaway message:", e);
          });

        if (winners.length > 0) {
          await channel
            .send({
              content: `<:tada2:1539875614440554597> Congratulations ${winnerMentions}! You won **${g.prize}**!`,
            })
            .catch(() => null);
        } else {
          await channel
            .send({
              content: `<:tada2:1539875614440554597> Giveaway for **${g.prize}** ended, but there were no valid participants.`,
            })
            .catch(() => null);
        }
      }
    }
  } catch (e) {
    console.error("Failed to edit ended giveaway message:", e);
  }

  return { winners, prize: g.prize };
}

async function rerollGiveaway(client, messageId) {
  const data = loadData();
  const g = data[messageId];
  if (!g || !g.ended) return null;

  const entries = g.entries || [];
  const winnersCount = g.winnersCount || 1;
  const winners = [];

  if (entries.length > 0) {
    const pool = [...entries];
    for (let i = 0; i < winnersCount && pool.length > 0; i++) {
      const randIndex = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(randIndex, 1)[0]);
    }
  }

  g.winners = winners;
  saveData(data);

  try {
    const channel = await client.channels.fetch(g.channelId).catch(() => null);
    if (channel && winners.length > 0) {
      const winnerMentions = winners.map((id) => `<@${id}>`).join(", ");
      await channel
        .send({
          content: `<:tada2:1539875614440554597> New Reroll Winner(s) for **${g.prize}**: ${winnerMentions}!`,
        })
        .catch(() => null);
    }
  } catch (e) {}

  return { winners, prize: g.prize };
}

async function pauseGiveaway(client, messageId) {
  const data = loadData();
  const g = data[messageId];
  if (!g || g.ended || g.paused) return null;

  g.paused = true;
  g.remainingTime = g.endTimestamp - Date.now();
  if (timersMap.has(messageId)) {
    clearTimeout(timersMap.get(messageId));
    timersMap.delete(messageId);
  }

  saveData(data);
  return g;
}

async function unpauseGiveaway(client, messageId) {
  const data = loadData();
  const g = data[messageId];
  if (!g || g.ended || !g.paused) return null;

  g.paused = false;
  g.endTimestamp = Date.now() + (g.remainingTime || 60000);
  delete g.remainingTime;

  saveData(data);
  scheduleEndTimer(client, g);
  return g;
}

async function deleteGiveaway(client, messageId) {
  const data = loadData();
  const g = data[messageId];
  if (!g) return false;

  if (timersMap.has(messageId)) {
    clearTimeout(timersMap.get(messageId));
    timersMap.delete(messageId);
  }

  delete data[messageId];
  saveData(data);

  try {
    const channel = await client.channels.fetch(g.channelId).catch(() => null);
    if (channel) {
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (message) await message.delete().catch(() => {});
    }
  } catch (e) {}

  return true;
}

function init(client) {
  const data = loadData();
  Object.values(data).forEach((g) => {
    if (!g.ended && !g.paused) {
      scheduleEndTimer(client, g);
    }
  });
}

module.exports = {
  parseDuration,
  getGiveaway,
  getGuildGiveaways,
  saveGiveaway,
  scheduleEndTimer,
  toggleEntry,
  endGiveaway,
  rerollGiveaway,
  pauseGiveaway,
  unpauseGiveaway,
  deleteGiveaway,
  init,
};
