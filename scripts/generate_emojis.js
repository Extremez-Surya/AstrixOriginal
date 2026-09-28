const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'assets', 'emojis');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────────
// BASE CANVAS HELPERS
// ─────────────────────────────────────────────────────────────

function createBaseCanvas() {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  return { canvas, ctx };
}

/**
 * Draws the DisBot-style 3D glossy obsidian circular coin
 */
function drawBadgeBase(ctx) {
  const cx = 64;
  const cy = 64;
  const r = 54;

  // 1. Soft Outer Drop Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0f1013';
  ctx.fill();
  ctx.restore();

  // 2. Outer Bevel Rim Gradient (Titanium Silver / Chrome)
  const rimGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  rimGrad.addColorStop(0, '#5a5d66');
  rimGrad.addColorStop(0.3, '#8e929c');
  rimGrad.addColorStop(0.5, '#2e3036');
  rimGrad.addColorStop(0.8, '#464850');
  rimGrad.addColorStop(1, '#1b1c20');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // 3. Inner Dark Obsidian Coin Body
  const innerR = r - 4;
  const bodyGrad = ctx.createRadialGradient(cx, cy - 10, 4, cx, cy, innerR);
  bodyGrad.addColorStop(0, '#26282e');
  bodyGrad.addColorStop(0.65, '#16171b');
  bodyGrad.addColorStop(1, '#0e0f12');

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 4. Subtle Top Gloss Reflection (Half Arc)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR - 1, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineWidth = 2.5;
  const glossGrad = ctx.createLinearGradient(cx - innerR, cy, cx + innerR, cy);
  glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
  glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.strokeStyle = glossGrad;
  ctx.stroke();
  ctx.restore();
}

/**
 * Common styling for crisp white/silver glyph inside badge or standalone
 */
function applyGlyphStyle(ctx, isTransparentStyle = false) {
  if (isTransparentStyle) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2.5;
  }
}

// ─────────────────────────────────────────────────────────────
// GLYPH DEFINITIONS
// ─────────────────────────────────────────────────────────────

