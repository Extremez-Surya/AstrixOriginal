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
    path.join(__dirname, "../assets/help_anime.jpg"),
    path.join(__dirname, "../assets/help_bg.png"),
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
 * Draws common cinematic monochrome dark gradient backdrop (Black, White & Grey)
 */
function drawCinematicBackdrop(ctx, baseW, baseH) {
  // 1. Deep Obsidian to Charcoal & Slate Grey Gradient
  const baseGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
  baseGrad.addColorStop(0, "#08090c");
  baseGrad.addColorStop(0.3, "#0e1117");
  baseGrad.addColorStop(0.65, "#141722");
  baseGrad.addColorStop(1, "#07080a");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // 2. Ambient Platinum & Silver Specular Blooms (Soft Lighting Sheen)
  const topGlow = ctx.createRadialGradient(baseW * 0.22, 0, 10, baseW * 0.22, 0, 480);
  topGlow.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  topGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
  topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, baseW, baseH);

  const bottomGlow = ctx.createRadialGradient(baseW * 0.82, baseH, 10, baseW * 0.82, baseH, 420);
  bottomGlow.addColorStop(0, "rgba(255, 255, 255, 0.04)");
  bottomGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 0, baseW, baseH);

  // 3. Diagonal Specular Lighting Beam
  const beamX = baseW * 0.48;
  const beamGrad = ctx.createLinearGradient(beamX - 180, 0, beamX + 180, 0);
  beamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  beamGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.025)");
  beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = beamGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // 4. Clean Carbon Micro-Grid
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  const gridSize = 24;
  for (let x = 0; x < baseW; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, baseH);
    ctx.stroke();
  }
  for (let y = 0; y < baseH; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(baseW, y);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Outer Frame & Hairline Borders
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 12, 12, baseW - 24, baseH - 24, 20, false, true);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, 14, 14, baseW - 28, baseH - 28, 18, false, true);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. GENERATE MAIN HELP CARD (Ultra-Aesthetic Dynamic Home Overview)
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

  const cacheKey = `main_${prefix}_${totalCommands}_${totalCategories}_${guild?.id || "dm"}`;
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
  ctx.roundRect(0, 0, baseW, baseH, 20);
  ctx.clip();

  // Draw clean monochrome Black, White & Grey Backdrop
  drawCinematicBackdrop(ctx, baseW, baseH);

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
  const avatarSize = 60;
  const avatarX = 36;

  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, headY, avatarSize, avatarSize);
    ctx.restore();
  } else {
    // Elegant Monogram Fallback
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, headY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#121620";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", avatarX + avatarSize / 2, headY + avatarSize / 2);
    ctx.restore();
  }

  const textX = avatarX + avatarSize + 16;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 26px ${FONT_FAMILY}`;
  ctx.fillText("ASTRIX COMMAND CENTER", textX, headY + 24);

  // Verified Badge next to title
  const titleW = ctx.measureText("ASTRIX COMMAND CENTER").width;
  const badgeX = textX + titleW + 12;
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, badgeX, headY + 7, 76, 20, 5, true, true);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillText("✓ VERIFIED", badgeX + 8, headY + 21);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("DISCORD SECURITY, MODERATION & HIGH-FIDELITY AUDIO SUITE", textX, headY + 42);

  ctx.fillStyle = "#64748b";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText("Engineered for low latency, autonomous guild protection and seamless server management.", textX, headY + 58);

  // Status Pill on top right
  const statusW = 142;
  const statusH = 32;
  const statusPillX = baseW - 36 - statusW;
  const statusPillY = headY + 12;

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, statusPillX, statusPillY, statusW, statusH, 16, true, true);

  ctx.beginPath();
  ctx.arc(statusPillX + 16, statusPillY + statusH / 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#10b981";
  ctx.shadowColor = "#10b981";
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#10b981";
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillText("SYSTEM ACTIVE", statusPillX + 28, statusPillY + 20);

  // ── Stats Row (4 Glassmorphic Metrics Cards) ─────────────────
  const statY = 104;
  const statW = (baseW - 72 - 36) / 4; // ~218px
  const statH = 72;
  const statGap = 12;

  const statsData = [
    { label: "GUILD PREFIX", val: `${prefix}`, sub: "Server Custom" },
    { label: "ALL COMMANDS", val: `${totalCommands}`, sub: "Active & Ready" },
    { label: "SYSTEM MODULES", val: `${totalCategories}`, sub: "Organized Suites" },
    { label: "GATEWAY PING", val: `${latency}ms`, sub: "Global Latency" },
  ];

  statsData.forEach((st, idx) => {
    const x = 36 + idx * (statW + statGap);

    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, statY, statW, statH, 12, true, true);

    // Accent top hairline
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(x + 14, statY, statW - 28, 1);

    // Label
    ctx.fillStyle = "#94a3b8";
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillText(`// ${st.label}`, x + 16, statY + 20);

    // Value
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 22px ${FONT_FAMILY}`;
    ctx.fillText(st.val, x + 16, statY + 46);

    // Subtitle
    ctx.fillStyle = "#64748b";
    ctx.font = `11px ${FONT_FAMILY}`;
    ctx.fillText(st.sub, x + 16, statY + 62);
  });

  // ── Central Feature UI (2 Modern Panels, NO redundant categories) ──
  const panelY = 192;
  const panelH = 320;
  const panelW = (baseW - 72 - 16) / 2; // 456px

  // ── LEFT PANEL: Core System Capabilities ─────────────────────
  const leftX = 36;
  ctx.fillStyle = "rgba(14, 18, 26, 0.75)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, leftX, panelY, panelW, panelH, 14, true, true);

  // Panel Header
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  drawRoundRect(ctx, leftX + 18, panelY + 18, 3, 16, 2, true, false);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillText("CORE SYSTEM CAPABILITIES", leftX + 28, panelY + 31);

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fillRect(leftX + 18, panelY + 44, panelW - 36, 1);

  const capabilities = [
    {
      badge: "SEC",
      title: "Autonomous Security & Antinuke",
      desc: "Real-time whitelist, anti-bot, anti-ban, channel/role protection.",
    },
    {
      badge: "MOD",
      title: "Advanced Moderation Engine",
      desc: "Multi-purge, timed bans, mute, lock, warns and automod filters.",
    },
    {
      badge: "AUD",
      title: "Lossless 4K Audio Experience",
      desc: "High-bitrate music playback, custom audio filters & live lyrics.",
    },
    {
      badge: "UTL",
      title: "Full Automation & Utilities",
      desc: "Custom welcome cards, tickets, leveling, giveaways & role managers.",
    },
  ];

  capabilities.forEach((cap, idx) => {
    const rowY = panelY + 56 + idx * 64;

    // Mini Pill Badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, leftX + 18, rowY + 4, 38, 22, 6, true, true);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = `bold 10px monospace, ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.fillText(cap.badge, leftX + 18 + 19, rowY + 19);
    ctx.textAlign = "left";

    // Feature Title
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillText(cap.title, leftX + 66, rowY + 16);

    // Feature Desc
    ctx.fillStyle = "#94a3b8";
    ctx.font = `11.5px ${FONT_FAMILY}`;
    ctx.fillText(truncateText(ctx, cap.desc, panelW - 84), leftX + 66, rowY + 32);

    if (idx < capabilities.length - 1) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
      ctx.fillRect(leftX + 24, rowY + 48, panelW - 48, 1);
    }
  });

  // ── RIGHT PANEL: Navigation & Quick Start Guide ──────────────
  const rightX = leftX + panelW + 16;
  ctx.fillStyle = "rgba(14, 18, 26, 0.75)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, rightX, panelY, panelW, panelH, 14, true, true);

  // Panel Header
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  drawRoundRect(ctx, rightX + 18, panelY + 18, 3, 16, 2, true, false);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillText("QUICK NAVIGATION & SHORTCUTS", rightX + 28, panelY + 31);

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fillRect(rightX + 18, panelY + 44, panelW - 36, 1);

  const steps = [
    {
      num: "01",
      title: "Select A Module Category",
      desc: "Open the dropdown below to view all commands in any module.",
    },
    {
      num: "02",
      title: "Inspect Syntax & Examples",
      desc: "Pick any command to inspect required arguments & usage permissions.",
    },
    {
      num: "03",
      title: "Prefix & Slash Commands",
      desc: `Execute directly with prefix (${prefix}command) or slash command (/).`,
    },
  ];

  steps.forEach((step, idx) => {
    const rowY = panelY + 56 + idx * 64;

    // Step Number Badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, rightX + 18, rowY + 4, 32, 22, 6, true, true);

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 11px monospace, ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.fillText(step.num, rightX + 18 + 16, rowY + 19);
    ctx.textAlign = "left";

    // Step Title
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillText(step.title, rightX + 60, rowY + 16);

    // Step Desc
    ctx.fillStyle = "#94a3b8";
    ctx.font = `11.5px ${FONT_FAMILY}`;
    ctx.fillText(truncateText(ctx, step.desc, panelW - 78), rightX + 60, rowY + 32);

    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.fillRect(rightX + 24, rowY + 48, panelW - 48, 1);
  });

  // Bottom Tip Card inside right panel
  const tipY = panelY + 252;
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, rightX + 18, tipY, panelW - 36, 48, 8, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillText("» QUICK LOOKUP SHORTCUT", rightX + 30, tipY + 19);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillText(`Type ${prefix}help <command> in chat for instant documentation.`, rightX + 30, tipY + 35);

  // ── Bottom Instruction Bar ──────────────────────────────────
  const footerY = baseH - 42;
  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, 36, footerY, baseW - 72, 30, 8, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillText("» QUICK INSTRUCTION:", 48, footerY + 19);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillText(
    "Select any module from the dropdown menus below to view all commands & permissions",
    180,
    footerY + 19
  );

  ctx.fillStyle = "#64748b";
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.textAlign = "right";
  ctx.fillText("ASTRIXCODE™ 2026", baseW - 48, footerY + 19);
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
  const baseH = 580;
  const scale = 1.5; // High-DPI optimized (1500 x 870)
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
  drawCinematicBackdrop(ctx, baseW, baseH);

  // ── Header Box ──────────────────────────────────────────────
  const headY = 24;
  const headH = 68;

  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.2;
  drawRoundRect(ctx, 36, headY, baseW - 72, headH, 14, true, true);

  // Subtle top accent line
  const accentGrad = ctx.createLinearGradient(36, 0, baseW - 36, 0);
  accentGrad.addColorStop(0, "rgba(255, 255, 255, 0.6)");
  accentGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  accentGrad.addColorStop(1, "rgba(255, 255, 255, 0.02)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(36, headY + headH - 2, baseW - 72, 2);

  // Title & Subtitle with clean tech symbol
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 25px ${FONT_FAMILY}`;
  ctx.fillText(`»  ${categoryName.toUpperCase()} MODULE`, 54, headY + 33);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `13px ${FONT_FAMILY}`;
  ctx.fillText(`Explore all available commands, aliases and syntax options in this category.`, 54, headY + 54);

  // Badges on Header Right
  const badgeText = `${commands.length} Commands`;
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  const badgeW = ctx.measureText(badgeText).width + 24;
  const badgeX = baseW - 54 - badgeW;

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, badgeX, headY + 18, badgeW, 32, 8, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.fillText(badgeText, badgeX + 12, headY + 39);

  if (totalPages > 1) {
    const pageBadgeText = `Page ${page + 1}/${totalPages}`;
    const pageBadgeW = ctx.measureText(pageBadgeText).width + 20;
    const pageBadgeX = badgeX - pageBadgeW - 10;

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, pageBadgeX, headY + 18, pageBadgeW, 32, 8, true, true);

    ctx.fillStyle = "#ced6e0";
    ctx.fillText(pageBadgeText, pageBadgeX + 10, headY + 39);
  }

  // ── High-Legibility Command Grid (3 Columns × 6 Rows = 18 per page) ──
  const cols = 3;
  const startX = 36;
  const startY = headY + headH + 16;
  const gapX = 14;
  const gapY = 12;
  const cardW = (baseW - 72 - gapX * (cols - 1)) / cols; // (1000 - 72 - 28) / 3 = 300px
  const cardH = 54;
  const pageSize = 18;

  const pageCmds = commands.slice(page * pageSize, (page + 1) * pageSize);

  pageCmds.forEach((cmd, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    const primaryName = cmd.alias?.[0] || cmd.name;

    // Command Item Glass Card Background
    ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, y, cardW, cardH, 10, true, true);

    // Subtle top inner gloss
    const cardGloss = ctx.createLinearGradient(x, y, x, y + cardH);
    cardGloss.addColorStop(0, "rgba(255, 255, 255, 0.06)");
    cardGloss.addColorStop(1, "rgba(255, 255, 255, 0.01)");
    ctx.fillStyle = cardGloss;
    drawRoundRect(ctx, x, y, cardW, cardH, 10, true, false);

    // Left silver accent bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    drawRoundRect(ctx, x + 8, y + 12, 3, cardH - 24, 1.5, true, false);

    // Command Name: Noticeably larger, bold and clear (16px bold)
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 16px ${FONT_FAMILY}`;
    const nameText = `${prefix}${primaryName}`;
    ctx.fillText(truncateText(ctx, nameText, 250), x + 20, y + 23);

    // Snippet description: Larger, crisp silver tone (12.5px)
    const rawDesc = cmd.desc || cmd.description || "Command syntax & usage details";
    ctx.fillStyle = "#94a3b8";
    ctx.font = `12.5px ${FONT_FAMILY}`;
    const descText = truncateText(ctx, rawDesc, cardW - 32);
    ctx.fillText(descText, x + 20, y + 43);
  });

  // ── Footer Bar ──────────────────────────────────────────────
  const footerY = baseH - 42;
  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, 36, footerY, baseW - 72, 30, 8, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillText("» QUICK HINT:", 48, footerY + 19);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillText(
    "Select any command from the dropdown below to view syntax, permissions & examples",
    140,
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
  const scale = 1.5; // High-DPI optimized
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Clip Container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, baseW, baseH, 20);
  ctx.clip();

  // Backdrop
  drawCinematicBackdrop(ctx, baseW, baseH);

  // ── Header Box ──────────────────────────────────────────────
  const headY = 26;
  const headH = 70;

  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  drawRoundRect(ctx, 36, headY, baseW - 72, headH, 14, true, true);

  const accentGrad = ctx.createLinearGradient(36, 0, baseW - 36, 0);
  accentGrad.addColorStop(0, "rgba(255, 255, 255, 0.6)");
  accentGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  accentGrad.addColorStop(1, "rgba(255, 255, 255, 0.02)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(36, headY + headH - 2, baseW - 72, 2);

  // Command Title
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 25px ${FONT_FAMILY}`;
  ctx.fillText(`»  COMMAND DETAILS ── ${prefix}${primaryName}`, 54, headY + 34);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(`Full configuration, syntax execution, and permission documentation.`, 54, headY + 54);

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
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  drawRoundRect(ctx, catX, headY + 18, catW, 32, 8, true, true);
  ctx.fillStyle = "#ced6e0";
  ctx.fillText(catBadgeText, catX + 12, headY + 39);

  // Draw Cooldown Badge
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  drawRoundRect(ctx, cdX, headY + 18, cdW, 32, 8, true, true);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(cdBadgeText, cdX + 12, headY + 39);

  // ── Left Column (Main Specs) ─────────────────────────────────
  const leftX = 36;
  const leftW = 510;

  // 1. Description Box (Multi-line wrap support)
  const desc = cmd.desc || cmd.description || "Executes command functionality.";
  ctx.font = `14px ${FONT_FAMILY}`;
  const descLines = wrapText(ctx, desc, leftW - 32, 2);

  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, leftX, 116, leftW, 76, 10, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("DESCRIPTION", leftX + 16, 136);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `13.5px ${FONT_FAMILY}`;
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

  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, leftX, 206, leftW, 70, 10, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("USAGE SYNTAX", leftX + 16, 228);

  ctx.fillStyle = "#10b981";
  ctx.font = `bold 15px monospace, ${FONT_FAMILY}`;
  ctx.fillText(`${prefix}${usage}`, leftX + 16, 254);

  // 3. Aliases Box
  const aliases =
    cmd.alias && cmd.alias.length > 1
      ? cmd.alias.filter((a) => a.toLowerCase() !== primaryName.toLowerCase()).map((a) => `${prefix}${a}`).join(", ")
      : "None";

  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, leftX, 290, leftW, 62, 10, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("COMMAND ALIASES", leftX + 16, 310);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `13px monospace, ${FONT_FAMILY}`;
  ctx.fillText(truncateText(ctx, aliases, leftW - 32), leftX + 16, 333);

  // 4. Permissions Box
  const botPerms = cmd.botPermissions?.length > 0 ? cmd.botPermissions.join(", ") : "SendMessages";
  const userPerms = cmd.userPermissions?.length > 0 ? cmd.userPermissions.join(", ") : "None";

  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, leftX, 366, leftW, 64, 10, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("REQUIRED PERMISSIONS", leftX + 16, 388);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(`Bot: ${botPerms}   •   User: ${userPerms}`, leftX + 16, 411);

  // ── Right Column (Examples & Live Execution) ─────────────────
  const rightX = leftX + leftW + 18;
  const rightW = baseW - rightX - 36;

  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, rightX, 116, rightW, 314, 12, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillText("EXAMPLES & EXECUTION", rightX + 18, 142);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
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
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    drawRoundRect(ctx, rightX + 18, currY - 18, rightW - 36, 36, 6, true, true);

    ctx.fillStyle = "#94a3b8";
    ctx.font = `bold 12px monospace`;
    ctx.fillText(`0${idx + 1}`, rightX + 28, currY + 5);

    ctx.fillStyle = "#ffffff";
    ctx.font = `13px monospace, ${FONT_FAMILY}`;
    const exText = ex.startsWith(prefix) ? ex : `${prefix}${ex}`;
    ctx.fillText(truncateText(ctx, exText, rightW - 85), rightX + 58, currY + 5);

    currY += 46;
  });

  // ── Footer Bar ──────────────────────────────────────────────
  const footerY = baseH - 42;
  ctx.fillStyle = "rgba(14, 18, 26, 0.78)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundRect(ctx, 36, footerY, baseW - 72, 30, 8, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillText("» INFORMATION:", 48, footerY + 19);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillText(
    "Astrix Multi-Purpose Engine • Use action buttons below to return to the category list or view slash info",
    150,
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
