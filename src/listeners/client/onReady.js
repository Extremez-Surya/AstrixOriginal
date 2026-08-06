const { logger, print, colors, reset } = require("../../lib/functions/common.js");
const { Events } = require("discord.js");
const {
  AppMessages,
  AppSlashCommands,
} = require("../../lib/functions/application-ecs-loader.js");
const { setTimeout: sleep } = require("node:timers/promises");

const giveawayManager = require("../../lib/giveawayManager");

const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, "");

function printBoxLine(content, width = 71) {
  const visibleLen = stripAnsi(content).length;
  const padding = " ".repeat(Math.max(0, width - visibleLen));
  console.log(`${colors.darkGray}│${reset}  ${content}${padding}  ${colors.darkGray}│${reset}`);
}

module.exports = {
  name: "onReady",
  event: Events.ClientReady,
  once: true,

  async execute(client) {
    await AppMessages(client);
    await sleep(1500);
    await AppSlashCommands(client);
    giveawayManager.init(client);

    const botTag = `${client.user.username}${client.user.discriminator === "0" ? "" : `#${client.user.discriminator}`}`;
    const servers = client.guilds.cache.size.toLocaleString();
    const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString();
    const ping = client.ws.ping;
    
    let pingColor = colors.green;
    let pingBadge = "🟢 Optimal";
    if (ping > 150 && ping <= 300) {
      pingColor = colors.yellow;
      pingBadge = "🟡 Moderate";
    } else if (ping > 300) {
      pingColor = colors.red;
      pingBadge = "🔴 High";
    }

    const lineTop    = `${colors.darkGray}╭${"─".repeat(75)}╮${reset}`;
    const lineBottom = `${colors.darkGray}╰${"─".repeat(75)}╯${reset}`;
    const divider    = `${colors.darkGray}├${"─".repeat(75)}┤${reset}`;

    console.log(`\n${lineTop}`);
    printBoxLine(`${colors.green}${print.bold("🟢 ASTRIX BOT ENGINE IS LIVE & ONLINE")}${reset}`, 71);
    console.log(divider);
    printBoxLine(`${colors.white}${print.bold("Bot Identity:")}${reset}   ${colors.cyan}${botTag}${reset}`, 71);
    printBoxLine(`${colors.white}${print.bold("Connected:")}${reset}      ${colors.purple}${servers} Servers${reset}  ${colors.darkGray}•${reset}  ${colors.blue}${users} Total Members${reset}`, 71);
    printBoxLine(`${colors.white}${print.bold("Gateway Ping:")}${reset}   ${pingColor}${ping} ms${reset} ${colors.darkGray}(${pingBadge})${reset}`, 71);
    console.log(`${lineBottom}\n`);

    logger.Success("ClientReady", `Engine initialized as ${botTag}`);
  },
};
