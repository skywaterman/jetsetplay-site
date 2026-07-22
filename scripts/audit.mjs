import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const expectedRoutes = [
  "app/commission/page.tsx",
  "app/games/page.tsx",
  "app/page.tsx",
  "app/work/page.tsx",
  "app/your-proposal/page.tsx",
];
const auditedRoots = ["app", "components", "lib", "server/proposal"];
const auditedFiles = [
  ".eslintrc.json",
  "next.config.ts",
  "package.json",
  "postcss.config.mjs",
  "scripts/audit-proposal-server.mjs",
  "scripts/audit-client-secrets.mjs",
  "scripts/audit-phase5.mjs",
  "scripts/capture-live-proposal-demos.mjs",
  "scripts/proposal-browser-fixture.mjs",
  "scripts/sync-proposal-context.mjs",
  "services/pdf-renderer/.dockerignore",
  "services/pdf-renderer/Dockerfile.vercel",
  "services/pdf-renderer/README.md",
  "services/pdf-renderer/build_fonts.py",
  "services/pdf-renderer/renderer.py",
  "services/pdf-renderer/requirements.txt",
  "services/pdf-renderer/server.py",
  "services/pdf-renderer/tests/test_http.py",
  "services/pdf-renderer/tests/test_renderer.py",
  "tailwind.config.ts",
  "tsconfig.json",
  "tsconfig.proposal-server.json",
  "vercel.json",
];
const forbidden = [
  { label: "en dash", pattern: /\u2013/u },
  { label: "em dash", pattern: /\u2014/u },
  { label: "placeholder note", pattern: /TODO/iu },
  { label: "sample filler", pattern: /lorem ipsum/iu },
];
const repositoryTextExtensions = new Set([
  ".css",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".py",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const ignoredRepositoryDirectories = new Set([".git", ".next", "node_modules"]);
const expectedCopy = [
  "Home",
  "Work",
  "Games",
  "Your Proposal",
  "Commission",
  "JetSetPlay · San Francisco",
  "Custom-branded games. Made to be kept.",
  "JETSETPLAY · SAN FRANCISCO",
  "A gift is communication you can hold.",
  "We design heritage games in your brand's language. Built to be kept. Made to be played for decades.",
  "Commission a game",
  "See your proposal live",
  "Presence is the last luxury.",
  "Most gifts are consumed and forgotten by Friday. A game returns. Every time your client sets the board, your brand is back on the table, in their home, between people they love. We call this recognition frequency. It is why a board outlasts a dinner, a basket, and every bottle you have ever sent.",
  "Merch gets stored. Games get replayed. So we measure differently. Not impressions, interactions. Not distribution, connection. Not cost per gift, value per relationship. Count the conversations started, the memories that now include you, and the number of times the board comes back out.",
  "One studio. Five ways to be remembered.",
  "Backgammon. The flagship. Your brand, translated into a board built to outlive the deal that inspired it.",
  "TALISMAN. Dominoes as objects of meaning. Twenty-eight small reasons to think of you.",
  "CLACK. Mahjong, taught by the tiles themselves. The first set anyone can learn from the corner up.",
  "Dossier. A parlor mystery written for your table only. An evening no one else can buy.",
  "MINIS. Charms that live on chips, keys, and collars. The smallest possible unit of presence.",
  "On the tables of",
  "Coral Casino. Fischer Travel. Montecito Club. Godmothers. Distributed Global. Makaira. Film Roman.",
  "Play It Back · Edition 01 · Beirut",
  "Two hundred fifty boards. Seventy-two percent to the Unite Lebanon Youth Project. Because a game teaches the same thing everywhere: your move matters.",
  "The Beirut edition",
  "Your brand is in play.",
  "Work that stayed on the table.",
  "Coral Casino: A board for a hundred-year clubhouse. It looks like it was always there.",
  "Fischer Travel: For clients who have everything, the one thing they did not.",
  "Montecito Club: Course green, bunker sand, brass. The nineteenth hole, boxed.",
  "Godmothers: A literary house deserves a literate game.",
  "Distributed Global: The long game, for people who invest in it.",
  "Film Roman: Where the characters got their own seat at the table.",
  "Yours belongs here.",
  "Designed to be gifted. Built to be played.",
  "Backgammon: Five thousand years old and still the fastest way to know someone. We build yours to Board Standard v2: your marks, your materials, your colors, correct to the millimeter.",
  "TALISMAN dominoes: Every tile a token. Line them up and read your brand like a sentence.",
  "CLACK mahjong: The corner index changed everything. The set that teaches while it plays, so the table grows instead of gatekeeping.",
  "Dossier: A mystery written for your people, your places, your inside jokes. Solved once, retold forever.",
  "MINIS: Presence at charm scale. On the chip, on the keyring, on the dog.",
  "Commission yours",
  "Your brand. On the board. In ninety seconds.",
  "Tell us who the gift is for. The studio engine drafts a concept in your brand's own language: colors, marks, materials, and the note that goes in the box.",
  "Your brand",
  "Who receives it",
  "The occasion",
  "Draft my proposal",
  "Setting the board",
  "Every board starts with a name. Give us yours.",
  "The board did not set. Check your entries and try again.",
  "Proposed by JetSetPlay.",
  "Make it real",
  "Get the custom catalogue.",
  "Email",
  "One-sheet",
  "TL;DR",
  "Four moves to a gift they keep.",
  "Signal. We study who you are and who this is for. The gift begins as listening.",
  "Design. Designed from your brand. Never decorated with it. Proofed to the millimeter.",
  "Craft. Materials chosen to age well. Built by hands, checked twice.",
  "Dispatch. Boxed, noted, delivered. The unboxing is part of the design.",
  "Start with a conversation.",
  "San Francisco · ciao@jetsetplay.co",
  "Book a call",
];

async function walk(directory) {
  const entries = await readdir(path.join(root, directory), {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const relative = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(relative)));
    } else {
      files.push(relative);
    }
  }

  return files;
}

