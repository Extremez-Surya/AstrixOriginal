const fs = require("fs");
const path = require("path");

const WELCOME_FILE = path.join(__dirname, "welcomeConfig.json");

function loadConfig() {
  try {
    if (fs.existsSync(WELCOME_FILE)) {
      const data = fs.readFileSync(WELCOME_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load welcomeConfig.json:", e);
  }
  return {};
}

function saveConfig(data) {
  try {
    fs.writeFileSync(WELCOME_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save welcomeConfig.json:", e);
  }
}

function getGuildWelcome(guildId) {
  if (!guildId) return null;
  const config = loadConfig();
  const guildData = config[guildId] || {};

  return {
    enabled: guildData.enabled ?? false,
    channelId: guildData.channelId ?? null,
    messageEnabled: guildData.messageEnabled ?? true,
    messageText:
      guildData.messageText ??
      "Welcome {user} to **{server}**! We are glad to have you as member #{memberCount}!",
    autoRoleId: guildData.autoRoleId ?? null,
    autoNickFormat: guildData.autoNickFormat ?? null,
    joinDmEnabled: guildData.joinDmEnabled ?? false,
    joinDmText:
      guildData.joinDmText ??
      "Welcome to **{server}**! We are super excited to have you join our community! Make sure to read the rules and enjoy your time here.",
    canvasEnabled: guildData.canvasEnabled ?? true,
    canvasBgUrl: guildData.canvasBgUrl ?? null,
    canvasTemplate: guildData.canvasTemplate ?? "emerald",
    textColor: guildData.textColor ?? null,
    accentColor: guildData.accentColor ?? null,
    avatarShape: guildData.avatarShape ?? "circle",
    customWatermark: guildData.customWatermark ?? null,
  };
}

function updateGuildWelcome(guildId, newSettings) {
  if (!guildId) return false;
  const config = loadConfig();
  const current = getGuildWelcome(guildId);
  config[guildId] = { ...current, ...newSettings };
  saveConfig(config);
  return config[guildId];
}

function getGuildGoodbye(guildId) {
  if (!guildId) return null;
  const config = loadConfig();
  const guildData = config[guildId]?.goodbye || {};

  return {
    enabled: guildData.enabled ?? false,
    channelId: guildData.channelId ?? null,
    messageText:
      guildData.messageText ??
      "Goodbye **{username}**! We'll miss you. We now have {memberCount} members.",
    canvasEnabled: guildData.canvasEnabled ?? true,
    canvasBgUrl: guildData.canvasBgUrl ?? null,
  };
}

function updateGuildGoodbye(guildId, newSettings) {
  if (!guildId) return false;
  const config = loadConfig();
  const currentWelcome = config[guildId] || getGuildWelcome(guildId);
  const currentGoodbye = currentWelcome.goodbye || getGuildGoodbye(guildId);

  config[guildId] = {
    ...currentWelcome,
    goodbye: { ...currentGoodbye, ...newSettings },
  };
  saveConfig(config);
  return config[guildId].goodbye;
}

/**
 * Enhanced placeholder replacement engine with multi-format placeholder support
 */
function formatWelcomeText(template, member, guild) {
  if (!template) return "";
  
  const userObj = member.user || member;
  const guildObj = guild || member.guild || {};
  
  const memberId = userObj.id || "0";
  const username = userObj.username || "Member";
  const tag = userObj.tag || username;
  const avatar = typeof userObj.displayAvatarURL === "function" ? userObj.displayAvatarURL({ size: 512 }) : "";
  const createdAt = userObj.createdTimestamp ? `<t:${Math.floor(userObj.createdTimestamp / 1000)}:F>` : "Unknown";
  const joinedAt = member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Unknown";

  const guildName = guildObj.name || "Server";
  const guildId = guildObj.id || "0";
  const memberCount = guildObj.memberCount ? guildObj.memberCount.toLocaleString() : "1";
  const icon = typeof guildObj.iconURL === "function" ? (guildObj.iconURL({ size: 512 }) || "") : "";
  const banner = typeof guildObj.bannerURL === "function" ? (guildObj.bannerURL({ size: 1024 }) || "") : "";
  const boostCount = guildObj.premiumSubscriptionCount ? guildObj.premiumSubscriptionCount.toString() : "0";
  const boostTier = guildObj.premiumTier ? `Level ${guildObj.premiumTier}` : "No Level";
  const ownerId = guildObj.ownerId || "0";

  return template
    .replace(/{user}/g, `<@${memberId}>`)
    .replace(/{user\.mention}/g, `<@${memberId}>`)
    .replace(/{user\.tag}/g, tag)
    .replace(/{user\.name}/g, username)
    .replace(/{user\.id}/g, memberId)
    .replace(/{user\.avatar}/g, avatar)
    .replace(/{user\.created_at}/g, createdAt)
    .replace(/{user\.joined_at}/g, joinedAt)
    .replace(/{username}/g, username)
    .replace(/{tag}/g, tag)
    .replace(/{server}/g, guildName)
    .replace(/{guild}/g, guildName)
    .replace(/{guild\.name}/g, guildName)
    .replace(/{guild\.id}/g, guildId)
    .replace(/{memberCount}/g, memberCount)
    .replace(/{guild\.count}/g, memberCount)
    .replace(/{guild\.icon}/g, icon)
    .replace(/{guild\.banner}/g, banner)
    .replace(/{guild\.boost_count}/g, boostCount)
    .replace(/{guild\.boost_tier}/g, boostTier)
    .replace(/{guild\.owner_id}/g, ownerId)
    .replace(/{timestamp}/g, `<t:${Math.floor(Date.now() / 1000)}:F>`)
    .replace(/{date}/g, new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
    .replace(/{time}/g, new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
}

function resetGuildWelcome(guildId) {
  if (!guildId) return false;
  const config = loadConfig();
  const existingGoodbye = config[guildId]?.goodbye;
  const defaults = {
    enabled: false,
    channelId: null,
    messageEnabled: true,
    messageText:
      "Welcome {user} to **{server}**! We are glad to have you as member #{memberCount}!",
    autoRoleId: null,
    autoNickFormat: null,
    joinDmEnabled: false,
    joinDmText:
      "Welcome to **{server}**! We are super excited to have you join our community! Make sure to read the rules and enjoy your time here.",
    canvasEnabled: true,
    canvasBgUrl: null,
    canvasTemplate: "emerald",
    textColor: null,
    accentColor: null,
    avatarShape: "circle",
    customWatermark: null,
  };
  if (existingGoodbye) {
    defaults.goodbye = existingGoodbye;
  }
  config[guildId] = defaults;
  saveConfig(config);
  return config[guildId];
}

module.exports = {
  getGuildWelcome,
  updateGuildWelcome,
  resetGuildWelcome,
  getGuildGoodbye,
  updateGuildGoodbye,
  formatWelcomeText,
};
