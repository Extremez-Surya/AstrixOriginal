const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const path = require("path");
const fs = require("fs");

// Register fonts if available
const sekuyaFontPath = path.join(__dirname, "../fonts/Sekuya-Regular.ttf");
if (fs.existsSync(sekuyaFontPath)) {
  try {
    GlobalFonts.registerFromPath(sekuyaFontPath, "Sekuya");
  } catch (_) {}
}

const dancingFontPath = path.join(__dirname, "../fonts/DancingScript-VariableFont_wght.ttf");
if (fs.existsSync(dancingFontPath)) {
  try {
    GlobalFonts.registerFromPath(dancingFontPath, "Dancing");
  } catch (_) {}
}

const BIRTHDAY_TEMPLATES = {
  celebration: {
    name: "Golden Celebration (Default)",
    gradient: ["#1a0914", "#381028", "#12050e"],
    accent: "#f59e0b",
    text: "#fde047",
    subText: "#ffffff",
    decorations: "#fbbf24",
  },
  cyberpunk: {
    name: "Cyberpunk Neon",
    gradient: ["#0b091a", "#161133", "#090314"],
    accent: "#00f0ff",
    text: "#ff0055",
    subText: "#00f0ff",
    decorations: "#00f0ff",
  },
  midnight: {
    name: "Midnight Royal",
    gradient: ["#0f091f", "#1d113a", "#080414"],
    accent: "#a855f7",
    text: "#ec4899",
    subText: "#c084fc",
    decorations: "#e879f9",
  },
  sunset: {
    name: "Sunset Horizon",
    gradient: ["#1f0b16", "#3b1028", "#14050d"],
    accent: "#f97316",
    text: "#f43f5e",
    subText: "#fbbf24",
    decorations: "#fb7185",
  },
  sakura: {
    name: "Sakura Blossom",
    gradient: ["#1f0c18", "#36162a", "#140710"],
    accent: "#f472b6",
    text: "#fbcfe8",
    subText: "#ffffff",
    decorations: "#f472b6",
  },
  gold: {
    name: "Luxury Gold",
    gradient: ["#1c1504", "#382a08", "#120d02"],
    accent: "#eab308",
    text: "#fef08a",
    subText: "#f59e0b",
    decorations: "#fef08a",
  },
  frost: {
    name: "Frostbite Blue",
    gradient: ["#06131e", "#0c2538", "#040b12"],
    accent: "#38bdf8",
    text: "#f8fafc",
    subText: "#7dd3fc",
    decorations: "#38bdf8",
  },
  crimson: {
    name: "Crimson Blaze",
    gradient: ["#1a0505", "#330d0d", "#120202"],
    accent: "#ef4444",
    text: "#f97316",
    subText: "#fde047",
    decorations: "#ef4444",
  },
  emerald: {
    name: "Emerald Forest",
    gradient: ["#07120a", "#0e2416", "#050e07"],
    accent: "#22c55e",
    text: "#ffffff",
    subText: "#a3e635",
    decorations: "#22c55e",
  },
  toxic: {
    name: "Toxic Neon",
    gradient: ["#0c1a05", "#16330a", "#060d02"],
    accent: "#84cc16",
    text: "#d946ef",
    subText: "#a3e635",
    decorations: "#84cc16",
  },
};

