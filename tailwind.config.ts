import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import { brandColors } from "./lib/brand";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        charcoal: brandColors.charcoal,
        orange: brandColors.electricOrange,
        "deep-blue": brandColors.deepBlue,
        cyan: brandColors.neonCyan,
        "off-white": brandColors.offWhite,
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(253, 72, 2, 0.35)",
        "glow-cyan": "0 0 24px rgba(0, 212, 255, 0.35)",
      },
    },
  },
  plugins: [typography],
};
export default config;
