const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const path = require("path");
const fs = require("fs");

// Register Sekuya-Regular font
const sekuyaFontPath = path.join(__dirname, "../fonts/Sekuya-Regular.ttf");
if (fs.existsSync(sekuyaFontPath)) {
  try {
    GlobalFonts.registerFromPath(sekuyaFontPath, "Sekuya");
  } catch (_) {}
}

// Register DancingScript font
const dancingFontPath = path.join(__dirname, "../fonts/DancingScript-VariableFont_wght.ttf");
if (fs.existsSync(dancingFontPath)) {
  try {
    GlobalFonts.registerFromPath(dancingFontPath, "Dancing");
  } catch (_) {}
}

const CANVAS_TEMPLATES = {
  emerald: {
    name: "Emerald (Default)",
    gradient: ["#07120a", "#0e2416", "#050e07"],
    accent: "#22c55e",
    text: "#ffffff",
    subText: "#a3e635",
    watermark: "rgba(255, 255, 255, 0.04)",
  },
  cyberpunk: {
    name: "Cyberpunk Neon",
    gradient: ["#0b091a", "#161133", "#090314"],
    accent: "#00f0ff",
    text: "#ff0055",
    subText: "#00f0ff",
    watermark: "rgba(0, 240, 255, 0.06)",
  },
  crimson: {
    name: "Crimson Blaze",
    gradient: ["#1a0505", "#330d0d", "#120202"],
    accent: "#ef4444",
    text: "#f97316",
    subText: "#fde047",
    watermark: "rgba(239, 68, 68, 0.06)",
  },
  midnight: {
    name: "Midnight Purple",
    gradient: ["#0f091f", "#1d113a", "#080414"],
    accent: "#a855f7",
    text: "#ec4899",
    subText: "#c084fc",
    watermark: "rgba(168, 85, 247, 0.06)",
  },
  sunset: {
    name: "Sunset Horizon",
    gradient: ["#1f0b16", "#3b1028", "#14050d"],
    accent: "#f97316",
    text: "#f43f5e",
    subText: "#fbbf24",
    watermark: "rgba(249, 115, 22, 0.06)",
  },
  frost: {
    name: "Frostbite Blue",
    gradient: ["#06131e", "#0c2538", "#040b12"],
    accent: "#38bdf8",
    text: "#f8fafc",
    subText: "#7dd3fc",
    watermark: "rgba(56, 189, 248, 0.06)",
  },
  gold: {
    name: "Luxury Gold",
    gradient: ["#1c1504", "#382a08", "#120d02"],
    accent: "#eab308",
    text: "#fef08a",
    subText: "#f59e0b",
    watermark: "rgba(234, 179, 8, 0.06)",
  },
  sakura: {
    name: "Sakura Blossom",
    gradient: ["#1f0c18", "#36162a", "#140710"],
    accent: "#f472b6",
    text: "#fbcfe8",
    subText: "#fb7185",
    watermark: "rgba(244, 114, 182, 0.06)",
  },
  monochrome: {
    name: "Obsidian Monochrome",
    gradient: ["#0f172a", "#1e293b", "#020617"],
    accent: "#cbd5e1",
    text: "#ffffff",
    subText: "#94a3b8",
    watermark: "rgba(255, 255, 255, 0.06)",
  },
  toxic: {
    name: "Toxic Neon",
    gradient: ["#0c1a05", "#16330a", "#060d02"],
    accent: "#84cc16",
    text: "#d946ef",
    subText: "#a3e635",
    watermark: "rgba(132, 204, 22, 0.06)",
  },
};

/**
 * Safely fetches and loads an image from URL without throwing unhandled exceptions
 */
