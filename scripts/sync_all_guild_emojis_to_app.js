const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const envPath = path.join(__dirname, '..', '.env');
let token = process.env.DISCORD_TOKEN;

if (!token && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DISCORD_TOKEN=(.+)/);
  if (match) token = match[1].trim();
}

if (token && ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")))) {
  token = token.slice(1, -1);
}

const rest = new REST({ version: '10' }).setToken(token);
const TARGET_APP_ID = '1526903059857543218';
const GUILD_ID = '1526109131042459678';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`🚀 Starting Full Guild -> Developer Portal Application Emoji Sync...`);
  console.log(`Guild Source: ${GUILD_ID}`);
  console.log(`Application Target: ${TARGET_APP_ID}`);

  try {
    // 1. Fetch existing application emojis
    const existingAppEmojisRes = await rest.get(Routes.applicationEmojis(TARGET_APP_ID));
    const existingAppEmojis = existingAppEmojisRes.items || existingAppEmojisRes || [];
    console.log(`Found ${existingAppEmojis.length} existing Application Emojis.`);
    const existingNames = new Map(existingAppEmojis.map((e) => [e.name, e]));

    // 2. Fetch guild emojis from target server
    const guildEmojis = await rest.get(Routes.guildEmojis(GUILD_ID));
    console.log(`Found ${guildEmojis.length} Guild Emojis in server ${GUILD_ID}.`);

    let uploadedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < guildEmojis.length; i++) {
      const e = guildEmojis[i];
      if (existingNames.has(e.name)) {
        console.log(`[${i + 1}/${guildEmojis.length}] ⏭️  ${e.name} already exists in Developer Portal. Skipping.`);
        skippedCount++;
        continue;
      }

      console.log(`[${i + 1}/${guildEmojis.length}] 📥 Downloading & uploading "${e.name}" (${e.id})...`);
      const ext = e.animated ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${e.id}.${ext}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUri = `data:image/${ext};base64,${base64}`;

        const created = await rest.post(Routes.applicationEmojis(TARGET_APP_ID), {
          body: {
            name: e.name,
            image: dataUri,
          },
        });

        existingNames.set(created.name, created);
        console.log(`    ✅ Created Application Emoji: ${created.name} (${created.id})`);
        uploadedCount++;
        // Respect rate limits
        await sleep(1000);
      } catch (err) {
        console.error(`    ❌ Failed to upload ${e.name}:`, err.message);
        await sleep(1500);
      }
    }

    // 3. Re-fetch all application emojis to build complete map
    console.log(`\n🔄 Building comprehensive application emojis map...`);
    const finalAppRes = await rest.get(Routes.applicationEmojis(TARGET_APP_ID));
    const allAppEmojis = finalAppRes.items || finalAppRes || [];

    const emojiMap = {};
    for (const e of allAppEmojis) {
      const formatted = `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`;
      emojiMap[e.name] = formatted;
    }

    const emojisJsonPath = path.join(__dirname, '..', 'src', 'lib', 'emojis.json');
    fs.writeFileSync(emojisJsonPath, JSON.stringify(emojiMap, null, 2), 'utf8');

    console.log(`\n🎉 DONE!`);
    console.log(`- Total Guild Emojis: ${guildEmojis.length}`);
    console.log(`- Uploaded: ${uploadedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Total Application Emojis: ${allAppEmojis.length}`);
    console.log(`- Saved mapping to: ${emojisJsonPath}`);
  } catch (err) {
    console.error('Fatal error during emoji sync:', err);
  }
}

main();
