const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const envPath = path.join(__dirname, '..', '..', '.env');
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
const TARGET_APP_ID = '1526903059857543218';

async function main() {
  console.log(`🚀 Fetching Developer Portal Emojis from Application: ${TARGET_APP_ID}...`);

  try {
    let appEmojis = [];
    try {
      const response = await rest.get(Routes.applicationEmojis(TARGET_APP_ID));
      appEmojis = response.items || response || [];
      console.log(`✅ Successfully fetched ${appEmojis.length} Application Emojis!`);
    } catch (err) {
      console.warn(`⚠️ Fetching via ${TARGET_APP_ID} gave: ${err.message}. Trying currentApplication...`);
      const app = await rest.get(Routes.currentApplication());
      const response = await rest.get(Routes.applicationEmojis(app.id));
      appEmojis = response.items || response || [];
      console.log(`✅ Fetched ${appEmojis.length} emojis from currentApplication (ID: ${app.id})!`);
    }

    const emojiMap = {};
    for (const e of appEmojis) {
      const formatted = `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`;
      emojiMap[e.name] = formatted;
      console.log(`✔ [${e.name}] -> ${formatted}`);
    }

    const jsonPath = path.join(__dirname, '..', 'lib', 'emojis.json');
    fs.writeFileSync(jsonPath, JSON.stringify(emojiMap, null, 2), 'utf8');
    console.log(`\n🎉 Saved ${Object.keys(emojiMap).length} Developer Portal Emojis to ${jsonPath}!`);
  } catch (err) {
    console.error('❌ Error syncing emojis:', err);
  }
}

main();
