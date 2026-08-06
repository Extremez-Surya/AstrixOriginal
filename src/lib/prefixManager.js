const fs = require("fs");
const path = require("path");
const { clientPrefix } = require("./config.json");

const PREFIX_FILE = path.join(__dirname, "guildPrefixes.json");

function loadPrefixes() {
  try {
    if (fs.existsSync(PREFIX_FILE)) {
      const data = fs.readFileSync(PREFIX_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load guildPrefixes.json:", e);
  }
  return {};
}

function savePrefixes(data) {
  try {
    fs.writeFileSync(PREFIX_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save guildPrefixes.json:", e);
  }
}

function getPrefix(guildId) {
  if (!guildId) return clientPrefix || ".";
  const prefixes = loadPrefixes();
  return prefixes[guildId] || clientPrefix || ".";
}

function setPrefix(guildId, newPrefix) {
  if (!guildId) return false;
  const prefixes = loadPrefixes();
  prefixes[guildId] = newPrefix;
  savePrefixes(prefixes);
  return true;
}

function resetPrefix(guildId) {
  if (!guildId) return false;
  const prefixes = loadPrefixes();
  if (prefixes[guildId]) {
    delete prefixes[guildId];
    savePrefixes(prefixes);
    return true;
  }
  return false;
}

module.exports = {
  getPrefix,
  setPrefix,
  resetPrefix,
};
