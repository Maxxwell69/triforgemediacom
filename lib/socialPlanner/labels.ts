import type { SocialPlannerItemKind, SocialPlannerItemStatus } from "@prisma/client";

export const SOCIAL_PLANNER_KINDS = ["VIDEO", "PHOTO", "LIVE"] as const;
export const SOCIAL_PLANNER_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
  "CANCELED",
] as const;

export const SOCIAL_PLANNER_PRIVACY = [
  "PUBLIC_TO_EVERYONE",
  "MUTUAL_FOLLOW_FRIENDS",
  "FOLLOWER_OF_CREATOR",
  "SELF_ONLY",
] as const;

export type SocialPlannerPrivacy = (typeof SOCIAL_PLANNER_PRIVACY)[number];

export function plannerKindLabel(kind: SocialPlannerItemKind): string {
  switch (kind) {
    case "VIDEO":
      return "Video";
    case "PHOTO":
      return "Photo";
    case "LIVE":
      return "LIVE";
    default:
      return kind;
  }
}

export function plannerStatusLabel(status: SocialPlannerItemStatus): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SCHEDULED":
      return "Scheduled";
    case "PUBLISHING":
      return "Publishing";
    case "PUBLISHED":
      return "Published";
    case "FAILED":
      return "Failed";
    case "CANCELED":
      return "Canceled";
    default:
      return status;
  }
}

export function plannerPrivacyLabel(value: string): string {
  switch (value) {
    case "PUBLIC_TO_EVERYONE":
      return "Everyone";
    case "MUTUAL_FOLLOW_FRIENDS":
      return "Friends";
    case "FOLLOWER_OF_CREATOR":
      return "Followers";
    case "SELF_ONLY":
      return "Only me";
    default:
      return value;
  }
}

export function accountHandle(account: { username: string | null; nickname: string | null }): string {
  if (account.username) return `@${account.username}`;
  if (account.nickname) return account.nickname;
  return "TikTok account";
}