async function safeLoadImage(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const cleanUrl = url.trim().replace(/^<|>$/g, "");
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) return null;

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });
    if (!response.ok) {
      console.error(`[safeLoadImage] Failed to fetch image (${response.status}): ${cleanUrl}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return await loadImage(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error(`[safeLoadImage] Error loading image from ${url}:`, err.message);
    return null;
  }
}

/**
 * Renders clipping path for avatar shape
 */
function clipAvatarPath(ctx, x, y, r, shape = "circle") {
  ctx.beginPath();
  if (shape === "square") {
    roundRect(ctx, x - r, y - r, r * 2, r * 2, 20);
  } else if (shape === "rounded") {
    roundRect(ctx, x - r, y - r, r * 2, r * 2, 45);
  } else if (shape === "hexagon") {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + r * Math.cos(angle);
      const hy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
  } else {
    // circle
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.closePath();
}

/**
 * Renders Welcome Canvas Banner with Template & Custom Colors
 */
async function generateWelcomeCard(member, options = {}) {
  const width = 1100;
  const height = 420;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const templateKey = options.canvasTemplate && CANVAS_TEMPLATES[options.canvasTemplate] ? options.canvasTemplate : "emerald";
  const tmpl = CANVAS_TEMPLATES[templateKey];

  const activeAccent = options.accentColor || tmpl.accent;
  const activeTextColor = options.textColor || tmpl.text;
  const activeSubTextColor = tmpl.subText;
  const avatarShape = options.avatarShape || "circle";

  // 1. Background (Custom image URL or Template gradient)
  let bgLoaded = false;
  if (options.canvasBgUrl || options.bgUrl) {
    const bgToLoad = options.canvasBgUrl || options.bgUrl;
    const customBg = await safeLoadImage(bgToLoad);
    if (customBg) {
      ctx.drawImage(customBg, 0, 0, width, height);
      bgLoaded = true;
    }
  }

  if (!bgLoaded) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, tmpl.gradient[0]);
    grad.addColorStop(0.5, tmpl.gradient[1]);
    grad.addColorStop(1, tmpl.gradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Black Opaque-to-Transparent Gradient Backdrop (Left Opaque Black -> Right Transparent)
  const fadeOverlay = ctx.createLinearGradient(0, 0, width, 0);
  fadeOverlay.addColorStop(0, "rgba(0, 0, 0, 0.92)");
  fadeOverlay.addColorStop(0.45, "rgba(0, 0, 0, 0.65)");
  fadeOverlay.addColorStop(0.75, "rgba(0, 0, 0, 0.25)");
  fadeOverlay.addColorStop(1, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = fadeOverlay;
  ctx.fillRect(0, 0, width, height);

  // Background Watermark
  const serverName = member.guild?.name || "Server";
  const cleanServerName = serverName.length > 22 ? serverName.slice(0, 22) + "..." : serverName;
  const watermarkText = options.customWatermark || cleanServerName.toUpperCase();

  ctx.save();
  ctx.fillStyle = tmpl.watermark;
  ctx.font = "900 110px Sekuya, sans-serif";
  ctx.fillText(watermarkText, 250, 260);
  ctx.restore();

  // 2. Glow Effects
  const glowGrad = ctx.createRadialGradient(850, 210, 20, 850, 210, 260);
  glowGrad.addColorStop(0, hexToRgba(activeAccent, 0.35));
  glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(850, 210, 260, 0, Math.PI * 2);
  ctx.fill();

  const textGlow = ctx.createRadialGradient(250, 180, 20, 250, 180, 300);
  textGlow.addColorStop(0, hexToRgba(activeAccent, 0.25));
  textGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = textGlow;
  ctx.beginPath();
  ctx.arc(250, 180, 300, 0, Math.PI * 2);
  ctx.fill();

  // 3. Top Left Server Badge
  const guildObj = member.guild || {};
  const guildIconUrl = typeof guildObj.iconURL === "function"
    ? guildObj.iconURL({ forceStatic: true, extension: "png", size: 128 })
    : null;

  const serverIconImg = await safeLoadImage(guildIconUrl);
  if (serverIconImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(70, 52, 22, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(serverIconImg, 48, 30, 44, 44);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(70, 52, 23, 0, Math.PI * 2);
    ctx.strokeStyle = activeAccent;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    drawFallbackIcon(ctx, 70, 52, 22, activeAccent);
  }

  // Server Name in Dancing font
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Dancing, cursive";
  ctx.fillText(cleanServerName, 105, 48);

  // Sub-tag in Dancing font
  ctx.fillStyle = activeSubTextColor;
  ctx.font = "18px Dancing, cursive";
  ctx.fillText("✦ Welcome System", 105, 68);

  // 4. Top Accent Line
  ctx.fillStyle = activeAccent;
  ctx.fillRect(45, 100, 620, 3);

  // 5. Main WELCOME Title
  ctx.shadowColor = activeAccent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = activeAccent;
  ctx.font = "900 72px Sekuya, sans-serif";
  ctx.fillText("WELCOME", 45, 180);
  ctx.shadowBlur = 0;

  // User Handle @username
  const userObj = member.user || member;
  const username = userObj.username || "member";
  ctx.fillStyle = activeTextColor;
  ctx.font = "bold 46px Dancing, cursive";
  const displayUser = `@${username.length > 18 ? username.slice(0, 18) + "..." : username}`;
  ctx.fillText(displayUser, 45, 235);

  // Subtitle "to Server Name"
  ctx.fillStyle = activeTextColor;
  ctx.font = "bold 28px Sekuya, sans-serif";
  ctx.fillText(`to ${cleanServerName}`, 45, 280);

  // Member Count
  ctx.fillStyle = "#94a3b8";
  ctx.font = "22px Dancing, cursive";
  const memberCount = guildObj.memberCount ? guildObj.memberCount.toLocaleString() : "1";
  ctx.fillText(`✦  You are member #${memberCount}`, 45, 320);

  // 6. Bottom Accent Line
  ctx.fillStyle = activeAccent;
  ctx.fillRect(45, 345, 620, 2);

  // 8. Right Side User Avatar with Avatar Shape
  const avatarUrl = typeof userObj.displayAvatarURL === "function"
    ? userObj.displayAvatarURL({ forceStatic: true, extension: "png", size: 512 })
    : null;

  const userAvatarImg = await safeLoadImage(avatarUrl);
  if (userAvatarImg) {
    ctx.save();
    clipAvatarPath(ctx, 850, 210, 115, avatarShape);
    ctx.clip();
    ctx.drawImage(userAvatarImg, 735, 95, 230, 230);
    ctx.restore();

    ctx.shadowColor = activeAccent;
    ctx.shadowBlur = 20;
    clipAvatarPath(ctx, 850, 210, 118, avatarShape);
    ctx.strokeStyle = activeAccent;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    drawFallbackAvatar(ctx, 850, 210, 115, activeAccent);
  }

  return canvas.toBuffer("image/png");
}

/**
 * Renders Crimson Goodbye Banner
 */
async function generateGoodbyeCard(member, options = {}) {
  const width = 1100;
  const height = 420;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  let bgLoaded = false;
  if (options.bgUrl) {
    const customBg = await safeLoadImage(options.bgUrl);
    if (customBg) {
      ctx.drawImage(customBg, 0, 0, width, height);
      bgLoaded = true;
    }
  }

  if (!bgLoaded) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#190812");
    grad.addColorStop(0.5, "#2b0a1a");
    grad.addColorStop(1, "#12050d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Black Opaque-to-Transparent Gradient Backdrop (Left Opaque Black -> Right Transparent)
  const fadeOverlay = ctx.createLinearGradient(0, 0, width, 0);
  fadeOverlay.addColorStop(0, "rgba(0, 0, 0, 0.92)");
  fadeOverlay.addColorStop(0.45, "rgba(0, 0, 0, 0.65)");
  fadeOverlay.addColorStop(0.75, "rgba(0, 0, 0, 0.25)");
  fadeOverlay.addColorStop(1, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = fadeOverlay;
  ctx.fillRect(0, 0, width, height);

  const serverName = member.guild?.name || "Server";
  const cleanServerName = serverName.length > 22 ? serverName.slice(0, 22) + "..." : serverName;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.font = "900 110px Sekuya, sans-serif";
  ctx.fillText(cleanServerName.toUpperCase(), 250, 260);
  ctx.restore();

  const glowGrad = ctx.createRadialGradient(850, 210, 20, 850, 210, 260);
  glowGrad.addColorStop(0, "rgba(225, 29, 72, 0.35)");
  glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(850, 210, 260, 0, Math.PI * 2);
  ctx.fill();

  const guildObj = member.guild || {};
  const guildIconUrl = typeof guildObj.iconURL === "function"
    ? guildObj.iconURL({ forceStatic: true, extension: "png", size: 128 })
    : null;

  const serverIconImg = await safeLoadImage(guildIconUrl);
  if (serverIconImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(70, 52, 22, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(serverIconImg, 48, 30, 44, 44);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(70, 52, 23, 0, Math.PI * 2);
    ctx.strokeStyle = "#e11d48";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    drawFallbackIcon(ctx, 70, 52, 22, "#e11d48");
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Dancing, cursive";
  ctx.fillText(cleanServerName, 105, 48);

  ctx.fillStyle = "#fda4af";
  ctx.font = "18px Dancing, cursive";
  ctx.fillText("✦ Goodbye System", 105, 68);

  ctx.fillStyle = "#e11d48";
  ctx.fillRect(45, 100, 620, 3);

  ctx.shadowColor = "#e11d48";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#e11d48";
  ctx.font = "900 72px Sekuya, sans-serif";
  ctx.fillText("GOODBYE", 45, 180);
  ctx.shadowBlur = 0;

  const userObj = member.user || member;
  const username = userObj.username || "member";
  ctx.fillStyle = "#e11d48";
  ctx.font = "bold 46px Dancing, cursive";
  const displayUser = `@${username.length > 18 ? username.slice(0, 18) + "..." : username}`;
  ctx.fillText(displayUser, 45, 235);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Sekuya, sans-serif";
  ctx.fillText(`left ${cleanServerName}`, 45, 280);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "22px Dancing, cursive";
  const memberCount = guildObj.memberCount ? guildObj.memberCount.toLocaleString() : "1";
  ctx.fillText(`✦  Remaining members: #${memberCount}`, 45, 320);

  ctx.fillStyle = "#e11d48";
  ctx.fillRect(45, 345, 620, 2);

  const avatarUrl = typeof userObj.displayAvatarURL === "function"
    ? userObj.displayAvatarURL({ forceStatic: true, extension: "png", size: 512 })
    : null;

  const userAvatarImg = await safeLoadImage(avatarUrl);
  if (userAvatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(850, 210, 115, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(userAvatarImg, 735, 95, 230, 230);
    ctx.restore();

    ctx.shadowColor = "#e11d48";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(850, 210, 118, 0, Math.PI * 2);
    ctx.strokeStyle = "#e11d48";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    drawFallbackAvatar(ctx, 850, 210, 115, "#e11d48");
  }

  return canvas.toBuffer("image/png");
}

function roundRect(ctx, x, y, width, height, radius) {
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
}

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== "string") return `rgba(34, 197, 94, ${alpha})`;
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(34, 197, 94, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawFallbackIcon(ctx, x, y, r, color) {
  ctx.fillStyle = "#052e16";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawFallbackAvatar(ctx, x, y, r, color) {
  ctx.fillStyle = "#052e16";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();
}

module.exports = {
  CANVAS_TEMPLATES,
  generateWelcomeCard,
  generateGoodbyeCard,
};
