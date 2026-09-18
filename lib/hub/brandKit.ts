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

const DEFAULT_BUTTON_INK = "#FFFFFF";

export type SurfaceKit = {
  canvas: string;
  ink: string;
  backgroundImageUrl: string | null;
  overlay: number;
};

export type BrandKit = {
  logoUrl: string | null;
  backgroundImageUrl: string | null;
  colors: {
    canvas: string;
    primary: string;
    secondary: string;
    ink: string;
    button: string;
    buttonInk: string;
  };
  fonts: {
    display: DisplayFontId;
    body: BodyFontId;
  };
  overlay: number;
  surfaces: {
    menu: SurfaceKit;
    groups: SurfaceKit;
    chat: SurfaceKit;
  };
};

export const DEFAULT_SURFACE: SurfaceKit = {
  canvas: brandColors.charcoal,
  ink: brandColors.offWhite,
  backgroundImageUrl: null,
  overlay: 55,
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  logoUrl: null,
  backgroundImageUrl: null,
  colors: {
    canvas: brandColors.charcoal,
    primary: brandColors.electricOrange,
    secondary: brandColors.neonCyan,
    ink: brandColors.offWhite,
    button: brandColors.electricOrange,
    buttonInk: DEFAULT_BUTTON_INK,
  },
  fonts: { display: "bebas", body: "outfit" },
  overlay: 55,
  surfaces: {
    menu: { ...DEFAULT_SURFACE },
    groups: { ...DEFAULT_SURFACE, canvas: "#070707" },
    chat: { ...DEFAULT_SURFACE },
  },
};

const HEX = /^#([0-9a-f]{6})$/i;
/** Block near-white canvases; saturated brand colors (magenta, navy, etc.) are allowed. */
const MAX_CANVAS_LUMINANCE = 0.45;
const MIN_INK_CONTRAST = 3;

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

function parseSurface(raw: unknown, fallback: SurfaceKit): SurfaceKit {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const row = raw as Record<string, unknown>;
  return {
    canvas: normalizeHex(String(row.canvas || "")) ?? fallback.canvas,
    ink: normalizeHex(String(row.ink || "")) ?? fallback.ink,
    backgroundImageUrl: parseImageUrl(row.backgroundImageUrl),
    overlay: parseOverlay(row.overlay),
  };
}

export function parseBrandKit(raw: unknown): BrandKit {
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_BRAND_KIT,
      colors: { ...DEFAULT_BRAND_KIT.colors },
      fonts: { ...DEFAULT_BRAND_KIT.fonts },
      surfaces: {
        menu: { ...DEFAULT_BRAND_KIT.surfaces.menu },
        groups: { ...DEFAULT_BRAND_KIT.surfaces.groups },
        chat: { ...DEFAULT_BRAND_KIT.surfaces.chat },
      },
    };
  }
  const row = raw as Record<string, unknown>;
  const colors = row.colors && typeof row.colors === "object" ? (row.colors as Record<string, unknown>) : {};
  const fonts = row.fonts && typeof row.fonts === "object" ? (row.fonts as Record<string, unknown>) : {};
  const surfaces = row.surfaces && typeof row.surfaces === "object" ? (row.surfaces as Record<string, unknown>) : {};
  return {
    logoUrl: parseImageUrl(row.logoUrl),
    backgroundImageUrl: parseImageUrl(row.backgroundImageUrl),
    colors: {
      canvas: normalizeHex(String(colors.canvas || "")) ?? DEFAULT_BRAND_KIT.colors.canvas,
      primary: normalizeHex(String(colors.primary || "")) ?? DEFAULT_BRAND_KIT.colors.primary,
      secondary: normalizeHex(String(colors.secondary || "")) ?? DEFAULT_BRAND_KIT.colors.secondary,
      ink: normalizeHex(String(colors.ink || "")) ?? DEFAULT_BRAND_KIT.colors.ink,
      button:
        normalizeHex(String(colors.button || colors.primary || "")) ??
        DEFAULT_BRAND_KIT.colors.button,
      buttonInk: normalizeHex(String(colors.buttonInk || "")) ?? DEFAULT_BRAND_KIT.colors.buttonInk,
    },
    fonts: {
      display: displayFontById(String(fonts.display || "")).id,
      body: bodyFontById(String(fonts.body || "")).id,
    },
    overlay: parseOverlay(row.overlay),
    surfaces: {
      menu: parseSurface(surfaces.menu, DEFAULT_BRAND_KIT.surfaces.menu),
      groups: parseSurface(surfaces.groups, DEFAULT_BRAND_KIT.surfaces.groups),
      chat: parseSurface(surfaces.chat, DEFAULT_BRAND_KIT.surfaces.chat),
    },
  };
}

export type BrandKitIssue = { field: string; message: string };

