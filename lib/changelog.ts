/**
 * Public release notes for hub.triforgemedia.com.
 * Keep in sync with APP_VERSION in lib/version.ts — add a new entry
 * whenever you bump the version for a production ship.
 */

export type ChangelogKind = "feature" | "program" | "fix" | "improve";

export type ChangelogItem = {
  kind: ChangelogKind;
  text: string;
};

export type ChangelogRelease = {
  version: string;
  date: string;
  title: string;
  summary: string;
  items: ChangelogItem[];
};

export type PlatformProgram = {
  name: string;
  tagline: string;
  description: string;
  since: string;
};

/** Major products / programs members and partners can point to. */
export const PLATFORM_PROGRAMS: PlatformProgram[] = [
  {
    name: "Community Hub",
    tagline: "Real-time chat & channels",
    description:
      "Invite-only Discord-style community with role-gated channels, mentions, reactions, DMs, and member profiles.",
    since: "1.0",
  },
  {
    name: "TikTask",
    tagline: "Daily creator task engine",
    description:
      "Personalized daily tasks based on each creator’s platform and goals — with streaks, XP, and admin-editable templates.",
    since: "1.0",
  },
  {
    name: "Creator Network Tracks",
    tagline: "CN & Media Network",
    description:
      "Application routing into Creator Network or Media Network, with track-specific groups, tags, channels, and training.",
    since: "1.5",
  },
  {
    name: "Learning Center",
    tagline: "Courses, quizzes & certificates",
    description:
      "Structured courses with rich lessons, thumbnails, per-course quizzes, badges, and completion certificates.",
    since: "1.6",
  },
  {
    name: "TikTok Stats",
    tagline: "Profile counts & live check",
    description:
      "Members add their TikTok handle to pull followers, likes, video count, and Live/Offline status (via tik.tools) onto their community profile.",
    since: "1.6",
  },
  {
    name: "Rewards & Badges",
    tagline: "XP store & recognition",
    description:
      "Earn XP from tasks and sharing, redeem rewards, and collect course and achievement badges.",
    since: "1.6",
  },
  {
    name: "Leaderboard",
    tagline: "Daily · weekly · monthly XP",
    description:
      "Community rankings of XP earned over today, this week, this month, or all time — with online presence.",
    since: "2.22",
  },
  {
    name: "Live Webinars",
    tagline: "Hosted with LiveKit",
    description:
      "Scheduled webinars with multi-host stage, screen share, raise hand, chat, people list, moderation, and recordings.",
    since: "2.0",
  },
  {
    name: "Admin Command Center",
    tagline: "Ops for the whole hub",
    description:
      "Applications, GHL import, users, groups, tags, courses, webinars, email templates, broadcasts, and moderation — in one place.",
    since: "1.0",
  },
];

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: "2.26",
    date: "July 31, 2026",
    title: "TikTok stats auto-fill for existing members",
    summary:
      "Existing members keep their TikTok handle from apply/profile — stats load automatically without re-entering an account.",
    items: [
      {
        kind: "improve",
        text: "Backfill TikTok social link from application handle/URL when missing",
      },
      {
        kind: "improve",
        text: "Auto-fetch TikTok stats on Account the first time a handle is present",
      },
    ],
  },
  {
    version: "2.25",
    date: "July 31, 2026",
    title: "TikTok stats without OAuth",
    summary:
      "Pull followers, likes, videos, and Live/Offline from a member’s TikTok handle — no Connect TikTok login required.",
    items: [
      {
        kind: "feature",
        text: "Account TikTok stats via tik.tools — profile counts + live check from social link handle",
      },
      {
        kind: "improve",
        text: "Member and admin profiles show cached TikTok stats with a Live/Offline badge",
      },
    ],
  },
  {
    version: "2.24",
    date: "July 31, 2026",
    title: "TikTok Connect re-enabled",
    summary:
      "Connect TikTok is live again on Account so we can record the approval walkthrough for TikTok.",
    items: [
      {
        kind: "feature",
        text: "Re-enabled Connect TikTok button on the account page (OAuth via /api/tiktok/connect)",
      },
    ],
  },
  {
    version: "2.23",
    date: "July 31, 2026",
    title: "Public Hub website & sign-in",
    summary:
      "A front-facing Hub page that explains what’s inside the community, with a branded Sign in entry at /signin.",
    items: [
      {
        kind: "feature",
        text: "Public Hub landing — hero, inside the Hub, what it represents, and CN/MN programs",
      },
      {
        kind: "feature",
        text: "Branded /signin page; legacy /login redirects there",
      },
    ],
  },
  {
    version: "2.22",
    date: "July 31, 2026",
    title: "Leaderboard, last login & online presence",
    summary:
      "Daily/weekly/monthly XP leaderboard, admin last-login on member profiles, and green online dots in chat and the directory.",
    items: [
      {
        kind: "feature",
        text: "Leaderboard page with Today / This week / This month / All time XP rankings",
      },
      {
        kind: "feature",
        text: "Admin user profiles show last login and last-seen presence",
      },
      {
        kind: "feature",
        text: "Green online dots on avatars and names in chat, members directory, and profiles",
      },
    ],
  },
  {
    version: "2.21",
    date: "July 31, 2026",
    title: "Channel chat replies",
    summary:
      "Reply to any message in community channels — Discord-style quote preview above your message.",
    items: [
      {
        kind: "feature",
        text: "Reply button on channel messages with quoted preview and jump-to-original",
      },
      {
        kind: "improve",
        text: "Project rule: every ship bumps APP_VERSION and adds an /updates changelog entry",
      },
    ],
  },
  {
    version: "2.20",
    date: "July 31, 2026",
    title: "Members directory CN filter",
    summary:
      "The CN chip on the community members page now finds people who show CN on their profile via group, tag, or application track.",
    items: [
      {
        kind: "fix",
        text: "Members CN/MN filter matches group membership and application track, not only the tag row",
      },
    ],
  },
  {
    version: "2.19",
    date: "July 31, 2026",
    title: "CN / MN filtering for broadcasts",
    summary:
      "Creator Network memberships now sync to the CN tag and group, so admins can filter and email CN or MN tracks reliably.",
    items: [
      {
        kind: "fix",
        text: "CN-track members get CN group + tag (same as MN already did) so filters recognize them",
      },
      {
        kind: "feature",
        text: "Broadcast audience option for Creator Network (CN) or Media Network (MN) track",
      },
      {
        kind: "feature",
        text: "Admin Users page filter chips for CN / MN",
      },
      {
        kind: "improve",
        text: "Backfill repairs existing members missing CN/MN memberships when admins open Users or Broadcast",
      },
    ],
  },
  {
    version: "2.18",
    date: "July 30, 2026",
    title: "Public updates & version history",
    summary:
      "A public changelog so anyone — members, partners, and applicants — can see what shipped and which programs are live.",
    items: [
      {
        kind: "feature",
        text: "New public Updates page listing every release and the major programs on the hub",
      },
      {
        kind: "feature",
        text: "Admin menu shortcut to the Updates page for quick partner review",
      },
      {
        kind: "improve",
        text: "Version badge in the corner now links to the full changelog",
      },
    ],
  },
  {
    version: "2.17",
    date: "July 30, 2026",
    title: "Unread channels & clearer names",
    summary:
      "Easier to spot new activity in chat, and members can keep display names and usernames accurate.",
    items: [
      {
        kind: "feature",
        text: "Discord-style unread badges on community channels",
      },
      {
        kind: "feature",
        text: "Members can edit their name and username from account settings",
      },
      {
        kind: "improve",
        text: "TikTok-connected members show their TikTok name in chat",
      },
    ],
  },
  {
    version: "2.16",
    date: "July 2026",
    title: "Deploy reliability",
    summary: "Smoother production deploys so new features reach the live hub faster.",
    items: [
      {
        kind: "fix",
        text: "Simplified pre-deploy database migration alignment for Railway",
      },
      {
        kind: "improve",
        text: "Migration checks no longer block a clean ship when already in sync",
      },
    ],
  },
  {
    version: "2.15",
    date: "July 2026",
    title: "Webinar chat unread badges",
    summary: "Live session chat now surfaces unread messages the same way community chat does.",
    items: [
      {
        kind: "feature",
        text: "Unread badge on the webinar Chat tab during live sessions",
      },
      {
        kind: "fix",
        text: "Build and deploy fixes for webinar chat on Railway",
      },
    ],
  },
  {
    version: "2.14",
    date: "July 2026",
    title: "Mobile webinar stage",
    summary: "Camera stage and room layout tuned so webinars work cleanly on phones.",
    items: [
      {
        kind: "fix",
        text: "Webinar camera stage layout fixed for mobile viewers and hosts",
      },
      {
        kind: "improve",
        text: "Staging migration handling for webinar recordings",
      },
    ],
  },
  {
    version: "2.13",
    date: "July 2026",
    title: "Host moderation tools",
    summary:
      "Hosts can run the room: invite to stage, demote, and manage chat while the session stays locked to one screen height.",
    items: [
      {
        kind: "feature",
        text: "Host moderation: stage invite, demote, and chat tools",
      },
      {
        kind: "feature",
        text: "People tab and raise-hand support in watch mode",
      },
      {
        kind: "fix",
        text: "Room height locked so chat cannot stretch the whole page",
      },
    ],
  },
  {
    version: "2.0",
    date: "July 2026",
    title: "Live Webinars milestone",
    summary:
      "Major program launch: members join scheduled webinars powered by LiveKit — multi-host stage, screen share, and admin recordings.",
    items: [
      {
        kind: "program",
        text: "Member webinars with LiveKit Cloud (schedule, join, and watch live)",
      },
      {
        kind: "feature",
        text: "Multi-host stage layouts with screen-share focus",
      },
      {
        kind: "feature",
        text: "Admins choose host or watch-only when joining a live session",
      },
      {
        kind: "feature",
        text: "Post-webinar recording uploads for admins",
      },
    ],
  },
  {
    version: "1.9",
    date: "July 2026",
    title: "Learning Center polish & chat power-ups",
    summary:
      "Richer courses, clearer profiles, and chat that feels closer to Discord — mentions, reactions, and admin DMs.",
    items: [
      {
        kind: "feature",
        text: "Chat mentions, emoji reactions, and admin-started DMs",
      },
      {
        kind: "feature",
        text: "Editable email templates and unpublished course preview for admins",
      },
      {
        kind: "feature",
        text: "Lesson thumbnails as course heroes; quizzes once per course",
      },
      {
        kind: "improve",
        text: "Public display name defaults to TikTok username (optional real name)",
      },
      {
        kind: "improve",
        text: "Apply form routes by country into CN or Media Network; phone/country kept private",
      },
    ],
  },
  {
    version: "1.8",
    date: "July 2026",
    title: "GHL import & TikTok Connect",
    summary:
      "One-time Media/Creator Network migration tools, plus TikTok Connect on the account page.",
    items: [
      {
        kind: "program",
        text: "GHL contact import (CSV upload/paste) with MN/CN track auto-detection",
      },
      {
        kind: "feature",
        text: "Deferred-email import mode for bulk onboarding",
      },
      {
        kind: "feature",
        text: "TikTok Connect control on the account page",
      },
      {
        kind: "feature",
        text: "Daily streak reminder emails via scheduled GitHub Actions",
      },
    ],
  },
  {
    version: "1.7",
    date: "July 28, 2026",
    title: "Version badge & release tracking",
    summary:
      "Every page shows the live app version so production always matches what we expect.",
    items: [
      {
        kind: "feature",
        text: "Site-wide version badge (corner of every page)",
      },
      {
        kind: "improve",
        text: "Documented bump-on-release convention for production ships",
      },
    ],
  },
  {
    version: "1.6",
    date: "July 2026",
    title: "Learning, social & TikTok profiles",
    summary:
      "Learning Center, company social sharing, TikTok profile cards, tags, and the email/broadcast system.",
    items: [
      {
        kind: "program",
        text: "Learning Center: courses, rich HTML lessons, badges, and certificates",
      },
      {
        kind: "program",
        text: "TikTok OAuth — live follower/like/video stats on member profiles",
      },
      {
        kind: "feature",
        text: "Company social admin area and share-to menu (TikTok, Instagram, and more)",
      },
      {
        kind: "feature",
        text: "Daily XP for sharing to promote the network",
      },
      {
        kind: "feature",
        text: "Tag system with member search filters",
      },
      {
        kind: "feature",
        text: "Email system: welcome, password reset, streak, badge, certificate + AI broadcast drafting",
      },
      {
        kind: "feature",
        text: "Dashboard home with section cards and company announcement banner",
      },
      {
        kind: "feature",
        text: "Public Terms and Privacy Policy pages",
      },
    ],
  },
  {
    version: "1.5",
    date: "July 2026",
    title: "Creator Network tracks (CN / MN)",
    summary:
      "Applications route into the right network track with matching groups, tags, channels, and training.",
    items: [
      {
        kind: "program",
        text: "MN/CN application routing with agency question on the apply form",
      },
      {
        kind: "feature",
        text: "Auto MN group + tag assignment; CN-only channel and CN training course",
      },
      {
        kind: "feature",
        text: "In-depth admin user detail page for member ops",
      },
      {
        kind: "feature",
        text: "Phone number and SMS consent on applications",
      },
      {
        kind: "improve",
        text: "Security hardening from pen-test ahead of MVP launch",
      },
    ],
  },
  {
    version: "1.0",
    date: "2026",
    title: "MVP foundation",
    summary:
      "The core TriForge Community hub: apply → approve → invite → chat → TikTask → admin tools.",
    items: [
      {
        kind: "program",
        text: "Public application flow with admin approval queue and invite emails",
      },
      {
        kind: "program",
        text: "Email/password auth (invite-only signup) and profile onboarding",
      },
      {
        kind: "program",
        text: "Real-time community chat with role-gated channels",
      },
      {
        kind: "program",
        text: "TikTask daily tasks, streaks, and XP from admin-managed templates",
      },
      {
        kind: "feature",
        text: "Admin dashboard: users, roles, bans, task templates, channels, rewards",
      },
    ],
  },
];

export function getLatestRelease(): ChangelogRelease {
  return CHANGELOG[0];
}
