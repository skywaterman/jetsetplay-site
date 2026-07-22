"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function PageReveal({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        animate={{ y: 0 }}
        className="page-reveal"
        initial={reduceMotion ? false : { y: 18 }}
        transition={{
          delay: 0.04,
          duration: 0.72,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
