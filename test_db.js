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

  ctx.fillStyle = "#00ff00"; // bright green
  ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "right";

  ctx.fillText("READ_VAL", 435, 607);
  ctx.fillText("WRITE_VAL", 435, 662);
  ctx.fillText("DELETE_VAL", 435, 717);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("C:/Users/VINAY KUMAR/.gemini/antigravity-ide/brain/3acf625a-af0b-4429-957d-bba1195450be/scratch/test_ping.png", buffer);
  console.log("Test DB generated.");
}

main().catch(console.error);
