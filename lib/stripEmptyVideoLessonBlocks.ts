/** Remove “Video Lesson” promo cards that have no real embed. */

function findMatchingDivEnd(html: string, start: number): number {
  if (!html.slice(start, start + 4).toLowerCase().startsWith("<div")) return -1;
  let i = start;
  let depth = 0;
  while (i < html.length) {
    const nextLt = html.indexOf("<", i);
    if (nextLt < 0) return -1;
    const rest = html.slice(nextLt).toLowerCase();
    if (rest.startsWith("</div")) {
      depth -= 1;
      const close = html.indexOf(">", nextLt);
      if (close < 0) return -1;
      if (depth === 0) return close + 1;
      i = close + 1;
      continue;
    }
    if (rest.startsWith("<div")) {
      depth += 1;
      const close = html.indexOf(">", nextLt);
      if (close < 0) return -1;
      i = close + 1;
      continue;
    }
    const close = html.indexOf(">", nextLt);
    if (close < 0) return -1;
    i = close + 1;
  }
  return -1;
}

function findCardStart(html: string, at: number): number {
  const before = html.slice(0, at);
  const flex = before.toLowerCase().lastIndexOf("display: flex; flex-wrap: wrap");
  if (flex >= 0) {
    const open = before.lastIndexOf("<div", flex);
    if (open >= 0) return open;
  }
  const play = before.lastIndexOf("▶");
  if (play >= 0) {
    const open = before.lastIndexOf("<div", play);
    if (open >= 0) return open;
  }
  return before.toLowerCase().lastIndexOf("<div");
}

function blockHasRealVideo(block: string) {
  return /<iframe|<video|youtube\.com|youtu\.be|vimeo\.com|loom\.com|wistia\.|cloudflarestream/i.test(
    block
  );
}

export function stripEmptyVideoLessonBlocks(html: string): string {
  if (!html || !/video\s*lesson/i.test(html)) return html;
  let out = html;
  const needle = /video\s*lesson/gi;
  const ranges: Array<[number, number]> = [];
  let match: RegExpExecArray | null;
  while ((match = needle.exec(out))) {
    const start = findCardStart(out, match.index);
    if (start < 0) continue;
    const end = findMatchingDivEnd(out, start);
    if (end <= start) continue;
    const block = out.slice(start, end);
    if (blockHasRealVideo(block)) continue;
    ranges.push([start, end]);
    needle.lastIndex = end;
  }
  for (const [start, end] of ranges.reverse()) {
    out = `${out.slice(0, start)}${out.slice(end)}`;
  }
  return out.replace(/(\n[ \t]*){3,}/g, "\n\n");
}
