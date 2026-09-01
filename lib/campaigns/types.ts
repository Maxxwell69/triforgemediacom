import type { CampaignAudienceType, CampaignTriggerType } from "@prisma/client";

export type CampaignTriggerConfig = {
  days?: number;
  tagId?: string;
  levelId?: string;
};

export const CAMPAIGN_TRIGGERS: {
  type: CampaignTriggerType;
  label: string;
  ghlAnalog: string;
  description: string;
  timed: boolean;
}[] = [
  {
    type: "FIRST_LOGIN",
    label: "First login to the hub",
    ghlAnalog: "Contact created / first visit",
    description: "Fires the first time a member signs in.",
    timed: false,
  },
  {
    type: "MEMBER_JOINED",
    label: "Finished onboarding",
    ghlAnalog: "Form submitted / pipeline start",
    description: "Fires when a member completes profile setup.",
    timed: false,
  },
  {
    type: "APPLICATION_APPROVED",
    label: "Application approved",
    ghlAnalog: "Opportunity won / invite sent",
    description: "Fires when an admin approves an applicant (invite email still sends separately).",
    timed: false,
  },
  {
    type: "TAG_ADDED",
    label: "Tag added",
    ghlAnalog: "Tag added",
    description: "Fires when a member receives a tag. Optionally limit to one tag.",
    timed: false,
  },
  {
    type: "LEVEL_REACHED",
    label: "Progression level reached",
    ghlAnalog: "Custom event",
    description: "Fires when a creator moves to a new progression level. Optionally limit to one level.",
    timed: false,
  },
  {
    type: "WENT_LIVE",
    label: "Went live on TikTok",
    ghlAnalog: "Custom event",
    description: "Fires when the live poll first sees this creator go live (a new session).",
    timed: false,
  },
  {
    type: "INACTIVE_DAYS",
    label: "Inactive for X days",
    ghlAnalog: "Date-based / no activity",
    description: "Hourly check: signed in before, but last seen is older than X days.",
    timed: true,
  },
  {
    type: "NEVER_LOGGED_IN",
    label: "Invited, never signed in",
    ghlAnalog: "Date-based after create",
    description: "Hourly check: still has never logged in, X days after the account was created.",
    timed: true,
  },
  {
    type: "DAYS_AFTER_FIRST_LOGIN",
    label: "X days after first login",
    ghlAnalog: "Wait / date-based follow-up",
    description: "Hourly check: first hub login was at least X days ago.",
    timed: true,
  },
];

export const CAMPAIGN_AUDIENCES: { type: CampaignAudienceType; label: string }[] = [
  { type: "ALL_MEMBERS", label: "Everyone matching the trigger" },
  { type: "TAG", label: "Only a tag" },
  { type: "GROUP", label: "Only a group" },
  { type: "NETWORK_TRACK", label: "Only CN or MN track" },
];

export function parseTriggerConfig(raw: unknown): CampaignTriggerConfig {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const days = typeof obj.days === "number" ? obj.days : Number(obj.days);
  return {
    days: Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), 365) : undefined,
    tagId: typeof obj.tagId === "string" && obj.tagId ? obj.tagId : undefined,
    levelId: typeof obj.levelId === "string" && obj.levelId ? obj.levelId : undefined,
  };
}

export function triggerLabel(type: CampaignTriggerType): string {
  return CAMPAIGN_TRIGGERS.find((t) => t.type === type)?.label ?? type;
}
