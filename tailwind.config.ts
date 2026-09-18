import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

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
        charcoal: `rgb(var(--brand-charcoal) / <alpha-value>)`,
        orange: `rgb(var(--brand-orange) / <alpha-value>)`,
        "deep-blue": `rgb(var(--brand-deep-blue) / <alpha-value>)`,
        cyan: `rgb(var(--brand-cyan) / <alpha-value>)`,
        "off-white": `rgb(var(--brand-off-white) / <alpha-value>)`,
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgb(var(--brand-orange) / 0.35)",
        "glow-cyan": "0 0 24px rgb(var(--brand-cyan) / 0.35)",
      },
    },
  },
  plugins: [typography],
};
export default config;
