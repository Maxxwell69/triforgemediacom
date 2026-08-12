export type AdminNavLink = {
  href: string;
  label: string;
  description?: string;
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
      },
      {
        href: "/admin/users",
        label: "Users",
        description: "Roles, bans, TikTok links, groups & tags",
      },
      {
        href: "/admin/import",
        label: "Import",
        description: "GHL / roster import tools",
      },
      {
        href: "/admin/applications",
        label: "Applicants",
        description: "Review and approve applications",
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
      },
      {
        href: "/admin/projects",
        label: "Projects",
        description: "Assign hub projects and tasks to members",
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
      },
      {
        href: "/admin/tags",
        label: "Tags",
        description: "Member tags and filters",
      },
      {
        href: "/admin/channels",
        label: "Channels",
        description: "Community chat channels",
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
      },
      {
        href: "/admin/emails",
        label: "Email templates",
        description: "Edit transactional email copy",
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
      },
      {
        href: "/admin/chat",
        label: "DM settings",
        description: "DM access mode and allowlist",
      },
      {
        href: "/admin/moderation",
        label: "Moderation",
        description: "Moderation log and history",
      },
      {
        href: "/admin/bugs",
        label: "Hub Bug",
        description: "Status, timing, and finder credit",
      },
    ],
  },
  {
    id: "webinars",
    label: "Live & events",
    description: "Webinars and hub events",
    links: [
      {
        href: "/admin/webinars",
        label: "Webinars",
        description: "Schedule and manage webinars",
      },
      {
        href: "/admin/calendar",
        label: "Events",
        description: "Schedule hub meetings and events",
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
      },
      {
        href: "/admin/rewards",
        label: "Rewards",
        description: "XP store catalog",
      },
      {
        href: "/admin/badges",
        label: "Badges",
        description: "Achievement badges",
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
      },
      {
        href: "/admin/social",
        label: "Company social",
        description: "Share-to links for the hub",
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
