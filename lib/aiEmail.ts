import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export type BroadcastDraft = {
  subject: string;
  paragraphs: string[];
};

const SYSTEM_PROMPT = `You write announcement emails for TriForge Community, an invite-only
community platform for creators (streamers, TikTok creators, live hosts, gaming personalities).
The voice is energetic, direct, and encouraging — never corporate or stiff. Keep it short:
1 short intro line, 2-4 short body paragraphs max, no walls of text. Never invent facts, dates,
or numbers that weren't given to you in the topic. Don't sign off with a name — the platform
sends it as "The TriForge Team" automatically.

Respond with ONLY minified JSON in this exact shape, no markdown fences, no commentary:
{"subject": "short punchy subject line", "paragraphs": ["paragraph 1", "paragraph 2"]}`;

/**
 * Drafts a broadcast email from a rough topic/bullet points using an LLM.
 * Returns plain paragraphs (not raw HTML) — the caller wraps them in the
 * app's branded template, so we never trust AI-generated markup directly.
 */
export async function generateBroadcastDraft(topic: string): Promise<BroadcastDraft> {
  if (!client) {
    throw new Error(
      "AI drafting isn't configured yet — add OPENAI_API_KEY to enable the Generate button."
    );
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Topic / notes for the email:\n${topic}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI didn't return a draft. Try again.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned an unexpected format. Try again.");
  }

  const obj = parsed as { subject?: unknown; paragraphs?: unknown };
  if (typeof obj.subject !== "string" || !Array.isArray(obj.paragraphs)) {
    throw new Error("AI returned an unexpected format. Try again.");
  }

  const paragraphs = obj.paragraphs.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  if (paragraphs.length === 0) throw new Error("AI didn't return any body content. Try again.");

  return { subject: obj.subject.trim(), paragraphs };
}

export function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs
    .map((p) => `<p style="line-height:1.6;margin:0 0 16px;">${escapeHtml(p)}</p>`)
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function isAiEmailConfigured(): boolean {
  return client !== null;
}
