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
const auditedRoots = ["app"];
const auditedFiles = [
  ".eslintrc.json",
  "next.config.ts",
  "package.json",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
];
const forbidden = [
  { label: "em dash", pattern: /\u2014/u },
  { label: "placeholder note", pattern: /TODO/iu },
  { label: "sample filler", pattern: /lorem ipsum/iu },
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

process.stdout.write("Phase 1 source audit passed.\n");
