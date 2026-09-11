export const calendarEventKindOptions = [
  "MEETING",
  "EVENT",
  "LIVE",
  "WEBINAR",
  "OTHER",
  "INTERVIEW",
  "BATTLE",
  "SHOP_EVENT",
] as const;

export type CalendarEventKindValue = (typeof calendarEventKindOptions)[number];

/** Kinds staff or group hosts can pick — webinars sync from Admin → Webinars. */
export const creatableCalendarEventKinds = [
  "MEETING",
  "EVENT",
  "LIVE",
  "INTERVIEW",
  "BATTLE",
  "SHOP_EVENT",
  "OTHER",
] as const;

export const CALENDAR_KIND_LABELS: Record<string, string> = {
  MEETING: "Meeting",
  EVENT: "Event",
  LIVE: "Live",
  WEBINAR: "Webinar",
  OTHER: "Other",
  INTERVIEW: "Interview",
  BATTLE: "Battles",
  SHOP_EVENT: "Shop event",
};

export type CalendarMemberOption = {
  id: string;
  label: string;
};

export function calendarKindLabel(kind: string): string {
  return CALENDAR_KIND_LABELS[kind] || kind;
}

export function calendarKindNeedsFeatured(kind: string): boolean {
  return kind === "INTERVIEW" || kind === "BATTLE" || kind === "SHOP_EVENT";
}

export function calendarKindNeedsOpponent(kind: string): boolean {
  return kind === "BATTLE";
}

export function calendarFeaturedProfileLabel(kind: string): string {
  if (kind === "INTERVIEW") return "Person being interviewed";
  if (kind === "BATTLE") return "Battler 1";
  if (kind === "SHOP_EVENT") return "Featured profile";
  return "Profile";
}

export function calendarOpponentProfileLabel(): string {
  return "Battler 2";
}

/** Turn a location/link field into a safe http(s) href, or null if it's plain text. */
export function calendarLocationHref(location: string | null | undefined): string | null {
  const trimmed = (location || "").trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
