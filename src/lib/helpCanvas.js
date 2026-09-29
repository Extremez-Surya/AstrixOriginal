const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const path = require("path");
const fs = require("fs");

// Register Hogwarts Font for high-fantasy wizardry typography
const hogwartsFontPath = path.join(__dirname, "../assets/fonts/hogwarts/Hogwarts.ttf");
if (fs.existsSync(hogwartsFontPath)) {
  try {
    GlobalFonts.registerFromPath(hogwartsFontPath, "Hogwarts");
  } catch (_) {}
}

// Register GoogleSans for razor-sharp, modern technical body typography
const fontPath = path.join(__dirname, "../fonts/GoogleSans.ttf");
if (fs.existsSync(fontPath)) {
  try {
    GlobalFonts.registerFromPath(fontPath, "GoogleSans");
  } catch (_) {}
}

const FONT_HOGWARTS = "Hogwarts, 'Cinzel Decorative', 'Georgia', serif";
const FONT_SERIF = "'Georgia', 'Times New Roman', serif";
const FONT_BODY = "GoogleSans, 'Segoe UI', Arial, sans-serif";

// In-memory caches to make response times instantaneous (<10ms on repeat)
const mainCardCache = new Map();
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
 * Truncates text with ellipsis if it exceeds maxWidth
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
 * Wraps text into multiple lines given a max width and max lines
 */
function wrapText(ctx, text, maxWidth, maxLines = 2) {
  if (!text) return [];
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        break;
      }
    }
  }
  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  } else if (lines.length >= maxLines - 1 && currentLine) {
    lines.push(truncateText(ctx, currentLine, maxWidth));
  }
  return lines;
}

/**
 * Clean standard Unicode emoji mapping for each category (used for Discord dropdowns)
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
 * Draws iconic Harry Potter lightning scar motif
 */
function drawLightningBolt(ctx, x, y, scale = 1, color = "#fde047") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(2, 8);
  ctx.lineTo(6, 8);
  ctx.lineTo(1, 16);
  ctx.lineTo(9, 7);
  ctx.lineTo(5, 7);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = "#f59e0b";
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.restore();
}

/**
 * Draws an authentic Hogwarts Great Hall floating candle with warm ambient glow
 */
function drawFloatingCandle(ctx, x, y, candleH = 22) {
  ctx.save();
  // Candle wax body
  const candleGrad = ctx.createLinearGradient(x - 3, y, x + 3, y);
  candleGrad.addColorStop(0, "rgba(240, 230, 205, 0.45)");
  candleGrad.addColorStop(0.5, "rgba(255, 250, 230, 0.65)");
  candleGrad.addColorStop(1, "rgba(210, 195, 170, 0.45)");
  ctx.fillStyle = candleGrad;
  drawRoundRect(ctx, x - 2.5, y, 5, candleH, 2, true, false);

  // Wick
  ctx.strokeStyle = "rgba(40, 30, 20, 0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 3);
  ctx.stroke();

  // Outer ambient flame glow
  const flameGlow = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 18);
  flameGlow.addColorStop(0, "rgba(255, 215, 80, 0.55)");
  flameGlow.addColorStop(0.5, "rgba(245, 150, 30, 0.2)");
  flameGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = flameGlow;
  ctx.beginPath();
  ctx.arc(x, y - 6, 18, 0, Math.PI * 2);
  ctx.fill();

  // Flame teardrop
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.bezierCurveTo(x + 3, y - 6, x + 3, y - 3, x, y - 3);
  ctx.bezierCurveTo(x - 3, y - 3, x - 3, y - 6, x, y - 10);
  ctx.fillStyle = "#fff4d0";
  ctx.shadowColor = "#f59e0b";
  ctx.shadowBlur = 8;
  ctx.fill();

  ctx.restore();
}

/**
 * Draws antique gold corner flourishes and diamond studs
 */
