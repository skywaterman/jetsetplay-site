import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const clientRoots = [
  path.join(process.cwd(), ".next", "static"),
  path.join(process.cwd(), "public"),
];
const prerenderRoot = path.join(process.cwd(), ".next", "server", "app");
const secretValues = [
  process.env.ANTHROPIC_API_KEY,
  process.env.PDF_RENDERER_SECRET,
].filter((value) => typeof value === "string" && value.length >= 12);
const forbiddenClientMarkers = [
  "$10M ARR",
  "AGENTS.md",
  "ANTHROPIC_API_KEY",
  "Battery Rev",
  "Dream Master List",
  "MANIFESTO.md",
  "Paddock Line",
  "Sky Waterman",
  "Steve Waterman",
  "Vaultbreakers",
  "Wake Babalu",
  "jsp-proposal-tracker-v4",
];

if (secretValues.length === 0) {
  throw new Error("Set server secret canaries before running this audit.");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(filePath)));
    } else {
      files.push(filePath);
    }
  }

  return files;
}

const clientFiles = (
  await Promise.all(clientRoots.map((directory) => walk(directory)))
).flat();
const prerenderFiles = (await walk(prerenderRoot)).filter(
  (filePath) => filePath.endsWith(".html") || filePath.endsWith(".rsc"),
);

for (const filePath of [...clientFiles, ...prerenderFiles]) {
  const contents = await readFile(filePath);
  for (const secret of secretValues) {
    if (contents.includes(Buffer.from(secret))) {
      throw new Error(`Server secret leaked into ${path.relative(process.cwd(), filePath)}`);
    }
  }

  for (const marker of forbiddenClientMarkers) {
    if (contents.includes(Buffer.from(marker))) {
      throw new Error(
        `Internal marker leaked into ${path.relative(process.cwd(), filePath)}`,
      );
    }
  }
}

process.stdout.write("Client secret audit passed.\n");
