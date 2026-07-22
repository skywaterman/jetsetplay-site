import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = process.cwd();
const evidenceRoot = path.join(root, "outputs/evidence/phase-5");
const slugs = ["home", "work", "games", "your-proposal", "commission"];
const viewportHeights = new Map([
  [375, 812],
  [1440, 1000],
]);
const expectedTitle = "JetSetPlay · Games designed to be gifted.™";

function linearChannel(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/gu)
    .map((channel) => Number.parseInt(channel, 16));

  return (
    0.2126 * linearChannel(channels[0]) +
    0.7152 * linearChannel(channels[1]) +
    0.0722 * linearChannel(channels[2])
  );
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const [
  layout,
  styles,
  pageShell,
  pageReveal,
  browserProofSource,
  packageSource,
  lighthouseDesktopSource,
  lighthouseMobileSource,
] = await Promise.all([
    readFile(path.join(root, "app/layout.tsx"), "utf8"),
    readFile(path.join(root, "app/globals.css"), "utf8"),
    readFile(path.join(root, "components/site/PageShell.tsx"), "utf8"),
    readFile(path.join(root, "components/site/PageReveal.tsx"), "utf8"),
    readFile(path.join(evidenceRoot, "browser-proof.json"), "utf8"),
    readFile(path.join(root, "package.json"), "utf8"),
    readFile(path.join(evidenceRoot, "lighthouse-desktop.json"), "utf8"),
    readFile(path.join(evidenceRoot, "lighthouse-mobile.json"), "utf8"),
  ]);

const packageJson = JSON.parse(packageSource);
assert.equal(
  packageJson.dependencies["framer-motion"],
  "12.42.2",
  "Framer Motion must be locked to the reviewed build version",
);

for (const [profile, source] of [
  ["desktop", lighthouseDesktopSource],
  ["mobile", lighthouseMobileSource],
]) {
  const report = JSON.parse(source);
  for (const category of ["performance", "accessibility", "best-practices"]) {
    const score = report.categories[category].score * 100;
    assert.ok(score >= 95, `${profile} ${category} score is ${score}`);
  }
  assert.equal(
    report.audits["errors-in-console"].details.items.length,
    0,
    `${profile} Lighthouse recorded console errors`,
  );
}

for (const marker of [
  "metadataBase:",
  "description:",
  "icons:",
  "openGraph:",
  "twitter:",
  "robots:",
  'url: "/og.png"',
]) {
  assert.ok(layout.includes(marker), `Metadata marker is missing: ${marker}`);
}

assert.ok(
  pageReveal.includes('from "framer-motion"'),
  "The canon-required motion library is not used for the reveal",
);
assert.ok(
  pageReveal.includes("LazyMotion") && pageReveal.includes("domAnimation"),
  "The page reveal does not use the reduced Framer Motion feature bundle",
);
assert.ok(
  pageReveal.includes("useReducedMotion"),
  "The page reveal does not honor reduced motion at render time",
);
assert.ok(
  pageReveal.includes("initial={reduceMotion ? false"),
  "The page reveal does not disable its entrance under reduced motion",
);
assert.ok(
  !pageReveal.includes("opacity: 0"),
  "The reveal must not hide the largest paint while JavaScript starts",
);
assert.ok(
  styles.includes("@media (prefers-reduced-motion: reduce)"),
  "The reduced motion media query is missing",
);
assert.ok(
  styles.includes(".proposal-studio__form :focus-visible"),
  "The proposal form focus treatment is missing",
);
assert.ok(
  pageShell.includes("<PageReveal>{children}</PageReveal>"),
  "PageShell does not apply the single reveal wrapper",
);
assert.ok(
  pageReveal.includes('className="page-reveal"'),
  "PageReveal does not expose the expected class",
);

const contrastPairs = [
  ["ink on cream", "#1A1A1A", "#F5F1E8"],
  ["cream on felt", "#F5F1E8", "#173D32"],
  ["cream on oxblood", "#F5F1E8", "#5A2030"],
  ["fuchsia on cream", "#C8235F", "#F5F1E8"],
];

for (const [label, foreground, background] of contrastPairs) {
  const ratio = contrast(foreground, background);
  assert.ok(ratio >= 4.5, `${label} contrast is ${ratio.toFixed(2)}:1`);
}

const browserProof = JSON.parse(browserProofSource);
assert.equal(browserProof.pages.length, slugs.length * viewportHeights.size);

for (const slug of slugs) {
  for (const [width, expectedHeight] of viewportHeights) {
    const proof = browserProof.pages.find(
      (entry) => entry.slug === slug && entry.width === width,
    );
    assert.ok(proof, `Browser proof is missing for ${slug} at ${width}px`);
    assert.equal(proof.errors, 0, `Console errors found on ${slug} at ${width}px`);
    assert.equal(proof.metrics.h1, 1, `H1 count failed on ${slug} at ${width}px`);
    assert.equal(proof.metrics.title, expectedTitle);
    assert.equal(proof.metrics.viewport, width);
    assert.equal(proof.metrics.width, width, `Horizontal overflow on ${slug}`);
    assert.equal(proof.metrics.scrollY, 0, `Capture is scrolled on ${slug}`);
    assert.equal(proof.metrics.ogImage, "https://jetsetplay.co/og.png");

    const screenshot = path.join(evidenceRoot, `${slug}-${width}.png`);
    const metadata = await sharp(screenshot).metadata();
    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, width);
    assert.equal(metadata.height, expectedHeight);
  }
}

assert.equal(browserProof.focus.outlineColor, "rgb(245, 241, 232)");
assert.equal(browserProof.focus.outlineStyle, "solid");
assert.equal(browserProof.focus.outlineWidth, "2px");
assert.equal(browserProof.proposalInteractions.error.state, "error");
assert.equal(
  browserProof.proposalInteractions.error.focusedRecoveryMessage,
  true,
);
assert.equal(browserProof.proposalInteractions.success.length, 2);
for (const success of browserProof.proposalInteractions.success) {
  assert.equal(success.focusedResult, true);
  assert.equal(success.h1, 1);
  assert.equal(success.scrollY, 0);
  assert.equal(success.siteChromeVisible, false);
}
assert.equal(
  browserProof.proposalInteractions.success[0].publicSignalMentions,
  0,
);
assert.equal(
  browserProof.proposalInteractions.success[1].boardAlignedWithResult,
  true,
);

const ogMetadata = await sharp(path.join(root, "public/og.png")).metadata();
assert.equal(ogMetadata.format, "png");
assert.equal(ogMetadata.width, 1200);
assert.equal(ogMetadata.height, 630);

process.stdout.write("Phase 5 local quality audit passed.\n");
