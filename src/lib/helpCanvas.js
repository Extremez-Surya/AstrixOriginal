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

const FONT_FAMILY = "GoogleSans, Arial, sans-serif";

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
 * Loads background image (prefers helpmenu.png, falls back to mention_bg.png)
 */
let cachedBgImg = null;
async function getBackgroundImage() {
  if (cachedBgImg) return cachedBgImg;
  const paths = [
    path.join(__dirname, "../assets/helpmenu.png"),
    path.join(__dirname, "../assets/mention_bg.png"),
    path.join(__dirname, "../assets/developer_bg.png"),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        cachedBgImg = await loadImage(p);
        return cachedBgImg;
      } catch (_) {}
    }
  }
  return null;
}

/**
 * Draws common cinematic cyberpunk background & particle VFX
 */
function drawCinematicBackdrop(ctx, baseW, baseH, bgImg) {
  if (bgImg) {
    const bgAspect = bgImg.width / bgImg.height;
    const targetAspect = baseW / baseH;
    let sx = 0, sy = 0, sw = bgImg.width, sh = bgImg.height;

    if (bgAspect > targetAspect) {
      sw = bgImg.height * targetAspect;
      sx = (bgImg.width - sw) * 0.5;
    } else {
      sh = bgImg.width / targetAspect;
      sy = (bgImg.height - sh) * 0.45;
    }

    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, baseW, baseH);

    // Deep Dark Crimson & Obsidian Overlay (optimized for maximum readability)
    const overlayGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
    overlayGrad.addColorStop(0, "rgba(8, 10, 15, 0.90)");
    overlayGrad.addColorStop(0.35, "rgba(12, 14, 20, 0.86)");
    overlayGrad.addColorStop(0.7, "rgba(18, 16, 24, 0.84)");
    overlayGrad.addColorStop(1, "rgba(6, 8, 12, 0.90)");
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, baseW, baseH);
  } else {
    const baseGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
    baseGrad.addColorStop(0, "#08090d");
    baseGrad.addColorStop(0.3, "#0f121a");
    baseGrad.addColorStop(0.7, "#141520");
    baseGrad.addColorStop(1, "#06070a");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, baseW, baseH);
  }

  // 1. High-Tech Diamond Micro-Grid Pattern
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  const gridSize = 28;
  for (let x = -baseH; x < baseW + baseH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + baseH, baseH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + baseH, 0);
    ctx.lineTo(x, baseH);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Ambient Spotlights & Crimson Bloom
  const redSpotlight = ctx.createRadialGradient(baseW * 0.2, 0, 20, baseW * 0.2, 80, 450);
  redSpotlight.addColorStop(0, "rgba(255, 45, 85, 0.22)");
  redSpotlight.addColorStop(0.5, "rgba(229, 62, 62, 0.06)");
  redSpotlight.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = redSpotlight;
  ctx.fillRect(0, 0, baseW, baseH);

  const rightBloom = ctx.createRadialGradient(baseW * 0.85, baseH, 10, baseW * 0.85, baseH, 350);
  rightBloom.addColorStop(0, "rgba(255, 71, 87, 0.12)");
  rightBloom.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = rightBloom;
  ctx.fillRect(0, 0, baseW, baseH);

  // 3. Sweeping Specular Beam
  const beamX = baseW * 0.48;
  const beamGrad = ctx.createLinearGradient(beamX - 120, 0, beamX + 120, 0);
  beamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  beamGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.04)");
  beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = beamGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // 4. Cyber Dust & Glowing Star Particles
  ctx.save();
  const particles = [
    { x: 140, y: 45, r: 1.5, a: 0.6 },
    { x: 280, y: 75, r: 1.2, a: 0.4 },
    { x: 490, y: 35, r: 1.8, a: 0.7 },
    { x: 670, y: 65, r: 1.0, a: 0.45 },
    { x: 860, y: 40, r: 2.0, a: 0.65 },
    { x: 220, y: 480, r: 1.4, a: 0.35 },
    { x: 540, y: 510, r: 1.2, a: 0.4 },
    { x: 820, y: 490, r: 1.6, a: 0.5 },
  ];
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 220, 230, ${p.a})`;
    ctx.shadowColor = "rgba(255, 75, 100, 0.85)";
    ctx.shadowBlur = 6;
    ctx.fill();
  });
  ctx.restore();

  // 5. Card Border Frame with Rounded Corners
  ctx.strokeStyle = "rgba(255, 60, 80, 0.35)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 12, 12, baseW - 24, baseH - 24, 20, false, true);

  // Subtle Inner Edge
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, 14, 14, baseW - 28, baseH - 28, 18, false, true);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. GENERATE MAIN HELP CARD (Ultra-Aesthetic Dynamic Home Overview)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function generateMainHelpCard({
  client,
  guild,
  prefix = ".",
  totalCommands = 375,
  totalCategories = 28,
  latency = 0,
}) {
  const cacheKey = `main_${prefix}_${totalCommands}_${totalCategories}_${guild?.id || "dm"}`;
  if (mainCardCache.has(cacheKey)) {
    return mainCardCache.get(cacheKey);
  }

  const baseW = 1000;
  const baseH = 540;
  const scale = 2; // 2x Ultra-HD
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const bgImg = await getBackgroundImage();

  // Clip Container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, baseW, baseH, 20);
  ctx.clip();

  // Backdrop
  drawCinematicBackdrop(ctx, baseW, baseH, bgImg);

  // Fetch Bot Avatar / Logo
  let avatarImg = null;
  try {
    const avatarUrl = client.user.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
    avatarImg = await loadImage(avatarUrl);
  } catch (_) {
    try {
      avatarImg = await loadImage(path.join(__dirname, "../assets/logo.png"));
    } catch (_) {}
  }

  // ── Top Header Bar ──────────────────────────────────────────
  const headY = 32;
  const avatarSize = 64;
  const avatarX = 36;

  if (avatarImg) {
    ctx.save();
    // Avatar Outer Glow Ring
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 42, 85, 0.25)";
    ctx.shadowColor = "#ff2a55";
    ctx.shadowBlur = 12;
    ctx.fill();

    // Avatar Circle Clip
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, headY, avatarSize, avatarSize);
    ctx.restore();
  }

  // Bot Title & Sub-brand
  const textX = avatarImg ? avatarX + avatarSize + 18 : 36;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.fillText("ASTRIX COMMAND DIRECTORY", textX, headY + 28);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("HIGH-PERFORMANCE DISCORD SECURITY & AUTOMATION ENGINE", textX, headY + 46);

  ctx.fillStyle = "rgba(206, 214, 224, 0.75)";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText("Explore modular commands, automated protection suites, and utility systems.", textX, headY + 63);

  // Top Right System Status Pill
  const statusW = 142;
  const statusH = 34;
  const statusX = baseW - 36 - statusW;
  const statusY = headY + 12;

  ctx.fillStyle = "rgba(16, 22, 32, 0.75)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, statusX, statusY, statusW, statusH, 17, true, true);

  // Green Dot
  ctx.beginPath();
  ctx.arc(statusX + 16, statusY + statusH / 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#2ed573";
  ctx.shadowColor = "#2ed573";
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#2ed573";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("SYSTEM ACTIVE", statusX + 28, statusY + 21);

  // ── Stats Row (4 Glassmorphic Metrics Cards) ─────────────────
  const statY = 118;
  const statW = (baseW - 72 - 36) / 4; // ~218px
  const statH = 74;
  const statGap = 12;

  const statsData = [
    { label: "GUILD PREFIX", val: `${prefix}`, sub: "Server Custom", color: "#ff4757" },
    { label: "ALL COMMANDS", val: `${totalCommands}`, sub: "Active & Ready", color: "#ffffff" },
    { label: "SYSTEM MODULES", val: `${totalCategories}`, sub: "Categorized", color: "#ffffff" },
    { label: "GATEWAY LATENCY", val: `${latency || 24}ms`, sub: "Global Shards", color: "#2ed573" },
  ];

  statsData.forEach((st, idx) => {
    const x = 36 + idx * (statW + statGap);

    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, statY, statW, statH, 12, true, true);

    // Accent bottom line
    ctx.fillStyle = st.color;
    ctx.fillRect(x + 14, statY + statH - 3, statW - 28, 2);

    // Glowing indicator circle
    ctx.beginPath();
    ctx.arc(x + 18, statY + 18, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = st.color;
    ctx.shadowColor = st.color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(164, 176, 190, 0.85)";
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillText(`// ${st.label}`, x + 28, statY + 22);

    ctx.fillStyle = st.color;
    ctx.font = `bold 22px ${FONT_FAMILY}`;
    ctx.fillText(st.val, x + 14, statY + 48);

    ctx.fillStyle = "rgba(164, 176, 190, 0.65)";
    ctx.font = `11px ${FONT_FAMILY}`;
    ctx.fillText(st.sub, x + 14, statY + 63);
  });

  // ── Featured Core Modules Showcase (8 Modules) ───────────────
  const featY = 214;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillText("CORE SYSTEM MODULES OVERVIEW", 36, featY);

  ctx.fillStyle = "rgba(255, 42, 85, 0.7)";
  ctx.fillRect(36, featY + 8, baseW - 72, 1.5);

  const featuredModules = [
    { name: "Anti Nuke", desc: "13 Core Modules" },
    { name: "Anti Raid", desc: "5 Guard Systems" },
    { name: "Automod", desc: "11 Auto Rules" },
    { name: "Moderation", desc: "71 Mod Actions" },
    { name: "Music 4K", desc: "39 Audio Tools" },
    { name: "Configuration", desc: "5 Server Setups" },
    { name: "Custom Roles", desc: "4 Role Managers" },
    { name: "Utility", desc: "24 Server Utilities" },
  ];

  const gridCols = 4;
  const gridW = (baseW - 72 - 36) / gridCols;
  const gridH = 50;
  const startGridY = featY + 22;

  featuredModules.forEach((mod, idx) => {
    const col = idx % gridCols;
    const row = Math.floor(idx / gridCols);
    const x = 36 + col * (gridW + statGap);
    const y = startGridY + row * (gridH + 10);

    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.065)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, y, gridW, gridH, 10, true, true);

    // Glowing indicator
    ctx.fillStyle = "#ff2a55";
    ctx.beginPath();
    ctx.arc(x + 14, y + gridH / 2, 3.5, 0, Math.PI * 2);
    ctx.shadowColor = "#ff2a55";
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#f1f2f6";
    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillText(mod.name, x + 26, y + 22);

    ctx.fillStyle = "rgba(164, 176, 190, 0.75)";
    ctx.font = `11px ${FONT_FAMILY}`;
    ctx.fillText(mod.desc, x + 26, y + 38);
  });

  // ── Bottom Instruction Bar ──────────────────────────────────
  const footerY = baseH - 52;
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  drawRoundRect(ctx, 36, footerY, baseW - 72, 34, 8, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("» QUICK INSTRUCTION:", 50, footerY + 22);

  ctx.fillStyle = "#ced6e0";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(
    "Select any module from the dropdown menus below to view the full command list & syntax",
    195,
    footerY + 22
  );

  ctx.fillStyle = "rgba(164, 176, 190, 0.5)";
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.textAlign = "right";
  ctx.fillText("ASTRIXCODE™ 2026", baseW - 48, footerY + 22);
  ctx.textAlign = "left";

  ctx.restore(); // unclip

  const buffer = canvas.toBuffer("image/png");
  mainCardCache.set(cacheKey, buffer);
  return buffer;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. GENERATE CATEGORY CARD (High-Capacity Glassmorphic Command Grid)
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
  const cacheKey = `cat_${categoryName}_${commands.length}_${prefix}_p${page}`;
  if (categoryCardCache.has(cacheKey)) {
    return categoryCardCache.get(cacheKey);
  }

  const baseW = 1000;
  const baseH = 560;
  const scale = 2; // 2x Ultra-HD
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const bgImg = await getBackgroundImage();

  // Clip Container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, baseW, baseH, 20);
  ctx.clip();

  // Backdrop
  drawCinematicBackdrop(ctx, baseW, baseH, bgImg);

  // ── Header Box ──────────────────────────────────────────────
  const headY = 28;
  const headH = 72;

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, 36, headY, baseW - 72, headH, 14, true, true);

  // Crimson Accent Line under header
  const accentGrad = ctx.createLinearGradient(36, 0, baseW - 36, 0);
  accentGrad.addColorStop(0, "#ff2a55");
  accentGrad.addColorStop(0.6, "#e53e3e");
  accentGrad.addColorStop(1, "rgba(229, 62, 62, 0.1)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(36, headY + headH - 3, baseW - 72, 3);

  // Title & Subtitle with clean tech symbol
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 26px ${FONT_FAMILY}`;
  ctx.fillText(`»  ${categoryName.toUpperCase()} MODULE`, 54, headY + 36);

  ctx.fillStyle = "rgba(206, 214, 224, 0.75)";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(`Explore all available commands, aliases and syntax options in this category.`, 54, headY + 56);

  // Badges on Header Right
  const badgeText = `${commands.length} Commands`;
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  const badgeW = ctx.measureText(badgeText).width + 24;
  const badgeX = baseW - 54 - badgeW;

  ctx.fillStyle = "rgba(229, 62, 62, 0.22)";
  ctx.strokeStyle = "rgba(255, 60, 80, 0.5)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, badgeX, headY + 20, badgeW, 32, 8, true, true);

  ctx.fillStyle = "#ff6b81";
  ctx.fillText(badgeText, badgeX + 12, headY + 41);

  if (totalPages > 1) {
    const pageBadgeText = `Page ${page + 1}/${totalPages}`;
    const pageBadgeW = ctx.measureText(pageBadgeText).width + 20;
    const pageBadgeX = badgeX - pageBadgeW - 10;

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    drawRoundRect(ctx, pageBadgeX, headY + 20, pageBadgeW, 32, 8, true, true);

    ctx.fillStyle = "#ced6e0";
    ctx.fillText(pageBadgeText, pageBadgeX + 10, headY + 41);
  }

  // ── High-Capacity Command Grid (4 Columns × 7 Rows = 28 per page) ──
  const cols = 4;
  const startX = 36;
  const startY = headY + headH + 18;
  const gapX = 12;
  const gapY = 10;
  const cardW = (baseW - 72 - gapX * (cols - 1)) / cols; // ~223px
  const cardH = 40;
  const pageSize = 28;

  const pageCmds = commands.slice(page * pageSize, (page + 1) * pageSize);

  pageCmds.forEach((cmd, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    const primaryName = cmd.alias?.[0] || cmd.name;

    // Command Item Background
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, y, cardW, cardH, 8, true, true);

    // Left glowing indicator dot
    ctx.fillStyle = "#ff2a55";
    ctx.beginPath();
    ctx.arc(x + 12, y + cardH / 2, 3, 0, Math.PI * 2);
    ctx.shadowColor = "#ff2a55";
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Command Name
    ctx.fillStyle = "#f1f2f6";
    ctx.font = `bold 13px ${FONT_FAMILY}`;
    const nameText = `${prefix}${primaryName}`;
    ctx.fillText(truncateText(ctx, nameText, 100), x + 22, y + 19);

    // Snippet description
    const rawDesc = cmd.desc || cmd.description || "Command";
    ctx.fillStyle = "rgba(164, 176, 190, 0.7)";
    ctx.font = `11px ${FONT_FAMILY}`;
    const descText = truncateText(ctx, rawDesc, cardW - 32);
    ctx.fillText(descText, x + 22, y + 33);
  });

  // ── Footer Bar ──────────────────────────────────────────────
  const footerY = baseH - 46;
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  drawRoundRect(ctx, 36, footerY, baseW - 72, 30, 6, true, false);

  ctx.fillStyle = "rgba(164, 176, 190, 0.75)";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(
    `» Select any command from the dropdown menu below to view detailed syntax, permissions & examples`,
    48,
    footerY + 19
  );

  ctx.restore(); // unclip

  const buffer = canvas.toBuffer("image/png");
  categoryCardCache.set(cacheKey, buffer);
  return buffer;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. GENERATE COMMAND DETAIL CARD (Cinematic Deep-Dive Syntax View)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function generateCommandDetailCard(cmd, prefix = ".", slashCmd = null) {
  const primaryName = cmd.alias?.[0] || cmd.name;
  const cacheKey = `cmd_${primaryName}_${prefix}`;
  if (commandCardCache.has(cacheKey)) {
    return commandCardCache.get(cacheKey);
  }

  const baseW = 1000;
  const baseH = 540;
  const scale = 2; // 2x Ultra-HD
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const bgImg = await getBackgroundImage();

  // Clip Container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, baseW, baseH, 20);
  ctx.clip();

  // Backdrop
  drawCinematicBackdrop(ctx, baseW, baseH, bgImg);

  // ── Header Box ──────────────────────────────────────────────
  const headY = 28;
  const headH = 72;

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, 36, headY, baseW - 72, headH, 14, true, true);

  const accentGrad = ctx.createLinearGradient(36, 0, baseW - 36, 0);
  accentGrad.addColorStop(0, "#ff2a55");
  accentGrad.addColorStop(0.6, "#e53e3e");
  accentGrad.addColorStop(1, "rgba(229, 62, 62, 0.1)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(36, headY + headH - 3, baseW - 72, 3);

  // Command Title
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 26px ${FONT_FAMILY}`;
  ctx.fillText(`»  COMMAND DETAILS ── ${prefix}${primaryName}`, 54, headY + 36);

  ctx.fillStyle = "rgba(206, 214, 224, 0.75)";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(`Full configuration, syntax execution, and permission documentation.`, 54, headY + 56);

  // Category & Cooldown Badges on right
  const category = cmd.category || "General";
  const cooldown = cmd.cooldown ? `${cmd.cooldown}s` : "3s";

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  const catBadgeText = category;
  const cdBadgeText = `${cooldown}`;

  const cdW = ctx.measureText(cdBadgeText).width + 24;
  const catW = ctx.measureText(catBadgeText).width + 24;

  const cdX = baseW - 54 - cdW;
  const catX = cdX - 10 - catW;

  // Draw Category Badge
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  drawRoundRect(ctx, catX, headY + 20, catW, 32, 8, true, true);
  ctx.fillStyle = "#ced6e0";
  ctx.fillText(catBadgeText, catX + 12, headY + 41);

  // Draw Cooldown Badge
  ctx.fillStyle = "rgba(229, 62, 62, 0.2)";
  ctx.strokeStyle = "rgba(255, 60, 80, 0.5)";
  drawRoundRect(ctx, cdX, headY + 20, cdW, 32, 8, true, true);
  ctx.fillStyle = "#ff6b81";
  ctx.fillText(cdBadgeText, cdX + 12, headY + 41);

  // ── Left Column (Main Specs) ─────────────────────────────────
  const leftX = 36;
  const leftW = 510;

  // 1. Description Box (Multi-line wrap support)
  const desc = cmd.desc || cmd.description || "Executes command functionality.";
  ctx.font = `14px ${FONT_FAMILY}`;
  const descLines = wrapText(ctx, desc, leftW - 32, 2);

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  drawRoundRect(ctx, leftX, 120, leftW, 76, 10, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("DESCRIPTION", leftX + 16, 140);

  ctx.fillStyle = "#e4e7eb";
  ctx.font = `14px ${FONT_FAMILY}`;
  if (descLines.length === 1) {
    ctx.fillText(descLines[0], leftX + 16, 166);
  } else {
    ctx.fillText(descLines[0] || "", leftX + 16, 162);
    ctx.fillText(descLines[1] || "", leftX + 16, 182);
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

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  drawRoundRect(ctx, leftX, 210, leftW, 70, 10, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("USAGE SYNTAX", leftX + 16, 232);

  ctx.fillStyle = "#2ed573";
  ctx.font = `bold 15px monospace, ${FONT_FAMILY}`;
  ctx.fillText(`${prefix}${usage}`, leftX + 16, 258);

  // 3. Aliases Box
  const aliases =
    cmd.alias && cmd.alias.length > 1
      ? cmd.alias.filter((a) => a.toLowerCase() !== primaryName.toLowerCase()).map((a) => `${prefix}${a}`).join(", ")
      : "None";

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  drawRoundRect(ctx, leftX, 294, leftW, 62, 10, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("COMMAND ALIASES", leftX + 16, 314);

  ctx.fillStyle = "#ced6e0";
  ctx.font = `13px monospace, ${FONT_FAMILY}`;
  ctx.fillText(truncateText(ctx, aliases, leftW - 32), leftX + 16, 337);

  // 4. Permissions Box
  const botPerms = cmd.botPermissions?.length > 0 ? cmd.botPermissions.join(", ") : "SendMessages";
  const userPerms = cmd.userPermissions?.length > 0 ? cmd.userPermissions.join(", ") : "None";

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  drawRoundRect(ctx, leftX, 370, leftW, 64, 10, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("REQUIRED PERMISSIONS", leftX + 16, 392);

  ctx.fillStyle = "#a4b0be";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(`Bot: ${botPerms}   •   User: ${userPerms}`, leftX + 16, 415);

  // ── Right Column (Examples & Live Execution) ─────────────────
  const rightX = leftX + leftW + 18;
  const rightW = baseW - rightX - 36;

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  drawRoundRect(ctx, rightX, 120, rightW, 314, 12, true, true);

  ctx.fillStyle = "#ff4757";
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillText("EXAMPLES & EXECUTION", rightX + 18, 146);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(rightX + 18, 158, rightW - 36, 1);

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
    drawRoundRect(ctx, rightX + 18, currY - 18, rightW - 36, 36, 6, true, false);

    ctx.fillStyle = "#ff2a55";
    ctx.font = `bold 12px monospace`;
    ctx.fillText(`0${idx + 1}`, rightX + 28, currY + 5);

    ctx.fillStyle = "#ffffff";
    ctx.font = `13px monospace, ${FONT_FAMILY}`;
    const exText = ex.startsWith(prefix) ? ex : `${prefix}${ex}`;
    ctx.fillText(truncateText(ctx, exText, rightW - 85), rightX + 58, currY + 5);

    currY += 46;
  });

  // ── Footer Bar ──────────────────────────────────────────────
  const footerY = baseH - 46;
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  drawRoundRect(ctx, 36, footerY, baseW - 72, 30, 6, true, false);

  ctx.fillStyle = "rgba(164, 176, 190, 0.75)";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(
    `» Astrix Multi-Purpose Engine • Use action buttons below to return to the category list or view slash info`,
    48,
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
