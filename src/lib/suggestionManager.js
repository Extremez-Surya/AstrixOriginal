const fs = require("fs");
const path = require("path");
const {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require("discord.js");
const EMOJIS = require("./emojis");

const DATA_FILE = path.join(__dirname, "suggestionData.json");

const configCache = new Map();
const votesCache = new Map();
let isInitialized = false;

function getDefaultGuildConfig() {
  return {
    suggestChannelId: null,
    suggestAllowAllChannels: false,
    suggestThreadChannelId: null,
    suggestThreadEnabled: false,
  };
}

function initCache() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(data);
      if (parsed.guilds) {
        for (const [guildId, cfg] of Object.entries(parsed.guilds)) {
          configCache.set(guildId, {
            suggestChannelId: cfg.suggestChannelId || null,
            suggestAllowAllChannels: cfg.suggestAllowAllChannels === true,
            suggestThreadChannelId: cfg.suggestThreadChannelId || null,
            suggestThreadEnabled: cfg.suggestThreadEnabled === true,
          });
        }
      }
      if (parsed.votes) {
        for (const [msgId, vData] of Object.entries(parsed.votes)) {
          votesCache.set(msgId, {
            upvotes: Array.isArray(vData.upvotes) ? vData.upvotes : [],
            downvotes: Array.isArray(vData.downvotes) ? vData.downvotes : [],
          });
        }
      }
    }
  } catch (e) {
    console.error("[SuggestionManager] Cache init error:", e);
  }
  isInitialized = true;
}

function saveDiskAsync() {
  setImmediate(() => {
    try {
      const obj = { guilds: {}, votes: {} };
      for (const [guildId, cfg] of configCache.entries()) {
        obj.guilds[guildId] = cfg;
      }
      for (const [msgId, vData] of votesCache.entries()) {
        obj.votes[msgId] = vData;
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("[SuggestionManager] Save disk error:", e);
    }
  });
}

function getGuildConfig(client, guildId) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultGuildConfig();

  const raw = configCache.get(guildId);
  if (!raw) return getDefaultGuildConfig();

  return { ...raw };
}

function updateGuildConfig(client, guildId, updateFn) {
  if (!isInitialized) initCache();
  if (!guildId) return getDefaultGuildConfig();

  const current = getGuildConfig(client, guildId);
  const updated = updateFn({ ...current });

  configCache.set(guildId, updated);
  saveDiskAsync();
  return updated;
}

function getSuggestionVotes(messageId) {
  if (!isInitialized) initCache();
  return votesCache.get(messageId) || { upvotes: [], downvotes: [] };
}

function recordVote(messageId, userId, voteType) {
  if (!isInitialized) initCache();
  const current = getSuggestionVotes(messageId);
  let upvotes = new Set(current.upvotes || []);
  let downvotes = new Set(current.downvotes || []);

  let action = "";

  if (voteType === "upvote") {
    if (upvotes.has(userId)) {
      upvotes.delete(userId);
      action = "removed_upvote";
    } else {
      upvotes.add(userId);
      downvotes.delete(userId);
      action = "added_upvote";
    }
  } else if (voteType === "downvote") {
    if (downvotes.has(userId)) {
      downvotes.delete(userId);
      action = "removed_downvote";
    } else {
      downvotes.add(userId);
      upvotes.delete(userId);
      action = "added_downvote";
    }
  }

  const updated = {
    upvotes: Array.from(upvotes),
    downvotes: Array.from(downvotes),
  };

  votesCache.set(messageId, updated);
  saveDiskAsync();

  return { action, votes: updated };
}

async function handleSuggestionInteraction(client, interaction) {
  if (!interaction.isButton()) return false;
  const customId = interaction.customId;

  if (!customId.startsWith("suggest_upvote_") && !customId.startsWith("suggest_downvote_")) {
    return false;
  }

  const isUpvote = customId.startsWith("suggest_upvote_");
  const voteType = isUpvote ? "upvote" : "downvote";
  const userId = interaction.user.id;
  const messageId = interaction.message.id;

  const { action, votes } = recordVote(messageId, userId, voteType);
  const upCount = votes.upvotes.length;
  const downCount = votes.downvotes.length;

  const message = interaction.message;

  const upBtn = new ButtonBuilder()
    .setCustomId(`suggest_upvote_${messageId}`)
    .setLabel(`${upCount}`)
    .setEmoji(EMOJIS.upvote || "👍")
    .setStyle(ButtonStyle.Success);

  const downBtn = new ButtonBuilder()
    .setCustomId(`suggest_downvote_${messageId}`)
    .setLabel(`${downCount}`)
    .setEmoji(EMOJIS.downvote || "👎")
    .setStyle(ButtonStyle.Danger);

  const actionRow = new ActionRowBuilder().addComponents(upBtn, downBtn);

  let updatedComponents = [];

  const rawContainer = message.components?.[0];
  if (rawContainer && (rawContainer.type === 17 || rawContainer.components)) {
    const container = new ContainerBuilder();
    for (const comp of rawContainer.components) {
      if (comp.type === 1) {
        // ActionRow
        container.addActionRowComponents(actionRow);
      } else if (comp.type === 10) {
        // TextDisplay
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(comp.content || ""));
      } else if (comp.type === 14) {
        // Separator
        const sep = new SeparatorBuilder();
        if (comp.spacing) sep.setSpacing(comp.spacing);
        if (typeof comp.divider === "boolean") sep.setDivider(comp.divider);
        container.addSeparatorComponents(sep);
      }
    }
    updatedComponents = [container];
  } else {
    updatedComponents = [actionRow];
  }

  let feedbackText = "Vote recorded!";
  if (action === "added_upvote") feedbackText = "👍 You upvoted this suggestion!";
  else if (action === "removed_upvote") feedbackText = "ℹ️ Removed your upvote.";
  else if (action === "added_downvote") feedbackText = "👎 You downvoted this suggestion!";
  else if (action === "removed_downvote") feedbackText = "ℹ️ Removed your downvote.";

  await interaction.reply({
    content: feedbackText,
    flags: MessageFlags.Ephemeral,
  }).catch(() => null);

  await message.edit({
    components: updatedComponents,
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => null);

  return true;
}

initCache();

module.exports = {
  getGuildConfig,
  updateGuildConfig,
  getSuggestionVotes,
  recordVote,
  handleSuggestionInteraction,
};
