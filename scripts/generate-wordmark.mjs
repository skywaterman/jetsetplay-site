import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as fontkit from "fontkit";

const FONT_PATH = "/System/Library/Fonts/Avenir Next.ttc";
const FONT_POSTSCRIPT_NAME = "AvenirNext-Heavy";
const FONT_SOURCE_SHA256 =
  "98dec241f3ee712a37fad61aafdb83e225ed54c3e5b6e9f0abeb24eba13743ba";
const WORD = "JetSetPlay";
const TRACKING = -18;
const PIP_DIAMETER = 112;
const PIP_GAP = 46;
const PADDING = 32;
const OUTPUT_PATH = resolve(
  process.argv[2] ?? "public/brand/jetsetplay-wordmark.svg",
);

const font = fontkit.openSync(FONT_PATH, FONT_POSTSCRIPT_NAME);
const run = font.layout(WORD, { liga: false });
const wordCommands = [];
let cursorX = 0;

for (const [index, glyph] of run.glyphs.entries()) {
  const position = run.positions[index];
  const offsetX = cursorX + position.xOffset;
  const offsetY = position.yOffset;

  for (const command of glyph.path.commands) {
    wordCommands.push({
      command: command.command,
      args: command.args.map((value, argIndex) =>
        argIndex % 2 === 0 ? value + offsetX : value + offsetY,
      ),
    });
  }

  cursorX += position.xAdvance + (index === run.glyphs.length - 1 ? 0 : TRACKING);
}

const pipRadius = PIP_DIAMETER / 2;
const pipCenterX = cursorX + PIP_GAP + pipRadius;
const pipCenterY = pipRadius;
const circleControl = pipRadius * 0.552284749831;
const pipCommands = [
  {
    command: "moveTo",
    args: [pipCenterX + pipRadius, pipCenterY],
  },
  {
    command: "bezierCurveTo",
    args: [
      pipCenterX + pipRadius,
      pipCenterY + circleControl,
      pipCenterX + circleControl,
      pipCenterY + pipRadius,
      pipCenterX,
      pipCenterY + pipRadius,
    ],
  },
  {
    command: "bezierCurveTo",
    args: [
      pipCenterX - circleControl,
      pipCenterY + pipRadius,
      pipCenterX - pipRadius,
      pipCenterY + circleControl,
      pipCenterX - pipRadius,
      pipCenterY,
    ],
  },
  {
    command: "bezierCurveTo",
    args: [
      pipCenterX - pipRadius,
      pipCenterY - circleControl,
      pipCenterX - circleControl,
      pipCenterY - pipRadius,
      pipCenterX,
      pipCenterY - pipRadius,
    ],
  },
  {
    command: "bezierCurveTo",
    args: [
      pipCenterX + circleControl,
      pipCenterY - pipRadius,
      pipCenterX + pipRadius,
      pipCenterY - circleControl,
      pipCenterX + pipRadius,
      pipCenterY,
    ],
  },
  { command: "closePath", args: [] },
];

const allPoints = [...wordCommands, ...pipCommands].flatMap(({ args }) => {
  const points = [];

  for (let index = 0; index < args.length; index += 2) {
    points.push({ x: args[index], y: args[index + 1] });
  }

  return points;
});
const bounds = allPoints.reduce(
  (current, point) => ({
    minX: Math.min(current.minX, point.x),
    minY: Math.min(current.minY, point.y),
    maxX: Math.max(current.maxX, point.x),
    maxY: Math.max(current.maxY, point.y),
  }),
  {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  },
);
const viewBoxWidth = bounds.maxX - bounds.minX + PADDING * 2;
const viewBoxHeight = bounds.maxY - bounds.minY + PADDING * 2;

function number(value) {
  const normalized = Math.abs(value) < 0.0005 ? 0 : value;
  return normalized.toFixed(3);
}

function point(x, y) {
  return [
    x - bounds.minX + PADDING,
    bounds.maxY - y + PADDING,
  ];
}

function pathData(commands) {
  return commands
    .map(({ command, args }) => {
      if (command === "closePath") {
        return "Z";
      }

      const points = [];

      for (let index = 0; index < args.length; index += 2) {
        const [x, y] = point(args[index], args[index + 1]);
        points.push(number(x), number(y));
      }

      const commandLetter = {
        moveTo: "M",
        lineTo: "L",
        quadraticCurveTo: "Q",
        bezierCurveTo: "C",
      }[command];

      if (!commandLetter) {
        throw new Error(`Unsupported path command: ${command}`);
      }

      return `${commandLetter} ${points.join(" ")}`;
    })
    .join(" ");
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${number(viewBoxWidth)} ${number(viewBoxHeight)}" role="img" aria-labelledby="wordmark-title wordmark-description">
  <title id="wordmark-title">JetSetPlay.</title>
  <desc id="wordmark-description">JetSetPlay wordmark with fuchsia Pip</desc>
  <metadata>Outlined from ${FONT_POSTSCRIPT_NAME}; source-sha256 ${FONT_SOURCE_SHA256}</metadata>
  <path id="wordmark" fill="#1A1A1A" d="${pathData(wordCommands)}"/>
  <path id="pip" fill="#DD0F4C" d="${pathData(pipCommands)}"/>
</svg>
`;

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, svg, "utf8");
process.stdout.write(`${OUTPUT_PATH}\n`);
