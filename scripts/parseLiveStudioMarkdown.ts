import { readFileSync } from "fs";
import type { LessonFigure, LessonSeed } from "./specialtyCourseContent";

export type LiveStudioModuleSeed = {
  title: string;
  description: string;
  lessons: LessonSeed[];
};

const FOOTER = "Hub 0 · TikTok LIVE Studio";

const IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
const HEADER_RE = /^(?:\d+\.\s+)?\*\*(.+?)\*\*\s*(?:[—–:]\s*(.*))?$/;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableHtml(headers: string[], rows: string[][]) {
  const th = headers
    .map(
      (h) =>
        `<th style="padding: 8px 10px; border: 1px solid rgb(59, 59, 59); text-align: left; color: rgb(244, 122, 32); font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px;">${escapeHtml(h)}</th>`
    )
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="padding: 8px 10px; border: 1px solid rgb(59, 59, 59); color: rgb(222, 222, 222); font-size: 14px;">${escapeHtml(cell)}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0px 0px; background: rgb(26, 26, 26);"><thead><tr style="background: rgb(11, 11, 11);">${th}</tr></thead><tbody>${body}</tbody></table>`;
}

function parseTable(block: string): string | null {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2 || !lines.every((line) => line.startsWith("|"))) return null;
  const cells = (line: string) =>
    line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
  if (!/^[-|: ]+$/.test(lines[1].replace(/\|/g, ""))) return null;
  return tableHtml(cells(lines[0]), lines.slice(2).map(cells));
}

function cleanInline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenBlock(block: string) {
  return block
    .split("\n")
    .map((line) => line.replace(/^>\s?/, "").trim())
    .filter((line) => line && !line.startsWith("![") && !/^[-*]{3,}$/.test(line))
    .join("\n");
}

function extractFigures(section: string, imageMap: Record<string, string>): LessonFigure[] {
  const figures: LessonFigure[] = [];
  const seen = new Set<string>();
  for (const match of section.matchAll(IMAGE_RE)) {
    const alt = match[1].trim() || "LIVE Studio screenshot";
    const src = imageMap[match[2]] ?? match[2];
    if (seen.has(src)) continue;
    seen.add(src);
    figures.push({ src, alt, caption: alt.endsWith(".") ? alt : `${alt}.` });
  }
  return figures;
}

function splitSections(markdown: string) {
  const parts = markdown.split(/^## /m).slice(1);
  return parts
    .map((part) => {
      const nl = part.indexOf("\n");
      const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
      const body = nl === -1 ? "" : part.slice(nl + 1);
      return { heading, body };
    })
    .filter((part) => !/^Image Reference Manifest/i.test(part.heading));
}

function titleFromHeading(heading: string) {
  return heading.replace(/^\d+\.\s+/, "").replace(/\s+/g, " ").trim();
}

function pullHeader(line: string): { title: string; rest: string } | null {
  const match = line.match(HEADER_RE);
  if (!match) return null;
  return { title: cleanInline(match[1]), rest: (match[2] ?? "").trim() };
}

function blocksFromSection(body: string) {
  return body
    .split(/\n\s*\n/)
    .map(flattenBlock)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !block.startsWith("![") && !/^>\s*!\[/.test(block));
}

function chunkToSteps(blocks: string[]) {
  const intro: string[] = [];
  const steps: { title: string; body: string }[] = [];
  let extras: string[] = [];

  const flushIntro = () => {
    if (!intro.length && extras.length) {
      intro.push(extras.join(" "));
      extras = [];
    }
  };

  for (const block of blocks) {
    const table = parseTable(block);
    if (table) {
      extras.push("");
      continue;
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const header = pullHeader(lines[0] ?? "");
    if (header && (lines.length > 1 || header.rest || steps.length > 0 || intro.length > 0)) {
      flushIntro();
      const restLines = lines.slice(1);
      const bodyParts = [
        header.rest,
        ...restLines.map((line) =>
          line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "")
        ),
      ]
        .map(cleanInline)
        .filter(Boolean);
      steps.push({
        title: header.title.replace(/:$/, ""),
        body: bodyParts.join(" ") || header.title,
      });
      continue;
    }

    const numbered = lines.filter((line) => /^\d+\.\s+/.test(line));
    if (numbered.length >= 2 && numbered.length === lines.length) {
      flushIntro();
      for (const line of numbered) {
        const stripped = line.replace(/^\d+\.\s+/, "");
        const inner = pullHeader(stripped);
        steps.push({
          title: (inner?.title ?? cleanInline(stripped).slice(0, 72)).replace(/:$/, ""),
          body: cleanInline(inner?.rest ? `${inner.title} — ${inner.rest}` : stripped),
        });
      }
      continue;
    }

    const bullets = lines.filter((line) => /^[-*]\s+/.test(line));
    if (bullets.length && bullets.length === lines.length) {
      const text = bullets.map((line) => cleanInline(line.replace(/^[-*]\s+/, ""))).join(" ");
      if (steps.length) steps[steps.length - 1].body += ` ${text}`;
      else extras.push(text);
      continue;
    }

    const prose = cleanInline(block);
    if (!prose) continue;
    if (!intro.length && !steps.length) intro.push(prose);
    else if (steps.length) steps[steps.length - 1].body += ` ${prose}`;
    else extras.push(prose);
  }

  flushIntro();
  if (!intro.length) intro.push(steps[0]?.body || "Work this LIVE Studio lesson in order.");
  if (!steps.length) {
    const leftover = extras.join(" ");
    steps.push({
      title: "Put it into practice",
      body: leftover || intro[0],
    });
  }

  return { intro: intro[0], steps };
}

function tablesFromSection(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => parseTable(flattenBlock(block)))
    .filter((html): html is string => !!html);
}

function readingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(3, Math.min(12, Math.round(words / 160) || 3))} min`;
}

function taglineFrom(title: string, intro: string) {
  const first = intro.split(/[.!?]/)[0]?.trim() ?? "";
  if (first.length > 12 && first.length <= 72) return first;
  return title;
}

export function parseLiveStudioMarkdown(
  markdown: string,
  imageMap: Record<string, string> = {}
): LessonSeed[] {
  return splitSections(markdown).map((section) => {
    const title = titleFromHeading(section.heading);
    const figures = extractFigures(section.body, imageMap);
    const extraTables = tablesFromSection(section.body);
    const { intro, steps } = chunkToSteps(blocksFromSection(section.body));
    const allText = [intro, ...steps.map((step) => step.body)].join(" ");
    return {
      title,
      tagline: taglineFrom(title, intro),
      objective: intro.slice(0, 220),
      readingTime: readingTime(allText),
      footerLabel: FOOTER,
      paragraphs: [intro, ...steps.map((step) => step.body)],
      stepTitles: steps.map((step) => step.title),
      figures,
      extraHtml: extraTables.length ? extraTables.join("\n") : undefined,
      exercise: `Open LIVE Studio and run this lesson: ${title}. Screenshot the result and note one thing you will change on your next stream.`,
      knowledgeCheck: [
        `What is the main takeaway from “${title}”?`,
        ...steps.slice(0, 2).map((step) => `What should you remember about ${step.title.toLowerCase()}?`),
      ],
    };
  });
}

export function loadLiveStudioModuleFromFile(
  path: string,
  meta: { title: string; description: string },
  imageMap: Record<string, string> = {}
): LiveStudioModuleSeed {
  const markdown = readFileSync(path, "utf8");
  return {
    title: meta.title,
    description: meta.description,
    lessons: parseLiveStudioMarkdown(markdown, imageMap),
  };
}
