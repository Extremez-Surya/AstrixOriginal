const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  AttachmentBuilder,
} = require("discord.js");

let musicardModule = null;

async function getMusicard() {
  if (!musicardModule) {
    musicardModule = await import("musicard");
    try {
      if (typeof musicardModule.initializeFonts === "function") {
        musicardModule.initializeFonts();
      }
    } catch (e) {}
  }
  return musicardModule;
}

// Start loading musicard module immediately in background
getMusicard().catch(() => {});

const PRESETS_FILE = path.join(__dirname, "../guildPresets.json");

const THEMES = {
  melt: {
    key: "melt",
    name: "Melt",
    emoji: "🔥",
    desc: "Sleek glassmorphic liquid melt aesthetic",
    func: async (data) => {
      const { Melt } = await getMusicard();
      return Melt(data);
    },
  },
  bloom: {
    key: "bloom",
    name: "Bloom",
    emoji: "🌸",
    desc: "Vibrant neon bloom glowing gradient style",
    func: async (data) => {
      const { Bloom } = await getMusicard();
      return Bloom(data);
    },
  },
  haze: {
    key: "haze",
    name: "Haze",
    emoji: "🌫️",
    desc: "Soft atmospheric ambient haze visual",
    func: async (data) => {
      const { Haze } = await getMusicard();
      return Haze(data);
    },
  },
  ease: {
    key: "ease",
    name: "Ease",
    emoji: "✨",
    desc: "Minimalist smooth elegant layout",
    func: async (data) => {
      const { Ease } = await getMusicard();
      return Ease(data);
    },
  },
  drift: {
    key: "drift",
    name: "Drift",
    emoji: "🏎️",
    desc: "Modern dynamic futuristic drift visual",
    func: async (data) => {
      const { Drift } = await getMusicard();
      return Drift(data);
    },
  },
  calm: {
    key: "calm",
    name: "Calm",
    emoji: "🌌",
    desc: "Clean tranquil dark-mode aesthetic",
    func: async (data) => {
      const { Calm } = await getMusicard();
      return Calm(data);
    },
  },
};

let guildPresets = {};

function loadPresets() {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      const data = fs.readFileSync(PRESETS_FILE, "utf-8");
      guildPresets = JSON.parse(data);
    }
  } catch (err) {
    console.error("[PresetManager] Error loading presets JSON:", err);
    guildPresets = {};
  }
}

function savePresets() {
  try {
    fs.writeFileSync(
      PRESETS_FILE,
      JSON.stringify(guildPresets, null, 2),
      "utf-8",
    );
  } catch (err) {
    console.error("[PresetManager] Error saving presets JSON:", err);
  }
}

loadPresets();

function getGuildTheme(guildId) {
  if (!guildId) return "melt";
  const theme = guildPresets[guildId];
  if (theme && THEMES[theme]) return theme;
  return "melt"; // Default server theme
}

function setGuildTheme(guildId, themeKey) {
  if (!guildId || !THEMES[themeKey]) return false;
  guildPresets[guildId] = themeKey;
  savePresets();
  return true;
}

function formatMs(ms) {
  if (!ms || isNaN(ms) || ms === 0) return "3:30";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function renderThemeCard(themeKey, data = {}) {
  try {
    const theme = THEMES[themeKey] || THEMES.melt;
    const title = data.title || "Unknown Track";
    const author = data.author || "Unknown Artist";
    let thumbnail = data.thumbnail;

    if (
      !thumbnail ||
      typeof thumbnail !== "string" ||
      !thumbnail.startsWith("http")
    ) {
      thumbnail = path.join(__dirname, "../../assets/helpmenu.png");
    }

    const durationStr = formatMs(data.duration);

    const imageBuffer = await theme.func({
      trackName: title,
      artistName: author,
      albumArt: thumbnail,
      isExplicit: false,
      timeAdjust: { timeStart: "0:00", timeEnd: durationStr },
      progressBar: 15,
      volumeBar: 80,
    });

    return imageBuffer;
  } catch (err) {
    console.error("[PresetManager] Error in renderThemeCard:", err);
    return null;
  }
}

async function createPresetPayload(guildId, selectedKey = null) {
  const savedKey = getGuildTheme(guildId);
  const currentKey = selectedKey || savedKey;
  const savedTheme = THEMES[savedKey] || THEMES.melt;
  const currentTheme = THEMES[currentKey] || THEMES.melt;

  const header = new TextDisplayBuilder().setContent(
    `### 🎨 Server Musicard Theme Presets\n` +
      `> - **Current Saved Theme:** ${savedTheme.emoji} **${savedTheme.name}**\n` +
      `> - **Previewing Theme:** ${currentTheme.emoji} **${currentTheme.name}**\n` +
      `-# *Select a theme from the menu below to preview its Canvas style, then click Save.*`,
  );

  const container = new ContainerBuilder().addTextDisplayComponents(header);

  let previewAttachment = null;
  try {
    const logoPath = path.join(__dirname, "../../assets/helpmenu.png");
    const sampleBuffer = await currentTheme.func({
      trackName: "AstrixCode is the Best",
      artistName: "Thank you For Using Me",
      albumArt: logoPath,
      isExplicit: false,
      timeAdjust: { timeStart: "1:20", timeEnd: "3:49" },
      progressBar: 35,
      volumeBar: 80,
    });
    previewAttachment = new AttachmentBuilder(sampleBuffer, {
      name: "preset_preview.png",
    });
  } catch (err) {
    console.error("[PresetManager] Error rendering preview:", err);
  }

  if (previewAttachment) {
    const mediaGallery = new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL("attachment://preset_preview.png"),
    );
    container.addMediaGalleryComponents(mediaGallery);
  }

  container.addSeparatorComponents(new SeparatorBuilder());

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`music_preset_select:${currentKey}`)
    .setPlaceholder("🎨 Select a Musicard Theme Preset...")
    .addOptions(
      Object.keys(THEMES).map((key) => {
        const t = THEMES[key];
        return {
          label: `${t.name} Theme`,
          value: t.key,
          description: t.desc,
          emoji: t.emoji,
          default: t.key === currentKey,
        };
      }),
    );

  const rowDropdown = new ActionRowBuilder().addComponents(selectMenu);

  const isSaved = currentKey === savedKey;

  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`music_preset_save:${currentKey}`)
      .setLabel(isSaved ? "Saved" : "Save Preset")
      .setEmoji(isSaved ? "✅" : "💾")
      .setStyle(isSaved ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(isSaved),
    new ButtonBuilder()
      .setCustomId("music_preset_reset")
      .setLabel("Reset Default")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),
  );

  container.addActionRowComponents(rowDropdown, rowButtons);

  return {
    container,
    attachment: previewAttachment,
    currentKey,
    savedKey,
  };
}

module.exports = {
  THEMES,
  getGuildTheme,
  setGuildTheme,
  renderThemeCard,
  createPresetPayload,
};
