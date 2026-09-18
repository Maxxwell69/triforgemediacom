import type { CSSProperties } from "react";
import { brandColors } from "@/lib/brand";

export const DISPLAY_FONTS = [
  { id: "bebas", label: "Bebas Neue", family: "Bebas Neue", google: "Bebas+Neue" },
  { id: "oswald", label: "Oswald", family: "Oswald", google: "Oswald:wght@400;500;600" },
  { id: "anton", label: "Anton", family: "Anton", google: "Anton" },
  { id: "teko", label: "Teko", family: "Teko", google: "Teko:wght@400;500;600" },
] as const;

export const BODY_FONTS = [
  { id: "outfit", label: "Outfit", family: "Outfit", google: "Outfit:wght@300;400;500;600;700" },
  { id: "inter", label: "Inter", family: "Inter", google: "Inter:wght@300;400;500;600;700" },
  { id: "nunito", label: "Nunito Sans", family: "Nunito Sans", google: "Nunito+Sans:wght@300;400;600;700" },
  { id: "source", label: "Source Sans 3", family: "Source Sans 3", google: "Source+Sans+3:wght@300;400;600;700" },
] as const;

export type DisplayFontId = (typeof DISPLAY_FONTS)[number]["id"];
export type BodyFontId = (typeof BODY_FONTS)[number]["id"];

export type BrandKit = {
  logoUrl: string | null;
  backgroundImageUrl: string | null;
  colors: {
    canvas: string;
    primary: string;
    secondary: string;
    ink: string;
  };
  fonts: {
    display: DisplayFontId;
    body: BodyFontId;
  };
  overlay: number;
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  logoUrl: null,
  backgroundImageUrl: null,
  colors: {
    canvas: brandColors.charcoal,
    primary: brandColors.electricOrange,
    secondary: brandColors.neonCyan,
    ink: brandColors.offWhite,
  },
  fonts: { display: "bebas", body: "outfit" },
  overlay: 55,
};

const HEX = /^#([0-9a-f]{6})$/i;
const MAX_CANVAS_LUMINANCE = 0.18;
const MIN_INK_CONTRAST = 4.5;
const MIN_ACCENT_CONTRAST = 2.8;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

