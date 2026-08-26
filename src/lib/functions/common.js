// ╔══════════════════════════════════════════════════════════════════════╗
// ║                   ASTRIX NEXT-GEN CONSOLE LOGGER                    ║
// ╚══════════════════════════════════════════════════════════════════════╝

const reset = "\x1b[0m";
const bold = "\x1b[1m";
const dim = "\x1b[2m";
const italic = "\x1b[3m";
const underline = "\x1b[4m";

// 24-bit TrueColor Palette
const rgb = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`;
const bgRgb = (r, g, b) => `\x1b[48;2;${r};${g};${b}m`;

const colors = {
  // Vibrant Neons
  cyan: rgb(56, 189, 248),      // #38bdf8 Neon Cyan
  deepCyan: rgb(6, 182, 212),   // #06b6d4 Deep Cyan
  purple: rgb(168, 85, 247),    // #a855f7 Cyber Violet
  violet: rgb(192, 132, 252),   // #c084fc Lavender Accent
  pink: rgb(244, 114, 182),     // #f472b6 Electric Pink
  emerald: rgb(52, 211, 153),   // #34d399 Bright Emerald
  green: rgb(34, 197, 94),      // #22c55e Standard Green
  yellow: rgb(251, 191, 36),    // #fbbf24 Warm Gold
  amber: rgb(245, 158, 11),     // #f59e0b Amber Warning
  blue: rgb(96, 165, 250),      // #60a5fa Ice Blue
  indigo: rgb(129, 140, 248),   // #818cf8 Royal Indigo
  red: rgb(248, 113, 113),      // #f87171 Crimson Light
  rose: rgb(244, 63, 94),       // #f43f5e Cyber Rose
  
  // Neutrals
  white: rgb(248, 250, 252),    // #f8fafc Ultra White
  lightGray: rgb(203, 213, 225),// #cbd5e1 Light Slate
  gray: rgb(148, 163, 184),     // #94a3b8 Slate Muted
  darkGray: rgb(71, 85, 105),   // #475569 Frame Dark
  border: rgb(51, 65, 85),      // #334155 Dark Border
  dimBg: bgRgb(15, 23, 42),     // #0f172a Deep Slate Background
};

const print = {
  reset: (text = "") => `${text}${reset}`,
  bold: (text = "") => `${bold}${text}${reset}`,
  dim: (text = "") => `${dim}${text}${reset}`,
  italic: (text = "") => `${italic}${text}${reset}`,
  underline: (text = "") => `${underline}${text}${reset}`,
  cyan: (text = "") => `${colors.cyan}${text}${reset}`,
  purple: (text = "") => `${colors.purple}${text}${reset}`,
  pink: (text = "") => `${colors.pink}${text}${reset}`,
  green: (text = "") => `${colors.emerald}${text}${reset}`,
  yellow: (text = "") => `${colors.yellow}${text}${reset}`,
  blue: (text = "") => `${colors.blue}${text}${reset}`,
  red: (text = "") => `${colors.rose}${text}${reset}`,
  gray: (text = "") => `${colors.gray}${text}${reset}`,
  white: (text = "") => `${colors.white}${text}${reset}`,
};

function formatTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Renders a pill badge with high contrast background
 */
function renderBadge(label, fgColor, bgColor) {
  return `${bgColor}${fgColor}${bold} ${label} ${reset}`;
}

const logger = {
  Info: (scope, message) => {
    const badge = renderBadge("INFO", colors.white, bgRgb(14, 116, 144)); // Cyan Pill
    const formattedScope = `${colors.cyan}${bold}[${scope}]${reset}`;
    console.log(
      `${colors.darkGray}${formatTime()}${reset}  ${badge}  ${formattedScope.padEnd(28)} ${colors.lightGray}${message}${reset}`
    );
  },

  Success: (scope, message) => {
    const badge = renderBadge("ONLINE", colors.white, bgRgb(16, 185, 129)); // Emerald Pill
    const formattedScope = `${colors.emerald}${bold}[${scope}]${reset}`;
    console.log(
      `${colors.darkGray}${formatTime()}${reset}  ${badge}  ${formattedScope.padEnd(28)} ${colors.white}${message}${reset}`
    );
  },

  Warn: (scope, message) => {
    const badge = renderBadge("WARN", colors.white, bgRgb(217, 119, 6)); // Amber Pill
    const formattedScope = `${colors.yellow}${bold}[${scope}]${reset}`;
    console.log(
      `${colors.darkGray}${formatTime()}${reset}  ${badge}  ${formattedScope.padEnd(28)} ${colors.yellow}${message}${reset}`
    );
  },

  Error: (scope, message, err = null) => {
    const badge = renderBadge("ERROR", colors.white, bgRgb(225, 29, 72)); // Rose/Red Pill
    const formattedScope = `${colors.rose}${bold}[${scope}]${reset}`;
    let errMsg = message;
    if (err) {
      if (err.message && !message.includes(err.message)) {
        errMsg = `${message} -> ${err.message}`;
      } else if (typeof err === "string" && !message.includes(err)) {
        errMsg = `${message} -> ${err}`;
      }
    }
    console.log(
      `${colors.darkGray}${formatTime()}${reset}  ${badge}  ${formattedScope.padEnd(28)} ${colors.rose}${errMsg}${reset}`
    );
    if (err && err.stack) {
      console.error(`${colors.darkGray}${err.stack}${reset}`);
    } else if (err && typeof err === "object") {
      console.dir(err, { depth: null, colors: true });
    }
  },

  System: (scope, message) => {
    const badge = renderBadge("SYSTEM", colors.white, bgRgb(126, 34, 206)); // Purple Pill
    const formattedScope = `${colors.purple}${bold}[${scope}]${reset}`;
    console.log(
      `${colors.darkGray}${formatTime()}${reset}  ${badge}  ${formattedScope.padEnd(28)} ${colors.violet}${message}${reset}`
    );
  },

  Music: (scope, message) => {
    const badge = renderBadge("AUDIO", colors.white, bgRgb(67, 56, 202)); // Indigo Pill
    const formattedScope = `${colors.indigo}${bold}[${scope}]${reset}`;
    console.log(
      `${colors.darkGray}${formatTime()}${reset}  ${badge}  ${formattedScope.padEnd(28)} ${colors.pink}${message}${reset}`
    );
  },

  Debug: (scope, message) => {
    const badge = renderBadge("DEBUG", colors.white, bgRgb(71, 85, 105)); // Slate Pill
    const formattedScope = `${colors.gray}${bold}[${scope}]${reset}`;
    console.log(
      `${colors.darkGray}${formatTime()}${reset}  ${badge}  ${formattedScope.padEnd(28)} ${colors.gray}${message}${reset}`
    );
  },
};

function printBanner() {
  const ramMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const border = `${colors.darkGray}─────────────────────────────────────────────────────────────────────────────${reset}`;

  console.log(`\n${border}`);
  console.log(`${colors.cyan}${bold}
   █████╗ ███████╗████████╗██████╗ ██╗██╗  ██╗
  ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██║╚██╗██╔╝
  ███████║███████╗   ██║   ██████╔╝██║ ╚███╔╝ 
  ██╔══██║╚════██║   ██║   ██╔══██╗██║ ██╔██╗ 
  ██║  ██║███████║   ██║   ██║  ██║██║██╔╝ ██╗
  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝${reset}`);
  
  console.log(
    `            ${colors.purple}${bold}✦ ASTRIX CORE ENGINE v2.5 • DISCORD HIGH PERFORMANCE ✦${reset}`
  );
  
  // Metric Badges Line
  const badgeNode = `${bgRgb(30, 41, 59)}${colors.emerald}${bold} 🟢 Node ${process.version} ${reset}`;
  const badgeDjs  = `${bgRgb(30, 41, 59)}${colors.cyan}${bold} 🤖 Discord.js v14.27.0 ${reset}`;
  const badgeRam  = `${bgRgb(30, 41, 59)}${colors.violet}${bold} ⚡ Heap ${ramMb} MB ${reset}`;
  const badgeEnv  = `${bgRgb(30, 41, 59)}${colors.yellow}${bold} ⚙ PROD ${reset}`;

  console.log(`  ${badgeNode}  ${badgeDjs}  ${badgeRam}  ${badgeEnv}`);
  console.log(`${border}\n`);
}

module.exports = {
  print,
  logger,
  printBanner,
  colors,
  reset,
  bold,
  dim,
};
