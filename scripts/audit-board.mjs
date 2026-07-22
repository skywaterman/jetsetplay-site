import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

const root = process.cwd();
const home = await readFile(path.join(root, ".next/server/app/index.html"), "utf8");
const proposal = await readFile(
  path.join(root, ".next/server/app/your-proposal.html"),
  "utf8",
);
const boardSource = await readFile(
  path.join(root, "components/board/BoardFace.tsx"),
  "utf8",
);
const recolorSource = await readFile(
  path.join(root, "components/board/HomeBoardRecolor.tsx"),
  "utf8",
);
const contractSource = await readFile(
  path.join(root, "lib/board-face.ts"),
  "utf8",
);
const globalStyles = await readFile(
  path.join(root, "app/globals.css"),
  "utf8",
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`, "u"))?.[1];
}

function boardFrom(html, label) {
  const boards = html.match(/<svg[^>]*data-board-face="v2"[\s\S]*?<\/svg>/gu) ?? [];
  assert(boards.length === 1, `${label} must contain exactly one Board Face v2`);
  return boards[0];
}

function regionTag(svg, region, element = "rect") {
  const tag = svg.match(
    new RegExp(`<${element}[^>]*data-board-region="${region}"[^>]*>`, "u"),
  )?.[0];
  assert(tag, `Missing ${region} region`);
  return tag;
}

function numericAttribute(tag, name) {
  const value = Number(attribute(tag, name));
  assert(Number.isFinite(value), `Missing numeric ${name}`);
  return value;
}

function executableBoardModule() {
  const componentWithoutImports = boardSource
    .replace(/import type \{ CSSProperties \} from "react";\n/u, "")
    .replace(/import \{[\s\S]*?\} from "@\/lib\/board-face";\n/u, "");
  const output = ts.transpileModule(
    `const React = require("react");\n${contractSource}\n${componentWithoutImports}`,
    {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const loaded = { exports: {} };
  const evaluate = new Function("module", "exports", "require", output);

  evaluate(loaded, loaded.exports, require);
  return loaded.exports;
}

const homeBoard = boardFrom(home, "Home");
const proposalBoard = boardFrom(proposal, "Your Proposal");
const rootTag = homeBoard.match(/^<svg[^>]*>/u)?.[0] ?? "";
const proposalRootTag = proposalBoard.match(/^<svg[^>]*>/u)?.[0] ?? "";

assert(attribute(rootTag, "viewBox") === "0 0 2000 1406", "Canvas must be 2000x1406");
assert(attribute(rootTag, "data-board-variant") === "house", "Home must use house variant");
assert(attribute(rootTag, "aria-hidden") === "true", "Home board must be decorative");
assert(attribute(proposalRootTag, "role") === "img", "Proposal study must expose an image role");
assert(
  attribute(proposalRootTag, "aria-label") === "JetSetPlay game board",
  "Proposal study must have a brand-specific accessible name",
);

const pointTags = homeBoard.match(/<polygon[^>]*data-board-point=""[^>]*>/gu) ?? [];
assert(pointTags.length === 24, `Expected 24 points, found ${pointTags.length}`);

const left = [123, 246, 369, 492, 615, 738];
const right = [1139, 1262, 1385, 1508, 1631, 1754];
const starts = [...left, ...right];

for (const [index, tag] of pointTags.entries()) {
  const rowIndex = index % 12;
  const x = starts[rowIndex];
  const pointIndex = rowIndex % 6;
  const tone = pointIndex % 2 === 0 ? "light" : "dark";
  const row = index < 12 ? "top" : "bottom";
  const baseY = row === "top"
    ? tone === "light" ? 42 : 28
    : tone === "light" ? 1364 : 1378;
  const tipY = row === "top" ? 606 : 800;
  const expected = `${x},${baseY} ${x + 123},${baseY} ${x + 61.5},${tipY}`;

  assert(attribute(tag, "data-board-row") === row, `Point ${index} row mismatch`);
  assert(attribute(tag, "data-board-tone") === tone, `Point ${index} tone mismatch`);
  assert(attribute(tag, "points") === expected, `Point ${index} geometry mismatch`);
}

const border = regionTag(homeBoard, "border");
assert(numericAttribute(border, "width") === 2000, "Border width must be 2000");
assert(numericAttribute(border, "height") === 1406, "Border height must be 1406");

const field = regionTag(homeBoard, "field");
assert(numericAttribute(field, "x") === 28, "Field x must be 28");
assert(numericAttribute(field, "y") === 28, "Field y must be 28");
assert(numericAttribute(field, "width") === 1944, "Field width must be 1944");
assert(numericAttribute(field, "height") === 1350, "Field height must be 1350");

const leftStrip = regionTag(homeBoard, "left-edge-strip");
const rightStrip = regionTag(homeBoard, "right-edge-strip");
assert(numericAttribute(leftStrip, "x") === 28, "Left strip x must be 28");
assert(numericAttribute(leftStrip, "width") === 92, "Left strip interior must be 92");
assert(numericAttribute(rightStrip, "x") === 1880, "Right strip x must be 1880");
assert(numericAttribute(rightStrip, "width") === 92, "Right strip interior must be 92");

assert(homeBoard.includes('data-board-region="maker-mark"'), "House maker mark is required");
assert(homeBoard.includes('href="/brand/jetsetplay-wordmark.svg"'), "Maker mark must use master artwork");
assert(homeBoard.includes('transform="rotate(-90 74 703)"'), "Maker mark must stay inside the strip interior");
const makerGroup = homeBoard.match(
  /<g[^>]*data-board-region="maker-mark"[^>]*>[\s\S]*?<\/g>/u,
)?.[0];
assert(makerGroup, "Maker group must render");
const makerPlate = makerGroup.match(/<rect[^>]*>/u)?.[0] ?? "";
const makerX = numericAttribute(makerPlate, "x");
const makerY = numericAttribute(makerPlate, "y");
const makerWidth = numericAttribute(makerPlate, "width");
const makerHeight = numericAttribute(makerPlate, "height");
const makerLeft = 74 + makerY - 703;
const makerRight = makerLeft + makerHeight;
assert(makerX === -138 && makerWidth === 424, "Maker length must be 424");
assert(makerLeft >= 28 && makerRight <= 120, "Maker plate must not cross the border");
assert(homeBoard.includes('data-board-region="client-logo"'), "Client logo is required");
assert(!homeBoard.includes('data-board-region="center-bar"'), "Center bar is forbidden");
assert(!homeBoard.includes("Backgammon Social"), "Product line script is forbidden on board");
assert(!/<text[^>]*>[\s\S]*JetSetPlay/iu.test(homeBoard), "Maker mark cannot be retyped");

const logo = regionTag(homeBoard, "client-logo", "image");
assert(numericAttribute(logo, "x") === 820, "Client logo x must be 820");
assert(numericAttribute(logo, "y") === 668, "Client logo y must be 668");
assert(numericAttribute(logo, "width") === 360, "Client logo width must be 360");
assert(numericAttribute(logo, "height") === 70, "Client logo height must be 70");

assert(
  home.includes('data-board-colorways="house-felt salon-oxblood night-lacquer"'),
  "Home must declare all three test colorways",
);
assert(home.includes("--brand-field:#173D32"), "SSR field fallback must be felt");
assert(home.includes("--brand-primary:#1A1A1A"), "SSR dark fallback must be ink");
assert(proposalBoard.includes("--brand-field:#5A2030"), "Proposal study must use oxblood");
assert(
  /\.board-face\s*\{[^}]*--board-dark:\s*var\(--brand-primary\);[^}]*--board-field:\s*var\(--brand-field\);[^}]*--board-light:\s*var\(--brand-secondary\);[^}]*\}/su.test(
    globalStyles,
  ),
  "Each board must resolve its palette from local brand tokens",
);
const { BoardFace, homeBoardFieldAtScroll } = executableBoardModule();
const clientFixture = {
  field: "#315B53",
  logo: { alt: "Contract Client", src: "/brand/contract-client.svg" },
  motif: "Monogram",
  name: "Contract Client",
  primary: "#142421",
  secondary: "#F4EFE4",
};
const clientMarkup = renderToStaticMarkup(
  React.createElement(BoardFace, {
    brand: clientFixture,
    decorative: false,
    variant: "client",
  }),
);
assert(clientMarkup.includes('data-board-variant="client"'), "Client fixture must render as client");
assert(!clientMarkup.includes('data-board-region="maker-mark"'), "Client fixture cannot contain the JSP maker mark");
assert(!clientMarkup.includes("jetsetplay-wordmark.svg"), "Client fixture cannot contain JSP artwork");
assert(clientMarkup.includes('aria-label="Contract Client game board"'), "Client fixture needs a stable accessible name");

for (const forbidden of ["#C8235F", "#dd0f4c", "#DD0F4C80"]) {
  assert(
    (() => {
      try {
        renderToStaticMarkup(
          React.createElement(BoardFace, {
            brand: { ...clientFixture, primary: forbidden },
            variant: "client",
          }),
        );
        return false;
      } catch {
        return true;
      }
    })(),
    `Client fixture must reject ${forbidden}`,
  );
}
assert(
  recolorSource.includes('"(prefers-reduced-motion: reduce)"'),
  "Reduced-motion preference is required",
);
assert(
  recolorSource.includes("motionPreference.matches"),
  "Reduced-motion preference must control the recolor",
);
assert(
  recolorSource.includes('motionPreference.matches ? "reduced" : "scroll"'),
  "Reduced motion must expose its rendered state",
);
assert(
  recolorSource.includes("homeBoardFieldAtScroll("),
  "Scroll mapping must preserve the initial felt render",
);
assert(recolorSource.includes('"--brand-primary": felt.primary'), "Scroll recolor must leave dark points fixed");
assert(
  !recolorSource.includes("setPrimary") &&
    !recolorSource.includes("setSecondary"),
  "Scroll recolor must change only one board color",
);
assert(
  homeBoardFieldAtScroll(0, 1000, false) === "#173D32",
  "Scroll recolor must begin at deep felt",
);
assert(
  homeBoardFieldAtScroll(250, 1000, false) === "#173D32",
  "Scroll recolor must hold deep felt through the opening plateau",
);
assert(
  homeBoardFieldAtScroll(500, 1000, false) === "#1e4338",
  "Scroll recolor must interpolate only within the middle interval",
);
assert(
  homeBoardFieldAtScroll(750, 1000, false) === "#24483D",
  "Scroll recolor must settle at lifted felt",
);
assert(
  homeBoardFieldAtScroll(1000, 1000, true) === "#173D32",
  "Reduced motion must freeze the field at deep felt",
);

process.stdout.write("Board Face Standard v2 build audit passed.\n");
