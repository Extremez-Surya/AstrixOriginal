const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs");

async function main() {
  const imgPath = "C:/Users/VINAY KUMAR/.gemini/antigravity-ide/brain/3acf625a-af0b-4429-957d-bba1195450be/media__1784178952693.jpg";
  const bgImage = await loadImage(imgPath);
  const canvas = createCanvas(bgImage.width, bgImage.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImage, 0, 0);

  // Draw a big red rectangle over the System Status panel values
  ctx.fillStyle = "#ff0000";
  ctx.fillRect(780, 200, 180, 350);

  // Draw a big red rectangle over the Database Performance panel values
  ctx.fillRect(360, 580, 90, 160);

  // Draw a big red rectangle over the Bot Information panel values
  ctx.fillRect(780, 580, 180, 210);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("C:/Users/VINAY KUMAR/.gemini/antigravity-ide/brain/3acf625a-af0b-4429-957d-bba1195450be/scratch/test_fill.png", buffer);
  console.log("Test fill image generated.");
}

main().catch(console.error);