export function normalizeHex(value: string): string | null {
  const raw = value.trim();
  if (!HEX.test(raw)) return null;
  return `#${raw.slice(1).toUpperCase()}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

export function hexToRgbTriple(hex: string): string {
  const rgb = hexToRgb(hex) ?? { r: 10, g: 10, b: 10 };
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

export function displayFontById(id: string) {
  return DISPLAY_FONTS.find((f) => f.id === id) ?? DISPLAY_FONTS[0];
}

export function bodyFontById(id: string) {
  return BODY_FONTS.find((f) => f.id === id) ?? BODY_FONTS[0];
}

function parseImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return null;
  return value.slice(0, 2000);
}

function parseOverlay(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_BRAND_KIT.overlay;
  return Math.min(80, Math.max(0, Math.round(n)));
}

export function parseBrandKit(raw: unknown): BrandKit {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BRAND_KIT, colors: { ...DEFAULT_BRAND_KIT.colors }, fonts: { ...DEFAULT_BRAND_KIT.fonts } };
  const row = raw as Record<string, unknown>;
  const colors = row.colors && typeof row.colors === "object" ? (row.colors as Record<string, unknown>) : {};
  const fonts = row.fonts && typeof row.fonts === "object" ? (row.fonts as Record<string, unknown>) : {};
  return {
    logoUrl: parseImageUrl(row.logoUrl),
    backgroundImageUrl: parseImageUrl(row.backgroundImageUrl),
    colors: {
      canvas: normalizeHex(String(colors.canvas || "")) ?? DEFAULT_BRAND_KIT.colors.canvas,
      primary: normalizeHex(String(colors.primary || "")) ?? DEFAULT_BRAND_KIT.colors.primary,
      secondary: normalizeHex(String(colors.secondary || "")) ?? DEFAULT_BRAND_KIT.colors.secondary,
      ink: normalizeHex(String(colors.ink || "")) ?? DEFAULT_BRAND_KIT.colors.ink,
    },
    fonts: {
      display: displayFontById(String(fonts.display || "")).id,
      body: bodyFontById(String(fonts.body || "")).id,
    },
    overlay: parseOverlay(row.overlay),
  };
}

export type BrandKitIssue = { field: string; message: string };

export function validateBrandKit(kit: BrandKit): BrandKitIssue[] {
  const issues: BrandKitIssue[] = [];
  if (relativeLuminance(kit.colors.canvas) > MAX_CANVAS_LUMINANCE) {
    issues.push({
      field: "canvas",
      message: "Canvas must stay dark so chat and admin stay readable.",
    });
  }
  if (contrastRatio(kit.colors.ink, kit.colors.canvas) < MIN_INK_CONTRAST) {
    issues.push({
      field: "ink",
      message: "Text color does not contrast enough with the canvas.",
    });
  }
  if (contrastRatio(kit.colors.primary, kit.colors.canvas) < MIN_ACCENT_CONTRAST) {
    issues.push({
      field: "primary",
      message: "Primary color is too close to the canvas — pick a brighter accent.",
    });
  }
  if (contrastRatio(kit.colors.secondary, kit.colors.canvas) < MIN_ACCENT_CONTRAST) {
    issues.push({
      field: "secondary",
      message: "Secondary color is too close to the canvas — pick a brighter accent.",
    });
  }
  return issues;
}

function cssUrl(url: string | null): string {
  if (!url) return "none";
  return `url("${url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}

export function brandKitCssVars(kit: BrandKit): CSSProperties {
  const display = displayFontById(kit.fonts.display);
  const body = bodyFontById(kit.fonts.body);
  return {
    ["--brand-orange" as string]: hexToRgbTriple(kit.colors.primary),
    ["--brand-cyan" as string]: hexToRgbTriple(kit.colors.secondary),
    ["--brand-charcoal" as string]: hexToRgbTriple(kit.colors.canvas),
    ["--brand-deep-blue" as string]: hexToRgbTriple(brandColors.deepBlue),
    ["--brand-off-white" as string]: hexToRgbTriple(kit.colors.ink),
    ["--background" as string]: `rgb(${hexToRgbTriple(kit.colors.canvas)})`,
    ["--foreground" as string]: `rgb(${hexToRgbTriple(kit.colors.ink)})`,
    ["--font-display" as string]: `"${display.family}", sans-serif`,
    ["--font-body" as string]: `"${body.family}", sans-serif`,
    ["--hub-overlay" as string]: String(kit.overlay / 100),
    ["--hub-bg-image" as string]: cssUrl(kit.backgroundImageUrl),
  };
}

export function brandKitGoogleFontsHref(kit: BrandKit): string | null {
  const families = new Set<string>();
  const display = displayFontById(kit.fonts.display);
  const body = bodyFontById(kit.fonts.body);
  if (display.id !== "bebas") families.add(display.google);
  if (body.id !== "outfit") families.add(body.google);
  if (families.size === 0) return null;
  return `https://fonts.googleapis.com/css2?${Array.from(families)
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;
}

export function isDefaultBrandKit(kit: BrandKit): boolean {
  return (
    !kit.logoUrl &&
    !kit.backgroundImageUrl &&
    kit.colors.canvas === DEFAULT_BRAND_KIT.colors.canvas &&
    kit.colors.primary === DEFAULT_BRAND_KIT.colors.primary &&
    kit.colors.secondary === DEFAULT_BRAND_KIT.colors.secondary &&
    kit.colors.ink === DEFAULT_BRAND_KIT.colors.ink &&
    kit.fonts.display === DEFAULT_BRAND_KIT.fonts.display &&
    kit.fonts.body === DEFAULT_BRAND_KIT.fonts.body &&
    kit.overlay === DEFAULT_BRAND_KIT.overlay
  );
}

export type EmailBrandChrome = {
  logoUrl: string | null;
  primaryHex: string;
  canvasHex: string;
  inkHex: string;
  footer: string;
};

export function emailChromeFromKit(kit: BrandKit, hubName: string): EmailBrandChrome {
  return {
    logoUrl: kit.logoUrl,
    primaryHex: kit.colors.primary,
    canvasHex: kit.colors.canvas,
    inkHex: kit.colors.ink,
    footer: hubName,
  };
}
