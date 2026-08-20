const { loadFiles } = require("./fileloader.js");
const {
  ApplicationCommandType: { ChatInput, User, Message },
  Events,
} = require("discord.js");
const { logger, print, colors, reset, bold } = require("./common.js");
const categoriesConfig = require("../categories.json");

const consoleEmojiMap = {
  Information: "ℹ️",
  Moderation: "🛡️",
  Giveaway: "🎉",
  Security: "🔒",
  "Anti Raid": "🛡️",
  "Anti Nuke": "🔒",
  Automod: "🤖",
  Birthday: "🎂",
  Owner: "👑",
  "Bump Reminder": "📣",
  Configuration: "⚙️",
  Music: "🎵",
  Filters: "🎛️",
  Utility: "🔧",
  Fun: "🎲",
  AI: "🧠",
  Voice: "🎙️",
  Leveling: "📈",
  Logging: "📜",
  Ticket: "🎟️",
  Welcome: "👋",
  Owner: "👑",
  Booster: "🚀",
  "Join To Create": "🔊",
  "Custom Roles": "🎭",
  General: "🌐",
  Miscellaneous: "🧩",
};

const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, "");

/**
 * Formats a two-column row inside the table box with a clear vertical column line
 */
function formatTwoColumnRow(col1, col2, width1 = 46, width2 = 22) {
  const v1 = stripAnsi(col1).length;
  const v2 = stripAnsi(col2).length;
  const p1 = " ".repeat(Math.max(0, width1 - v1));
  const p2 = " ".repeat(Math.max(0, width2 - v2));
  return `${colors.darkGray}│${reset}  ${col1}${p1}  ${colors.darkGray}│${reset}  ${col2}${p2}  ${colors.darkGray}│${reset}`;
}

/**
 * Formats a full-width row inside the table box
 */
function formatFullWidthRow(content, width = 73) {
  const v = stripAnsi(content).length;
  const p = " ".repeat(Math.max(0, width - v));
  return `${colors.darkGray}│${reset}  ${content}${p}  ${colors.darkGray}│${reset}`;
}

async function AppEvents(client) {
  const files = await loadFiles("src/listeners");
  const validEvents = Object.values(Events);
  let loadedCount = 0;

  for (const file of files) {
    const event = require(file);

    if (!event.event || !validEvents.includes(event.event)) {
      continue;
    }

    if (event.once)
      client.once(event.event, (...args) => event.execute(client, ...args));
    else client.on(event.event, (...args) => event.execute(client, ...args));

    loadedCount++;
  }

  logger.Success("Event Loader", `Loaded ${loadedCount} gateway event listeners successfully.`);
}

async function AppMessages(client) {
  const files = await loadFiles("src/commands");
  await client.messageCommands.clear();

  const categoryStats = {};

  for (const file of files) {
    const command = require(file);

    if (
      !command.alias ||
      command.alias.length === 0 ||
      command.alias.some((alias) => alias === "")
    ) {
      continue;
    }

    client.messageCommands.set(command.alias[0], command);

    const cat = command.category || "Miscellaneous";
    categoryStats[cat] = (categoryStats[cat] || 0) + 1;
  }

  const totalCmds = client.messageCommands.size;

  const lineTop       = `${colors.darkGray}╭${"─".repeat(50)}┬${"─".repeat(26)}╮${reset}`;
  const lineMid       = `${colors.darkGray}├${"─".repeat(50)}┼${"─".repeat(26)}┤${reset}`;
  const lineSummary   = `${colors.darkGray}├${"─".repeat(50)}┴${"─".repeat(26)}┤${reset}`;
  const lineBottom    = `${colors.darkGray}╰${"─".repeat(77)}╯${reset}`;

  console.log(`\n${lineTop}`);
  console.log(formatTwoColumnRow(
    `${colors.cyan}${print.bold("📦 COMMAND ENGINE DASHBOARD")}${reset}`,
    `${colors.gray}${print.bold("STATUS: READY")}${reset}`
  ));
  console.log(lineMid);

  // Table Column Headers
  console.log(formatTwoColumnRow(
    `${colors.lightGray}${print.bold("CATEGORY")}${reset}`,
    `${colors.lightGray}${print.bold("COMMANDS LOADED")}${reset}`
  ));
  console.log(lineMid);

  for (const [catName, count] of Object.entries(categoryStats)) {
    const icon = consoleEmojiMap[catName] || "📁";
    const nameStr = `${icon}  ${catName}`;
    const countStr = `${count} cmds`;

    console.log(formatTwoColumnRow(
      `${colors.violet}${nameStr}${reset}`,
      `${colors.emerald}${countStr}${reset}`
    ));
  }

  console.log(lineSummary);
  console.log(formatFullWidthRow(
    `${colors.yellow}${print.bold("✦ TOTAL READY")}${reset}    │  ${colors.white}${print.bold(`${totalCmds} Commands loaded across ${Object.keys(categoryStats).length} Categories`)}${reset}`
  ));
  console.log(`${lineBottom}\n`);
}

async function AppSlashCommands(client) {
  const files = await loadFiles("src/slashcommands");
  await client.slashCommands.clear();

  const commandMap = new Map();

  for (const file of files) {
    const command = require(file);

    if (!command.name) continue;

    if (command.type == ChatInput && !command.description) continue;

    if ([User, Message].includes(command.type) && command.description) continue;

    if (typeof command.execute !== "function") continue;

    command.dmPermission ??= false;
    client.slashCommands.set(command.name, command);

    const { others, execute, ...cmd } = command;
    commandMap.set(command.name.toLowerCase(), cmd);
  }

  let CommandsArray = Array.from(commandMap.values());

  if (CommandsArray.length > 100) {
    CommandsArray = CommandsArray.slice(0, 100);
  }

  try {
    await client.application.commands.set(CommandsArray);
    logger.Success("Slash Commands", `Registered ${CommandsArray.length} slash commands with Discord API.`);
  } catch (err) {
    console.error("[Slash Commands Detailed Error]", err);
    logger.Error("Slash Commands", `Failed to register application commands: ${err?.rawError || err?.message || err}`);
  }
}

module.exports = {
  AppEvents,
  AppMessages,
  AppSlashCommands,
};
