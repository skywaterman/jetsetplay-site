"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { renderBoard } from "./BoardFace";
import {
  homeBoardFieldAtScroll,
  HOUSE_BOARD_COLORWAYS,
} from "@/lib/board-face";

type BoardStyle = CSSProperties & {
  "--brand-field": string;
  "--brand-motif": string;
  "--brand-name": string;
  "--brand-primary": string;
  "--brand-secondary": string;
};

const felt = HOUSE_BOARD_COLORWAYS.houseFelt;

export function HomeBoardRecolor() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [field, setField] = useState<string>(felt.field);
  const [mode, setMode] = useState<"reduced" | "scroll">("scroll");

  useEffect(() => {
    const node = boardRef.current;

    if (!node) {
      return;
    }

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frame = 0;

    const update = () => {
      frame = 0;

      const hero = node.closest<HTMLElement>(".home-hero");
      const travel = Math.max(hero?.offsetHeight ?? node.offsetHeight, 1);

      setField(
        homeBoardFieldAtScroll(
          window.scrollY,
          travel,
          motionPreference.matches,
        ),
      );
      setMode(motionPreference.matches ? "reduced" : "scroll");
    };

    const scheduleUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    motionPreference.addEventListener("change", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      motionPreference.removeEventListener("change", scheduleUpdate);
    };
  }, []);

  const style: BoardStyle = {
    "--brand-field": field,
    "--brand-motif": `"${felt.motif}"`,
    "--brand-name": `"${felt.name}"`,
    "--brand-primary": felt.primary,
    "--brand-secondary": felt.secondary,
  };

  return (
    <div
      className="home-hero__board"
      data-board-colorways="house-felt salon-oxblood night-lacquer"
      data-board-recolor={mode}
      ref={boardRef}
      style={style}
    >
      {renderBoard(felt, {
        decorative: true,
        inheritPalette: true,
        variant: "house",
      })}
    </div>
  );
}
