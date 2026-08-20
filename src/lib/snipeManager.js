const MAX_SNIPES_PER_CHANNEL = 20;
const MAX_REACTION_HISTORY_PER_MESSAGE = 100;
const CACHE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

const deletedMessages = new Map();
const editedMessages = new Map();
const removedReactions = new Map();
const reactionHistory = new Map();

function cleanOldEntries(cache, maxAge = CACHE_EXPIRY_MS) {
  const now = Date.now();
  for (const [guildId, channelMap] of cache) {
    for (const [channelId, entries] of channelMap) {
      const filtered = entries.filter((e) => now - e.timestamp < maxAge);
      if (filtered.length === 0) {
        channelMap.delete(channelId);
      } else if (filtered.length !== entries.length) {
        channelMap.set(channelId, filtered);
      }
    }
    if (channelMap.size === 0) {
      cache.delete(guildId);
    }
  }
}

// Periodic cleanup every 15 minutes
setInterval(() => {
  cleanOldEntries(deletedMessages);
  cleanOldEntries(editedMessages);
  cleanOldEntries(removedReactions);
}, 15 * 60 * 1000);

function addDeletedMessage(message) {
  if (!message || !message.guild || (!message.content && !message.attachments?.size)) return;

  const guildId = message.guild.id;
  const channelId = message.channel.id;

  if (!deletedMessages.has(guildId)) {
    deletedMessages.set(guildId, new Map());
  }

  const guildCache = deletedMessages.get(guildId);
  if (!guildCache.has(channelId)) {
    guildCache.set(channelId, []);
  }

  const channelCache = guildCache.get(channelId);

  channelCache.unshift({
    author: {
      id: message.author?.id,
      tag: message.author?.tag,
      username: message.author?.username,
      displayAvatarURL: message.author?.displayAvatarURL?.() || null,
    },
    content: message.content || "",
    attachments:
      message.attachments?.map((a) => ({
        url: a.url,
        name: a.name,
        contentType: a.contentType,
      })) || [],
    embeds: message.embeds?.length || 0,
    stickers: message.stickers?.map((s) => s.name) || [],
    messageId: message.id,
    timestamp: Date.now(),
  });

  if (channelCache.length > MAX_SNIPES_PER_CHANNEL) {
    channelCache.pop();
  }
}

function addEditedMessage(oldMessage, newMessage) {
  if (!oldMessage || !oldMessage.guild) return;
  if (oldMessage.content === newMessage?.content) return;

  const guildId = oldMessage.guild.id;
  const channelId = oldMessage.channel.id;

  if (!editedMessages.has(guildId)) {
    editedMessages.set(guildId, new Map());
  }

  const guildCache = editedMessages.get(guildId);
  if (!guildCache.has(channelId)) {
    guildCache.set(channelId, []);
  }

  const channelCache = guildCache.get(channelId);

  channelCache.unshift({
    author: {
      id: oldMessage.author?.id,
      tag: oldMessage.author?.tag,
      username: oldMessage.author?.username,
      displayAvatarURL: oldMessage.author?.displayAvatarURL?.() || null,
    },
    oldContent: oldMessage.content || "",
    newContent: newMessage?.content || "",
    messageId: oldMessage.id,
    messageUrl: oldMessage.url,
    timestamp: Date.now(),
  });

  if (channelCache.length > MAX_SNIPES_PER_CHANNEL) {
    channelCache.pop();
  }
}

function addRemovedReaction(reaction, user) {
  if (!reaction?.message?.guild || !user) return;

  const guildId = reaction.message.guild.id;
  const channelId = reaction.message.channel.id;

  if (!removedReactions.has(guildId)) {
    removedReactions.set(guildId, new Map());
  }

  const guildCache = removedReactions.get(guildId);
  if (!guildCache.has(channelId)) {
    guildCache.set(channelId, []);
  }

  const channelCache = guildCache.get(channelId);

  channelCache.unshift({
    user: {
      id: user.id,
      tag: user.tag,
      username: user.username,
      displayAvatarURL: user.displayAvatarURL?.() || null,
    },
    emoji: reaction.emoji.toString(),
    emojiName: reaction.emoji.name,
    emojiId: reaction.emoji.id,
    messageId: reaction.message.id,
    messageUrl: reaction.message.url,
    timestamp: Date.now(),
  });

  if (channelCache.length > MAX_SNIPES_PER_CHANNEL) {
    channelCache.pop();
  }

  addReactionHistoryEntry(reaction.message.id, user, reaction.emoji, "remove", reaction.message.url, guildId, channelId);
}

function addReactionHistoryEntry(messageId, user, emoji, action, messageUrl, guildId, channelId) {
  if (!reactionHistory.has(messageId)) {
    reactionHistory.set(messageId, {
      guildId,
      channelId,
      history: [],
    });
  }

  const data = reactionHistory.get(messageId);

  data.history.unshift({
    user: {
      id: user.id,
      tag: user.tag,
      username: user.username,
    },
    emoji: emoji.toString(),
    emojiName: emoji.name,
    action,
    messageUrl,
    timestamp: Date.now(),
  });

  if (data.history.length > MAX_REACTION_HISTORY_PER_MESSAGE) {
    data.history.pop();
  }
}

function getDeletedMessages(guildId, channelId) {
  const entries = deletedMessages.get(guildId)?.get(channelId) || [];
  const now = Date.now();
  return entries.filter((e) => now - e.timestamp < CACHE_EXPIRY_MS);
}

function getEditedMessages(guildId, channelId) {
  const entries = editedMessages.get(guildId)?.get(channelId) || [];
  const now = Date.now();
  return entries.filter((e) => now - e.timestamp < CACHE_EXPIRY_MS);
}

function getRemovedReactions(guildId, channelId) {
  const entries = removedReactions.get(guildId)?.get(channelId) || [];
  const now = Date.now();
  return entries.filter((e) => now - e.timestamp < CACHE_EXPIRY_MS);
}

function getReactionHistory(messageId) {
  const data = reactionHistory.get(messageId);
  if (!data) return [];
  const now = Date.now();
  return data.history.filter((e) => now - e.timestamp < CACHE_EXPIRY_MS);
}

function clearSnipeData(guildId, channelId = null) {
  if (channelId) {
    deletedMessages.get(guildId)?.delete(channelId);
    editedMessages.get(guildId)?.delete(channelId);
    removedReactions.get(guildId)?.delete(channelId);
    for (const [msgId, data] of reactionHistory) {
      if (data.guildId === guildId && data.channelId === channelId) {
        reactionHistory.delete(msgId);
      }
    }
  } else {
    deletedMessages.delete(guildId);
    editedMessages.delete(guildId);
    removedReactions.delete(guildId);
    for (const [msgId, data] of reactionHistory) {
      if (data.guildId === guildId) {
        reactionHistory.delete(msgId);
      }
    }
  }
}

module.exports = {
  addDeletedMessage,
  addEditedMessage,
  addRemovedReaction,
  addReactionHistoryEntry,
  getDeletedMessages,
  getEditedMessages,
  getRemovedReactions,
  getReactionHistory,
  clearSnipeData,
};
