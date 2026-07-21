import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const output = path.join(root, "outputs/evidence/phase-3");
const html = await readFile(path.join(root, ".next/server/app/index.html"), "utf8");
const wordmark = await readFile(
  path.join(root, "public/brand/jetsetplay-wordmark.svg"),
  "utf8",
);
const board = html.match(/<svg[^>]*data-board-face="v2"[\s\S]*?<\/svg>/u)?.[0];

if (!board) {
  throw new Error("Compiled Home board was not found");
}

const colorways = {
  "house-felt": {
    dark: "#1A1A1A",
    field: "#173D32",
    light: "#F5F1E8",
  },
  "night-lacquer": {
    dark: "#5A2030",
    field: "#1A1A1A",
    light: "#F5F1E8",
  },
  "salon-oxblood": {
    dark: "#1A1A1A",
    field: "#5A2030",
    light: "#F5F1E8",
  },
};
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const wordmarkData = `data:image/svg+xml;base64,${Buffer.from(wordmark).toString("base64")}`;
const centerWordmark = await sharp(Buffer.from(wordmark))
  .resize({ width: 360, height: 70, fit: "contain", background: transparent })
  .png()
  .toBuffer();
const makerHorizontal = await sharp(Buffer.from(wordmark))
  .resize({ width: 424, height: 80, fit: "contain", background: transparent })
  .png()
  .toBuffer();
const makerWordmark = await sharp(makerHorizontal)
  .rotate(270, { background: transparent })
  .png()
  .toBuffer();

await mkdir(output, { recursive: true });

for (const [name, palette] of Object.entries(colorways)) {
  const svg = board
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replaceAll("var(--board-dark)", palette.dark)
    .replaceAll("var(--board-field)", palette.field)
    .replaceAll("var(--board-light)", palette.light)
    .replaceAll("/brand/jetsetplay-wordmark.svg", wordmarkData)
    .replaceAll("&quot;", "&apos;");

  await writeFile(path.join(output, `board-${name}.svg`), svg, "utf8");
  const boardWithoutNestedImages = svg
    .replaceAll(/<image[\s\S]*?<\/image>/gu, "")
    .replaceAll(/<image[\s\S]*?\/>/gu, "");
  await sharp(Buffer.from(boardWithoutNestedImages))
    .resize({ width: 2000 })
    .composite([
      { input: Buffer.from(makerWordmark), left: 34, top: 491 },
      { input: Buffer.from(centerWordmark), left: 820, top: 668 },
    ])
    .png()
    .toFile(path.join(output, `board-${name}.png`));
}

process.stdout.write(`${output}\n`);
