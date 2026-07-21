import type { CSSProperties } from "react";
import {
  BOARD_GEOMETRY,
  boardIncludesMakerMark,
  boardPaletteIsValid,
  clientPaletteUsesJspFuchsia,
  type BoardBrand,
} from "@/lib/board-face";

export type BoardVariant = "client" | "house";

type BoardFaceProps = Readonly<{
  brand: BoardBrand;
  className?: string;
  decorative?: boolean;
  inheritPalette?: boolean;
  variant: BoardVariant;
}>;

type BrandTokenStyle = CSSProperties & {
  "--brand-field"?: string;
  "--brand-motif"?: string;
  "--brand-name"?: string;
  "--brand-primary"?: string;
  "--brand-secondary"?: string;
};

const pointStarts = [
  ...BOARD_GEOMETRY.leftPointStarts,
  ...BOARD_GEOMETRY.rightPointStarts,
];

function brandTokenStyle(brand: BoardBrand, inheritPalette: boolean) {
  const style: BrandTokenStyle = {
    "--brand-motif": `"${brand.motif}"`,
    "--brand-name": `"${brand.name}"`,
  };

  if (!inheritPalette) {
    style["--brand-field"] = brand.field;
    style["--brand-primary"] = brand.primary;
    style["--brand-secondary"] = brand.secondary;
  }

  return style;
}

function pointTone(index: number) {
  return index % 2 === 0 ? "light" : "dark";
}

function pointFill(index: number) {
  return pointTone(index) === "light"
    ? "var(--board-light)"
    : "var(--board-dark)";
}

function topPoint(x: number, index: number) {
  const baseY = pointTone(index) === "light" ? 42 : 28;

  return `${x},${baseY} ${x + BOARD_GEOMETRY.pitch},${baseY} ${
    x + BOARD_GEOMETRY.pitch / 2
  },${BOARD_GEOMETRY.topTipY}`;
}

function bottomPoint(x: number, index: number) {
  const baseY = pointTone(index) === "light" ? 1364 : 1378;

  return `${x},${baseY} ${x + BOARD_GEOMETRY.pitch},${baseY} ${
    x + BOARD_GEOMETRY.pitch / 2
  },${BOARD_GEOMETRY.bottomTipY}`;
}

export function BoardFace({
  brand,
  className = "",
  decorative = true,
  inheritPalette = false,
  variant,
}: BoardFaceProps) {
  if (!brand.name.trim()) {
    throw new Error("Board brands require a name");
  }

  if (!boardPaletteIsValid(brand)) {
    throw new Error("Board palettes require valid CSS hex colors");
  }

  if (variant === "client" && clientPaletteUsesJspFuchsia(brand)) {
    throw new Error("Client board palettes cannot contain JSP fuchsia");
  }

  const accessibleProps = decorative
    ? ({ "aria-hidden": true, focusable: "false" } as const)
    : ({
        "aria-label": `${brand.name.trim()} game board`,
        focusable: "false",
        role: "img",
      } as const);

  return (
    <svg
      {...accessibleProps}
      className={`board-face ${className}`.trim()}
      data-board-face="v2"
      data-board-variant={variant}
      data-brand-motif={brand.motif}
      data-brand-name={brand.name}
      style={brandTokenStyle(brand, inheritPalette)}
      viewBox={`0 0 ${BOARD_GEOMETRY.width} ${BOARD_GEOMETRY.height}`}
    >
      <rect
        data-board-region="border"
        fill="var(--board-dark)"
        height={BOARD_GEOMETRY.height}
        width={BOARD_GEOMETRY.width}
      />
      <rect
        data-board-region="field"
        fill="var(--board-field)"
        height={BOARD_GEOMETRY.height - BOARD_GEOMETRY.border * 2}
        width={BOARD_GEOMETRY.width - BOARD_GEOMETRY.border * 2}
        x={BOARD_GEOMETRY.border}
        y={BOARD_GEOMETRY.border}
      />
      <rect
        data-board-region="left-edge-strip"
        fill="var(--board-dark)"
        height={BOARD_GEOMETRY.height - BOARD_GEOMETRY.border * 2}
        width={BOARD_GEOMETRY.edgeStrip - BOARD_GEOMETRY.border}
        x={BOARD_GEOMETRY.border}
        y={BOARD_GEOMETRY.border}
      />
      <rect
        data-board-region="right-edge-strip"
        fill="var(--board-dark)"
        height={BOARD_GEOMETRY.height - BOARD_GEOMETRY.border * 2}
        width={BOARD_GEOMETRY.edgeStrip - BOARD_GEOMETRY.border}
        x={BOARD_GEOMETRY.width - BOARD_GEOMETRY.edgeStrip}
        y={BOARD_GEOMETRY.border}
      />

      {pointStarts.map((x, index) => (
        <polygon
          data-board-half={index < 6 ? "left" : "right"}
          data-board-index={index % 6}
          data-board-point=""
          data-board-row="top"
          data-board-tone={pointTone(index)}
          fill={pointFill(index)}
          key={`top-${x}`}
          points={topPoint(x, index)}
        />
      ))}
      {pointStarts.map((x, index) => (
        <polygon
          data-board-half={index < 6 ? "left" : "right"}
          data-board-index={index % 6}
          data-board-point=""
          data-board-row="bottom"
          data-board-tone={pointTone(index)}
          fill={pointFill(index)}
          key={`bottom-${x}`}
          points={bottomPoint(x, index)}
        />
      ))}

      {boardIncludesMakerMark(variant) ? (
        <g
          data-board-region="maker-mark"
          transform={`rotate(-90 74 ${
            BOARD_GEOMETRY.centerY
          })`}
        >
          <rect
            fill="var(--board-light)"
            height="80"
            width="424"
            x="-138"
            y="663"
          />
          <image
            aria-hidden="true"
            height="80"
            href="/brand/jetsetplay-wordmark.svg"
            preserveAspectRatio="xMidYMid meet"
            width="424"
            x="-138"
            y="663"
          />
        </g>
      ) : null}

      {brand.logo.background ? (
        <rect
          data-board-region="client-logo-plate"
          fill={brand.logo.background}
          height="96"
          width="420"
          x="790"
          y="655"
        />
      ) : null}
      <image
        aria-hidden="true"
        data-board-region="client-logo"
        height="70"
        href={brand.logo.src}
        preserveAspectRatio="xMidYMid meet"
        width="360"
        x="820"
        y="668"
      />
    </svg>
  );
}

export function renderBoard(
  brand: BoardBrand,
  options: Omit<BoardFaceProps, "brand"> = { variant: "client" },
) {
  return <BoardFace brand={brand} {...options} />;
}