const GLYPHS = {
  // ── BADGES (CIRCULAR COINS) ──
  shield: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    // Shield outer path
    ctx.moveTo(64, 34);
    ctx.lineTo(88, 42);
    ctx.quadraticCurveTo(87, 72, 64, 94);
    ctx.quadraticCurveTo(41, 72, 40, 42);
    ctx.closePath();
    ctx.fill();

    // Inner embossed contrast
    ctx.fillStyle = '#1c1d22';
    ctx.beginPath();
    ctx.moveTo(64, 42);
    ctx.lineTo(81, 48);
    ctx.quadraticCurveTo(80, 68, 64, 85);
    ctx.quadraticCurveTo(48, 68, 47, 48);
    ctx.closePath();
    ctx.fill();

    // Small center white star / emblem
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 60, 6, 0, Math.PI * 2);
    ctx.fill();
  },

  crown: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(38, 76);
    ctx.lineTo(34, 48);
    ctx.lineTo(49, 60);
    ctx.lineTo(64, 40);
    ctx.lineTo(79, 60);
    ctx.lineTo(94, 48);
    ctx.lineTo(90, 76);
    ctx.closePath();
    ctx.fill();

    // Crown base band
    ctx.fillRect(36, 80, 56, 6);

    // Jewels on crown peaks
    [34, 64, 94].forEach(x => {
      ctx.beginPath();
      ctx.arc(x, x === 64 ? 38 : 46, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  hammer: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-Math.PI / 4);

    // Handle
    ctx.fillStyle = '#d2d5dc';
    ctx.fillRect(-4, -10, 8, 44);

    // Hammer Head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-22, -26, 44, 20, 4);
    ctx.fill();

    // Striking face bevel
    ctx.fillStyle = '#8e929c';
    ctx.fillRect(-26, -24, 4, 16);
    ctx.fillRect(22, -24, 4, 16);

    ctx.restore();
  },

  check: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(42, 64);
    ctx.lineTo(57, 79);
    ctx.lineTo(88, 47);
    ctx.stroke();
  },

  cross: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(44, 44);
    ctx.lineTo(84, 84);
    ctx.moveTo(84, 44);
    ctx.lineTo(44, 84);
    ctx.stroke();
  },

  warn: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(64, 36);
    ctx.lineTo(92, 85);
    ctx.lineTo(36, 85);
    ctx.closePath();
    ctx.fill();

    // Inner dark mark
    ctx.fillStyle = '#141518';
    ctx.fillRect(61, 50, 6, 18);
    ctx.beginPath();
    ctx.arc(64, 76, 3.5, 0, Math.PI * 2);
    ctx.fill();
  },

  info: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 44, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(59, 56, 10, 28, 4);
    ctx.fill();
  },

  music: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    // Two notes connected by bar
    ctx.ellipse(47, 78, 9, 6.5, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(77, 70, 9, 6.5, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    // Stems
    ctx.fillRect(52, 40, 6, 38);
    ctx.fillRect(82, 32, 6, 38);
    // Top bar
    ctx.fillRect(52, 32, 36, 10);
  },

  ticket: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-Math.PI / 12);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-28, -18, 56, 36, 6);
    ctx.fill();

    // Notch cutouts
    ctx.fillStyle = '#141518';
    ctx.beginPath();
    ctx.arc(-28, 0, 7, 0, Math.PI * 2);
    ctx.arc(28, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Dotted perforated line
    ctx.strokeStyle = '#8e929c';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(4, -14);
    ctx.lineTo(4, 14);
    ctx.stroke();
    ctx.restore();
  },

  gift: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    // Box body
    ctx.fillRect(40, 54, 48, 34);
    // Lid
    ctx.fillRect(36, 46, 56, 10);
    // Ribbon vertical & horizontal cutout
    ctx.fillStyle = '#141518';
    ctx.fillRect(60, 46, 8, 42);
    ctx.fillRect(36, 66, 56, 6);
    // Ribbon Bow top
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(54, 39, 8, 5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(74, 39, 8, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
  },

  star: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = 26;
    const innerRadius = 12;
    let rot = (Math.PI / 2) * 3;
    let x = 64;
    let y = 64;
    const step = Math.PI / spikes;

    ctx.moveTo(64, 64 - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = 64 + Math.cos(rot) * outerRadius;
      y = 64 + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = 64 + Math.cos(rot) * innerRadius;
      y = 64 + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(64, 64 - outerRadius);
    ctx.closePath();
    ctx.fill();
  },

  gear: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    const cx = 64, cy = 64;
    // Outer teeth
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillRect(-6, -26, 12, 10);
      ctx.restore();
    }
    // Main ring
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, Math.PI * 2);
    ctx.fill();
    // Center hole
    ctx.fillStyle = '#141518';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
  },

  lock: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    // Shackle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 48, 14, Math.PI, 0);
    ctx.lineTo(78, 62);
    ctx.moveTo(50, 48);
    ctx.lineTo(50, 62);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.roundRect(42, 60, 44, 30, 6);
    ctx.fill();

    // Keyhole
    ctx.fillStyle = '#141518';
    ctx.beginPath();
    ctx.arc(64, 72, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(62, 72, 4, 8);
  },

  stats: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    // Bar chart 4 bars
    ctx.fillRect(38, 72, 9, 18);
    ctx.fillRect(51, 58, 9, 32);
    ctx.fillRect(64, 46, 9, 44);
    ctx.fillRect(77, 36, 9, 54);
  },

  user: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    // Head
    ctx.beginPath();
    ctx.arc(64, 48, 14, 0, Math.PI * 2);
    ctx.fill();
    // Shoulders
    ctx.beginPath();
    ctx.arc(64, 94, 26, Math.PI, 0);
    ctx.fill();
  },

  bot: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    // Head
    ctx.beginPath();
    ctx.roundRect(40, 46, 48, 36, 8);
    ctx.fill();
    // Antenna
    ctx.fillRect(62, 34, 4, 12);
    ctx.beginPath();
    ctx.arc(64, 32, 4, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#141518';
    ctx.beginPath();
    ctx.arc(52, 62, 5, 0, Math.PI * 2);
    ctx.arc(76, 62, 5, 0, Math.PI * 2);
    ctx.fill();
    // Mouth line
    ctx.fillRect(54, 72, 20, 3);
  },

  bell: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 52, 16, Math.PI, 0);
    ctx.lineTo(83, 76);
    ctx.lineTo(45, 76);
    ctx.closePath();
    ctx.fill();
    // Clapper
    ctx.beginPath();
    ctx.arc(64, 82, 5, 0, Math.PI * 2);
    ctx.fill();
  },

  sparkle: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    // Big 4-point sparkle
    const drawStar4 = (cx, cy, r) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx - r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - r);
      ctx.fill();
    };
    drawStar4(60, 60, 26);
    drawStar4(84, 42, 10);
  },

  clock: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(64, 46);
    ctx.lineTo(64, 64);
    ctx.lineTo(76, 64);
    ctx.stroke();
  },

  trash: (ctx) => {
    drawBadgeBase(ctx);
    applyGlyphStyle(ctx);
    ctx.fillStyle = '#ffffff';
    // Can body
    ctx.beginPath();
    ctx.moveTo(46, 52);
    ctx.lineTo(50, 86);
    ctx.lineTo(78, 86);
    ctx.lineTo(82, 52);
    ctx.closePath();
    ctx.fill();
    // Lid
    ctx.fillRect(40, 46, 48, 5);
    ctx.fillRect(58, 41, 12, 5);
    // Slits
    ctx.fillStyle = '#141518';
    ctx.fillRect(54, 57, 4, 22);
    ctx.fillRect(62, 57, 4, 22);
    ctx.fillRect(70, 57, 4, 22);
  },

  // ── TRANSPARENT MINIMALIST INLINE GLYPHS ──
  arrow: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(34, 64);
    ctx.lineTo(84, 64);
    ctx.moveTo(64, 44);
    ctx.lineTo(84, 64);
    ctx.lineTo(64, 84);
    ctx.stroke();
  },

  arrow_double: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(36, 44);
    ctx.lineTo(56, 64);
    ctx.lineTo(36, 84);
    ctx.moveTo(64, 44);
    ctx.lineTo(84, 64);
    ctx.lineTo(64, 84);
    ctx.stroke();
  },

  dot: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 64, 18, 0, Math.PI * 2);
    ctx.fill();

    // Subtle inner bevel
    ctx.fillStyle = '#d2d5dc';
    ctx.beginPath();
    ctx.arc(64, 62, 8, 0, Math.PI * 2);
    ctx.fill();
  },

  code: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Left bracket <
    ctx.beginPath();
    ctx.moveTo(42, 46);
    ctx.lineTo(26, 64);
    ctx.lineTo(42, 82);
    ctx.stroke();

    // Slash /
    ctx.beginPath();
    ctx.moveTo(56, 88);
    ctx.lineTo(72, 40);
    ctx.stroke();

    // Right bracket >
    ctx.beginPath();
    ctx.moveTo(86, 46);
    ctx.lineTo(102, 64);
    ctx.lineTo(86, 82);
    ctx.stroke();
  },

  terminal: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // >
    ctx.beginPath();
    ctx.moveTo(32, 46);
    ctx.lineTo(54, 64);
    ctx.lineTo(32, 82);
    ctx.stroke();
    // _
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(64, 76, 32, 8);
  },

  play: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(44, 34);
    ctx.lineTo(94, 64);
    ctx.lineTo(44, 94);
    ctx.closePath();
    ctx.fill();
  },

  pause: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(40, 36, 16, 56, 4);
    ctx.roundRect(72, 36, 16, 56, 4);
    ctx.fill();
  },

  skip: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(32, 38);
    ctx.lineTo(68, 64);
    ctx.lineTo(32, 90);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(64, 38);
    ctx.lineTo(100, 64);
    ctx.lineTo(64, 90);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(96, 38, 8, 52);
  },

  previous: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 38, 8, 52);

    ctx.beginPath();
    ctx.moveTo(64, 38);
    ctx.lineTo(28, 64);
    ctx.lineTo(64, 90);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(96, 38);
    ctx.lineTo(60, 64);
    ctx.lineTo(96, 90);
    ctx.closePath();
    ctx.fill();
  },

  loop: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    // Rounded loop path
    ctx.beginPath();
    ctx.roundRect(32, 44, 64, 40, 12);
    ctx.stroke();

    // Arrow tip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(86, 36);
    ctx.lineTo(100, 48);
    ctx.lineTo(86, 60);
    ctx.closePath();
    ctx.fill();
  },

  shuffle: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(30, 42);
    ctx.bezierCurveTo(55, 42, 70, 84, 94, 84);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(30, 84);
    ctx.bezierCurveTo(55, 84, 60, 68, 64, 62);
    ctx.moveTo(76, 50);
    ctx.bezierCurveTo(80, 44, 85, 42, 94, 42);
    ctx.stroke();

    // Top arrow tip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(88, 34);
    ctx.lineTo(100, 42);
    ctx.lineTo(88, 50);
    ctx.fill();

    // Bottom arrow tip
    ctx.beginPath();
    ctx.moveTo(88, 76);
    ctx.lineTo(100, 84);
    ctx.lineTo(88, 92);
    ctx.fill();
  },

  volume: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.fillStyle = '#ffffff';
    // Speaker horn
    ctx.beginPath();
    ctx.moveTo(34, 52);
    ctx.lineTo(46, 52);
    ctx.lineTo(64, 36);
    ctx.lineTo(64, 92);
    ctx.lineTo(46, 76);
    ctx.lineTo(34, 76);
    ctx.closePath();
    ctx.fill();

    // Sound waves
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(64, 64, 18, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(64, 64, 30, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  },

  link: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-Math.PI / 4);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';

    // Left chain link
    ctx.beginPath();
    ctx.roundRect(-30, -10, 26, 20, 8);
    ctx.stroke();

    // Center bar
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    // Right chain link
    ctx.beginPath();
    ctx.roundRect(4, -10, 26, 20, 8);
    ctx.stroke();

    ctx.restore();
  },

  ping: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    // Signal arches
    ctx.beginPath();
    ctx.arc(64, 82, 38, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(64, 82, 24, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 80, 6, 0, Math.PI * 2);
    ctx.fill();
  },

  search: (ctx) => {
    applyGlyphStyle(ctx, true);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(56, 56, 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.lineTo(94, 94);
    ctx.stroke();
  },
};

