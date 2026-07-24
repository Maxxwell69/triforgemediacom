/**
 * TriForge brand tokens — single source of truth for colors/fonts.
 * Locked per brand system. Sync by hand with the marketing site repo (triforge-web)
 * if these ever change; do not fork these values elsewhere.
 */

export const brandColors = {
  charcoal: "#0A0A0A",
  electricOrange: "#FD4802",
  deepBlue: "#0E1A3D",
  neonCyan: "#00D4FF",
  offWhite: "#F5F5F5",
} as const;

export const brandFonts = {
  display: "Bebas Neue",
  body: "Outfit",
} as const;
