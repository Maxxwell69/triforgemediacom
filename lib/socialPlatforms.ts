import type { SocialPlatform } from "@prisma/client";

// Central config for company social links (admin-managed via /admin/social).
// Add a new enum value in prisma/schema.prisma + an entry here to support
// another platform.
export const SOCIAL_PLATFORM_META: Record<
  SocialPlatform,
  { label: string; icon: string; placeholder: string }
> = {
  YOUTUBE: {
    label: "YouTube",
    icon: "▶️",
    placeholder: "https://youtube.com/@triforgemedia",
  },
  TIKTOK: {
    label: "TikTok",
    icon: "🎵",
    placeholder: "https://www.tiktok.com/@forge_live_cn",
  },
  INSTAGRAM: {
    label: "Instagram",
    icon: "📸",
    placeholder: "https://instagram.com/triforgemedia",
  },
  FACEBOOK: {
    label: "Facebook",
    icon: "👍",
    placeholder: "https://facebook.com/triforgemedia",
  },
};

export const SOCIAL_PLATFORM_ORDER: SocialPlatform[] = [
  "YOUTUBE",
  "TIKTOK",
  "INSTAGRAM",
  "FACEBOOK",
];
