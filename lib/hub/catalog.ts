/**
 * Obtainable Hub SKU catalog (dry-run model).
 * Flagship Hub 0 keeps every SKU on. Client hubs will opt into optional SKUs only.
 */

export type HubSkuKind = "core" | "optional" | "flagship";

export type HubSku = {
  id: string;
  kind: HubSkuKind;
  label: string;
  description: string;
};

/** Always on for every client hub. */
export const CORE_SKUS: HubSku[] = [
  {
    id: "core",
    kind: "core",
    label: "Core admin",
    description: "Users, groups, tags, moderation, account, member directory",
  },
];

/** Create Hub checkboxes — member surface + matching admin module. */
export const OPTIONAL_SKUS: HubSku[] = [
  { id: "chat", kind: "optional", label: "Chat", description: "Channels and community chat" },
  { id: "dms", kind: "optional", label: "Direct messages", description: "DMs and DM settings" },
  { id: "applications", kind: "optional", label: "Applications", description: "Public apply + applicant queue" },
  { id: "tiktask", kind: "optional", label: "TikTask", description: "Daily tasks and templates" },
  { id: "personalTasks", kind: "optional", label: "Personal tasks", description: "Member to-dos" },
  { id: "projects", kind: "optional", label: "Projects", description: "Assigned hub work" },
  { id: "rewards", kind: "optional", label: "XP / Rewards / Leaderboard", description: "Points store and ranks" },
  { id: "badges", kind: "optional", label: "Badges", description: "Achievement badges" },
  { id: "learning", kind: "optional", label: "Learning Center", description: "Courses, quizzes, certificates" },
  { id: "webinars", kind: "optional", label: "Webinars", description: "LiveKit stage and recordings" },
  { id: "calendar", kind: "optional", label: "Calendar", description: "Events and availability" },
  { id: "booking", kind: "optional", label: "Staff booking", description: "Public booking pages" },
  { id: "email", kind: "optional", label: "Email", description: "Broadcasts and templates" },
  { id: "hubBug", kind: "optional", label: "Hub Bug", description: "Bug reports" },
];

/** TriForge Hub 0 only — never a client Create Hub checkbox. */
export const FLAGSHIP_SKUS: HubSku[] = [
  {
    id: "tiktokInsights",
    kind: "flagship",
    label: "TikTok Live & Insights",
    description: "/live, network dashboard, Creator Insights (tik.tools)",
  },
  {
    id: "ghlImport",
    kind: "flagship",
    label: "GHL / roster import",
    description: "TriForge migration import",
  },
  {
    id: "companySocial",
    kind: "flagship",
    label: "Company social",
    description: "TriForge share-to links",
  },
  {
    id: "siteUpdates",
    kind: "flagship",
    label: "Public updates",
    description: "TriForge /updates changelog",
  },
  {
    id: "cnMnTracks",
    kind: "flagship",
    label: "CN / MN tracks",
    description: "Creator Network and Media Network apply routing",
  },
  {
    id: "shop",
    kind: "flagship",
    label: "Shop",
    description: "Hub merch catalog (moves to optional when client hubs can buy ecommerce)",
  },
];

export const ALL_SKUS: HubSku[] = [...CORE_SKUS, ...OPTIONAL_SKUS, ...FLAGSHIP_SKUS];

export const ALL_SKU_IDS = ALL_SKUS.map((s) => s.id);

export function isHubSkuId(value: string): boolean {
  return ALL_SKU_IDS.includes(value);
}
