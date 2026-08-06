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
  ctx.drawImage(bgImage, 0, 0, width, height);

  // Draw grid lines
  ctx.save();
  ctx.lineWidth = 1;
  
  // X grid lines
  for (let x = 0; x < width; x += 50) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.fillStyle = "#00ffff";
    ctx.font = "10px Arial";
    ctx.fillText(String(x), x + 2, 12);
    ctx.fillText(String(x), x + 2, height - 5);
  }

  // Y grid lines
  for (let y = 0; y < height; y += 50) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    ctx.fillStyle = "#00ffff";
    ctx.font = "10px Arial";
    ctx.fillText(String(y), 2, y - 2);
    ctx.fillText(String(y), width - 30, y - 2);
  }

  ctx.restore();

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("C:/Users/VINAY KUMAR/.gemini/antigravity-ide/brain/3acf625a-af0b-4429-957d-bba1195450be/scratch/grid_mockup.png", buffer);
  console.log("Grid overlay created.");
}

main().catch(console.error);
