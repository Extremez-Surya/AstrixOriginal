const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const path = require("path");
const fs = require("fs");

// Register GoogleSans for clean modern technical typography
const fontPath = path.join(__dirname, "../fonts/GoogleSans.ttf");
if (fs.existsSync(fontPath)) {
  try {
    GlobalFonts.registerFromPath(fontPath, "GoogleSans");
  } catch (_) {}
}

// Register Segoe UI Emoji on Windows for colored emojis
if (fs.existsSync("C:/Windows/Fonts/seguiemj.ttf")) {
  try {
    GlobalFonts.registerFromPath("C:/Windows/Fonts/seguiemj.ttf", "SegoeUIEmoji");
  } catch (_) {}
}

const FONT_FAMILY = "GoogleSans, SegoeUIEmoji, 'Segoe UI', 'Segoe UI Emoji', Arial, sans-serif";

/**
 * Draws rounded rectangle helper
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
  let str = String(text);
  while (str.length > 0 && ctx.measureText(str + "...").width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str.trim() + "...";
}

/**
 * Wraps text into multiple lines given a max width and max lines
 */
function wrapText(ctx, text, maxWidth, maxLines = 3) {
  if (!text) return [];
  const words = String(text).split(" ");
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
      if (lines.length >= maxLines - 1) break;
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
 * Selects best display name avoiding unrenderable symbols
 */
function getBestDisplayName(user) {
  const global = user.globalName || user.global_name;
  if (!global) return user.username || "Developer";
  const printableAscii = global.replace(/[^\x20-\x7E]/g, "").trim();
  if (printableAscii.length >= 2) {
    return global;
  }
  return user.username || global;
}

/**
 * Draws common titanium carbon brushed backdrop
 */
function drawTitaniumBackdrop(ctx, baseW, baseH) {
  // 1. Sleek Titanium Carbon Backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
  bgGrad.addColorStop(0, "#080b0f");
  bgGrad.addColorStop(0.35, "#10161d");
  bgGrad.addColorStop(0.55, "#161e27");
  bgGrad.addColorStop(0.8, "#0d1319");
  bgGrad.addColorStop(1, "#070a0e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // 2. Brushed Metal Specular Sheen (Central diagonal beam)
  const sheen = ctx.createLinearGradient(baseW * 0.35, 0, baseW * 0.65, baseH);
  sheen.addColorStop(0, "rgba(255, 255, 255, 0)");
  sheen.addColorStop(0.45, "rgba(255, 255, 255, 0.04)");
  sheen.addColorStop(0.55, "rgba(255, 255, 255, 0.08)");
  sheen.addColorStop(0.65, "rgba(255, 255, 255, 0.04)");
  sheen.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, baseW, baseH);

  // 3. Diagonal Woven Carbon Mesh Texture
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
  ctx.lineWidth = 1;
  const meshSpacing = 28;
  for (let x = -baseH; x < baseW + baseH; x += meshSpacing) {
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

  // 4. Outer Subtle Border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  drawRoundRect(ctx, 16, 16, baseW - 32, baseH - 32, 16, false, true);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VIEW 1: Team Overview (Panoramic 5-Slot Board)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function generateDeveloperBoard(teamMembers = [], options = {}) {
  const baseW = 1320;
  const baseH = 600;
  const scale = 1.5; // High-DPI 1980 x 900
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const page = options.page || 0;
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(teamMembers.length / pageSize));
  const pageMembers = teamMembers.slice(page * pageSize, (page + 1) * pageSize);

  drawTitaniumBackdrop(ctx, baseW, baseH);

  // ── Header Section ──────────────────────────────────────────
  const headX = 45;
  const headY = 48;

  // "ASTRIX" Big Bold Title
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 38px ${FONT_FAMILY}`;
  ctx.fillText("ASTRIX", headX, headY + 32);

  const brandW = ctx.measureText("ASTRIX").width;

  // "DEVELOPMENT TEAM"
  ctx.fillStyle = "#e2e8f0";
  ctx.font = `bold 24px ${FONT_FAMILY}`;
  ctx.fillText("DEVELOPMENT TEAM", headX + brandW + 14, headY + 31);

  // "THE PEOPLE BEHIND THE BOT"
  ctx.fillStyle = "#94a3b8";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("THE PEOPLE BEHIND THE BOT", headX, headY + 54);

  // Full-width Divider Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(headX, headY + 68);
  ctx.lineTo(baseW - headX, headY + 68);
  ctx.stroke();

  // ── 5 Cards Grid Section ────────────────────────────────────
  const cardsStartY = headY + 84;
  const marginX = 45;
  const cardGap = 16;
  const availableWidth = baseW - marginX * 2 - cardGap * (pageSize - 1);
  const cardW = availableWidth / pageSize; // ~233px
  const cardH = 390;

  for (let idx = 0; idx < pageSize; idx++) {
    const cardX = marginX + idx * (cardW + cardGap);
    const cardY = cardsStartY;
    const member = pageMembers[idx] || null;
    const globalIdx = page * pageSize + idx + 1;
    const slotNum = globalIdx < 10 ? `0${globalIdx}` : `${globalIdx}`;

    // Card Glass Background
    ctx.save();
    ctx.fillStyle = "rgba(10, 16, 22, 0.88)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, cardX, cardY, cardW, cardH, 18, true, true);

    // Subtle inner top gloss
    const cardGloss = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH * 0.4);
    cardGloss.addColorStop(0, "rgba(255, 255, 255, 0.05)");
    cardGloss.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = cardGloss;
    drawRoundRect(ctx, cardX, cardY, cardW, cardH * 0.4, 18, true, false);

    if (member) {
      // 1. Slot Number (Top Left)
      ctx.fillStyle = "#94a3b8";
      ctx.font = `bold 12px monospace, ${FONT_FAMILY}`;
      ctx.fillText(slotNum, cardX + 16, cardY + 26);

      // 2. Status Dot (Top Right)
      const status = (member.status || "offline").toLowerCase();
      let statusColor = "#64748b"; // offline
      let statusLabel = "OFFLINE";
      if (status === "online") {
        statusColor = "#10b981";
        statusLabel = "ONLINE";
      } else if (status === "idle") {
        statusColor = "#f59e0b";
        statusLabel = "IDLE";
      } else if (status === "dnd") {
        statusColor = "#ef4444";
        statusLabel = "DND";
      }

      ctx.beginPath();
      ctx.arc(cardX + cardW - 20, cardY + 22, 5, 0, Math.PI * 2);
      ctx.fillStyle = statusColor;
      ctx.shadowColor = statusColor;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Member Avatar (Centered Circle with silver ring)
      const avRadius = 48;
      const avCenterX = cardX + cardW / 2;
      const avCenterY = cardY + 88;

      ctx.save();
      // Outer ring
      ctx.beginPath();
      ctx.arc(avCenterX, avCenterY, avRadius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(avCenterX, avCenterY, avRadius, 0, Math.PI * 2);
      ctx.clip();

      if (member.avatarImg) {
        ctx.drawImage(member.avatarImg, avCenterX - avRadius, avCenterY - avRadius, avRadius * 2, avRadius * 2);
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(avCenterX - avRadius, avCenterY - avRadius, avRadius * 2, avRadius * 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold 28px ${FONT_FAMILY}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const initial = (member.displayName || member.username || "D")[0].toUpperCase();
        ctx.fillText(initial, avCenterX, avCenterY);
      }
      ctx.restore();

      // 4. Member Display Name
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 16.5px ${FONT_FAMILY}`;
      const nameText = getBestDisplayName(member);
      ctx.fillText(truncateText(ctx, nameText, cardW - 32), cardX + 16, cardY + 162);

      // 5. Member Role / Badges
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `bold 11px ${FONT_FAMILY}`;
      const roleText = member.role || "Developer";
      ctx.fillText(truncateText(ctx, roleText, cardW - 32), cardX + 16, cardY + 180);

      // 6. Status Text
      ctx.fillStyle = statusColor;
      ctx.font = `bold 9.5px ${FONT_FAMILY}`;
      ctx.fillText(statusLabel, cardX + 16, cardY + 196);

      // 7. Divider Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 16, cardY + 208);
      ctx.lineTo(cardX + cardW - 16, cardY + 208);
      ctx.stroke();

      // 8. BIO Section
      ctx.fillStyle = "#64748b";
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillText("BIO", cardX + 16, cardY + 226);

      const bioText = member.bio || "No bio set.";
      ctx.fillStyle = "#94a3b8";
      ctx.font = `11.5px ${FONT_FAMILY}`;
      const bioLines = wrapText(ctx, bioText, cardW - 32, 4);
      bioLines.forEach((line, lIdx) => {
        ctx.fillText(line, cardX + 16, cardY + 244 + lIdx * 17);
      });

      // 9. Bottom Signoff Signature
      ctx.fillStyle = "#cbd5e1";
      ctx.font = `11.5px ${FONT_FAMILY}`;
      ctx.fillText(`— ${truncateText(ctx, nameText, cardW - 40)}`, cardX + 16, cardY + cardH - 18);
    } else {
      // OPEN SLOT
      ctx.fillStyle = "#64748b";
      ctx.font = `bold 12px monospace, ${FONT_FAMILY}`;
      ctx.fillText(slotNum, cardX + 16, cardY + 26);

      ctx.fillStyle = "#64748b";
      ctx.font = `bold 16px ${FONT_FAMILY}`;
      ctx.textAlign = "center";
      ctx.fillText("OPEN SLOT", cardX + cardW / 2, cardY + cardH / 2);
      ctx.textAlign = "left";
    }

    ctx.restore();
  }

  // ── Footer Section ──────────────────────────────────────────
  const footY = baseH - 24;
  ctx.fillStyle = "#64748b";
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillText("ASTRIX • TEAM DIRECTORY", headX, footY);

  ctx.textAlign = "right";
  ctx.fillText(`PAGE ${page + 1} / ${totalPages}`, baseW - headX, footY);
  ctx.textAlign = "left";

  return canvas.toBuffer("image/png");
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VIEW 2: Team Details (Horizontal Member Capsules)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function generateDeveloperDetailsBoard(teamMembers = [], options = {}) {
  const baseW = 1320;
  const baseH = 600;
  const scale = 1.5;
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const page = options.page || 0;
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(teamMembers.length / pageSize));
  const pageMembers = teamMembers.slice(page * pageSize, (page + 1) * pageSize);

  drawTitaniumBackdrop(ctx, baseW, baseH);

  // ── Header Section ──────────────────────────────────────────
  const headX = 45;
  const headY = 48;

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 38px ${FONT_FAMILY}`;
  ctx.fillText("TEAM DETAILS", headX, headY + 32);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText("STATUS • ALL RANKS • BIOGRAPHY", headX, headY + 54);

  // Full-width Divider Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(headX, headY + 68);
  ctx.lineTo(baseW - headX, headY + 68);
  ctx.stroke();

  // ── Member Bars List ────────────────────────────────────────
  const listStartY = headY + 90;
  const barW = baseW - headX * 2; // 1230px
  const barH = 74;
  const barGap = 14;

  pageMembers.forEach((member, idx) => {
    const barY = listStartY + idx * (barH + barGap);

    // Bar Glass Background
    ctx.save();
    ctx.fillStyle = "rgba(10, 16, 22, 0.88)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, headX, barY, barW, barH, 14, true, true);

    // Subtle inner top gloss
    const gloss = ctx.createLinearGradient(headX, barY, headX, barY + barH * 0.5);
    gloss.addColorStop(0, "rgba(255, 255, 255, 0.04)");
    gloss.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gloss;
    drawRoundRect(ctx, headX, barY, barW, barH * 0.5, 14, true, false);

    // Left Accent indicator
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    drawRoundRect(ctx, headX + 12, barY + 16, 3, barH - 32, 1.5, true, false);

    // Member Avatar
    const avRadius = 24;
    const avX = headX + 48;
    const avY = barY + barH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avX, avY, avRadius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avX, avY, avRadius, 0, Math.PI * 2);
    ctx.clip();
    if (member.avatarImg) {
      ctx.drawImage(member.avatarImg, avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 16px ${FONT_FAMILY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((member.displayName || "D")[0], avX, avY);
    }
    ctx.restore();

    // Member Name
    const nameX = avX + avRadius + 18;
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 17px ${FONT_FAMILY}`;
    const nameStr = getBestDisplayName(member);
    ctx.fillText(truncateText(ctx, nameStr, 220), nameX, barY + 33);

    // Bio
    ctx.fillStyle = "#94a3b8";
    ctx.font = `12px ${FONT_FAMILY}`;
    const bioStr = member.bio || "No bio set.";
    ctx.fillText(truncateText(ctx, bioStr, 240), nameX, barY + 53);

    // Center Section: All Ranks / Roles
    const roleX = headX + 400;
    ctx.fillStyle = "#cbd5e1";
    ctx.font = `bold 13.5px ${FONT_FAMILY}`;
    const roleStr = member.role || "Developer";
    ctx.fillText(truncateText(ctx, roleStr, 480), roleX, barY + 42);

    // Right Section: Status Pill Badge
    const status = (member.status || "offline").toLowerCase();
    let statusColor = "#64748b";
    let statusLabel = "OFFLINE";
    if (status === "online") {
      statusColor = "#10b981";
      statusLabel = "ONLINE";
    } else if (status === "idle") {
      statusColor = "#f59e0b";
      statusLabel = "IDLE";
    } else if (status === "dnd") {
      statusColor = "#ef4444";
      statusLabel = "DND";
    }

    const pillW = 100;
    const pillH = 30;
    const pillX = headX + barW - pillW - 20;
    const pillY = barY + (barH - pillH) / 2;

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1;
    drawRoundRect(ctx, pillX, pillY, pillW, pillH, 8, true, true);

    // Glowing Dot
    ctx.beginPath();
    ctx.arc(pillX + 16, pillY + pillH / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.shadowColor = statusColor;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Status Label Text
    ctx.fillStyle = statusColor;
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillText(statusLabel, pillX + 28, pillY + 19);

    ctx.restore();
  });

  // ── Footer ──────────────────────────────────────────────────
  const footY = baseH - 24;
  ctx.fillStyle = "#64748b";
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillText("ASTRIX • TEAM DIRECTORY", headX, footY);

  ctx.textAlign = "right";
  ctx.fillText(`PAGE ${page + 1} / ${totalPages}`, baseW - headX, footY);
  ctx.textAlign = "left";

  return canvas.toBuffer("image/png");
}

module.exports = {
  generateDeveloperBoard,
  generateDeveloperDetailsBoard,
  getBestDisplayName,
};
