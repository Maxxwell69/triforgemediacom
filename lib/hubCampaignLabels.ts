import type {
  HubCampaignAudienceType,
  HubCampaignCategory,
  HubCampaignStatus,
} from "@prisma/client";

export const HUB_CAMPAIGN_CATEGORIES: {
  value: HubCampaignCategory;
  label: string;
  icon: string;
}[] = [
  { value: "INTERVIEWS", label: "Interviews", icon: "🎙️" },
  { value: "MEETING", label: "Meeting", icon: "📅" },
  { value: "GAMES", label: "Games", icon: "🎮" },
  { value: "BATTLES", label: "Battles", icon: "⚔️" },
];

export const HUB_CAMPAIGN_STATUSES: { value: HubCampaignStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "ARCHIVED", label: "Archived" },
];

export const HUB_CAMPAIGN_AUDIENCES: {
  value: HubCampaignAudienceType;
  label: string;
}[] = [
  { value: "ALL_MEMBERS", label: "Everyone" },
  { value: "TAG", label: "Members with a tag" },
  { value: "BADGE", label: "Members with a badge" },
];

export function hubCampaignCategoryMeta(category: HubCampaignCategory) {
  return (
    HUB_CAMPAIGN_CATEGORIES.find((c) => c.value === category) ?? {
      value: category,
      label: category,
      icon: "📌",
    }
  );
}

export function hubCampaignStatusLabel(status: HubCampaignStatus) {
  return HUB_CAMPAIGN_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function isInterviewCampaign(category: HubCampaignCategory | string) {
  return category === "INTERVIEWS";
}
