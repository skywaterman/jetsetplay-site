export type HexColor = `#${string}`;

export type BoardLogo = Readonly<{
  alt: string;
  background?: HexColor;
  src: string;
}>;

export type BoardBrand = Readonly<{
  field: HexColor;
  logo: BoardLogo;
  motif: string;
  name: string;
  primary: HexColor;
  secondary: HexColor;
}>;

export const BOARD_GEOMETRY = {
  border: 28,
  bottomTipY: 800,
  centerEndX: 1139,
  centerStartX: 861,
  centerWidth: 278,
  centerY: 703,
  edgeStrip: 120,
  height: 1406,
  leftPointStarts: [123, 246, 369, 492, 615, 738],
  pitch: 123,
  rightPointStarts: [1139, 1262, 1385, 1508, 1631, 1754],
  topTipY: 606,
  waistHeight: 194,
  width: 2000,
} as const;

const HOUSE_LOGO = {
  alt: "JetSetPlay.",
  background: "#F5F1E8",
  src: "/brand/jetsetplay-wordmark.svg",
} as const satisfies BoardLogo;

export const HOUSE_BOARD_COLORWAYS = {
  houseFelt: {
    field: "#173D32",
    logo: HOUSE_LOGO,
    motif: "Pip",
    name: "JetSetPlay",
    primary: "#1A1A1A",
    secondary: "#F5F1E8",
  },
  nightLacquer: {
    field: "#1A1A1A",
    logo: HOUSE_LOGO,
    motif: "Pip",
    name: "JetSetPlay",
    primary: "#5A2030",
    secondary: "#F5F1E8",
  },
  salonOxblood: {
    field: "#5A2030",
    logo: HOUSE_LOGO,
    motif: "Pip",
    name: "JetSetPlay",
    primary: "#1A1A1A",
    secondary: "#F5F1E8",
  },
} as const satisfies Record<string, BoardBrand>;

export const JSP_FUCHSIAS = ["#C8235F", "#DD0F4C"] as const;
export const HOME_BOARD_LIFTED_FELT = "#24483D" as const satisfies HexColor;

function mixHex(from: HexColor, to: HexColor, progress: number) {
  const channel = (hex: HexColor, start: number) =>
    Number.parseInt(hex.slice(start, start + 2), 16);
  const mixed = [1, 3, 5].map((start) =>
    Math.round(
      channel(from, start) +
        (channel(to, start) - channel(from, start)) * progress,
    )
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${mixed.join("")}` as HexColor;
}

export function homeBoardFieldAtScroll(
  scrollY: number,
  travel: number,
  reducedMotion: boolean,
) {
  const felt = HOUSE_BOARD_COLORWAYS.houseFelt.field;

  if (reducedMotion) {
    return felt;
  }

  const progress = Math.min(Math.max(scrollY / Math.max(travel, 1), 0), 1);
  const recolorProgress = Math.min(Math.max((progress - 0.25) / 0.5, 0), 1);

  if (recolorProgress === 0) {
    return felt;
  }

  if (recolorProgress === 1) {
    return HOME_BOARD_LIFTED_FELT;
  }

  return mixHex(felt, HOME_BOARD_LIFTED_FELT, recolorProgress);
}

export function isHexColor(value: string): value is HexColor {
  return /^#(?:[\dA-F]{3,4}|[\dA-F]{6}|[\dA-F]{8})$/iu.test(value);
}

function normalizedRgb(color: HexColor) {
  const value = color.slice(1).toUpperCase();

  if (value.length === 3 || value.length === 4) {
    return `#${value
      .slice(0, 3)
      .split("")
      .map((channel) => channel.repeat(2))
      .join("")}`;
  }

  return `#${value.slice(0, 6)}`;
}

export function boardPaletteIsValid(brand: BoardBrand) {
  return [
    brand.primary,
    brand.secondary,
    brand.field,
    brand.logo.background,
  ]
    .filter((color): color is HexColor => Boolean(color))
    .every(isHexColor);
}

export function clientPaletteUsesJspFuchsia(brand: BoardBrand) {
  const palette = [
    brand.primary,
    brand.secondary,
    brand.field,
    brand.logo.background,
  ]
    .filter((color): color is HexColor => Boolean(color))
    .filter(isHexColor)
    .map(normalizedRgb);

  return JSP_FUCHSIAS.some((color) => palette.includes(color));
}

export function boardIncludesMakerMark(variant: "client" | "house") {
  return variant === "house";
}