function drawOrnateCorner(ctx, x, y, size, flipX = false, flipY = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 1.5;

  // Outer corner L
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();

  // Inner decorative flourish dot
  ctx.beginPath();
  ctx.arc(6, 6, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#e5c158";
  ctx.fill();

  // Diamond accent
  ctx.beginPath();
  ctx.moveTo(size - 4, 0);
  ctx.lineTo(size, 4);
  ctx.lineTo(size - 4, 8);
  ctx.lineTo(size - 8, 4);
  ctx.closePath();
  ctx.fillStyle = "rgba(212, 175, 55, 0.8)";
  ctx.fill();

  ctx.restore();
}

/**
 * Draws common Hogwarts enchanted castle backdrop with celestial night sky, Lumos radiance & floating candles
 */
function drawHogwartsBackdrop(ctx, baseW, baseH) {
  // 1. Midnight Gothic Castle Atmosphere
  const baseGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
  baseGrad.addColorStop(0, "#08060f");     // Deep midnight shadow
  baseGrad.addColorStop(0.3, "#0e0d1f");   // Royal astral navy
  baseGrad.addColorStop(0.65, "#15102a");  // Mystic violet parchment
  baseGrad.addColorStop(1, "#07050d");     // Antique obsidian
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // 2. Warm Candlelight / Lumos Radiance Glow
  const lumosTop = ctx.createRadialGradient(baseW * 0.5, 0, 10, baseW * 0.5, 0, 500);
  lumosTop.addColorStop(0, "rgba(245, 185, 65, 0.16)");
  lumosTop.addColorStop(0.4, "rgba(212, 145, 40, 0.05)");
  lumosTop.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = lumosTop;
  ctx.fillRect(0, 0, baseW, baseH);

  const ambientViolet = ctx.createRadialGradient(baseW * 0.85, baseH * 0.3, 20, baseW * 0.85, baseH * 0.3, 450);
  ambientViolet.addColorStop(0, "rgba(138, 75, 255, 0.08)");
  ambientViolet.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = ambientViolet;
  ctx.fillRect(0, 0, baseW, baseH);

  // 3. Magical Starry Celestial Field & Golden Embers
  const stars = [
    { x: 90, y: 70, r: 1.5, a: 0.6 },
    { x: 180, y: 130, r: 1.2, a: 0.5 },
    { x: 310, y: 45, r: 2.0, a: 0.8 },
    { x: 440, y: 110, r: 1.0, a: 0.4 },
    { x: 580, y: 65, r: 2.2, a: 0.9 },
    { x: 720, y: 140, r: 1.2, a: 0.5 },
    { x: 860, y: 80, r: 1.8, a: 0.7 },
    { x: 930, y: 160, r: 1.0, a: 0.5 },
    { x: 120, y: 480, r: 1.4, a: 0.5 },
    { x: 260, y: 530, r: 1.0, a: 0.4 },
    { x: 780, y: 500, r: 1.8, a: 0.6 },
    { x: 890, y: 460, r: 1.2, a: 0.5 },
  ];

  ctx.save();
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 235, 170, ${s.a})`;
    ctx.shadowColor = "#f5d061";
    ctx.shadowBlur = 6;
    ctx.fill();

    // 4-point sparkle cross on brighter stars
    if (s.r >= 1.8) {
      ctx.strokeStyle = `rgba(255, 240, 190, ${s.a * 0.75})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(s.x - 5, s.y);
      ctx.lineTo(s.x + 5, s.y);
      ctx.moveTo(s.x, s.y - 5);
      ctx.lineTo(s.x, s.y + 5);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 4. Subtle Gothic Arch / Filigree Silhouette in Background
  ctx.save();
  ctx.strokeStyle = "rgba(212, 175, 55, 0.04)";
  ctx.lineWidth = 1.2;
  // Arch left
  ctx.beginPath();
  ctx.arc(200, 290, 140, Math.PI, 0);
  ctx.stroke();
  // Arch right
  ctx.beginPath();
  ctx.arc(800, 290, 140, Math.PI, 0);
  ctx.stroke();
  ctx.restore();

  // Floating Candles (Great Hall Atmosphere)
  drawFloatingCandle(ctx, 65, 175, 22);
  drawFloatingCandle(ctx, 240, 95, 26);
  drawFloatingCandle(ctx, 520, 48, 20);
  drawFloatingCandle(ctx, 760, 110, 24);
  drawFloatingCandle(ctx, 925, 195, 22);
  drawFloatingCandle(ctx, 480, 525, 20);

  // 5. Regal Double Gold Borders
  ctx.save();
  const goldBorderGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
  goldBorderGrad.addColorStop(0, "rgba(212, 175, 55, 0.65)");
  goldBorderGrad.addColorStop(0.5, "rgba(245, 215, 110, 0.85)");
  goldBorderGrad.addColorStop(1, "rgba(165, 125, 35, 0.65)");
  ctx.strokeStyle = goldBorderGrad;
  ctx.lineWidth = 1.8;
  drawRoundRect(ctx, 12, 12, baseW - 24, baseH - 24, 18, false, true);

  // Inner hairline border
  ctx.strokeStyle = "rgba(212, 175, 55, 0.22)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, 17, 17, baseW - 34, baseH - 34, 14, false, true);

  // Ornate Corner Flourishes
  drawOrnateCorner(ctx, 22, 22, 18, false, false);
  drawOrnateCorner(ctx, baseW - 22, 22, 18, true, false);
  drawOrnateCorner(ctx, 22, baseH - 22, 18, false, true);
  drawOrnateCorner(ctx, baseW - 22, baseH - 22, 18, true, true);
  ctx.restore();
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. GENERATE MAIN HELP CARD (Hogwarts Edition Overview)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function generateMainHelpCard(options = {}) {
  let client = null;
  let guild = null;
  let prefix = ".";
  let totalCommands = 372;
  let totalCategories = 28;
  let latency = 24;

  if (typeof options === "object" && options !== null) {
    client = options.client || null;
    guild = options.guild || null;
    prefix = options.prefix || ".";
    totalCommands = options.totalCommands || 372;
    totalCategories = options.totalCategories || 28;
    latency = options.latency !== undefined ? options.latency : 24;
  }

  const cacheKey = `main_hogwarts_${prefix}_${totalCommands}_${totalCategories}_${guild?.id || "dm"}`;
  if (mainCardCache.has(cacheKey)) {
    return mainCardCache.get(cacheKey);
  }

  const baseW = 1000;
  const baseH = 580;
  const scale = 1.5; // High-DPI optimized (1500 x 870)
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Clip Container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, baseW, baseH, 18);
  ctx.clip();

  // Draw Hogwarts Castle Backdrop
  drawHogwartsBackdrop(ctx, baseW, baseH);

  // Fetch Bot Avatar / Logo
  let avatarImg = null;
  try {
    if (client?.user) {
      const avatarUrl = client.user.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
      avatarImg = await loadImage(avatarUrl);
    }
  } catch (_) {}

  if (!avatarImg) {
    try {
      avatarImg = await loadImage(path.join(__dirname, "../assets/logo.png"));
    } catch (_) {}
  }

  // ── Top Header Bar ──────────────────────────────────────────
  const headY = 26;
  const avatarSize = 64;
  const avatarX = 38;

  if (avatarImg) {
    ctx.save();
    // Antique Gold Medallion Ring
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2 + 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(245, 215, 110, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, headY, avatarSize, avatarSize);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#161224";
    ctx.fill();

    ctx.fillStyle = "#f5d061";
    ctx.font = `34px ${FONT_HOGWARTS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", avatarX + avatarSize / 2, headY + avatarSize / 2 + 2);
    ctx.restore();
  }

  const textX = avatarX + avatarSize + 18;

  // Main Title in Hogwarts Font with Gold Shimmer
  const goldTextGrad = ctx.createLinearGradient(textX, headY, textX + 450, headY);
  goldTextGrad.addColorStop(0, "#fce881");
  goldTextGrad.addColorStop(0.5, "#e5c158");
  goldTextGrad.addColorStop(1, "#c59b27");

  ctx.fillStyle = goldTextGrad;
  ctx.font = `32px ${FONT_HOGWARTS}`;
  ctx.fillText("ASTRIX COMMAND CENTER", textX, headY + 28);

  // Hogwarts Edition Seal Badge with Lightning Bolt
  const titleW = ctx.measureText("ASTRIX COMMAND CENTER").width;
  const sealX = textX + titleW + 16;
  ctx.fillStyle = "rgba(212, 175, 55, 0.12)";
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, sealX, headY + 9, 116, 22, 6, true, true);

  drawLightningBolt(ctx, sealX + 9, headY + 12, 0.75, "#fde047");

  ctx.fillStyle = "#fde047";
  ctx.font = `14px ${FONT_HOGWARTS}`;
  ctx.fillText("HOGWARTS", sealX + 23, headY + 25);

  // Subtitle in antique parchment silver
  ctx.fillStyle = "#cbd5e1";
  ctx.font = `13px ${FONT_SERIF}`;
  ctx.fillText("HOGWARTS ARCHIVES • DISCORD DEFENSE, WITCHCRAFT & AUDITORY SUITE", textX, headY + 47);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `11.5px ${FONT_BODY}`;
  ctx.fillText("Enchanted for rapid execution, autonomous realm warding and seamless guild governance.", textX, headY + 63);

  // Status Pill on top right: LUMOS ACTIVE
  const statusW = 152;
  const statusH = 34;
  const statusPillX = baseW - 38 - statusW;
  const statusPillY = headY + 14;

  ctx.fillStyle = "rgba(20, 16, 32, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 1.2;
  drawRoundRect(ctx, statusPillX, statusPillY, statusW, statusH, 17, true, true);

  // Glowing Magical Golden Orb
  ctx.beginPath();
  ctx.arc(statusPillX + 18, statusPillY + statusH / 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#fbbf24";
  ctx.shadowColor = "#f59e0b";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#fde68a";
  ctx.font = `14px ${FONT_HOGWARTS}`;
  ctx.fillText("LUMOS ACTIVE", statusPillX + 32, statusPillY + 22);

  // ── Stats Row (4 Antique Golden Parchment Metrics Cards) ─────
  const statY = 106;
  const statW = (baseW - 76 - 36) / 4;
  const statH = 74;
  const statGap = 12;

  const statsData = [
    { label: "GUILD INCANTATION", val: `${prefix}`, sub: "Server Prefix" },
    { label: "REGISTERED SPELLS", val: `${totalCommands}`, sub: "Ready To Cast" },
    { label: "MAGICAL HOUSES", val: `${totalCategories}`, sub: "Organized Suites" },
    { label: "OWL DISPATCH", val: `${latency}ms`, sub: "Gateway Latency" },
  ];

  statsData.forEach((st, idx) => {
    const x = 38 + idx * (statW + statGap);

    ctx.fillStyle = "rgba(18, 14, 30, 0.8)";
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, statY, statW, statH, 10, true, true);

    ctx.fillStyle = "rgba(212, 175, 55, 0.5)";
    ctx.fillRect(x + 12, statY, statW - 24, 1.5);

    ctx.fillStyle = "#d4af37";
    ctx.font = `14px ${FONT_HOGWARTS}`;
    ctx.fillText(st.label, x + 14, statY + 21);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 22px ${FONT_BODY}`;
    ctx.fillText(st.val, x + 14, statY + 47);

    ctx.fillStyle = "#94a3b8";
    ctx.font = `11px ${FONT_BODY}`;
    ctx.fillText(st.sub, x + 14, statY + 63);
  });

  // ── Central Feature UI (2 Hogwarts Grimoire Panels) ─────────
  const panelY = 196;
  const panelH = 316;
  const panelW = (baseW - 76 - 16) / 2;

  // ── LEFT PANEL: Defense & Magical Disciplines ────────────────
  const leftX = 38;
  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  ctx.lineWidth = 1.2;
  drawRoundRect(ctx, leftX, panelY, panelW, panelH, 12, true, true);

  // Golden header accent ribbon
  ctx.fillStyle = "#d4af37";
  drawRoundRect(ctx, leftX + 16, panelY + 16, 3, 18, 1.5, true, false);

  ctx.fillStyle = "#fce881";
  ctx.font = `18px ${FONT_HOGWARTS}`;
  ctx.fillText("DEFENSE & MAGICAL DISCIPLINES", leftX + 26, panelY + 31);

  ctx.fillStyle = "rgba(212, 175, 55, 0.18)";
  ctx.fillRect(leftX + 16, panelY + 44, panelW - 32, 1);

  const capabilities = [
    {
      badge: "AUR",
      title: "Autonomous Antinuke & Wards",
      desc: "Real-time whitelist, anti-bot, anti-banish, channel & role shields.",
    },
    {
      badge: "MOD",
      title: "Disciplinary Moderation Hexes",
      desc: "Multi-purge, hex timeouts, banish, silence & automod charms.",
    },
    {
      badge: "AUD",
      title: "Bardic 4K Lossless Symphony",
      desc: "High-fidelity orchestral music, magical audio filters & live lyrics.",
    },
    {
      badge: "ENCH",
      title: "Enchantments & Guild Utilities",
      desc: "Magical parchment welcomes, tickets, house leveling & role sorcery.",
    },
  ];

  capabilities.forEach((cap, idx) => {
    const rowY = panelY + 56 + idx * 63;

    ctx.fillStyle = "rgba(212, 175, 55, 0.1)";
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, leftX + 16, rowY + 3, 40, 22, 5, true, true);

    ctx.fillStyle = "#fde047";
    ctx.font = `13px ${FONT_HOGWARTS}`;
    ctx.textAlign = "center";
    ctx.fillText(cap.badge, leftX + 16 + 20, rowY + 18);
    ctx.textAlign = "left";

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 13.5px ${FONT_SERIF}`;
    ctx.fillText(cap.title, leftX + 66, rowY + 16);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = `11.5px ${FONT_BODY}`;
    ctx.fillText(truncateText(ctx, cap.desc, panelW - 84), leftX + 66, rowY + 32);

    if (idx < capabilities.length - 1) {
      ctx.fillStyle = "rgba(212, 175, 55, 0.08)";
      ctx.fillRect(leftX + 20, rowY + 47, panelW - 40, 1);
    }
  });

  // ── RIGHT PANEL: Grimoire Navigation & Spell Guide ──────────
  const rightX = leftX + panelW + 16;
  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  ctx.lineWidth = 1.2;
  drawRoundRect(ctx, rightX, panelY, panelW, panelH, 12, true, true);

  ctx.fillStyle = "#d4af37";
  drawRoundRect(ctx, rightX + 16, panelY + 16, 3, 18, 1.5, true, false);

  ctx.fillStyle = "#fce881";
  ctx.font = `18px ${FONT_HOGWARTS}`;
  ctx.fillText("GRIMOIRE NAVIGATION & SPELL GUIDE", rightX + 26, panelY + 31);

  ctx.fillStyle = "rgba(212, 175, 55, 0.18)";
  ctx.fillRect(rightX + 16, panelY + 44, panelW - 32, 1);

  const steps = [
    {
      num: "01",
      title: "Consult The Sorting Dropdown",
      desc: "Select any magical discipline below to view its registered spells.",
    },
    {
      num: "02",
      title: "Study Wand Movements & Syntax",
      desc: "Inspect required reagents, privileges & incantation examples.",
    },
    {
      num: "03",
      title: "Cast With Prefix Or Slash",
      desc: `Execute directly with prefix (${prefix}spell) or standard slash command (/).`,
    },
  ];

  steps.forEach((step, idx) => {
    const rowY = panelY + 56 + idx * 63;

    ctx.fillStyle = "rgba(212, 175, 55, 0.1)";
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, rightX + 16, rowY + 3, 34, 22, 5, true, true);

    ctx.fillStyle = "#fde047";
    ctx.font = `13px ${FONT_HOGWARTS}`;
    ctx.textAlign = "center";
    ctx.fillText(step.num, rightX + 16 + 17, rowY + 18);
    ctx.textAlign = "left";

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 13.5px ${FONT_SERIF}`;
    ctx.fillText(step.title, rightX + 60, rowY + 16);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = `11.5px ${FONT_BODY}`;
    ctx.fillText(truncateText(ctx, step.desc, panelW - 78), rightX + 60, rowY + 32);

    ctx.fillStyle = "rgba(212, 175, 55, 0.08)";
    ctx.fillRect(rightX + 20, rowY + 47, panelW - 40, 1);
  });

  // Tip Box
  const tipY = panelY + 248;
  ctx.fillStyle = "rgba(212, 175, 55, 0.06)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
  drawRoundRect(ctx, rightX + 16, tipY, panelW - 32, 48, 8, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `15px ${FONT_HOGWARTS}`;
  ctx.fillText("» INSTANT SPELL CODEX", rightX + 28, tipY + 19);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `11.5px ${FONT_BODY}`;
  ctx.fillText(`Cast ${prefix}help <spell> in any channel for instantaneous scroll documentation.`, rightX + 28, tipY + 36);

  // ── Bottom Instruction Bar ──────────────────────────────────
  const footerY = baseH - 42;
  ctx.fillStyle = "rgba(16, 13, 28, 0.9)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  drawRoundRect(ctx, 38, footerY, baseW - 76, 30, 8, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `15px ${FONT_HOGWARTS}`;
  ctx.fillText("» HOGWARTS INSTRUCTION:", 50, footerY + 20);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `11.5px ${FONT_BODY}`;
  ctx.fillText(
    "Choose a discipline from the enchanted menus below to unfurl all spells, charms & permissions",
    245,
    footerY + 19
  );

  ctx.fillStyle = "#d4af37";
  ctx.font = `13px ${FONT_HOGWARTS}`;
  ctx.textAlign = "right";
  ctx.fillText("ASTRIX WIZARDRY 2026", baseW - 50, footerY + 20);
  ctx.textAlign = "left";

  ctx.restore(); // unclip

  const buffer = canvas.toBuffer("image/png");
  mainCardCache.set(cacheKey, buffer);
  return buffer;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. GENERATE CATEGORY CARD (Hogwarts Grimoire Command Grid)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function generateCategoryCard(
  categoryName,
  commands = [],
  prefix = ".",
  totalCategories = 28,
  page = 0,
  totalPages = 1
) {
  const cacheKey = `cat_hogwarts_${categoryName}_${commands.length}_${prefix}_p${page}`;
  if (categoryCardCache.has(cacheKey)) {
    return categoryCardCache.get(cacheKey);
  }

  const baseW = 1000;
  const baseH = 580;
  const scale = 1.5; // High-DPI optimized (1500 x 870)
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Clip Container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, baseW, baseH, 18);
  ctx.clip();

  // Backdrop
  drawHogwartsBackdrop(ctx, baseW, baseH);

  // ── Header Box ──────────────────────────────────────────────
  const headY = 24;
  const headH = 68;

  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  ctx.lineWidth = 1.2;
  drawRoundRect(ctx, 38, headY, baseW - 76, headH, 12, true, true);

  // Accent line
  const accentGrad = ctx.createLinearGradient(38, 0, baseW - 38, 0);
  accentGrad.addColorStop(0, "rgba(212, 175, 55, 0.8)");
  accentGrad.addColorStop(0.5, "rgba(245, 215, 110, 0.3)");
  accentGrad.addColorStop(1, "rgba(212, 175, 55, 0.05)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(38, headY + headH - 2, baseW - 76, 2);

  ctx.fillStyle = "#fce881";
  ctx.font = `28px ${FONT_HOGWARTS}`;
  ctx.fillText(`»  ${categoryName.toUpperCase()} DISCIPLINE`, 56, headY + 34);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `13px ${FONT_SERIF}`;
  ctx.fillText(`Explore all available wards, incantations, and guild charms in this discipline.`, 56, headY + 54);

  // Badges on Header Right
  const badgeText = `${commands.length} Spells`;
  ctx.font = `16px ${FONT_HOGWARTS}`;
  const badgeW = ctx.measureText(badgeText).width + 24;
  const badgeX = baseW - 56 - badgeW;

  ctx.fillStyle = "rgba(212, 175, 55, 0.12)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, badgeX, headY + 18, badgeW, 32, 8, true, true);

  ctx.fillStyle = "#fde047";
  ctx.fillText(badgeText, badgeX + 12, headY + 39);

  if (totalPages > 1) {
    const pageBadgeText = `Scroll ${page + 1}/${totalPages}`;
    const pageBadgeW = ctx.measureText(pageBadgeText).width + 20;
    const pageBadgeX = badgeX - pageBadgeW - 10;

    ctx.fillStyle = "rgba(212, 175, 55, 0.12)";
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, pageBadgeX, headY + 18, pageBadgeW, 32, 8, true, true);

    ctx.fillStyle = "#ced6e0";
    ctx.fillText(pageBadgeText, pageBadgeX + 10, headY + 39);
  }

  // ── High-Legibility Command Grid (3 Columns × 6 Rows = 18 per page) ──
  const cols = 3;
  const startX = 38;
  const startY = headY + headH + 16;
  const gapX = 14;
  const gapY = 12;
  const cardW = (baseW - 76 - gapX * (cols - 1)) / cols;
  const cardH = 54;
  const pageSize = 18;

  const pageCmds = commands.slice(page * pageSize, (page + 1) * pageSize);

  pageCmds.forEach((cmd, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    const primaryName = cmd.alias?.[0] || cmd.name;

    ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
    ctx.strokeStyle = "rgba(212, 175, 55, 0.28)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, y, cardW, cardH, 9, true, true);

    // Left gold accent bar
    ctx.fillStyle = "#d4af37";
    drawRoundRect(ctx, x + 7, y + 11, 2.5, cardH - 22, 1.2, true, false);

    // Command Name in Hogwarts Font
    ctx.fillStyle = "#fce881";
    ctx.font = `18px ${FONT_HOGWARTS}`;
    const nameText = `${prefix}${primaryName}`;
    ctx.fillText(truncateText(ctx, nameText, 250), x + 18, y + 24);

    // Snippet description
    const rawDesc = cmd.desc || cmd.description || "Incantation syntax & usage details";
    ctx.fillStyle = "#94a3b8";
    ctx.font = `12px ${FONT_BODY}`;
    const descText = truncateText(ctx, rawDesc, cardW - 28);
    ctx.fillText(descText, x + 18, y + 43);
  });

  // ── Footer Bar ──────────────────────────────────────────────
  const footerY = baseH - 42;
  ctx.fillStyle = "rgba(16, 13, 28, 0.9)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  drawRoundRect(ctx, 38, footerY, baseW - 76, 30, 8, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `15px ${FONT_HOGWARTS}`;
  ctx.fillText("» HOGWARTS HINT:", 50, footerY + 20);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `11.5px ${FONT_BODY}`;
  ctx.fillText(
    "Select any spell from the dropdown below to study exact incantation, permissions & examples",
    190,
    footerY + 19
  );

  ctx.restore(); // unclip

  const buffer = canvas.toBuffer("image/png");
  categoryCardCache.set(cacheKey, buffer);
  return buffer;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. GENERATE COMMAND DETAIL CARD (Hogwarts Spell Codex)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function generateCommandDetailCard(cmd, prefix = ".", slashCmd = null) {
  const primaryName = cmd.alias?.[0] || cmd.name;
  const cacheKey = `cmd_hogwarts_${primaryName}_${prefix}`;
  if (commandCardCache.has(cacheKey)) {
    return commandCardCache.get(cacheKey);
  }

  const baseW = 1000;
  const baseH = 540;
  const scale = 1.5; // High-DPI optimized
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Clip Container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, baseW, baseH, 18);
  ctx.clip();

  // Backdrop
  drawHogwartsBackdrop(ctx, baseW, baseH);

  // ── Header Box ──────────────────────────────────────────────
  const headY = 26;
  const headH = 70;

  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  drawRoundRect(ctx, 38, headY, baseW - 76, headH, 12, true, true);

  const accentGrad = ctx.createLinearGradient(38, 0, baseW - 38, 0);
  accentGrad.addColorStop(0, "rgba(212, 175, 55, 0.8)");
  accentGrad.addColorStop(0.5, "rgba(245, 215, 110, 0.3)");
  accentGrad.addColorStop(1, "rgba(212, 175, 55, 0.05)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(38, headY + headH - 2, baseW - 76, 2);

  // Command Title in Hogwarts Font
  ctx.fillStyle = "#fce881";
  ctx.font = `28px ${FONT_HOGWARTS}`;
  ctx.fillText(`»  SPELL CODEX ── ${prefix}${primaryName.toUpperCase()}`, 56, headY + 34);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `12.5px ${FONT_SERIF}`;
  ctx.fillText(`Sacred configuration, incantation execution, and required magical authority.`, 56, headY + 54);

  // Category & Cooldown Badges on right
  const category = cmd.category || "General";
  const cooldown = cmd.cooldown ? `${cmd.cooldown}s` : "3s";

  ctx.font = `15px ${FONT_HOGWARTS}`;
  const catBadgeText = category;
  const cdBadgeText = `${cooldown}`;

  const cdW = ctx.measureText(cdBadgeText).width + 24;
  const catW = ctx.measureText(catBadgeText).width + 24;

  const cdX = baseW - 56 - cdW;
  const catX = cdX - 10 - catW;

  // Draw Category Badge
  ctx.fillStyle = "rgba(212, 175, 55, 0.12)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  drawRoundRect(ctx, catX, headY + 18, catW, 32, 8, true, true);
  ctx.fillStyle = "#fde047";
  ctx.fillText(catBadgeText, catX + 12, headY + 39);

  // Draw Cooldown Badge
  drawRoundRect(ctx, cdX, headY + 18, cdW, 32, 8, true, true);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(cdBadgeText, cdX + 12, headY + 39);

  // ── Left Column (Main Specs) ─────────────────────────────────
  const leftX = 38;
  const leftW = 510;

  // 1. Description Box
  const desc = cmd.desc || cmd.description || "Executes incantation functionality.";
  ctx.font = `13px ${FONT_SERIF}`;
  const descLines = wrapText(ctx, desc, leftW - 32, 2);

  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.28)";
  drawRoundRect(ctx, leftX, 116, leftW, 76, 10, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `16px ${FONT_HOGWARTS}`;
  ctx.fillText("INCANTATION DESCRIPTION", leftX + 16, 137);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `13px ${FONT_SERIF}`;
  if (descLines.length === 1) {
    ctx.fillText(descLines[0], leftX + 16, 162);
  } else {
    ctx.fillText(descLines[0] || "", leftX + 16, 158);
    ctx.fillText(descLines[1] || "", leftX + 16, 178);
  }

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

  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.28)";
  drawRoundRect(ctx, leftX, 206, leftW, 70, 10, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `16px ${FONT_HOGWARTS}`;
  ctx.fillText("INCANTATION SYNTAX", leftX + 16, 228);

  ctx.fillStyle = "#fbbf24";
  ctx.font = `bold 15px monospace`;
  ctx.fillText(`${prefix}${usage}`, leftX + 16, 254);

  // 3. Aliases Box
  const aliases =
    cmd.alias && cmd.alias.length > 1
      ? cmd.alias.filter((a) => a.toLowerCase() !== primaryName.toLowerCase()).map((a) => `${prefix}${a}`).join(", ")
      : "None";

  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.28)";
  drawRoundRect(ctx, leftX, 290, leftW, 62, 10, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `16px ${FONT_HOGWARTS}`;
  ctx.fillText("ANCIENT ALIASES", leftX + 16, 310);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `13px monospace`;
  ctx.fillText(truncateText(ctx, aliases, leftW - 32), leftX + 16, 333);

  // 4. Permissions Box
  const botPerms = cmd.botPermissions?.length > 0 ? cmd.botPermissions.join(", ") : "SendMessages";
  const userPerms = cmd.userPermissions?.length > 0 ? cmd.userPermissions.join(", ") : "None";

  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.28)";
  drawRoundRect(ctx, leftX, 366, leftW, 64, 10, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `16px ${FONT_HOGWARTS}`;
  ctx.fillText("REQUIRED MAGICAL AUTHORITY", leftX + 16, 388);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `12px ${FONT_BODY}`;
  ctx.fillText(`Bot: ${botPerms}   •   Wizard: ${userPerms}`, leftX + 16, 411);

  // ── Right Column (Examples & Live Execution) ─────────────────
  const rightX = leftX + leftW + 18;
  const rightW = baseW - rightX - 38;

  ctx.fillStyle = "rgba(16, 13, 28, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.28)";
  drawRoundRect(ctx, rightX, 116, rightW, 314, 12, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `17px ${FONT_HOGWARTS}`;
  ctx.fillText("EXAMPLE INCANTATIONS", rightX + 18, 142);

  ctx.fillStyle = "rgba(212, 175, 55, 0.18)";
  ctx.fillRect(rightX + 18, 154, rightW - 36, 1);

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

  let currY = 188;
  examples.slice(0, 5).forEach((ex, idx) => {
    ctx.fillStyle = "rgba(212, 175, 55, 0.06)";
    ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
    drawRoundRect(ctx, rightX + 18, currY - 18, rightW - 36, 36, 6, true, true);

    ctx.fillStyle = "#fde047";
    ctx.font = `13px ${FONT_HOGWARTS}`;
    ctx.fillText(`0${idx + 1}`, rightX + 28, currY + 4);

    ctx.fillStyle = "#ffffff";
    ctx.font = `13px monospace`;
    const exText = ex.startsWith(prefix) ? ex : `${prefix}${ex}`;
    ctx.fillText(truncateText(ctx, exText, rightW - 85), rightX + 58, currY + 4);

    currY += 46;
  });

  // ── Footer Bar ──────────────────────────────────────────────
  const footerY = baseH - 42;
  ctx.fillStyle = "rgba(16, 13, 28, 0.9)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  drawRoundRect(ctx, 38, footerY, baseW - 76, 30, 8, true, true);

  ctx.fillStyle = "#fce881";
  ctx.font = `15px ${FONT_HOGWARTS}`;
  ctx.fillText("» HOGWARTS ARCHIVES:", 50, footerY + 20);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `11.5px ${FONT_BODY}`;
  ctx.fillText(
    "Astrix High Grimoire • Use buttons below to return to the discipline list or summon slash parameters",
    215,
    footerY + 19
  );

  ctx.restore(); // unclip

  const buffer = canvas.toBuffer("image/png");
  commandCardCache.set(cacheKey, buffer);
  return buffer;
}

module.exports = {
  generateMainHelpCard,
  generateCategoryCard,
  generateCommandDetailCard,
  CATEGORY_EMOJIS,
};
