const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

async function main() {
  const imgPath = "C:/Users/VINAY KUMAR/.gemini/antigravity-ide/brain/3acf625a-af0b-4429-957d-bba1195450be/media__1784178952693.jpg";
  const bgImage = await loadImage(imgPath);
  const width = bgImage.width;
  const height = bgImage.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  console.log("Image size:", width, "x", height);
  
  // 1. Draw original mockup as base
  ctx.drawImage(bgImage, 0, 0, width, height);

  // Mock data to overlay
  const wsLatency = 297;
  const apiLatency = 444;
  const gateway = 297;
  const uptime = "99.98%";
  const memoryUsage = "21.39 MB";
  const cpuUsage = "6.8 %";
  const nodeStatus = "ONLINE";
  const readMs = "N/A";
  const writeMs = "N/A";
  const deleteMs = "N/A";
  const guilds = "1";
  const users = "4";
  const commands = "3";
  const version = "v1.0.0";
  const quality = "POOR";
  const statusColor = "#ff3131"; // red since poor
  const accentColor = "#ff3131";
  const gcx = 280, gcy = 350; // Corrected gauge center Y to 350

  // 2. Cover up the original values with matching dark rects
  ctx.save();
  ctx.fillStyle = "#0c0505"; // matching dark panel background

  // Gauge text covers (cover texts precisely to preserve grid/graphics)
  ctx.fillRect(245, 225, 70, 35);   // PING
  ctx.fillRect(195, 260, 115, 125);  // "31" (taller box to cover entire text)
  ctx.fillRect(310, 310, 65, 75);   // "ms"
  ctx.fillRect(195, 454, 170, 22);  // "EXCELLENT" status text cover

  // Code block status & latency covers (only cover value strings, keep keys)
  ctx.fillRect(132, 226, 100, 18);
  ctx.fillRect(142, 244, 80, 18);

  // System Status values cover (baseline - 14, height 22, width extended to cover text and original dot at X: 944)
  ctx.fillRect(780, 228, 175, 22); // Status (baseline 242)
  ctx.fillRect(780, 286, 175, 22);  // API Latency (baseline 300)
  ctx.fillRect(780, 340, 175, 22);  // Gateway (baseline 354)
  ctx.fillRect(780, 388, 175, 22);  // Uptime (baseline 402)
  ctx.fillRect(780, 436, 175, 22); // Memory Usage (baseline 450)
  ctx.fillRect(780, 484, 175, 22);  // CPU Usage (baseline 498)
  ctx.fillRect(780, 532, 175, 22);  // Node Status (baseline 546)

  // Database Performance values cover (using X: 360, width 80 to cover entire numbers column)
  ctx.fillRect(360, 554, 80, 22); // Read
  ctx.fillRect(360, 609, 80, 22); // Write
  ctx.fillRect(360, 664, 80, 22); // Delete

  // Bot Information values cover
  ctx.fillRect(780, 554, 175, 22); // Guilds
  ctx.fillRect(780, 609, 175, 22); // Users
  ctx.fillRect(780, 664, 175, 22); // Commands
  ctx.fillRect(780, 719, 175, 22); // Version

  // Clock time cover inside LIVE card
  ctx.fillRect(865, 92, 110, 28);

  ctx.restore();

  // 3. Write new values in their places
  ctx.save();
  
  // Clock time
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Consolas, monospace";
  ctx.fillText("10:45:13", 878, 112);

  // Code Block status and latency
  ctx.font = "11px Consolas, monospace";
  ctx.fillStyle = "#98c379"; // Green string in code
  ctx.fillText(`"${quality.charAt(0).toUpperCase() + quality.slice(1).toLowerCase()}",`, 132, 238);
  ctx.fillText(`"${wsLatency}ms"`, 142, 255);

  // Circular Gauge central number
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 58px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(String(wsLatency), gcx - 15, gcy + 15);
  ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("ms", gcx + 38, gcy + 10);

  // Gauge Connection Quality status and labels
  ctx.fillStyle = accentColor;
  ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("PING", gcx, gcy - 50);

  ctx.fillStyle = statusColor;
  ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(quality, gcx, gcy + 60);

  // System Status Panel values (right aligned to X: 918)
  ctx.textAlign = "right";
  
  // Status (Green/Red)
  ctx.fillStyle = statusColor;
  ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(quality, 918, 234); // baseline 242 (234 + 8)

  // API Latency
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`${apiLatency} ms`, 918, 292); // baseline 300 (292 + 8)

  // Gateway
  ctx.fillText(`${gateway} ms`, 918, 346); // baseline 354 (346 + 8)

  // Uptime
  ctx.fillText(uptime, 918, 394); // baseline 402 (394 + 8)

  // Memory Usage
  ctx.fillText(memoryUsage, 918, 442); // baseline 450 (442 + 8)

  // CPU Usage
  ctx.fillText(cpuUsage, 918, 490); // baseline 498 (490 + 8)

  // Node Status
  ctx.fillStyle = "#00ff66";
  ctx.fillText(nodeStatus, 918, 538); // baseline 546 (538 + 8)

  // Draw custom status dots at X: 944
  ctx.fillStyle = statusColor;
  ctx.beginPath(); ctx.arc(944, 235, 3.5, 0, Math.PI * 2); ctx.fill(); // Status dot (242 - 7 = 235)
  
  ctx.fillStyle = "#00ff66"; // rest of dots are green
  ctx.beginPath(); ctx.arc(944, 293, 3.5, 0, Math.PI * 2); ctx.fill(); // API Latency dot (300 - 7 = 293)
  ctx.beginPath(); ctx.arc(944, 347, 3.5, 0, Math.PI * 2); ctx.fill(); // Gateway dot (354 - 7 = 347)
  ctx.beginPath(); ctx.arc(944, 395, 3.5, 0, Math.PI * 2); ctx.fill(); // Uptime dot (402 - 7 = 395)
  ctx.beginPath(); ctx.arc(944, 443, 3.5, 0, Math.PI * 2); ctx.fill(); // Memory dot (450 - 7 = 443)
  ctx.beginPath(); ctx.arc(944, 491, 3.5, 0, Math.PI * 2); ctx.fill(); // CPU dot (498 - 7 = 491)
  ctx.beginPath(); ctx.arc(944, 539, 3.5, 0, Math.PI * 2); ctx.fill(); // Node Status dot (546 - 7 = 539)

  // Database Performance values (right aligned to X: 435)
  ctx.fillStyle = "#00ff66"; // database numbers are green
  ctx.fillText(readMs, 435, 560);
  ctx.fillText(writeMs, 435, 615);
  ctx.fillText(deleteMs, 435, 670);

  // Bot Information values (right aligned to X: 918)
  ctx.fillStyle = "#ff3131"; // original bot info text color is red
  ctx.fillText(guilds, 918, 560);
  ctx.fillText(users, 918, 615);
  ctx.fillText(commands, 918, 670);
  ctx.fillText(version, 918, 725);

  ctx.restore();



  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("C:/Users/VINAY KUMAR/.gemini/antigravity-ide/brain/3acf625a-af0b-4429-957d-bba1195450be/scratch/mockup_overlay_preview_unique.png", buffer);
  console.log("Mockup overlay test generated.");
}

main().catch(console.error);
