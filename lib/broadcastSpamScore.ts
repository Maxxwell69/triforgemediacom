/**
 * Heuristic deliverability score for admin broadcast drafts.
 * 100 = clean / inbox-friendly; lower = more likely to be filtered as spam.
 * Pure functions — safe to import from client and server.
 */

export type SpamIssue = {
  severity: "block" | "warn" | "tip";
  text: string;
};

export type BroadcastSpamScore = {
  /** 0–100, higher is better for inbox placement */
  score: number;
  grade: "good" | "ok" | "poor" | "blocked";
  issues: SpamIssue[];
  /** Server refuses to send when true (unless force-send is added later) */
  canSend: boolean;
};

const SPAMMY_PHRASES = [
  "act now",
  "limited time",
  "click here",
  "buy now",
  "order now",
  "free money",
  "no obligation",
  "risk free",
  "risk-free",
  "congratulations you",
  "you have been selected",
  "winner",
  "cash prize",
  "make money fast",
  "double your",
  "guarantee",
  "100% free",
  "urgent!!!",
  "as seen on",
  "call now",
  "don't delete",
  "do not delete",
  "this is not spam",
  "dear friend",
  "increase your sales",
  "lowest price",
  "no catch",
  "once in a lifetime",
  "what are you waiting for",
];

const URL_SHORTENERS = [
  "bit.ly/",
  "t.co/",
  "tinyurl.com/",
  "goo.gl/",
  "ow.ly/",
  "buff.ly/",
  "is.gd/",
];

const MIN_SEND_SCORE = 65;

function countMatches(text: string, re: RegExp): number {
  return (text.match(re) || []).length;
}

/** Rough emoji count without requiring the unicode-property regex flag. */
function countEmoji(text: string): number {
  let n = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (
      (code >= 0x1f300 && code <= 0x1faff) ||
      (code >= 0x2600 && code <= 0x27bf) ||
      (code >= 0x1f600 && code <= 0x1f64f) ||
      (code >= 0x1f900 && code <= 0x1f9ff)
    ) {
      n++;
    }
  }
  return n;
}