function drawRoundedRect(ctx, x, y, width, height, radius) {
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

function drawHexagon(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const hx = x + radius * Math.cos(angle);
    const hy = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
}

function drawConfettiAndBokeh(ctx, width, height, theme) {
  ctx.save();
  // Bokeh blurred light circles
  for (let i = 0; i < 12; i++) {
    const bx = Math.random() * width;
    const by = Math.random() * height;
    const bradius = Math.random() * 45 + 15;
    ctx.globalAlpha = Math.random() * 0.12 + 0.03;
    ctx.fillStyle = i % 2 === 0 ? theme.accent : theme.text;
    ctx.beginPath();
    ctx.arc(bx, by, bradius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glittering confetti & stars
  const count = 40;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 2.5 + 1;
    const alpha = Math.random() * 0.7 + 0.2;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 3 === 0 ? theme.decorations : i % 2 === 0 ? "#ffffff" : theme.accent;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw little starburst cross on some sparkles
    if (i % 4 === 0) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = theme.decorations;
      ctx.beginPath();
      ctx.moveTo(x - radius * 2.5, y);
      ctx.lineTo(x + radius * 2.5, y);
      ctx.moveTo(x, y - radius * 2.5);
      ctx.lineTo(x, y + radius * 2.5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

async function generateBirthdayCanvas(user, guild, options = {}) {
  const width = 1000;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Determine template & color overrides
  const templateKey = options.canvasTemplate || options.theme || "celebration";
  const tmpl = BIRTHDAY_TEMPLATES[templateKey] || BIRTHDAY_TEMPLATES.celebration;

  const accentColor = options.canvasAccentColor || tmpl.accent;
  const textColor = options.canvasTextColor || tmpl.text;

  // 1. Background Image or Gradient Fill
  let bgLoaded = false;
  if (options.canvasBgUrl) {
    try {
      const bgImg = await loadImage(options.canvasBgUrl);
      ctx.drawImage(bgImg, 0, 0, width, height);

      // Dark overlay filter for text readability
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      bgLoaded = true;
    } catch (_) {}
  }

  if (!bgLoaded) {
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, tmpl.gradient[0]);
    bgGradient.addColorStop(0.5, tmpl.gradient[1]);
    bgGradient.addColorStop(1, tmpl.gradient[2]);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Bokeh & Particle Physics Effect
  drawConfettiAndBokeh(ctx, width, height, tmpl);

  // 3. Glassmorphism Card Overlay Panel
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Double Glowing Outer Border
  ctx.save();
  ctx.lineWidth = 6;
  const borderGrad = ctx.createLinearGradient(0, 0, width, height);
  borderGrad.addColorStop(0, accentColor);
  borderGrad.addColorStop(0.5, textColor);
  borderGrad.addColorStop(1, accentColor);
  ctx.strokeStyle = borderGrad;
  drawRoundedRect(ctx, 12, 12, width - 24, height - 24, 20);
  ctx.stroke();
  ctx.restore();

  // 5. Draw Avatar with Selected Shape (Circle, Square, Hexagon, Rounded)
  const avatarX = 145;
  const avatarY = height / 2;
  const avatarRadius = 98;
  const shape = options.avatarShape || "circle";

  // Avatar Shadow & Glow Ring
  ctx.save();
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 30;
  ctx.fillStyle = accentColor;
  if (shape === "hexagon") {
    drawHexagon(ctx, avatarX, avatarY, avatarRadius + 6);
  } else if (shape === "square") {
    drawRoundedRect(ctx, avatarX - avatarRadius - 6, avatarY - avatarRadius - 6, (avatarRadius + 6) * 2, (avatarRadius + 6) * 2, 12);
  } else if (shape === "rounded") {
    drawRoundedRect(ctx, avatarX - avatarRadius - 6, avatarY - avatarRadius - 6, (avatarRadius + 6) * 2, (avatarRadius + 6) * 2, 28);
  } else {
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 6, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  // Load and Clip Avatar
  try {
    const avatarUrl = user.displayAvatarURL({ extension: "png", size: 512 });
    const avatarImage = await loadImage(avatarUrl);

    ctx.save();
    if (shape === "hexagon") {
      drawHexagon(ctx, avatarX, avatarY, avatarRadius);
    } else if (shape === "square") {
      drawRoundedRect(ctx, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2, 8);
    } else if (shape === "rounded") {
      drawRoundedRect(ctx, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2, 24);
    } else {
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    }
    ctx.clip();
    ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();
  } catch (_) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.restore();
  }

  // Inner Avatar Border Frame Line
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  if (shape === "hexagon") {
    drawHexagon(ctx, avatarX, avatarY, avatarRadius);
  } else if (shape === "square") {
    drawRoundedRect(ctx, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2, 8);
  } else if (shape === "rounded") {
    drawRoundedRect(ctx, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2, 24);
  } else {
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.restore();

  // 6. Draw Header Text: "HAPPY BIRTHDAY!"
  const textX = 295;

  ctx.save();
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 18;

  const headerGrad = ctx.createLinearGradient(textX, 0, width - 40, 0);
  headerGrad.addColorStop(0, textColor);
  headerGrad.addColorStop(1, "#ffffff");

  ctx.fillStyle = headerGrad;
  ctx.font = "bold 52px Sekuya, sans-serif";
  ctx.fillText("HAPPY BIRTHDAY!", textX, 130);
  ctx.restore();

  // 7. Draw Username
  const username = user.username || user.displayName || "Friend";
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 10;
  ctx.fillText(username, textX, 192);
  ctx.restore();

  // 8. Draw Custom Wish Text
  const wishText = options.customWish || options.wishMessage?.description || "Wishing you an amazing day filled with joy, laughter, and success!";
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.font = "italic 22px sans-serif";

  const words = wishText.split(" ");
  let line = "";
  let lineY = 245;
  const maxWidth = width - textX - 50;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, textX, lineY);
      line = words[i] + " ";
      lineY += 30;
      if (lineY > 310) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, textX, lineY);
  ctx.restore();

  // 9. Footer Watermark Text
  const guildName = guild?.name ? guild.name.toUpperCase() : "ASTRIX DEVELOPMENT";
  const watermark = options.canvasWatermark || `ASTRIX CELEBRATIONS ▪ ${guildName}`;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(watermark.toUpperCase(), textX, 355);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

module.exports = {
  BIRTHDAY_TEMPLATES,
  generateBirthdayCanvas,
};
