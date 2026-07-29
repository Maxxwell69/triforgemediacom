import "server-only";

// jsdom ships with isomorphic-dompurify; avoid a hard @types dependency.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { JSDOM } = require("jsdom") as { JSDOM: new (html: string) => { window: { document: Document } } };

/**
 * Lesson HTML from tools like GoHighLevel often keeps `color: #fff` on headings
 * and cards that were designed for a dark page, then those same blocks get a
 * light gray/peach background — white-on-white in our off-white lesson canvas.
 *
 * After sanitize, walk inline styles and remap near-white text to charcoal when
 * the element (and its ancestors) don't provide a dark background.
 */

const CHARCOAL = "#0A0A0A";

function parseCssColor(raw: string): { r: number; g: number; b: number; a: number } | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === "transparent" || v === "inherit" || v === "currentcolor") return null;
  if (v === "white") return { r: 255, g: 255, b: 255, a: 1 };
  if (v === "black") return { r: 0, g: 0, b: 0, a: 1 };

  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgb = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] !== undefined ? Number(rgb[4]) : 1,
    };
  }

  return null;
}

function relativeLuminance(c: { r: number; g: number; b: number }): number {
  const lin = [c.r, c.g, c.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function isNearWhite(c: { r: number; g: number; b: number; a: number }): boolean {
  if (c.a < 0.4) return false;
  return relativeLuminance(c) >= 0.85;
}

function isDarkBackground(c: { r: number; g: number; b: number; a: number }): boolean {
  if (c.a < 0.5) return false;
  return relativeLuminance(c) <= 0.45;
}

function getDecl(style: string, prop: string): string | null {
  const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i");
  const m = style.match(re);
  return m ? m[1].trim() : null;
}

function setDecl(style: string, prop: string, value: string): string {
  const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*[^;]*`, "i");
  if (re.test(style)) {
    return style.replace(re, (match) => {
      const prefix = match.startsWith(";") ? ";" : "";
      return `${prefix}${prop}: ${value}`;
    });
  }
  const trimmed = style.trim().replace(/;?\s*$/, "");
  return trimmed ? `${trimmed}; ${prop}: ${value}` : `${prop}: ${value}`;
}

function effectiveBackground(
  el: Element,
  root: Element
): { r: number; g: number; b: number; a: number } {
  let node: Element | null = el;
  while (node) {
    const style = node.getAttribute("style") || "";
    const bg = getDecl(style, "background-color") || getDecl(style, "background");
    if (bg) {
      const solid = bg.split(/url\(/)[0]?.trim().replace(/,\s*$/, "") ?? bg;
      const tokens = solid.split(/\s+/);
      let parsed = parseCssColor(solid);
      if (!parsed) {
        for (let i = tokens.length - 1; i >= 0; i--) {
          parsed = parseCssColor(tokens[i].replace(/;$/, ""));
          if (parsed) break;
        }
      }
      if (parsed && parsed.a >= 0.5) return parsed;
    }
    if (node === root) break;
    node = node.parentElement;
  }
  // Lesson canvas is off-white (#F5F5F5).
  return { r: 245, g: 245, b: 245, a: 1 };
}

/**
 * Remap near-white inline text colors to charcoal when sitting on a light
 * background (our lesson page or a light card). Leaves white text alone on
 * dark backgrounds (hero banners, dark step cards, etc.).
 */
export function fixIllegibleLessonTextColors(html: string): string {
  if (!html || !/color\s*:/i.test(html)) return html;

  const doc = new JSDOM(`<div id="__lesson_root">${html}</div>`).window.document;
  const root = doc.getElementById("__lesson_root");
  if (!root) return html;

  const withStyle = root.querySelectorAll("[style]");
  withStyle.forEach((el: Element) => {
    const style = el.getAttribute("style");
    if (!style) return;
    const colorRaw = getDecl(style, "color");
    if (!colorRaw) return;
    const color = parseCssColor(colorRaw);
    if (!color || !isNearWhite(color)) return;

    const bg = effectiveBackground(el, root);
    if (isDarkBackground(bg)) return;

    el.setAttribute("style", setDecl(style, "color", CHARCOAL));
  });

  return root.innerHTML;
}