function stripForAnalysis(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Score subject + plain-text body (what admins type in the composer).
 */
export function scoreBroadcastContent(subject: string, bodyText: string): BroadcastSpamScore {
  const issues: SpamIssue[] = [];
  let penalty = 0;

  const sub = stripForAnalysis(subject || "");
  const body = stripForAnalysis(bodyText || "");
  const combined = `${sub} ${body}`.toLowerCase();

  if (sub.length < 3) {
    issues.push({ severity: "block", text: "Subject is required." });
    penalty += 40;
  } else if (sub.length > 60) {
    issues.push({
      severity: "warn",
      text: `Subject is long (${sub.length} chars). Keep it under 60 for mobile inboxes.`,
    });
    penalty += 12;
  } else if (sub.length > 45) {
    issues.push({
      severity: "tip",
      text: "Shorter subjects (under ~45 characters) usually place better.",
    });
    penalty += 4;
  }

  if (/^(re:|fwd:|fw:)\s/i.test(sub)) {
    issues.push({
      severity: "block",
      text: "Don't fake Re:/Fwd: in the subject — filters treat that as deceptive.",
    });
    penalty += 35;
  }

  const subLetters = sub.replace(/[^a-zA-Z]/g, "");
  const subUpper = sub.replace(/[^A-Z]/g, "").length;
  if (subLetters.length >= 8 && subUpper / subLetters.length >= 0.7) {
    issues.push({
      severity: "block",
      text: "Subject is mostly ALL CAPS — rewrite in sentence case.",
    });
    penalty += 30;
  }

  const bangs = countMatches(sub, /!/g);
  if (bangs >= 3) {
    issues.push({
      severity: "block",
      text: "Too many exclamation marks in the subject (max 1).",
    });
    penalty += 25;
  } else if (bangs === 2) {
    issues.push({ severity: "warn", text: "Use at most one exclamation mark in the subject." });
    penalty += 12;
  } else if (bangs === 1) {
    issues.push({
      severity: "tip",
      text: "Subjects without “!” often look more trustworthy.",
    });
    penalty += 3;
  }

  const emojiInSubject = countEmoji(sub);
  if (emojiInSubject >= 3) {
    issues.push({ severity: "warn", text: "Cut subject emoji down to 0–1." });
    penalty += 10;
  } else if (emojiInSubject === 2) {
    issues.push({ severity: "tip", text: "One emoji in the subject is plenty." });
    penalty += 4;
  }

  if (/\$\$+|💰|💵/.test(sub) || /\$\$+/.test(body)) {
    issues.push({
      severity: "warn",
      text: "Money symbols / cash emoji look promotional to filters.",
    });
    penalty += 15;
  }

  for (const phrase of SPAMMY_PHRASES) {
    if (combined.includes(phrase)) {
      issues.push({
        severity: phrase.length > 12 || phrase.includes("free") ? "warn" : "tip",
        text: `Spam-trigger phrasing: “${phrase}”. Rephrase in plain language.`,
      });
      penalty += phrase.includes("free") || phrase.includes("winner") ? 14 : 8;
    }
  }

  if (/\b(free|urgent|!!!|100%)\b/i.test(sub)) {
    issues.push({
      severity: "warn",
      text: "Words like free / urgent in the subject raise spam scores — soften them.",
    });
    penalty += 10;
  }

  if (body.length < 40) {
    issues.push({
      severity: "warn",
      text: "Body is very short. Add a clear reason for writing and one concrete next step.",
    });
    penalty += 12;
  } else if (body.length > 2500) {
    issues.push({
      severity: "warn",
      text: "Body is quite long. Shorter announcements (a few short paragraphs) place better.",
    });
    penalty += 8;
  }

  const bodyLetters = body.replace(/[^a-zA-Z]/g, "");
  const bodyUpper = body.replace(/[^A-Z]/g, "").length;
  if (bodyLetters.length >= 40 && bodyUpper / bodyLetters.length >= 0.45) {
    issues.push({
      severity: "warn",
      text: "Lots of ALL CAPS in the body — use normal capitalization.",
    });
    penalty += 18;
  }

  const bodyBangs = countMatches(body, /!/g);
  if (bodyBangs >= 5) {
    issues.push({ severity: "warn", text: "Too many exclamation marks in the body." });
    penalty += 12;
  }

  const emojiInBody = countEmoji(body);
  if (emojiInBody >= 8) {
    issues.push({ severity: "warn", text: "Heavy emoji use can look like marketing spam." });
    penalty += 10;
  }

  for (const host of URL_SHORTENERS) {
    if (combined.includes(host)) {
      issues.push({
        severity: "block",
        text: "URL shorteners (bit.ly, t.co, etc.) are a major spam signal — use full hub.triforgemedia.com links.",
      });
      penalty += 30;
      break;
    }
  }

  const urlCount = countMatches(combined, /https?:\/\/|www\./gi);
  if (urlCount >= 5) {
    issues.push({
      severity: "warn",
      text: "Many links in one email. Prefer one clear CTA link.",
    });
    penalty += 12;
  }

  // Soft tip for invitation-style blast language (common spam pattern, not a hard fail)
  if (/you'?re invited|don't miss|amazing opportunity|inside scoop/i.test(combined)) {
    issues.push({
      severity: "tip",
      text: "Hypey invite language is fine in moderation — lead with the concrete what/when/where.",
    });
    penalty += 5;
  }

  if (!/\d|http|hub\.|meeting|webinar|thursday|monday|tuesday|wednesday|friday|saturday|sunday|pm|am|\d{1,2}\/\d{1,2}/i.test(combined) && body.length > 80) {
    issues.push({
      severity: "tip",
      text: "Include a specific date, time, or link when you can — vague blasts look more promotional.",
    });
    penalty += 3;
  }

  // Deduplicate similar issue texts
  const seen = new Set<string>();
  const uniqueIssues = issues.filter((i) => {
    if (seen.has(i.text)) return false;
    seen.add(i.text);
    return true;
  });

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const hasBlock = uniqueIssues.some((i) => i.severity === "block");
  const canSend = score >= MIN_SEND_SCORE && !hasBlock;

  let grade: BroadcastSpamScore["grade"];
  if (!canSend || score < MIN_SEND_SCORE) grade = "blocked";
  else if (score >= 85) grade = "good";
  else if (score >= 75) grade = "ok";
  else grade = "poor";

  return { score, grade, issues: uniqueIssues, canSend };
}

export const BROADCAST_MIN_SEND_SCORE = MIN_SEND_SCORE;
