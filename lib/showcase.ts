import type { BoardBrand } from "@/lib/board-face";

function textLogo(name: string, color: string) {
  const escaped = name.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 90"><text x="260" y="61" fill="${color}" font-family="Arial,sans-serif" font-size="42" font-weight="700" letter-spacing="1" text-anchor="middle">${escaped}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const WORK_BOARDS = {
  coralCasino: {
    field: "#409BD9",
    logo: {
      alt: "Coral Casino",
      background: "#FFF8F3",
      src: "/clients/coral-casino.svg",
    },
    motif: "Club",
    name: "Coral Casino",
    primary: "#004C6C",
    secondary: "#FFF8F3",
  },
  fischerTravel: {
    field: "#80684F",
    logo: {
      alt: "Fischer Travel",
      background: "#F7F1E6",
      src: textLogo("Fischer Travel", "#201C1C"),
    },
    motif: "Journey",
    name: "Fischer Travel",
    primary: "#201C1C",
    secondary: "#F7F1E6",
  },
  montecitoClub: {
    field: "#3F6657",
    logo: {
      alt: "Montecito Club",
      background: "#FFFFFF",
      src: "/clients/montecito-club.svg",
    },
    motif: "Course",
    name: "Montecito Club",
    primary: "#004C6C",
    secondary: "#F0E5C8",
  },
  godmothers: {
    field: "#3F6FB3",
    logo: {
      alt: "Godmothers",
      background: "#FFFFFF",
      src: "/clients/godmothers.png",
    },
    motif: "Story",
    name: "Godmothers",
    primary: "#000000",
    secondary: "#FFFFFF",
  },
  distributedGlobal: {
    field: "#5A8799",
    logo: {
      alt: "Distributed Global",
      background: "#FFFFFF",
      src: "/clients/distributed-global.png",
    },
    motif: "Long game",
    name: "Distributed Global",
    primary: "#16333E",
    secondary: "#FFFFFF",
  },
  filmRoman: {
    field: "#AFC3DF",
    logo: {
      alt: "Film Roman",
      background: "#FFFFFF",
      src: "/clients/film-roman.png",
    },
    motif: "Character",
    name: "Film Roman",
    primary: "#2D6EAD",
    secondary: "#FFFFFF",
  },
} as const satisfies Record<string, BoardBrand>;

export const GAME_ROSTER = [
  "Backgammon",
  "American mahjong",
  "Dominoes",
  "Chess",
  "Checkers",
  "Playing cards",
  "Poker set",
  "Rummy tiles",
  "Cribbage",
  "Dice chest",
  "Tower blocks",
  "Darts",
  "Go",
  "Mancala",
  "Dice score game",
  "Chinese checkers",
] as const;
