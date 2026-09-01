export type AdminNavLink = {
  href: string;
  label: string;
  description?: string;
  /** Catalog SKU; omitted or "core" = always shown on every hub. */
  sku?: string;
};

export type AdminNavSection = {
  id: string;
  label: string;
  description: string;
  links: AdminNavLink[];
};

/**
 * Single source of truth for admin navigation sections.
 * Used by AdminNav dropdowns and the dashboard shortcut grid.
 * Each link is tagged with a hub SKU for Obtainable Hub dry-run gating.
 */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: "people",
    label: "People",
    description: "Members, applicants, and imports",
    links: [
      {
        href: "/admin/network",
        label: "Network dashboard",
        description: "Creator counts, reach, live, league, hub engagement",
        sku: "tiktokInsights",
      },
      {
        href: "/admin/roster",
        label: "Activity roster",
        description: "Levels, participation, go-lives, who signed into the hub",
        sku: "core",
      },
      {
        href: "/admin/users",
        label: "Users",
        description: "Roles, bans, TikTok links, groups & tags",
        sku: "core",
      },
      {
        href: "/admin/import",
        label: "Import",
        description: "GHL / roster import tools",
        sku: "ghlImport",
      },
      {
        href: "/admin/applications",
        label: "Applicants",
        description: "Review and approve applications",
        sku: "applications",
      },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "TikTask and hub projects",
    links: [
      {
        href: "/admin/tasks",
        label: "Task templates",
        description: "Daily creator tasks by platform and goal",
        sku: "tiktask",
      },
      {
        href: "/admin/projects",
        label: "Projects",
        description: "Assign hub projects and tasks to members",
        sku: "projects",
      },
    ],
  },
  {
    id: "structure",
    label: "Structure",
    description: "Groups, tags, and channels",
    links: [
      {
        href: "/admin/groups",
        label: "Groups",
        description: "Spaces, roles, invites, and channel access",
        sku: "core",
      },
      {
        href: "/admin/tags",
        label: "Tags",
        description: "Member tags and filters",
        sku: "core",
      },
      {
        href: "/admin/channels",
        label: "Channels",
        description: "Community chat channels",
        sku: "chat",
      },
    ],
  },
  {
    id: "email",
    label: "Email",
    description: "Broadcasts and templates",
    links: [
      {
        href: "/admin/broadcast",
        label: "Broadcasts",
        description: "Send announcements to members",
        sku: "email",
      },
      {
        href: "/admin/campaigns",
        label: "Campaigns",
        description: "Triggers that email or notify members",
        sku: "email",
      },
      {
        href: "/admin/emails",
        label: "Email templates",
        description: "Edit transactional email copy",
        sku: "email",
      },
    ],
  },
  {
    id: "safety",
    label: "Chat & safety",
    description: "Chat, DMs, and moderation",
    links: [
      {
        href: "/dms",
        label: "Direct messages",
        description: "Open your DM inbox and conversations",
        sku: "dms",
      },
      {
        href: "/admin/chat",
        label: "DM settings",
        description: "DM access mode and allowlist",
        sku: "dms",
      },
      {
        href: "/admin/moderation",
        label: "Moderation",
        description: "Moderation log and history",
        sku: "core",
      },
      {
        href: "/admin/bugs",
        label: "Hub Bug",
        description: "Status, timing, and finder credit",
        sku: "hubBug",
      },
    ],
  },
  {
    id: "webinars",
    label: "Live & events",
    description: "Who's live, webinars, and hub events",
    links: [
      {
        href: "/live",
        label: "Live page",
        description: "See who's live on TikTok right now",
        sku: "tiktokInsights",
      },
      {
        href: "/admin/webinars",
        label: "Webinars",
        description: "Schedule and manage webinars",
        sku: "webinars",
      },
      {
        href: "/admin/calendar",
        label: "Events",
        description: "Schedule hub meetings and events",
        sku: "calendar",
      },
    ],
  },
  {
    id: "learning",
    label: "Learning",
    description: "Courses, rewards, and badges",
    links: [
      {
        href: "/admin/courses",
        label: "Courses",
        description: "Learning Center content",
        sku: "learning",
      },
      {
        href: "/admin/rewards",
        label: "Rewards",
        description: "XP store catalog",
        sku: "rewards",
      },
      {
        href: "/admin/badges",
        label: "Badges",
        description: "Achievement badges",
        sku: "badges",
      },
    ],
  },
  {
    id: "progression",
    label: "Progression",
    description: "Creator ladder, missions, and certs",
    links: [
      {
        href: "/admin/progression",
        label: "Overview",
        description: "Progression module dashboard",
        sku: "progression",
      },
      {
        href: "/admin/progression/applications",
        label: "Applications",
        description: "MN apply-to-start queue",
        sku: "progression",
      },
      {
        href: "/admin/progression/levels",
        label: "Levels",
        description: "Ladder, XP, milestones",
        sku: "progression",
      },
      {
        href: "/admin/progression/categories",
        label: "Categories",
        description: "Mission tracks",
        sku: "progression",
      },
      {
        href: "/admin/progression/missions",
        label: "Missions",
        description: "Category missions and XP",
        sku: "progression",
      },
      {
        href: "/admin/progression/learn",
        label: "Learn",
        description: "Courses attached to each level",
        sku: "progression",
      },
      {
        href: "/admin/progression/certs",
        label: "Certs",
        description: "Certifications and tiers",
        sku: "progression",
      },
      {
        href: "/admin/progression/people",
        label: "Creator trees",
        description: "Per-member progress and grants",
        sku: "progression",
      },
    ],
  },
  {
    id: "shop",
    label: "Shop",
    description: "Merch catalog and orders",
    links: [
      {
        href: "/admin/shop",
        label: "Products",
        description: "Create and edit shop products",
        sku: "shop",
      },
      {
        href: "/admin/shop/orders",
        label: "Orders",
        description: "Paid orders (Stripe checkout comes next)",
        sku: "shop",
      },
      {
        href: "/admin/shop/settings",
        label: "Shop settings",
        description: "Name, currency, publish, and future connections",
        sku: "shop",
      },
    ],
  },
  {
    id: "site",
    label: "Site",
    description: "Public updates and company social",
    links: [
      {
        href: "/updates",
        label: "Updates",
        description: "Public changelog and programs",
        sku: "siteUpdates",
      },
      {
        href: "/admin/social",
        label: "Company social",
        description: "Share-to links for the hub",
        sku: "companySocial",
      },
    ],
  },
];

export function isAdminLinkActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAdminSectionActive(pathname: string, section: AdminNavSection): boolean {
  return section.links.some((link) => isAdminLinkActive(pathname, link.href));
}

export function linkSku(link: AdminNavLink): string {
  return link.sku || "core";
}

/** Drop links whose SKU is hidden; drop empty sections. Pass hubHas from the server. */
export function filterAdminNavSections(
  sections: AdminNavSection[],
  has: (sku: string) => boolean
): AdminNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => has(linkSku(link))),
    }))
    .filter((section) => section.links.length > 0);
}
