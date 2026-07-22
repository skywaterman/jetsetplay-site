import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const AGENTS_PATH = path.join(ROOT, "AGENTS.md");
const MANIFESTO_PATH = path.join(ROOT, "docs", "MANIFESTO.md");
const GENERATED_PATH = path.join(
  ROOT,
  "server",
  "generated",
  "proposal-system-context.ts",
);

function hash(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const [agents, manifesto] = await Promise.all([
  readFile(AGENTS_PATH, "utf8"),
  readFile(MANIFESTO_PATH, "utf8"),
]);

const context = [
  "SOURCE: AGENTS.md",
  agents.trimEnd(),
  "SOURCE: docs/MANIFESTO.md",
  manifesto.trimEnd(),
].join("\n\n");

const generated = [
  `export const AGENTS_CONTEXT_SHA256 = ${JSON.stringify(hash(agents))} as const;`,
  `export const MANIFESTO_CONTEXT_SHA256 = ${JSON.stringify(hash(manifesto))} as const;`,
  `export const PROPOSAL_SYSTEM_CONTEXT_SHA256 = ${JSON.stringify(hash(context))} as const;`,
  `export const PROPOSAL_SYSTEM_CONTEXT = ${JSON.stringify(context)} as const;`,
  "",
].join("\n");

if (process.argv.includes("--check")) {
  const current = await readFile(GENERATED_PATH, "utf8").catch(() => "");
  if (current !== generated) {
    throw new Error("Proposal system context is out of sync.");
  }
  process.stdout.write(`${hash(context)}\n`);
} else {
  await mkdir(path.dirname(GENERATED_PATH), { recursive: true });
  await writeFile(GENERATED_PATH, generated, "utf8");
  process.stdout.write(`${hash(context)}\n`);
}
