const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const path = require("path");
const fs = require("fs");

// Register GoogleSans for razor-sharp, modern typography
const fontPath = path.join(__dirname, "../fonts/GoogleSans.ttf");
if (fs.existsSync(fontPath)) {
  try {
    GlobalFonts.registerFromPath(fontPath, "GoogleSans");
  } catch (_) {}
}

const FONT_FAMILY = "GoogleSans, sans-serif";

// In-memory cache for category cards
const categoryCardCache = new Map();
const commandCardCache = new Map();

/**
 * Draws a rounded rectangle helper
 */
function drawRoundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Truncate text with ellipsis if it exceeds max width
 */
function truncateText(ctx, text, maxWidth) {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let str = text;
  while (str.length > 0 && ctx.measureText(str + "...").width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str.trim() + "...";
}

/**
 * Clean standard Unicode emoji mapping for each category
 */
const CATEGORY_EMOJIS = {
  "Anti Nuke": "🔒",
  "Anti Raid": "🛡️",
  Automod: "🤖",
  Security: "🔐",
  Moderation: "⚔️",
  Music: "🎵",
  Filters: "🎛️",
  Logging: "📜",
  Server: "🌐",
  Configuration: "⚙️",
  Utility: "🔧",
  "Custom Roles": "🎭",
  Information: "ℹ️",
  General: "💬",
  Owner: "👑",
  Fun: "🎲",
  Giveaway: "🎉",
  Birthday: "🎂",
  "Bump Reminder": "📣",
  Leveling: "📈",
  Ticket: "🎟️",
  Welcome: "👋",
  Goodbye: "🚪",
  Booster: "🚀",
  "Join To Create": "🔊",
  AI: "🧠",
  Voice: "🎙️",
  Miscellaneous: "🧩",
};

/**
 * Generates an ultra-clean, modern Dark/Crimson Canvas card for a Category
 *
 * @param {string} categoryName
 * @param {Array<Object>} commands
 * @param {string} prefix
 * @param {number} totalCategories
 * @returns {Promise<Buffer>}
 */
async function generateCategoryCard(categoryName, commands = [], prefix = ".", totalCategories = 28) {
  const cacheKey = `${categoryName}_${commands.length}_${prefix}`;
  if (categoryCardCache.has(cacheKey)) {
    return categoryCardCache.get(cacheKey);
  }

  const baseW = 960;
  const baseH = 500;
  const scale = 2; // 2x High-DPI
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // 1. Deep Space Cyber Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
  bgGrad.addColorStop(0, "#0c0d12");
  bgGrad.addColorStop(0.5, "#12141c");
  bgGrad.addColorStop(1, "#0a0b0f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // Subtle Crimson Ambient Glow
  const glowGrad = ctx.createRadialGradient(baseW / 2, -50, 20, baseW / 2, 80, 500);
  glowGrad.addColorStop(0, "rgba(229, 62, 62, 0.22)");
  glowGrad.addColorStop(0.5, "rgba(229, 62, 62, 0.05)");
  glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // Card Outer Glow Border
  ctx.strokeStyle = "rgba(255, 60, 80, 0.25)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 16, 16, baseW - 32, baseH - 32, 18, false, true);

  // 2. Header Container
  const emoji = CATEGORY_EMOJIS[categoryName] || "📁";
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  drawRoundRect(ctx, 36, 32, baseW - 72, 70, 14, true, false);

  // Accent Line under header
  const accentGrad = ctx.createLinearGradient(36, 0, baseW - 36, 0);
  accentGrad.addColorStop(0, "#ff2a55");
  accentGrad.addColorStop(0.7, "#e53e3e");
  accentGrad.addColorStop(1, "rgba(229, 62, 62, 0.1)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(36, 100, baseW - 72, 2.5);

  // Category Icon & Title
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.fillText(`${emoji}  ${categoryName.toUpperCase()} MODULE`, 54, 76);

  // Badges on Header Right
  const badgeText = `${commands.length} Commands`;
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  const badgeW = ctx.measureText(badgeText).width + 24;
  const badgeX = baseW - 54 - badgeW;

  ctx.fillStyle = "rgba(229, 62, 62, 0.2)";
  ctx.strokeStyle = "rgba(255, 60, 80, 0.5)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, badgeX, 48, badgeW, 32, 8, true, true);

  ctx.fillStyle = "#ff6b81";
  ctx.fillText(badgeText, badgeX + 12, 69);

  // 3. Command Grid Layout (up to 24 commands displayed crisply)
  const cols = 3;
  const startX = 40;
  const startY = 122;
  const gapX = 14;
  const gapY = 12;
  const cardW = (baseW - 80 - gapX * (cols - 1)) / cols; // ~284px
  const cardH = 38;
  const maxDisplay = 24;

  const displayCmds = commands.slice(0, maxDisplay);

  displayCmds.forEach((cmd, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    const primaryName = cmd.alias?.[0] || cmd.name;

    // Command Item Background Pill
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, y, cardW, cardH, 8, true, true);

    // Left indicator dot
    ctx.fillStyle = "#ff2a55";
    ctx.beginPath();
    ctx.arc(x + 14, y + cardH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Command Name
    ctx.fillStyle = "#f1f2f6";
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    const nameText = `${prefix}${primaryName}`;
    ctx.fillText(truncateText(ctx, nameText, 110), x + 25, y + 24);

    // Short snippet / description
    const rawDesc = cmd.desc || cmd.description || "Command";
    ctx.fillStyle = "rgba(164, 176, 190, 0.75)";
    ctx.font = `12px ${FONT_FAMILY}`;
    const descText = truncateText(ctx, rawDesc, cardW - 145);
    ctx.fillText(descText, x + 138, y + 24);
  });

  // If there are more commands than fit on the card
  if (commands.length > maxDisplay) {
    const extraCount = commands.length - maxDisplay;
    ctx.fillStyle = "rgba(255, 60, 80, 0.85)";
    ctx.font = `italic 12px ${FONT_FAMILY}`;
    ctx.fillText(`+${extraCount} more commands available in dropdown below`, startX + 6, startY + 8 * (cardH + gapY) + 16);
  }

  // 4. Footer Bar
  const footerY = baseH - 42;
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  drawRoundRect(ctx, 36, footerY - 8, baseW - 72, 32, 8, true, false);

  ctx.fillStyle = "rgba(164, 176, 190, 0.7)";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(
    `💡 Select any command from the dropdown below to view full syntax & examples • Astrix Assistant`,
    50,
    footerY + 12
  );

  const buffer = canvas.toBuffer("image/png");
  categoryCardCache.set(cacheKey, buffer);
  return buffer;
}

/**
 * Generates an ultra-clean, modern Canvas card for Command Info Details
 *
 * @param {Object} cmd
 * @param {string} prefix
 * @param {Object} [slashCmd]
 * @returns {Promise<Buffer>}
 */
async function generateCommandDetailCard(cmd, prefix = ".", slashCmd = null) {
  const primaryName = cmd.alias?.[0] || cmd.name;
  const cacheKey = `cmd_${primaryName}_${prefix}`;
  if (commandCardCache.has(cacheKey)) {
    return commandCardCache.get(cacheKey);
  }

  const baseW = 960;
  const baseH = 500;
  const scale = 2;
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
  bgGrad.addColorStop(0, "#0d0f15");
  bgGrad.addColorStop(0.5, "#121520");
  bgGrad.addColorStop(1, "#0a0c10");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // Crimson ambient flare
  const glowGrad = ctx.createRadialGradient(150, 100, 20, 150, 100, 450);
  glowGrad.addColorStop(0, "rgba(229, 62, 62, 0.18)");
  glowGrad.addColorStop(0.7, "rgba(229, 62, 62, 0.03)");
  glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // Outer border
  ctx.strokeStyle = "rgba(255, 60, 80, 0.3)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 16, 16, baseW - 32, baseH - 32, 18, false, true);

  // Header Box
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  drawRoundRect(ctx, 36, 32, baseW - 72, 70, 14, true, false);

  const accentGrad = ctx.createLinearGradient(36, 0, baseW - 36, 0);
  accentGrad.addColorStop(0, "#ff2a55");
  accentGrad.addColorStop(0.7, "#e53e3e");
  accentGrad.addColorStop(1, "rgba(229, 62, 62, 0.1)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(36, 100, baseW - 72, 2.5);

  // Command Title
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.fillText(`📋  COMMAND INFO ── ${prefix}${primaryName}`, 54, 76);

  // Category & Cooldown Badges on right
  const category = cmd.category || "General";
  const cooldown = cmd.cooldown ? `${cmd.cooldown}s` : "3s";

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  const catBadgeText = `${CATEGORY_EMOJIS[category] || "📁"} ${category}`;
  const cdBadgeText = `⏱️ ${cooldown}`;

  const cdW = ctx.measureText(cdBadgeText).width + 20;
  const catW = ctx.measureText(catBadgeText).width + 20;

  const cdX = baseW - 54 - cdW;
  const catX = cdX - 10 - catW;

  // Draw Category Badge
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, catX, 48, catW, 32, 8, true, true);
  ctx.fillStyle = "#ced6e0";
  ctx.fillText(catBadgeText, catX + 10, 69);

  // Draw Cooldown Badge
  ctx.fillStyle = "rgba(229, 62, 62, 0.18)";
  ctx.strokeStyle = "rgba(255, 60, 80, 0.4)";
  drawRoundRect(ctx, cdX, 48, cdW, 32, 8, true, true);
  ctx.fillStyle = "#ff6b81";
  ctx.fillText(cdBadgeText, cdX + 10, 69);

  // Left Content Column (Main Info)
  const leftX = 40;
  const leftW = 490;

  // 1. Description Box
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  drawRoundRect(ctx, leftX, 120, leftW, 70, 10, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillText("DESCRIPTION", leftX + 16, 142);

  const desc = cmd.desc || cmd.description || "Executes command functionality.";
  ctx.fillStyle = "#e4e7eb";
  ctx.font = `14px ${FONT_FAMILY}`;
  ctx.fillText(truncateText(ctx, desc, leftW - 32), leftX + 16, 168);

  // 2. Syntax / Usage Box
  let usage = cmd.usage;
  if (!usage) {
    if (slashCmd?.options?.length > 0) {
      const opts = slashCmd.options.map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`)).join(" ");
      usage = `${primaryName} ${opts}`.trim();
    } else {
      usage = `${primaryName}`;
    }
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  drawRoundRect(ctx, leftX, 204, leftW, 70, 10, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillText("USAGE SYNTAX", leftX + 16, 226);

  ctx.fillStyle = "#2ed573";
  ctx.font = `bold 15px monospace, ${FONT_FAMILY}`;
  ctx.fillText(`${prefix}${usage}`, leftX + 16, 252);

  // 3. Aliases Box
  const aliases = cmd.alias && cmd.alias.length > 1
    ? cmd.alias.filter((a) => a.toLowerCase() !== primaryName.toLowerCase()).map((a) => `${prefix}${a}`).join(", ")
    : "None";

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  drawRoundRect(ctx, leftX, 288, leftW, 60, 10, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillText("ALIASES", leftX + 16, 310);

  ctx.fillStyle = "#ced6e0";
  ctx.font = `13px monospace, ${FONT_FAMILY}`;
  ctx.fillText(truncateText(ctx, aliases, leftW - 32), leftX + 16, 332);

  // 4. Permissions Box
  const botPerms = cmd.botPermissions?.length > 0 ? cmd.botPermissions.join(", ") : "SendMessages";
  const userPerms = cmd.userPermissions?.length > 0 ? cmd.userPermissions.join(", ") : "None";

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  drawRoundRect(ctx, leftX, 362, leftW, 58, 10, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillText("REQUIRED PERMISSIONS", leftX + 16, 384);

  ctx.fillStyle = "#a4b0be";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(`Bot: ${botPerms}  •  User: ${userPerms}`, leftX + 16, 404);

  // Right Content Column (Examples & Subcommands)
  const rightX = leftX + leftW + 18;
  const rightW = baseW - rightX - 40;

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  drawRoundRect(ctx, rightX, 120, rightW, 300, 12, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillText("EXAMPLES & EXECUTION", rightX + 18, 148);

  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(rightX + 18, 160, rightW - 36, 1);

  // Examples rendering
  let examples = [];
  if (cmd.examples && Array.isArray(cmd.examples) && cmd.examples.length > 0) {
    examples = cmd.examples;
  } else {
    examples = [`${prefix}${primaryName}`];
    if (slashCmd?.options?.[0]) {
      examples.push(`${prefix}${primaryName} ${slashCmd.options[0].name}`);
    }
    if (cmd.alias && cmd.alias.length > 1) {
      examples.push(`${prefix}${cmd.alias[1]}`);
    }
  }

  let currY = 192;
  examples.slice(0, 5).forEach((ex, idx) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    drawRoundRect(ctx, rightX + 18, currY - 18, rightW - 36, 34, 6, true, false);

    ctx.fillStyle = "#5352ed";
    ctx.font = `bold 13px monospace`;
    ctx.fillText(`0${idx + 1}`, rightX + 28, currY + 4);

    ctx.fillStyle = "#ffffff";
    ctx.font = `13px monospace, ${FONT_FAMILY}`;
    const exText = ex.startsWith(prefix) ? ex : `${prefix}${ex}`;
    ctx.fillText(truncateText(ctx, exText, rightW - 85), rightX + 58, currY + 4);

    currY += 44;
  });

  // Footer bar
  const footerY = baseH - 42;
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  drawRoundRect(ctx, 36, footerY - 8, baseW - 72, 32, 8, true, false);

  ctx.fillStyle = "rgba(164, 176, 190, 0.7)";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(
    `⚡ Astrix Multi-Purpose Engine • Use buttons below to navigate back or view slash command info`,
    50,
    footerY + 12
  );

  const buffer = canvas.toBuffer("image/png");
  commandCardCache.set(cacheKey, buffer);
  return buffer;
}

module.exports = {
  generateCategoryCard,
  generateCommandDetailCard,
  CATEGORY_EMOJIS,
};
