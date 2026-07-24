import { platformOptions } from "./validations/apply";

export const PLATFORM_LABELS: Record<(typeof platformOptions)[number], string> = {
  TIKTOK: "TikTok",
  TWITCH: "Twitch",
  YOUTUBE: "YouTube",
  KICK: "Kick",
  INSTAGRAM: "Instagram",
  OTHER: "Other",
};