// ─────────────────────────────────────────────────────────────
// GENERATION & SHOWCASE SHEET RENDERER
// ─────────────────────────────────────────────────────────────

async function generateAll() {
  console.log('🚀 Generating Astrix Custom Hybrid Emoji Pack (35 Icons)...');
  const entries = Object.entries(GLYPHS);

  // 1. Generate individual 128x128 PNGs
  for (const [name, drawFn] of entries) {
    const { canvas, ctx } = createBaseCanvas();
    drawFn(ctx);
    const buf = canvas.toBuffer('image/png');
    const filePath = path.join(OUTPUT_DIR, `astrix_${name}.png`);
    fs.writeFileSync(filePath, buf);
  }
  console.log(`✅ Saved ${entries.length} individual 128x128 PNGs to: ${OUTPUT_DIR}`);

  // 2. Generate a Complete Showcase Board (Preview image for User)
  const cols = 7;
  const rows = Math.ceil(entries.length / cols);
  const cellWidth = 140;
  const cellHeight = 150;
  const sheetWidth = cols * cellWidth + 60;
  const sheetHeight = rows * cellHeight + 160;

  const showcase = createCanvas(sheetWidth, sheetHeight);
  const sCtx = showcase.getContext('2d');

  // Discord Dark Theme Background (#313338 with subtle vignette)
  sCtx.fillStyle = '#1e1f22';
  sCtx.fillRect(0, 0, sheetWidth, sheetHeight);

  // Card Container
  sCtx.fillStyle = '#2b2d31';
  sCtx.beginPath();
  sCtx.roundRect(20, 20, sheetWidth - 40, sheetHeight - 40, 16);
  sCtx.fill();

  // Header Title
  sCtx.fillStyle = '#ffffff';
  sCtx.font = 'bold 32px sans-serif';
  sCtx.fillText('Astrix Bot — Custom Hybrid Emojis Pack', 50, 75);

  sCtx.fillStyle = '#949ba4';
  sCtx.font = '16px sans-serif';
  sCtx.fillText('Hybrid Design: 3D Glossy Obsidian Badges (Modules) + Transparent Minimalist Glyphs (Inline/Controls)', 50, 105);

  // Render each emoji on the grid
  for (let i = 0; i < entries.length; i++) {
    const [name, drawFn] = entries[i];
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = 50 + col * cellWidth;
    const y = 140 + row * cellHeight;

    // Small slot background
    sCtx.fillStyle = '#1e1f22';
    sCtx.beginPath();
    sCtx.roundRect(x + 10, y + 10, 100, 100, 12);
    sCtx.fill();

    // Render glyph on slot
    const { canvas: iconCanvas, ctx: iconCtx } = createBaseCanvas();
    drawFn(iconCtx);

    sCtx.drawImage(iconCanvas, x + 16, y + 16, 88, 88);

    // Label under slot
    sCtx.fillStyle = '#dbdee1';
    sCtx.font = 'bold 12px monospace';
    sCtx.textAlign = 'center';
    sCtx.fillText(name, x + 60, y + 128);
    sCtx.textAlign = 'left';
  }

  const showcaseBuf = showcase.toBuffer('image/png');
  const showcasePath = path.join(OUTPUT_DIR, 'preview_showcase.png');
  fs.writeFileSync(showcasePath, showcaseBuf);

  // Also copy to artifacts directory so user can view directly
  const artifactPath = path.join('C:\\Users\\VINAY KUMAR\\.gemini\\antigravity-ide\\brain\\35944cbf-dc86-45ba-9bb2-4c127c3e5d1c', 'emoji_showcase.png');
  fs.writeFileSync(artifactPath, showcaseBuf);

  console.log(`🎉 Showcase preview created at: ${showcasePath}`);
  console.log(`🖼️ Artifact copied to: ${artifactPath}`);
}

generateAll();
