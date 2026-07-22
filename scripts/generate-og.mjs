import { mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const boardPath = "outputs/evidence/phase-3/board-house-felt.png";
const wordmarkPath = "public/brand/jetsetplay-wordmark.svg";

const board = await sharp(boardPath)
  .resize({ height: 478, width: 680, fit: "contain" })
  .png()
  .toBuffer();
const wordmark = await sharp(await readFile(wordmarkPath))
  .resize({ width: 286 })
  .png()
  .toBuffer();

const background = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#F5F1E8"/>
    <text x="72" y="238" fill="#1A1A1A" font-family="Georgia, serif" font-size="62" letter-spacing="-2">A gift is</text>
    <text x="72" y="304" fill="#1A1A1A" font-family="Georgia, serif" font-size="62" letter-spacing="-2">communication</text>
    <text x="72" y="370" fill="#1A1A1A" font-family="Georgia, serif" font-size="62" letter-spacing="-2">you can hold.</text>
    <text x="72" y="548" fill="#1A1A1A" font-family="Arial, sans-serif" font-size="14" font-weight="600" letter-spacing="2">JETSETPLAY · SAN FRANCISCO</text>
  </svg>
`);

await mkdir("public", { recursive: true });
await sharp(background)
  .composite([
    { input: wordmark, left: 72, top: 58 },
    { input: board, left: 510, top: 76 },
  ])
  .png()
  .toFile("public/og.png");

process.stdout.write("public/og.png\n");