async function walkRepositoryText(directory = ".") {
  const entries = await readdir(path.join(root, directory), {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredRepositoryDirectories.has(entry.name)) {
      continue;
    }

    const relative = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkRepositoryText(relative)));
      continue;
    }

    if (entry.name === ".env.local") {
      continue;
    }

    if (repositoryTextExtensions.has(path.extname(entry.name))) {
      files.push(relative);
    }
  }

  return files;
}

const sourceFiles = (
  await Promise.all(auditedRoots.map((directory) => walk(directory)))
).flat();
const pageRoutes = sourceFiles
  .filter((file) => file.endsWith("page.tsx"))
  .sort();

if (JSON.stringify(pageRoutes) !== JSON.stringify(expectedRoutes)) {
  throw new Error(`Unexpected page routes: ${pageRoutes.join(", ")}`);
}

for (const file of [...sourceFiles, ...auditedFiles]) {
  const contents = await readFile(path.join(root, file), "utf8");

  for (const rule of forbidden) {
    if (rule.pattern.test(contents)) {
      throw new Error(`${rule.label} found in ${file}`);
    }
  }
}

for (const file of await walkRepositoryText()) {
  const contents = await readFile(path.join(root, file), "utf8");

  for (const rule of forbidden.slice(0, 2)) {
    if (rule.pattern.test(contents)) {
      throw new Error(`${rule.label} found in ${file}`);
    }
  }
}

const copySource = await readFile(path.join(root, "lib/site-copy.ts"), "utf8");

for (const text of expectedCopy) {
  if (!copySource.includes(JSON.stringify(text))) {
    throw new Error(`Locked copy is missing or changed: ${text}`);
  }
}

if (copySource.includes(JSON.stringify("Custom games, designed to be gifted."))) {
  throw new Error("The non-canonical footer candidate is present in site copy");
}

process.stdout.write("Source, route, and locked-copy audit passed.\n");
