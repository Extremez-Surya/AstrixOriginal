const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs");

async function main() {
  const imgPath = "C:/Users/VINAY KUMAR/.gemini/antigravity-ide/brain/3acf625a-af0b-4429-957d-bba1195450be/media__1784178952693.jpg";
  const bgImage = await loadImage(imgPath);
  const width = bgImage.width;
  const height = bgImage.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  
  ctx.drawImage(bgImage, 0, 0, width, height);

  ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#00ff00";
  ctx.font = "12px Arial";

  for (let y = 50; y < height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.fillText(String(y), 10, y - 2);
  }

  for (let x = 50; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.fillText(String(x), x + 2, 12);
  }

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("C:/Users/VINAY KUMAR/.gemini/antigravity-ide/brain/3acf625a-af0b-4429-957d-bba1195450be/scratch/grid_mockup.png", buffer);
  console.log("Grid mockup generated.");
}

main().catch(console.error);
