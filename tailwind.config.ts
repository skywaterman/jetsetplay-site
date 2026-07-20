import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pip: "var(--jsp-pip)",
        cream: "var(--jsp-cream)",
        ink: "var(--jsp-ink)",
        felt: "var(--material-felt)",
        oxblood: "var(--material-oxblood)",
        brass: "var(--material-brass)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
      },
      borderRadius: {
        none: "0",
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
};

export default config;
