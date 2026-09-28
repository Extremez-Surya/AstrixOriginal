const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const EMOJI_DIR = path.resolve(__dirname, '..', 'assets', 'emojis');
const envPath = path.resolve(__dirname, '..', '.env');

let token = process.env.DISCORD_TOKEN;
if (!token && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DISCORD_TOKEN=(.+)/);
  if (match) token = match[1].trim();
}

if (token && ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")))) {
  token = token.slice(1, -1);
}

if (!token) {
  console.error('❌ DISCORD_TOKEN is missing in .env file!');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

async function uploadEmojis() {
  console.log('🚀 Connecting to Discord REST API to upload Astrix Application Emojis...');

  let appId;
  try {
    const app = await rest.get(Routes.currentApplication());
    appId = app.id;
    console.log(`✅ Identified Bot Application: "${app.name}" (ID: ${appId})`);
  } catch (err) {
    console.error('❌ Failed to fetch current application:', err.message);
    process.exit(1);
  }

  // Fetch currently existing application emojis
  let existingEmojis = [];
  try {
    const res = await rest.get(Routes.applicationEmojis(appId));
    existingEmojis = res.items || res || [];
    console.log(`ℹ️ Current Application Emojis Count: ${existingEmojis.length}/50`);
  } catch (err) {
    console.warn('⚠️ Could not fetch existing emojis:', err.message);
  }

  const existingMap = new Map();
  for (const e of existingEmojis) {
    existingMap.set(e.name, e.id);
  }

  const files = fs
    .readdirSync(EMOJI_DIR)
    .filter((f) => f.startsWith('astrix_') && (f.endsWith('.png') || f.endsWith('.gif')));

  console.log(`📦 Found ${files.length} custom Astrix emojis (Static & Animated) ready for upload.\n`);

  const uploadedEmojiMap = {};

  for (const file of files) {
    const isAnimated = file.endsWith('.gif');
    const ext = isAnimated ? '.gif' : '.png';
    const mime = isAnimated ? 'image/gif' : 'image/png';
    const emojiName = file.replace(ext, '');
    const filePath = path.join(EMOJI_DIR, file);
    const fileBuf = fs.readFileSync(filePath);
    const base64Data = `data:${mime};base64,${fileBuf.toString('base64')}`;

    if (existingMap.has(emojiName)) {
      const existingId = existingMap.get(emojiName);
      const formatted = `<${isAnimated ? 'a' : ''}:${emojiName}:${existingId}>`;
      uploadedEmojiMap[emojiName] = formatted;
      console.log(`⏩ [Skipped/Already Exists]: ${emojiName} -> ${formatted}`);
      continue;
    }

    try {
      console.log(`⏳ Uploading ${isAnimated ? 'Animated' : 'Static'} "${emojiName}"...`);
      const created = await rest.post(Routes.applicationEmojis(appId), {
        body: {
          name: emojiName,
          image: base64Data,
        },
      });

      const formatted = `<${created.animated || isAnimated ? 'a' : ''}:${created.name}:${created.id}>`;
      uploadedEmojiMap[created.name] = formatted;
      console.log(`✨ [Uploaded]: ${created.name} -> ${formatted}`);

      // Small delay to be polite to Discord rate limits
      await new Promise((r) => setTimeout(r, 650));
    } catch (err) {
      console.error(`❌ Failed to upload ${emojiName}:`, err.message);
    }
  }

  // Update src/lib/emojis.json
  const emojisJsonPath = path.resolve(__dirname, '..', 'src', 'lib', 'emojis.json');
  let currentMap = {};
  if (fs.existsSync(emojisJsonPath)) {
    try {
      currentMap = JSON.parse(fs.readFileSync(emojisJsonPath, 'utf8'));
    } catch (_) {}
  }

  const merged = { ...currentMap, ...uploadedEmojiMap };
  fs.writeFileSync(emojisJsonPath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`\n🎉 Successfully synchronized ${Object.keys(merged).length} emojis in src/lib/emojis.json!`);
}

if (require.main === module) {
  uploadEmojis();
}

module.exports = { uploadEmojis };
