const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const path = require("path");
const fs = require("fs");

// Register GoogleSans font for crisp, modern typography across all hosting environments
const googleSansPath = path.join(__dirname, "../fonts/GoogleSans.ttf");
if (fs.existsSync(googleSansPath)) {
  try {
    GlobalFonts.registerFromPath(googleSansPath, "GoogleSans");
  } catch (_) {}
}

/**
 * Generates an ultra-sleek 4K Ultra-HD metallic Discord bot mention banner card with cyber VFX and cinematic artwork background.
 *
 * @param {Object} options
 * @param {import('discord.js').Client} options.client
 * @param {import('discord.js').Guild} options.guild
 * @param {import('discord.js').User} [options.user]
 * @param {string} options.guildPrefix
 * @param {number} options.wsLatency
 * @param {number|string} options.memberCount
 * @param {number|string} options.commandCount
 * @param {string} [options.uptimeStr]
 * @returns {Promise<Buffer>}
 */
async function generateMentionCard({
  client,
  guild,
  user,
  guildPrefix = "-",
  wsLatency = 0,
  memberCount = "0",
  commandCount = "0",
  uptimeStr = "",
}) {
  // 3x High-DPI Ultra-HD scale (2640 x 810 px) for crisp 4K fidelity with zero blur
  const scale = 3;
  const baseW = 880;
  const baseH = 270;
  const width = baseW * scale;
  const height = baseH * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Apply high-DPI scaling
  ctx.scale(scale, scale);

  // 1. Load Custom Cyber Artwork Background
  let bgImg = null;
  try {
    bgImg = await loadImage(path.join(__dirname, "../assets/mention_bg.png"));
  } catch (_) {
    bgImg = null;
  }

  // 2. Fetch bot avatar in high-resolution (1024px) or fallback to local asset
  let avatarImg = null;
  try {
    const avatarUrl = client.user.displayAvatarURL({
      extension: "png",
      size: 1024,
      forceStatic: true,
    });
    avatarImg = await loadImage(avatarUrl);
  } catch (e) {
    try {
      avatarImg = await loadImage(path.join(__dirname, "../assets/logo.png"));
    } catch (_) {
      try {
        avatarImg = await loadImage(
          path.join(__dirname, "../assets/astrix_logo.png"),
        );
      } catch (err) {
        avatarImg = null;
      }
    }
  }

  const radius = 24;

  // 3. Clip Card Container with rounded corners
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, baseW, baseH, radius);
  ctx.clip();

  // 4. Render Background (Artwork with cinematic dark overlay or deep procedural fallback)
  if (bgImg) {
    const bgAspect = bgImg.width / bgImg.height;
    const targetAspect = baseW / baseH;
    let sx = 0,
      sy = 0,
      sw = bgImg.width,
      sh = bgImg.height;

    if (bgAspect > targetAspect) {
      sw = bgImg.height * targetAspect;
      sx = (bgImg.width - sw) * 0.5;
    } else {
      sh = bgImg.width / targetAspect;
      sy = (bgImg.height - sh) * 0.45;
    }

    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, baseW, baseH);

    // Black, White & Grey Cinematic Monochrome Overlay
    const overlayGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
    overlayGrad.addColorStop(0, "rgba(8, 10, 15, 0.78)");
    overlayGrad.addColorStop(0.35, "rgba(12, 14, 20, 0.70)");
    overlayGrad.addColorStop(0.7, "rgba(14, 16, 22, 0.62)");
    overlayGrad.addColorStop(1, "rgba(6, 8, 12, 0.75)");
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, baseW, baseH);
  } else {
    const baseGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
    baseGrad.addColorStop(0, "#08090d");
    baseGrad.addColorStop(0.25, "#0f121a");
    baseGrad.addColorStop(0.55, "#141824");
    baseGrad.addColorStop(0.85, "#0d1017");
    baseGrad.addColorStop(1, "#06070a");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, baseW, baseH);
  }

  // 5. High-Tech Diamond Micro-Grid Pattern (Sleek Isometric Carbon Look)
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.024)";
  ctx.lineWidth = 1;
  const gridSize = 26;
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

  // 6. Ambient Spotlights & Radial Lighting
  const avatarSpotlight = ctx.createRadialGradient(135, 135, 10, 135, 135, 200);
  avatarSpotlight.addColorStop(0, "rgba(255, 80, 80, 0.12)"); // Subtle crimson/rose glow
  avatarSpotlight.addColorStop(0.4, "rgba(160, 195, 255, 0.08)");
  avatarSpotlight.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = avatarSpotlight;
  ctx.fillRect(0, 0, 380, baseH);

  const centerBloom = ctx.createRadialGradient(
    baseW * 0.52,
    20,
    10,
    baseW * 0.52,
    20,
    280,
  );
  centerBloom.addColorStop(0, "rgba(255, 255, 255, 0.04)");
  centerBloom.addColorStop(0.5, "rgba(140, 170, 220, 0.015)");
  centerBloom.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = centerBloom;
  ctx.fillRect(200, 0, baseW - 200, baseH);

  // 7. Sweeping Vertical Titanium Specular Beam (Signature Metallic Sheen)
  const beamX = baseW * 0.44;
  const beamGrad = ctx.createLinearGradient(beamX - 100, 0, beamX + 100, 0);
  beamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  beamGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.015)");
  beamGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.07)");
  beamGrad.addColorStop(0.7, "rgba(255, 255, 255, 0.015)");
  beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = beamGrad;
  ctx.fillRect(0, 0, baseW, baseH);

  // 8. Cyber Dust & Glowing Star Particles
  ctx.save();
  const particles = [
    { x: 260, y: 38, r: 1.5, a: 0.55 },
    { x: 375, y: 72, r: 1.0, a: 0.35 },
    { x: 520, y: 32, r: 1.8, a: 0.6 },
    { x: 675, y: 88, r: 1.2, a: 0.4 },
    { x: 805, y: 44, r: 2.0, a: 0.65 },
    { x: 310, y: 195, r: 1.4, a: 0.3 },
    { x: 490, y: 224, r: 1.0, a: 0.4 },
    { x: 745, y: 185, r: 1.6, a: 0.45 },
    { x: 190, y: 232, r: 1.2, a: 0.35 },
    { x: 95, y: 42, r: 1.5, a: 0.4 },
  ];
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 225, 235, ${p.a})`;
    ctx.shadowColor = "rgba(255, 120, 140, 0.8)";
    ctx.shadowBlur = 7;
    ctx.fill();
  });
  ctx.restore();

  // 9. Corner Tech Markings & Top Right Label / Status
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1;

  // Top Left cross
  ctx.beginPath();
  ctx.moveTo(25, 20);
  ctx.lineTo(25, 28);
  ctx.moveTo(21, 24);
  ctx.lineTo(29, 24);
  ctx.stroke();

  // Top Right Minimal Live Status Badge
  const statusX = baseW - 32;
  const statusY = 28;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(statusX - 78, statusY - 14, 78, 22, 11);
  ctx.fillStyle = "rgba(16, 22, 32, 0.65)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Glowing Green Online Dot
  ctx.beginPath();
  ctx.arc(statusX - 63, statusY - 3, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#22c55e";
  ctx.shadowColor = "#22c55e";
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#4ade80";
  ctx.font = "bold 10px GoogleSans, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ONLINE", statusX - 52, statusY);
  ctx.restore();
  ctx.restore();

  // 10. Outer Metallic Bevel Frame (Multi-layer border)
  ctx.restore(); // unclip

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(1, 1, baseW - 2, baseH - 2, radius);
  const outerBorder = ctx.createLinearGradient(0, 0, baseW, baseH);
  outerBorder.addColorStop(0, "rgba(255, 255, 255, 0.6)");
  outerBorder.addColorStop(0.2, "rgba(180, 205, 235, 0.2)");
  outerBorder.addColorStop(0.5, "rgba(70, 85, 115, 0.25)");
  outerBorder.addColorStop(0.8, "rgba(160, 190, 225, 0.18)");
  outerBorder.addColorStop(1, "rgba(255, 255, 255, 0.45)");
  ctx.strokeStyle = outerBorder;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Inner subtle border line
  ctx.beginPath();
  ctx.roundRect(4, 4, baseW - 8, baseH - 8, radius - 3);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 11. Avatar Display & Chrome Orbit Rings
  const cx = 135;
  const cy = 135;
  const r = 70;

  // Outer orbital accent ring (rose/cyan tech arcs)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 16, -Math.PI * 0.72, Math.PI * 0.18);
  ctx.strokeStyle = "rgba(255, 150, 170, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r + 16, Math.PI * 0.38, Math.PI * 0.88);
  ctx.strokeStyle = "rgba(180, 215, 255, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Polished Chrome Bevel Ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
  const chromeGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  chromeGrad.addColorStop(0, "#ffffff");
  chromeGrad.addColorStop(0.22, "#c8d6e8");
  chromeGrad.addColorStop(0.48, "#4a5568");
  chromeGrad.addColorStop(0.75, "#1e2533");
  chromeGrad.addColorStop(0.9, "#8fa3bd");
  chromeGrad.addColorStop(1, "#f2f6fb");
  ctx.strokeStyle = chromeGrad;
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(160, 210, 255, 0.55)";
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.restore();

  // Inner dark bezel ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(10, 13, 20, 0.95)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw Avatar circular clipped
  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  }

  // Specular Star Glints on Chrome Ring
  function drawGlint(gx, gy, size, alpha) {
    ctx.save();
    ctx.translate(gx, gy);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.shadowColor = "rgba(220, 245, 255, 1)";
    ctx.shadowBlur = 10;
    // 4-point star
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.fill();

    // Small circular center spark
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  }

  // Glint at top-left of ring
  const glint1X = cx + Math.cos(-Math.PI * 0.75) * (r + 9);
  const glint1Y = cy + Math.sin(-Math.PI * 0.75) * (r + 9);
  drawGlint(glint1X, glint1Y, 8, 1);

  // Glint at bottom-right of ring
  const glint2X = cx + Math.cos(Math.PI * 0.28) * (r + 9);
  const glint2Y = cy + Math.sin(Math.PI * 0.28) * (r + 9);
  drawGlint(glint2X, glint2Y, 6, 0.85);

  // --- Right Side Content ---
  const leftX = 250;
  const botName = client?.user?.username || "Astrix";

  // Format clean username without unsupported emojis to prevent square box glyphs in canvas
  const rawUserName =
    user?.displayName ||
    user?.globalName ||
    user?.username ||
    "User";
  const strippedName = rawUserName
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{FE00}-\u{FE0F}]/gu,
      "",
    )
    .trim();
  const safeName = strippedName.length > 0 ? strippedName : user?.username || "User";
  const cleanUserName =
    safeName.length > 18 ? `${safeName.substring(0, 16)}...` : safeName;

  // Bot Title (Large bold gradient)
  const titleGrad = ctx.createLinearGradient(leftX, 46, leftX, 86);
  titleGrad.addColorStop(0, "#ffffff");
  titleGrad.addColorStop(1, "#d1d9e6");
  ctx.fillStyle = titleGrad;
  ctx.font = "bold 44px GoogleSans, Arial, sans-serif";
  ctx.fillText(botName, leftX, 76);

  // Personalized Greeting & Role Tagline
  ctx.font = "bold 14px GoogleSans, Arial, sans-serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`Hey, ${cleanUserName} !`, leftX, 103);

  const greetingWidth = ctx.measureText(`Hey, ${cleanUserName} !`).width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "13px GoogleSans, Arial, sans-serif";
  ctx.fillText("•  Your Server Companion", leftX + greetingWidth + 8, 103);

  // Guidance description
  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px GoogleSans, Arial, sans-serif";
  ctx.fillText(
    `Type "${guildPrefix}help" to explore all ${commandCount} commands & features.`,
    leftX,
    126,
  );

  // 12. Dynamic Latency Color & Safe Latency
  const safeLatency = wsLatency >= 0 ? wsLatency : 24;
  let pingAccent = "#22c55e"; // Green
  if (safeLatency > 250)
    pingAccent = "#ef4444"; // Red
  else if (safeLatency > 150)
    pingAccent = "#eab308"; // Yellow
  else if (safeLatency > 80) pingAccent = "#38bdf8"; // Cyan

  // 13. Stats Cards (4 Frosted Glass Tech Pill Boxes)
  const statItems = [
    { label: "PREFIX", val: String(guildPrefix), accent: "#38bdf8" },
    { label: "COMMANDS", val: String(commandCount), accent: "#f8fafc" },
    {
      label: "PING",
      val: `${safeLatency}ms`,
      accent: pingAccent,
      hasDot: true,
      dotColor: pingAccent,
    },
    {
      label: "MEMBERS",
      val: String(memberCount),
      accent: "#a78bfa",
      hasDot: true,
      dotColor: "#a78bfa",
    },
  ];

  const pillY = 146;
  const pillW = 132;
  const pillH = 50;
  const pillSpacing = 18;

  statItems.forEach((item, idx) => {
    const px = leftX + idx * (pillW + pillSpacing);

    ctx.save();
    // Pill background (dark frosted glass)
    ctx.beginPath();
    ctx.roundRect(px, pillY, pillW, pillH, 8);
    const pillBg = ctx.createLinearGradient(px, pillY, px, pillY + pillH);
    pillBg.addColorStop(0, "rgba(20, 24, 34, 0.65)");
    pillBg.addColorStop(1, "rgba(10, 13, 20, 0.5)");
    ctx.fillStyle = pillBg;
    ctx.fill();

    // Top subtle specular highlight on pill edge
    ctx.beginPath();
    ctx.moveTo(px + 8, pillY);
    ctx.lineTo(px + pillW - 8, pillY);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pill border
    ctx.beginPath();
    ctx.roundRect(px, pillY, pillW, pillH, 8);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stat Label
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 10px GoogleSans, Arial, sans-serif";
    ctx.fillText(item.label, px + 12, pillY + 18);

    // Stat Value
    if (item.hasDot) {
      // Live glowing indicator dot
      ctx.beginPath();
      ctx.arc(px + 16, pillY + 34, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = item.dotColor || item.accent;
      ctx.shadowColor = item.dotColor || item.accent;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = item.accent;
      ctx.font = "bold 16px GoogleSans, Arial, sans-serif";
      ctx.fillText(item.val, px + 28, pillY + 38);
    } else {
      ctx.fillStyle = item.accent;
      ctx.font = "bold 16px GoogleSans, Arial, sans-serif";
      ctx.fillText(item.val, px + 12, pillY + 38);
    }
    ctx.restore();
  });

  // 14. Divider Line with gradient
  const divY = 214;
  ctx.beginPath();
  const divGrad = ctx.createLinearGradient(leftX, divY, baseW - 40, divY);
  divGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
  divGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
  divGrad.addColorStop(1, "rgba(255, 255, 255, 0.01)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.moveTo(leftX, divY);
  ctx.lineTo(baseW - 40, divY);
  ctx.stroke();

  // 15. Sub-Footer (Clean & uncluttered)
  const guildName = guild?.name ? String(guild.name).trim() : "Discord Community";
  const cleanGuildName =
    guildName.length > 32 ? `${guildName.substring(0, 30)}...` : guildName;

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "12px GoogleSans, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Serving ${cleanGuildName}`, leftX, 243);

  if (uptimeStr) {
    ctx.fillStyle = "#64748b";
    ctx.font = "12px GoogleSans, Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Uptime: ${uptimeStr}`, baseW - 40, 243);
  }

  return canvas.toBuffer("image/png");
}

module.exports = {
  generateMentionCard,
};