export function validateBrandKit(kit: BrandKit): BrandKitIssue[] {
  const issues: BrandKitIssue[] = [];
  if (relativeLuminance(kit.colors.canvas) > MAX_CANVAS_LUMINANCE) {
    issues.push({
      field: "canvas",
      message: "Canvas is too light — pick a darker page color so chat stays readable.",
    });
  }
  if (contrastRatio(kit.colors.ink, kit.colors.canvas) < MIN_INK_CONTRAST) {
    issues.push({
      field: "ink",
      message: "Text color does not contrast enough with the canvas.",
    });
  }
  if (contrastRatio(kit.colors.buttonInk, kit.colors.button) < MIN_INK_CONTRAST) {
    issues.push({
      field: "buttonInk",
      message: "Button text does not contrast enough with the button fill.",
    });
  }
  for (const [key, surface] of Object.entries(kit.surfaces) as Array<[string, SurfaceKit]>) {
    const label = key === "menu" ? "Menu" : key === "groups" ? "Groups" : "Chat";
    if (relativeLuminance(surface.canvas) > MAX_CANVAS_LUMINANCE) {
      issues.push({
        field: `${key}Canvas`,
        message: `${label} canvas is too light — pick a darker color.`,
      });
    }
    if (contrastRatio(surface.ink, surface.canvas) < MIN_INK_CONTRAST) {
      issues.push({
        field: `${key}Ink`,
        message: `${label} text does not contrast enough with that canvas.`,
      });
    }
  }
  return issues;
}

function cssUrl(url: string | null): string {
  if (!url) return "none";
  return `url("${url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}

function surfaceCssVars(prefix: string, surface: SurfaceKit): Record<string, string> {
  return {
    [`--hub-${prefix}-canvas`]: hexToRgbTriple(surface.canvas),
    [`--hub-${prefix}-ink`]: hexToRgbTriple(surface.ink),
    [`--hub-${prefix}-overlay`]: String(surface.overlay / 100),
    [`--hub-${prefix}-bg-image`]: cssUrl(surface.backgroundImageUrl),
  };
}

export function brandKitCssVars(kit: BrandKit): CSSProperties {
  const display = displayFontById(kit.fonts.display);
  const body = bodyFontById(kit.fonts.body);
  return {
    ["--brand-orange" as string]: hexToRgbTriple(kit.colors.button),
    ["--brand-primary" as string]: hexToRgbTriple(kit.colors.primary),
    ["--brand-cyan" as string]: hexToRgbTriple(kit.colors.secondary),
    ["--brand-charcoal" as string]: hexToRgbTriple(kit.colors.canvas),
    ["--brand-deep-blue" as string]: hexToRgbTriple(brandColors.deepBlue),
    ["--brand-off-white" as string]: hexToRgbTriple(kit.colors.ink),
    ["--brand-button-ink" as string]: hexToRgbTriple(kit.colors.buttonInk),
    ["--background" as string]: `rgb(${hexToRgbTriple(kit.colors.canvas)})`,
    ["--foreground" as string]: `rgb(${hexToRgbTriple(kit.colors.ink)})`,
    ["--font-display" as string]: `"${display.family}", sans-serif`,
    ["--font-body" as string]: `"${body.family}", sans-serif`,
    ["--hub-overlay" as string]: String(kit.overlay / 100),
    ["--hub-bg-image" as string]: cssUrl(kit.backgroundImageUrl),
    ...surfaceCssVars("menu", kit.surfaces.menu),
    ...surfaceCssVars("groups", kit.surfaces.groups),
    ...surfaceCssVars("chat", kit.surfaces.chat),
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
    kit.colors.button === DEFAULT_BRAND_KIT.colors.button &&
    kit.colors.buttonInk === DEFAULT_BRAND_KIT.colors.buttonInk &&
    kit.fonts.display === DEFAULT_BRAND_KIT.fonts.display &&
    kit.fonts.body === DEFAULT_BRAND_KIT.fonts.body &&
    kit.overlay === DEFAULT_BRAND_KIT.overlay &&
    !kit.surfaces.menu.backgroundImageUrl &&
    !kit.surfaces.groups.backgroundImageUrl &&
    !kit.surfaces.chat.backgroundImageUrl &&
    kit.surfaces.menu.canvas === DEFAULT_BRAND_KIT.surfaces.menu.canvas &&
    kit.surfaces.groups.canvas === DEFAULT_BRAND_KIT.surfaces.groups.canvas &&
    kit.surfaces.chat.canvas === DEFAULT_BRAND_KIT.surfaces.chat.canvas
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
    primaryHex: kit.colors.button,
    canvasHex: kit.colors.canvas,
    inkHex: kit.colors.ink,
    footer: hubName,
  };
}
