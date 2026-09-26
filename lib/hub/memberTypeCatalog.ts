/** Shared catalog — safe for client components. */

export const MEMBER_TYPE_SYSTEMS = [
  { id: "chat", label: "Chat" },
  { id: "groups", label: "Groups" },
  { id: "members", label: "Members" },
  { id: "webinars", label: "Webinars" },
  { id: "calendar", label: "Calendar / events" },
  { id: "campaigns", label: "Campaigns" },
  { id: "learn", label: "Learning" },
  { id: "tiktask", label: "TikTask" },
  { id: "personalTasks", label: "Personal tasks" },
  { id: "projects", label: "Projects" },
  { id: "rewards", label: "Rewards" },
  { id: "shop", label: "Shop" },
  { id: "support", label: "Support" },
  { id: "suggestions", label: "Suggestions" },
  { id: "hubBug", label: "Hub Bug" },
  { id: "live", label: "Live" },
  { id: "progress", label: "Progress" },
  { id: "streamingKit", label: "Branding kit" },
] as const;

export const MEMBER_TYPE_SYSTEM_IDS = new Set<string>(MEMBER_TYPE_SYSTEMS.map((s) => s.id));
