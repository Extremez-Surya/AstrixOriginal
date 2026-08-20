const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

// Load environment variables manually if dotenv is not present
const envPath = path.join(__dirname, '..', '..', '.env');
let token = process.env.DISCORD_TOKEN;

if (!token && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DISCORD_TOKEN=(.+)/);
  if (match) token = match[1].trim();
}

if (!token) {
  console.error('❌ DISCORD_TOKEN is missing in .env file!');
  process.exit(1);
}

// Reject on rate limit so we never hang when rate limited by Discord API
const rest = new REST({ version: '10', rejectOnRateLimit: () => true }).setToken(token);
const GUILD_ID = '1526109131042459678';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEmojiBuffer(emojiId, animated) {
  const formats = animated ? ['gif', 'png', 'webp'] : ['png', 'webp', 'gif'];
  for (const ext of formats) {
    const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=128&quality=lossless`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mime = res.headers.get('content-type') || (ext === 'gif' ? 'image/gif' : 'image/png');
        return { buffer, mime };
      }
    } catch (e) {
      // try next extension
    }
  }
  throw new Error(`Could not fetch image from Discord CDN for emoji ID ${emojiId}`);
}

async function main() {
  console.log('🚀 Starting Emoji Sync to Bot Developer Portal (Application Emojis)...');

  try {
    // 1. Get Application Details
    const app = await rest.get(Routes.currentApplication());
    console.log(`✅ Application: ${app.name} (ID: ${app.id})`);

    // 2. Fetch Guild Emojis
    console.log(`📡 Fetching emojis from server ID: ${GUILD_ID}...`);
    const guildEmojis = await rest.get(Routes.guildEmojis(GUILD_ID));
    console.log(`✅ Found ${guildEmojis.length} emojis in server.`);

    if (guildEmojis.length === 0) {
      console.log('⚠️ No emojis found in specified guild.');
      return;
    }

    // 3. Fetch Existing Application Emojis
    let existingAppEmojis = [];
    try {
      const response = await rest.get(Routes.applicationEmojis(app.id));
      existingAppEmojis = response.items || response || [];
      console.log(`ℹ️ Existing Application Emojis count: ${existingAppEmojis.length}`);
    } catch (err) {
      console.warn('⚠️ Could not fetch existing application emojis:', err.message);
    }

    const appEmojiMap = new Map();
    existingAppEmojis.forEach((e) => {
      appEmojiMap.set(e.name.toLowerCase(), e);
    });

    const finalEmojisByName = {};

    // 4. Sync / Upload each Guild Emoji to Application Emojis
    for (const emoji of guildEmojis) {
      const guildFormatted = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
      const lowerName = emoji.name.toLowerCase();

      if (appEmojiMap.has(lowerName)) {
        const appEmoji = appEmojiMap.get(lowerName);
        const appFormatted = `<${appEmoji.animated ? 'a' : ''}:${appEmoji.name}:${appEmoji.id}>`;
        console.log(`✔ Application Emoji exists: '${emoji.name}' -> ${appFormatted}`);
        finalEmojisByName[emoji.name] = appFormatted;
      } else {
        console.log(`📤 Uploading '${emoji.name}' to Bot Developer Portal...`);
        try {
          const { buffer, mime } = await fetchEmojiBuffer(emoji.id, emoji.animated);
          const base64Image = `data:${mime};base64,${buffer.toString('base64')}`;

          const createdAppEmoji = await rest.post(Routes.applicationEmojis(app.id), {
            body: {
              name: emoji.name,
              image: base64Image,
            },
          });

          const createdStr = `<${createdAppEmoji.animated ? 'a' : ''}:${createdAppEmoji.name}:${createdAppEmoji.id}>`;
          console.log(`🎉 Successfully uploaded '${emoji.name}' -> ${createdStr}`);
          finalEmojisByName[emoji.name] = createdStr;
          appEmojiMap.set(lowerName, createdAppEmoji);

          await sleep(500);
        } catch (uploadErr) {
          console.warn(`⚠️ Could not upload Application Emoji '${emoji.name}': ${uploadErr.message}`);
          console.log(`ℹ️ Falling back to server emoji format for '${emoji.name}': ${guildFormatted}`);
          finalEmojisByName[emoji.name] = guildFormatted;
        }
      }
    }

    // Ensure all guild emojis are represented
    guildEmojis.forEach((emoji) => {
      if (!finalEmojisByName[emoji.name]) {
        finalEmojisByName[emoji.name] = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
      }
    });

    console.log('\n📝 Updating Codebase Emoji Files...');

    // 5. Update src/lib/emojis.js
    const libEmojisPath = path.join(__dirname, '..', 'lib', 'emojis.js');
    if (fs.existsSync(libEmojisPath)) {
      const currentLib = require(libEmojisPath);
      const updatedLib = { ...currentLib };

      for (const key of Object.keys(updatedLib)) {
        const matchedName = Object.keys(finalEmojisByName).find(
          (name) => name === key || name.toLowerCase() === key.toLowerCase()
        );
        if (matchedName) {
          updatedLib[key] = finalEmojisByName[matchedName];
        }
      }

      for (const [name, value] of Object.entries(finalEmojisByName)) {
        if (!updatedLib[name]) {
          updatedLib[name] = value;
        }
      }

      const libContent = `module.exports = ${JSON.stringify(updatedLib, null, 2)};\n`;
      fs.writeFileSync(libEmojisPath, libContent, 'utf-8');
      console.log(`✅ Updated ${libEmojisPath}`);
    }

    // 6. Update Ares-master/src/utils/emojis.js
    const aresEmojisPath = path.join(__dirname, '..', '..', 'Ares-master', 'src', 'utils', 'emojis.js');
    if (fs.existsSync(aresEmojisPath)) {
      let aresContent = fs.readFileSync(aresEmojisPath, 'utf-8');

      for (const [name, formatted] of Object.entries(finalEmojisByName)) {
        const regex = new RegExp(`(${name}\\s*:\\s*['"\`])[^'"\`]+(['"\`])`, 'gi');
        aresContent = aresContent.replace(regex, `$1${formatted}$2`);
      }

      fs.writeFileSync(aresEmojisPath, aresContent, 'utf-8');
      console.log(`✅ Updated ${aresEmojisPath}`);
    }

    console.log('\n✨ Emoji Sync Completed Successfully!');
  } catch (err) {
    console.error('❌ Fatal Error during Emoji Sync:', err);
    process.exit(1);
  }
}

main();
