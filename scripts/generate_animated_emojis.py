import os
import math
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "emojis"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIZE = 128
CENTER = SIZE // 2

def make_transparent_frame():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

# ─────────────────────────────────────────────────────────────
# 1. LOADING SPINNER (SMOOTH ROTATING ARC)
# ─────────────────────────────────────────────────────────────
def gen_loading_spinner():
    frames = []
    num_frames = 16
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        angle = (i / num_frames) * 360
        r = 42
        bbox = [CENTER - r, CENTER - r, CENTER + r, CENTER + r]
        # Background faint ring
        draw.arc(bbox, 0, 360, fill=(70, 72, 80, 100), width=8)
        # Spinning bright segment
        draw.arc(bbox, angle, angle + 110, fill=(255, 255, 255, 255), width=8)
        # Glowing dot at head
        head_rad = math.radians(angle + 110)
        hx = CENTER + int(r * math.cos(head_rad))
        hy = CENTER + int(r * math.sin(head_rad))
        draw.ellipse([hx - 4, hy - 4, hx + 4, hy + 4], fill=(255, 255, 255, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 2. MUSIC EQUALIZER (BOUNCING BARS)
# ─────────────────────────────────────────────────────────────
def gen_equalizer():
    frames = []
    num_frames = 12
    bar_x = [30, 48, 66, 84]
    bar_width = 12
    max_h = 56
    min_h = 14
    base_y = 96

    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        for idx, bx in enumerate(bar_x):
            # Phase shifted sine wave
            phase = (i / num_frames) * math.pi * 2 + (idx * math.pi / 2)
            h = min_h + int((math.sin(phase) + 1) / 2 * (max_h - min_h))
            y0 = base_y - h
            draw.rounded_rectangle([bx, y0, bx + bar_width, base_y], radius=4, fill=(255, 255, 255, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 3. SPARKLE / SHINE STAR
# ─────────────────────────────────────────────────────────────
def gen_sparkle():
    frames = []
    num_frames = 14
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        scale = 0.6 + 0.4 * abs(math.sin((i / num_frames) * math.pi))
        alpha = int(180 + 75 * math.sin((i / num_frames) * math.pi))
        r = int(36 * scale)

        # Draw 4-point star
        points = [
            (CENTER, CENTER - r),
            (CENTER + int(r * 0.25), CENTER - int(r * 0.25)),
            (CENTER + r, CENTER),
            (CENTER + int(r * 0.25), CENTER + int(r * 0.25)),
            (CENTER, CENTER + r),
            (CENTER - int(r * 0.25), CENTER + int(r * 0.25)),
            (CENTER - r, CENTER),
            (CENTER - int(r * 0.25), CENTER - int(r * 0.25)),
        ]
        draw.polygon(points, fill=(255, 255, 255, alpha))
        draw.ellipse([CENTER - 6, CENTER - 6, CENTER + 6, CENTER + 6], fill=(255, 255, 255, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 4. BEATING HEART
# ─────────────────────────────────────────────────────────────
def gen_heartbeat():
    frames = []
    num_frames = 12
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        t = i / num_frames
        # Heart beat pulse pattern
        pulse = 1.0 + 0.18 * (math.sin(t * math.pi * 2) ** 4)
        r = int(22 * pulse)

        # Left lobe & Right lobe
        lx, rx = CENTER - int(12 * pulse), CENTER + int(12 * pulse)
        ly = CENTER - int(10 * pulse)
        draw.ellipse([lx - r, ly - r, lx + r, ly + r], fill=(255, 60, 80, 255))
        draw.ellipse([rx - r, ly - r, rx + r, ly + r], fill=(255, 60, 80, 255))
        # Triangle bottom
        by = CENTER + int(32 * pulse)
        draw.polygon([(CENTER - int(32 * pulse), ly + 4), (CENTER + int(32 * pulse), ly + 4), (CENTER, by)], fill=(255, 60, 80, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 5. SPINNING VINYL DISC
# ─────────────────────────────────────────────────────────────
def gen_spinning_disc():
    frames = []
    num_frames = 16
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        # Outer disc
        draw.ellipse([CENTER - 46, CENTER - 46, CENTER + 46, CENTER + 46], fill=(24, 25, 29, 255), outline=(90, 93, 102, 255), width=3)
        # Grooves
        draw.ellipse([CENTER - 36, CENTER - 36, CENTER + 36, CENTER + 36], outline=(45, 47, 53, 255), width=2)
        draw.ellipse([CENTER - 26, CENTER - 26, CENTER + 26, CENTER + 26], outline=(45, 47, 53, 255), width=2)
        # Center label with rotating marker
        draw.ellipse([CENTER - 16, CENTER - 16, CENTER + 16, CENTER + 16], fill=(255, 255, 255, 255))
        draw.ellipse([CENTER - 4, CENTER - 4, CENTER + 4, CENTER + 4], fill=(18, 19, 22, 255))

        angle = (i / num_frames) * math.pi * 2
        mx = CENTER + int(10 * math.cos(angle))
        my = CENTER + int(10 * math.sin(angle))
        draw.ellipse([mx - 2, my - 2, mx + 2, my + 2], fill=(20, 21, 24, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 6. BELL SWING
# ─────────────────────────────────────────────────────────────
def gen_swinging_bell():
    frames = []
    num_frames = 14
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        swing = math.sin((i / num_frames) * math.pi * 2) * 14
        top_x, top_y = CENTER, 36
        draw.ellipse([top_x - 5, top_y - 8, top_x + 5, top_y + 2], fill=(255, 255, 255, 255))

        bx = CENTER + int(swing)
        by = 82
        # Bell body
        draw.polygon([(top_x - 14, 52), (top_x + 14, 52), (bx + 26, by), (bx - 26, by)], fill=(255, 255, 255, 255))
        draw.rounded_rectangle([bx - 28, by, bx + 28, by + 6], radius=3, fill=(255, 255, 255, 255))
        # Clapper
        cx = CENTER - int(swing * 0.8)
        draw.ellipse([cx - 5, by + 4, cx + 5, by + 14], fill=(210, 213, 220, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 7. PULSING SHIELD (ANTINUKE ACTIVE)
# ─────────────────────────────────────────────────────────────
def gen_pulsing_shield():
    frames = []
    num_frames = 14
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        t = i / num_frames
        pulse = 0.92 + 0.08 * math.sin(t * math.pi * 2)
        r = int(50 * pulse)

        # Outer glowing ring
        draw.ellipse([CENTER - r, CENTER - r, CENTER + r, CENTER + r], outline=(255, 255, 255, int(80 + 60 * math.sin(t * math.pi * 2))), width=2)
        # Inner shield
        pts = [
            (CENTER, CENTER - 26),
            (CENTER + 24, CENTER - 18),
            (CENTER + 20, CENTER + 14),
            (CENTER, CENTER + 30),
            (CENTER - 20, CENTER + 14),
            (CENTER - 24, CENTER - 18),
        ]
        draw.polygon(pts, fill=(255, 255, 255, 255))
        # Cutout center
        pts_in = [
            (CENTER, CENTER - 18),
            (CENTER + 15, CENTER - 12),
            (CENTER + 13, CENTER + 10),
            (CENTER, CENTER + 20),
            (CENTER - 13, CENTER + 10),
            (CENTER - 15, CENTER - 12),
        ]
        draw.polygon(pts_in, fill=(20, 21, 25, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 8. BOUNCING ARROW (ATTENTION / CLICK ME)
# ─────────────────────────────────────────────────────────────
def gen_bouncing_arrow():
    frames = []
    num_frames = 12
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        offset = int(math.sin((i / num_frames) * math.pi * 2) * 8)
        x = CENTER + offset
        y = CENTER
        # Shaft
        draw.rounded_rectangle([x - 28, y - 6, x + 16, y + 6], radius=3, fill=(255, 255, 255, 255))
        # Arrowhead
        draw.polygon([(x + 8, y - 20), (x + 30, y), (x + 8, y + 20)], fill=(255, 255, 255, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 9. SIGNAL / PING PULSE
# ─────────────────────────────────────────────────────────────
def gen_signal_pulse():
    frames = []
    num_frames = 12
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        step = (i / num_frames) * 3
        # Center dot
        draw.ellipse([CENTER - 6, 80 - 6, CENTER + 6, 80 + 6], fill=(255, 255, 255, 255))
        # Wave 1
        a1 = int(255 * (1 if step >= 0.5 else 0.3))
        draw.arc([CENTER - 20, 80 - 20, CENTER + 20, 80 + 20], 210, 330, fill=(255, 255, 255, a1), width=6)
        # Wave 2
        a2 = int(255 * (1 if step >= 1.5 else 0.3))
        draw.arc([CENTER - 34, 80 - 34, CENTER + 34, 80 + 34], 210, 330, fill=(255, 255, 255, a2), width=6)
        # Wave 3
        a3 = int(255 * (1 if step >= 2.5 else 0.3))
        draw.arc([CENTER - 48, 80 - 48, CENTER + 48, 80 + 48], 210, 330, fill=(255, 255, 255, a3), width=6)
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# 10. FLICKERING FIRE / BOOST
# ─────────────────────────────────────────────────────────────
def gen_fire():
    frames = []
    num_frames = 12
    for i in range(num_frames):
        img = make_transparent_frame()
        draw = ImageDraw.Draw(img)
        wobble = math.sin((i / num_frames) * math.pi * 2) * 5
        scale = 0.94 + 0.06 * math.cos((i / num_frames) * math.pi * 2)

        # Outer flame
        pts = [
            (CENTER + int(wobble), int(30 * scale)),
            (CENTER + 28, 65),
            (CENTER + 22, 94),
            (CENTER - 22, 94),
            (CENTER - 28, 65),
            (CENTER - 8, 48),
        ]
        draw.polygon(pts, fill=(255, 120, 40, 255))
        # Inner core
        pts_in = [
            (CENTER + int(wobble * 0.5), int(52 * scale)),
            (CENTER + 14, 75),
            (CENTER + 10, 92),
            (CENTER - 10, 92),
            (CENTER - 14, 75),
        ]
        draw.polygon(pts_in, fill=(255, 240, 100, 255))
        frames.append(img)
    return frames

# ─────────────────────────────────────────────────────────────
# MAIN GENERATION DISPATCHER
# ─────────────────────────────────────────────────────────────
ANIMATIONS = {
    "astrix_loading_anim": (gen_loading_spinner, 60),
    "astrix_equalizer_anim": (gen_equalizer, 80),
    "astrix_sparkle_anim": (gen_sparkle, 75),
    "astrix_heart_anim": (gen_heartbeat, 70),
    "astrix_disc_anim": (gen_spinning_disc, 60),
    "astrix_bell_anim": (gen_swinging_bell, 70),
    "astrix_shield_anim": (gen_pulsing_shield, 80),
    "astrix_arrow_anim": (gen_bouncing_arrow, 75),
    "astrix_ping_anim": (gen_signal_pulse, 90),
    "astrix_fire_anim": (gen_fire, 70),
}

def main():
    print(f"[Animated] Generating {len(ANIMATIONS)} Animated GIF Emojis...")
    for name, (gen_fn, duration) in ANIMATIONS.items():
        frames = gen_fn()
        out_path = os.path.join(OUTPUT_DIR, f"{name}.gif")
        frames[0].save(
            out_path,
            save_all=True,
            append_images=frames[1:],
            optimize=False,
            duration=duration,
            loop=0,
            disposal=2
        )
        print(f"[Animated GIF Ready]: {name}.gif ({len(frames)} frames)")
    print("\n[Success] All Animated Emojis Generated Successfully!")

if __name__ == "__main__":
    main()
