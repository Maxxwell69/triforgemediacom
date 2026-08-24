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
    name: "TikTok Stats & Live",
    tagline: "Profile counts · who's live · private insights",
    description:
      "Members keep their TikTok handle on profile — the hub pulls followers, likes, video count, Live/Offline, auto LIVE tags, and a Live page for the community (via tik.tools, no TikTok login). Detailed Creator Insights stay private to the owner and admins.",
    since: "2.25",
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
    tagline: "Stage, chat & recordings",
    description:
      "Scheduled webinars with multi-host stage, screen share, raise hand, chat, people list, moderation, recordings, and secure outside-network signup pages for non-members.",
    since: "2.0",
  },
  {
    name: "Groups & Spaces",
    tagline: "Home + inviteable spaces",
    description:
      "Evolving hub groups into spaces with Home as the main community, member roles, invites/applications, and per-group channels (building out from the existing access-control groups).",
    since: "2.59",
  },
  {
    name: "Hub Projects",
    tagline: "Assigned work (not TikTask)",
    description:
      "Admin-assigned projects and tasks for hub members — separate from TikTask’s daily creator habits. Members only see work they’re added to.",
    since: "2.59",
  },
  {
    name: "Hub Calendar",
    tagline: "Events, availability & booking",
    description:
      "Meetings and events, member availability (including go-live windows), booking, and mass webinars mirrored onto the shared calendar.",
    since: "2.59",
  },
  {
    name: "Admin Command Center",
    tagline: "Ops for the whole hub",
    description:
      "Applications, GHL import, users, groups, tags, courses, webinars, email templates, broadcasts, and moderation — in one place.",
    since: "1.0",
  },
  {
    name: "Hub Shop",
    tagline: "Merch catalog",
    description:
      "Admin-managed catalog with Stripe Checkout, physical orders, and private digital downloads. Subscriptions, Shopify import, and Printify are next.",
    since: "2.96",
  },
  {
    name: "Creator Progression",
    tagline: "Editable ladder & missions",
    description:
      "Admin-built levels, mission categories, learning modules, certifications, skills, and badges — with a creator progress tree. Official TriForge ladder content ships as editable data.",
    since: "2.99",
  },
];

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: "3.136",
    date: "August 24, 2026",
    title: "Specialty learning attachments",
    summary:
      "Learning Center courses can attach to a progression level, a specialization, or both — members see those courses under the specialty skill after they pick that track.",
    items: [
      {
        kind: "feature",
        text: "Attach LMS courses on a level page, optionally limited to a specialty like Gamer or Shop Owner",
      },
      {
        kind: "feature",
        text: "Admin → Progression → Learn groups courses by rank and by the seven specializations",
      },
      {
        kind: "feature",
        text: "After a creator picks a specialty, its attached Learning Center courses show under that skill on /progress",
      },
    ],
  },
  {
    version: "3.135",
    date: "August 24, 2026",
    title: "Single CN / MN profile badge",
    summary:
      "Member profiles and the directory no longer show a duplicate CN or MN pill when someone is in both the group and the tag.",
    items: [
      {
        kind: "fix",
        text: "CN and MN badges render once on member cards and profiles even when both the group and tag are assigned",
      },
    ],
  },
  {
    version: "3.134",
    date: "August 22, 2026",
    title: "Admins can delete a lesson",
    summary:
      "Staff can remove a lesson from a course in Admin → Courses, or from the lesson page itself.",
    items: [
      {
        kind: "feature",
        text: "Delete a lesson from the course editor or the lesson page — progress and assignments go with it",
      },
    ],
  },
  {
    version: "3.133",
    date: "August 21, 2026",
    title: "Admin can set or reset a member password",
    summary:
      "Staff can set a sign-in password on a user or email them a one-hour reset link from Admin → Users.",
    items: [
      {
        kind: "feature",
        text: "Admin user page: set a password or send a reset email (mods cannot change admin/mod passwords)",
      },
    ],
  },
  {
    version: "3.132",
    date: "August 21, 2026",
    title: "Webinars list shows the next 24 hours",
    summary:
      "The hub Webinars page lists live sessions and anything starting within a day. Later dates stay on the calendar.",
    items: [
      {
        kind: "improve",
        text: "Upcoming webinars appear on Webinars only within 24 hours of start; the calendar still shows the full series",
      },
    ],
  },
  {
    version: "3.131",
    date: "August 21, 2026",
    title: "Calendar, My Tasks, and weekly webinars",
    summary:
      "Every member can use Calendar and My Tasks. Admins can schedule a weekly webinar series so sessions show throughout the week.",
    items: [
      {
        kind: "feature",
        text: "My Tasks is on for all members (admins can still hide it per person)",
      },
      {
        kind: "feature",
        text: "Everyone can post hub calendar events; Home events are visible to the whole hub",
      },
      {
        kind: "feature",
        text: "Admin → Webinars: Repeat weekly to create multiple sessions across chosen days",
      },
    ],
  },
  {
    version: "3.130",
    date: "August 21, 2026",
    title: "Learn tab lists courses by level",
    summary:
      "Admin → Progression → Learn is back, grouped so you can see which Learning Center courses sit on each rank.",
    items: [
      {
        kind: "improve",
        text: "Progression Learn tab shows every level and the LMS courses attached to it",
      },
    ],
  },
  {
    version: "3.129",
    date: "August 21, 2026",
    title: "Fix staging build after LMS cutover",
    summary: "Unused progression lesson seed code is gone so staging can deploy.",
    items: [
      {
        kind: "fix",
        text: "Removed leftover MODULES seed helpers that failed the ESLint production build",
      },
    ],
  },
  {
    version: "3.128",
    date: "August 21, 2026",
    title: "Choose more than one specialty",
    summary:
      "Rising Star specialties are no longer one-at-a-time — creators can unlock as many tracks as they want.",
    items: [
      {
        kind: "feature",
        text: "Progress lets you Choose additional specialties without resetting, and unlocks the skill for each one you pick",
      },
    ],
  },
  {
    version: "3.127",
    date: "August 21, 2026",
    title: "Progression uses Learning Center courses",
    summary:
      "Creator Progression no longer has a separate lesson system — it shows LMS courses attached to each level.",
    items: [
      {
        kind: "improve",
        text: "Attach a course to a progression level in Admin → Courses; Progress lists those Learning Center courses instead of the old progression modules",
      },
    ],
  },
  {
    version: "3.126",
    date: "August 21, 2026",
    title: "Fix specialty reset staging build",
    summary: "Reset specialization now compiles so staging can deploy.",
    items: [
      {
        kind: "fix",
        text: "Specialty reset no longer uses a Map iterator that failed the production TypeScript build",
      },
    ],
  },
  {
    version: "3.125",
    date: "August 21, 2026",
    title: "Reset specialization anytime",
    summary:
      "Creators can reset their Rising Star specialty and pick again as many times as they want.",
    items: [
      {
        kind: "feature",
        text: "Progress now has Reset specialization under Skills and the specialty icons — it clears the pick and that track’s deep-dive so you can go through the process again",
      },
    ],
  },
  {
    version: "3.124",
    date: "August 21, 2026",
    title: "Progression apply video",
    summary:
      "The Creator Progression application sheet now plays the program explainer video.",
    items: [
      {
        kind: "feature",
        text: "MN apply / Progress explainer sheet embeds the Creator Progression program video",
      },
    ],
  },
  {
    version: "3.123",
    date: "August 20, 2026",
    title: "Set progression level from the admin user profile",
    summary:
      "Opening a member in Admin → Users now shows their Creator Progression rank with a Set level control.",
    items: [
      {
        kind: "feature",
        text: "Admin → Users → a member includes Creator Progression so staff can change their level without leaving that profile",
      },
    ],
  },
  {
    version: "3.122",
    date: "August 20, 2026",
    title: "Admin can place anyone on a progression level",
    summary:
      "Staff can search any member and set their Creator Progression rank from Admin → Progression → People.",
    items: [
      {
        kind: "feature",
        text: "Admin → Progression → People now lets you put any user on any level, even before they earn the XP or certs",
      },
    ],
  },
  {
    version: "3.121",
    date: "August 19, 2026",
    title: "Keep Progress admin-only until training is ready",
    summary:
      "Creator Progression stays hidden from CN and MN even if member access was turned on in Admin.",
    items: [
      {
        kind: "improve",
        text: "Progress nav and /progress stay staff-only until the member lock is lifted in code",
      },
    ],
  },
  {
    version: "3.120",
    date: "August 19, 2026",
    title: "Fix overlapping cert names on level edit",
    summary:
      "Required certifications on a progression level no longer stack the cert name on top of the dropdown.",
    items: [
      {
        kind: "fix",
        text: "Admin level cert rows keep the name beside the tier dropdown instead of overlaying it",
      },
    ],
  },
  {
    version: "3.119",
    date: "August 19, 2026",
    title: "Fix admin level detail crash",
    summary: "Opening a progression level in Admin no longer throws a server error.",
    items: [
      {
        kind: "fix",
        text: "Admin → Progression → Levels detail no longer passes event handlers from the server into client toggles",
      },
    ],
  },
  {
    version: "3.118",
    date: "August 19, 2026",
    title: "Fix Progress page production build",
    summary: "Staging deploy of the current-level training panel now builds.",
    items: [
      {
        kind: "fix",
        text: "Current-level XP remaining no longer fails TypeScript during the Railway image build",
      },
    ],
  },
  {
    version: "3.117",
    date: "August 19, 2026",
    title: "Current-level training under the progression chart",
    summary:
      "Your Progress keeps the interactive ladder, then lists the current rank, what you need next, and linked training.",
    items: [
      {
        kind: "improve",
        text: "Under the chart: current level name, requirements to reach the next rank, and links to attached courses and learning modules",
      },
    ],
  },
  {
    version: "3.116",
    date: "August 19, 2026",
    title: "Progression enroll and MN apply",
    summary:
      "Creator Network members join the ladder as Recruits. Media Network members apply on Progress, and the system stays hidden until training is ready.",
    items: [
      {
        kind: "feature",
        text: "CN signups are enrolled in Creator Progression as Recruit; existing CN members enroll on their next hub visit",
      },
      {
        kind: "feature",
        text: "MN members see a Progress explainer (video + apply form) until an admin approves them as Recruit",
      },
      {
        kind: "improve",
        text: "Progress stays hidden from CN and MN until admins turn on member access in Admin → Progression",
      },
    ],
  },
  {
    version: "3.115",
    date: "August 18, 2026",
    title: "Fix webinar time label in the browser",
    summary:
      "Webinars no longer crash with “Invalid option” when formatting the scheduled time.",
    items: [
      {
        kind: "fix",
        text: "Time labels no longer mix dateStyle/timeStyle with timeZoneName, which Chrome rejects",
      },
    ],
  },
  {
    version: "3.114",
    date: "August 18, 2026",
    title: "Fix webinar page client crash",
    summary:
      "Opening Webinars no longer white-screens. Times still show in your timezone after the page loads.",
    items: [
      {
        kind: "fix",
        text: "Webinar/calendar time labels no longer pass Date objects into a client component (that crashed the page)",
      },
    ],
  },
  {
    version: "3.113",
    date: "August 18, 2026",
    title: "Calendar and webinar times use your timezone",
    summary:
      "Scheduling a webinar at 3:30 PM Eastern no longer shows as 11:30 AM. Times save in the host’s device zone and display in each viewer’s zone.",
    items: [
      {
        kind: "fix",
        text: "datetime-local webinar and calendar times were stored as UTC on Railway — they now use the submitter’s timezone",
      },
      {
        kind: "improve",
        text: "Calendar, webinar, and event pages show times in each user’s device timezone (with EST/EDT-style labels)",
      },
    ],
  },
  {
    version: "3.112",
    date: "August 18, 2026",
    title: "Fix Create Hub production build",
    summary:
      "Production image build was failing on TypeScript in Create Hub. The hub record form compiles again.",
    items: [
      {
        kind: "fix",
        text: "Create Hub save/update types and SKU checkbox iteration so next build succeeds on Railway",
      },
    ],
  },
  {
    version: "3.111",
    date: "August 18, 2026",
    title: "Versions now use three digits",
    summary:
      "Ships from here on bump as 3.111, 3.112, 3.113 — one extra digit after 3.11.",
    items: [
      {
        kind: "improve",
        text: "App version and /updates now use three-digit minors (3.111+) instead of 3.11, 3.12",
      },
    ],
  },
  {
    version: "3.11",
    date: "August 18, 2026",
    title: "Create Hub saves a real hub record",
    summary:
      "Admins can save a client hub (name, slug, email, SKUs) and check off the next setup steps — DNS, Railway TLS, tenant database, invite.",
    items: [
      {
        kind: "feature",
        text: "Create Hub stores client hubs in Postgres instead of only a browser cookie preview",
      },
      {
        kind: "feature",
        text: "Each hub has a setup list: DNS CNAME, Railway TLS domain, tenant database, invite client admin",
      },
    ],
  },
  {
    version: "3.10",
    date: "August 17, 2026",
    title: "Specialty hover glow and focus areas",
    summary:
      "Hover a specialization on Your Progress to light it up and see what that track covers.",
    items: [
      {
        kind: "improve",
        text: "Specialization icons glow on hover with a tooltip — description plus focus areas like polls, co-streams, or live selling",
      },
    ],
  },
  {
    version: "3.09",
    date: "August 17, 2026",
    title: "Progress ladder hover glow and cleanup",
    summary:
      "Your Progress drops the extra logos and planted chart image. Hover a rank to glow it and read what that level requires.",
    items: [
      {
        kind: "improve",
        text: "Hover any Progress level for an orange glow and a tooltip with XP plus the level description",
      },
      {
        kind: "fix",
        text: "Removed the broken F mark, the Creator Progression footer, the planted breakdown image, and the extra Rising Star tags under specialties",
      },
    ],
  },
  {
    version: "3.08",
    date: "August 17, 2026",
    title: "Official progression breakdown on Your Progress",
    summary:
      "Your Progress now uses the official Creator Progression layout — white rank cards, orange specialty icons, and the Live Host → Legend poster flow.",
    items: [
      {
        kind: "improve",
        text: "Progress chart matches the official breakdown: Live Host start, Recruit, Newcomer, Rising Star specialties, rank ladder 4–9, and Legend",
      },
      {
        kind: "feature",
        text: "Seven specialty icons (Engagement Host, Gamer, Shop Owner, Musician, Artist, Educator, Community Builder) with Choose still on each node",
      },
    ],
  },
  {
    version: "3.07",
    date: "August 17, 2026",
    title: "Progression admin delete actually works",
    summary:
      "Delete on Skills (and other Progression admin rows) was nested inside the Save form, so the browser ignored it. Delete now runs as its own action.",
    items: [
      {
        kind: "fix",
        text: "Admin Progression Delete / Up / Down buttons no longer get swallowed by the Save form — Early Adopter and other extras can be removed",
      },
    ],
  },
  {
    version: "3.06",
    date: "August 17, 2026",
    title: "Specialty skills actually load",
    summary:
      "Opening Progress or Admin → Progression → Skills now writes the seven specialty skills into the database, so Gamer and Engagement Host show up instead of Early Adopter.",
    items: [
      {
        kind: "fix",
        text: "Sync Engagement Host, Gamer, Shop Owner, Musician, Artist, Educator, and Community Builder on every Progress and Skills admin load",
      },
    ],
  },
  {
    version: "3.05",
    date: "August 17, 2026",
    title: "Specialty skills on the ladder",
    summary:
      "Skills are now the seven creator specialties — Engagement Host, Gamer, Shop Owner, Musician, Artist, Educator, Community Builder — not Early Adopter extras.",
    items: [
      {
        kind: "improve",
        text: "Progress Skills list shows the seven specialties; your pick at Rising Star unlocks that skill",
      },
      {
        kind: "fix",
        text: "Archived Early Adopter, Multi-Track, and Community Pillar so they no longer appear as the skill set",
      },
    ],
  },
  {
    version: "3.04",
    date: "August 17, 2026",
    title: "Official creator ladder chart",
    summary:
      "Progress now follows the TriForge chart: Live Host start, Recruit → Newcomer, Rising Star unlocks the seven specialties, then Regular through Legend on your chosen track.",
    items: [
      {
        kind: "feature",
        text: "Progress page ladder matches the official chart, including the seven specialty nodes",
      },
      {
        kind: "improve",
        text: "Specialization unlocks at Rising Star — picking a track is no longer required to reach that level",
      },
    ],
  },
  {
    version: "3.03",
    date: "August 17, 2026",
    title: "Choose a creator specialty",
    summary:
      "After Newcomer, creators pick one specialty — Engagement Host, Gamer, Shop Owner, Musician, Artist, Educator, or Community Builder — on the way to Rising Star.",
    items: [
      {
        kind: "feature",
        text: "Progress page Specialty section: locked until Newcomer, then choose one track",
      },
      {
        kind: "improve",
        text: "Skill Mastery shows only your chosen track’s deep-dive, not all seven specialize missions as checkboxes",
      },
    ],
  },
  {
    version: "3.02",
    date: "August 17, 2026",
    title: "Recruit membership & admin Hub maker",
    summary:
      "New accounts join as Recruits — the starting rung of Creator Progression. Create Hub stays admin-only so members never see the SKU catalog.",
    items: [
      {
        kind: "feature",
        text: "New membership role Recruit: default for new signups, same chat access as Member, shown on chat badges",
      },
      {
        kind: "feature",
        text: "Creator Progression starts at Recruit; visiting the hub creates a progress profile on the first level",
      },
      {
        kind: "feature",
        text: "Create Hub (/superadmin) is ADMIN-only — mods and members cannot open it",
      },
    ],
  },
  {
    version: "3.01",
    date: "August 17, 2026",
    title: "Learning Center on the ladder",
    summary:
      "Admins can attach any Learning Center course to Creator Progression — pick a track and the level it should appear from. Completing the course counts toward that track’s Trainee cert.",
    items: [
      {
        kind: "feature",
        text: "Course edit: toggle Use in Creator Progression, choose track and starting level",
      },
      {
        kind: "feature",
        text: "Attached courses show on /progress and count when the member finishes the course or passes its quiz",
      },
    ],
  },
  {
    version: "3.00",
    date: "August 16, 2026",
    title: "Official creator ladder",
    summary:
      "The Progression module is now populated with TriForge categories, levels, specialization tracks, certs, badges, and starter skills. Quiz questions come next.",
    items: [
      {
        kind: "program",
        text: "Official ladder: Recruit → Legend, 8 categories, 7 specialization tracks, 14 learning module shells",
      },
      {
        kind: "feature",
        text: "Admin can load or refresh official content from Progression overview (safe to re-run)",
      },
      {
        kind: "feature",
        text: "Level gates can require a cert tier, any-one milestone (track pick), and category unlocks at a level",
      },
    ],
  },
  {
    version: "2.99",
    date: "August 16, 2026",
    title: "Creator Progression module",
    summary:
      "Admins can build a creator ladder from levels, missions, learning modules, certs, skills, and badges. Members track it on /progress.",
    items: [
      {
        kind: "feature",
        text: "Admin → Progression: CRUD for categories, levels, missions, learn modules/quizzes, certs, skills, badges",
      },
      {
        kind: "feature",
        text: "Member /progress tree with XP, locked levels, mission complete, quizzes, and earned badges",
      },
      {
        kind: "feature",
        text: "Admin per-creator tree with manual cert / skill / badge grants",
      },
    ],
  },
  {
    version: "2.98",
    date: "August 16, 2026",
    title: "Shop setup and Stripe connect",
    summary:
      "Admins can paste Stripe keys, copy the webhook URL, and finish storefront setup from Shop settings.",
    items: [
      {
        kind: "feature",
        text: "Admin → Shop settings: Stripe keys, webhook endpoint, shipping countries, support email, tagline",
      },
      {
        kind: "improve",
        text: "Go-live checklist for Stripe, file storage, published catalog, and active products",
      },
    ],
  },
  {
    version: "2.97",
    date: "August 15, 2026",
    title: "Shop checkout and downloads",
    summary:
      "Members can buy physical or digital products on the hub via Stripe Checkout. Paid files unlock under Shop → Downloads.",
    items: [
      {
        kind: "feature",
        text: "Stripe Checkout for one-time shop purchases, with webhook + success-page fulfillment",
      },
      {
        kind: "feature",
        text: "Digital products: private R2 files and signed download links after payment",
      },
      {
        kind: "improve",
        text: "Admin orders can mark physical shipments fulfilled; subscriptions stay a follow-up",
      },
    ],
  },
  {
    version: "2.96",
    date: "August 15, 2026",
    title: "Hub Shop catalog",
    summary:
      "Admins can build a merch catalog; members browse /shop. Checkout, Shopify import, and Printify attach in later passes.",
    items: [
      {
        kind: "feature",
        text: "Admin → Shop: products, variants, images, publish, and an orders list ready for Stripe",
      },
      {
        kind: "feature",
        text: "Member /shop catalog and product pages (checkout disabled until Stripe is wired)",
      },
      {
        kind: "improve",
        text: "Shop is a flagship hub module so it can move to an optional SKU for client hubs later",
      },
    ],
  },
  {
    version: "2.95",
    date: "August 13, 2026",
    title: "Live page in admin nav",
    summary:
      "Admins can open the community Live page from Live & events in the admin menu.",
    items: [
      {
        kind: "improve",
        text: "Admin → Live & events now includes a link to /live (who’s live on TikTok)",
      },
    ],
  },
  {
    version: "2.94",
    date: "August 12, 2026",
    title: "Network Creator dashboard",
    summary:
      "Admins get a Network Creators dashboard with headcounts, TikTok reach, who’s live, Diamond Rush league, and hub engagement for CN, MN, or both.",
    items: [
      {
        kind: "feature",
        text: "Admin → Network dashboard: creator counts, follower buckets, live roster, league classes, TikTask/XP/streaks, chat & webinar activity",
      },
      {
        kind: "improve",
        text: "Admin home shows Network creators shortcut tile; clear notes where diamond earnings / live history aren’t stored yet",
      },
    ],
  },
  {
    version: "2.93",
    date: "August 12, 2026",
    title: "Chat names no longer stuck on Member",
    summary:
      "Channel chat falls back to a member’s account name when TikTok and hub username are missing — so people stop showing up as “Member”.",
    items: [
      {
        kind: "fix",
        text: "Chat display name: TikTok → hub username → account name → Member",
      },
      {
        kind: "improve",
        text: "Onboarding seeds hub username from the TikTok @handle when available",
      },
    ],
  },
  {
    version: "2.92",
    date: "August 11, 2026",
    title: "Fix chat image build",
    summary:
      "Restores a broken edit-message Save button that was failing Railway builds for admin chat images.",
    items: [
      {
        kind: "fix",
        text: "ChatView syntax error no longer blocks staging/production deploys",
      },
    ],
  },
  {
    version: "2.91",
    date: "August 11, 2026",
    title: "Admin chat images",
    summary:
      "Admins can attach images in channel chat — members can view them, but only admins can post them.",
    items: [
      {
        kind: "feature",
        text: "Channel composer Image button for ADMIN accounts (JPG/PNG/WEBP/GIF via R2)",
      },
      {
        kind: "improve",
        text: "Image-only posts and caption + image posts render inline; click opens full size",
      },
    ],
  },
  {
    version: "2.90",
    date: "August 11, 2026",
    title: "Shared broadcast drafts",
    summary:
      "Admins can save broadcast emails as drafts — any other admin can open, edit, preview recipients, and send.",
    items: [
      {
        kind: "feature",
        text: "Admin → Broadcasts: Save as draft / Update draft, with a shared drafts list for the whole admin team",
      },
      {
        kind: "improve",
        text: "Sending a draft converts it to a sent record (who sent + when) instead of leaving a stale draft behind",
      },
    ],
  },
  {
    version: "2.89",
    date: "August 11, 2026",
    title: "Broadcast audience email preview",
    summary:
      "Before sending an admin broadcast, see the exact active emails that will receive it for the chosen audience.",
    items: [
      {
        kind: "feature",
        text: "Admin → Broadcasts shows a live recipient count and email list when you pick All / CN·MN / tag / group / single user",
      },
      {
        kind: "improve",
        text: "Send button reflects the previewed recipient count; unsubscribed members are listed as skipped",
      },
    ],
  },
  {
    version: "2.88",
    date: "August 11, 2026",
    title: "Edit your chat messages",
    summary:
      "Channel authors can fix typos in their own posts — edits sync to everyone in the channel and show an (edited) mark.",
    items: [
      {
        kind: "feature",
        text: "Hover a message you sent → Edit, then Save (Enter) or Cancel (Esc)",
      },
      {
        kind: "improve",
        text: "Edited messages stay in place with an (edited) label; other members pick up changes on the next poll",
      },
    ],
  },
  {
    version: "2.87",
    date: "August 10, 2026",
    title: "Personal Tasks (admin-gated)",
    summary:
      "Admins can enable a private My Tasks list per member — self-assigned to-dos only, separate from TikTask and Projects.",
    items: [
      {
        kind: "feature",
        text: "Admin → Users: Personal Tasks toggle unlocks /apps/tasks for that member",
      },
      {
        kind: "feature",
        text: "Members create, start, complete, and delete private tasks assigned only to themselves",
      },
    ],
  },
  {
    version: "2.86",
    date: "August 10, 2026",
    title: "Group switcher sticks",
    summary:
      "Switching spaces no longer snaps back to the previous group when you were viewing a channel.",
    items: [
      {
        kind: "fix",
        text: "Group rail navigates to the new space instead of refreshing the old channel (which was rewriting the active-group cookie)",
      },
    ],
  },
  {
    version: "2.85",
    date: "August 9, 2026",
    title: "Channels above hub menu",
    summary:
      "The active group and its channels now sit at the top of the sidebar; hub menu links move below.",
    items: [
      {
        kind: "improve",
        text: "Sidebar order: space + channels first, then Groups/Dashboard/Account menu",
      },
    ],
  },
  {
    version: "2.84",
    date: "August 9, 2026",
    title: "Restore left group rail + default Home",
    summary:
      "Group circles are back on the left; Groups stays at the top of the menu; new sessions default to Home.",
    items: [
      {
        kind: "fix",
        text: "Revert horizontal group strip — space icons return to the left rail",
      },
      {
        kind: "improve",
        text: "First sign-in / no cookie defaults the active space to Home",
      },
    ],
  },
  {
    version: "2.83",
    date: "August 9, 2026",
    title: "Group switcher above the menu",
    summary:
      "Space icons now sit in a strip above the left menu instead of a far-left Discord-style column.",
    items: [
      {
        kind: "improve",
        text: "Group rail moved above the main sidebar menu as a horizontal switcher",
      },
    ],
  },
  {
    version: "2.82",
    date: "August 9, 2026",
    title: "Nav reorder + group switch flash",
    summary:
      "Groups leads the left menu, TikTask sits quietly under Account, and switching spaces flashes the channel list.",
    items: [
      {
        kind: "improve",
        text: "Groups moved to the top of the sidebar; TikTask nested under Account without highlight",
      },
      {
        kind: "improve",
        text: "Brief cyan flash on the space header when changing groups",
      },
    ],
  },
  {
    version: "2.81",
    date: "August 9, 2026",
    title: "Group unread badge overlay",
    summary:
      "Unread counts on the group rail sit on top of the icon again instead of getting clipped inside the circle.",
    items: [
      {
        kind: "fix",
        text: "Group notification pills use an overlay layer above the space icon",
      },
    ],
  },
  {
    version: "2.80",
    date: "August 9, 2026",
    title: "Day view, event pages & group calendars",
    summary:
      "Open a full day on the calendar, click through to event pages, filter by group, and let admins enable group event creation.",
    items: [
      {
        kind: "feature",
        text: "Day view + Open full day, with event detail pages at /calendar/events/[id]",
      },
      {
        kind: "feature",
        text: "Admin toggle: group members can create group-scoped calendar events",
      },
      {
        kind: "improve",
        text: "Filter the hub calendar by All / Hub / group calendars",
      },
    ],
  },
  {
    version: "2.79",
    date: "August 9, 2026",
    title: "Calendar cells match dashboard cards",
    summary:
      "Day cells drop the white outlines for soft glass panels that glow orange on hover.",
    items: [
      {
        kind: "improve",
        text: "Month/Week day cells use borderless glass styling with hover glow like home dashboard cards",
      },
    ],
  },
  {
    version: "2.78",
    date: "August 9, 2026",
    title: "Calendar day hover & click polish",
    summary:
      "Calendar day cells lift with an orange glow on hover and spark a short ignite ripple on click.",
    items: [
      {
        kind: "improve",
        text: "Month and Week day cells: hover lift/glow plus click ripple (respects reduced motion)",
      },
    ],
  },
  {
    version: "2.77",
    date: "August 9, 2026",
    title: "Calendar redesign",
    summary:
      "Hub Calendar gets Month, Week, and Agenda views with color-coded event chips and a richer schedule layout.",
    items: [
      {
        kind: "improve",
        text: "Wider atmospheric calendar page with kind legend and Today jump",
      },
      {
        kind: "feature",
        text: "Month / Week / Agenda toggle with titled event chips and kind-colored detail cards",
      },
    ],
  },
  {
    version: "2.76",
    date: "August 9, 2026",
    title: "Hide network groups + live unread badges",
    summary:
      "Admins can hide category groups (like MN) from listings, and unread red counters now update live on space icons.",
    items: [
      {
        kind: "feature",
        text: "Admin toggle to show or hide a group in /groups and the space switcher (MN/CN start hidden)",
      },
      {
        kind: "improve",
        text: "Group rail badges show live red unread counts, matching channel notification badges",
      },
    ],
  },
  {
    version: "2.75",
    date: "August 9, 2026",
    title: "Fix Home group image save",
    summary:
      "Saving a Home group image no longer crashes admin — the locked name field is submitted correctly.",
    items: [
      {
        kind: "fix",
        text: "Home group settings can save image, color, and TikTask access without a server error",
      },
    ],
  },
  {
    version: "2.74",
    date: "August 8, 2026",
    title: "Discord-style group rail",
    summary:
      "Switch spaces from a left icon rail like Discord servers; the channel column keeps the active group name and logo.",
    items: [
      {
        kind: "feature",
        text: "Far-left group rail with logos, active pill, unread badges, and hover names",
      },
      {
        kind: "improve",
        text: "Channel sidebar header shows the selected group’s name and logo",
      },
    ],
  },
  {
    version: "2.73",
    date: "August 8, 2026",
    title: "Staff access every group without applying",
    summary:
      "Hub admins and mods are treated as members of every space — no application queue or Apply CTA.",
    items: [
      {
        kind: "improve",
        text: "Admins/mods see all groups under Your spaces and get full group pages without applying",
      },
      {
        kind: "fix",
        text: "applyToGroup rejects staff who already have implicit access",
      },
    ],
  },
  {
    version: "2.72",
    date: "August 8, 2026",
    title: "Simplify sidebar — DMs live in Admin",
    summary:
      "Space switcher and Direct messages are out of the main sidebar; staff open DMs from Admin → Chat & safety.",
    items: [
      {
        kind: "improve",
        text: "Removed Space and Direct messages from the main community sidebar",
      },
      {
        kind: "improve",
        text: "Added Direct messages under Admin → Chat & safety (DM settings renamed)",
      },
    ],
  },
  {
    version: "2.71",
    date: "August 8, 2026",
    title: "Pre-prod booking & calendar security hardening",
    summary:
      "Public booking is rate-limited and closed to open webinar signup, RSVP respects event visibility, and staff emails are no longer shown on booking pages.",
    items: [
      {
        kind: "fix",
        text: "Calendar RSVP now enforces event visibility (no PRIVATE/GROUP bypass)",
      },
      {
        kind: "fix",
        text: "Appointment bookings disable open webinar signup; personal join links still work",
      },
      {
        kind: "fix",
        text: "Public booking rate limits + advisory lock to prevent double-book races",
      },
      {
        kind: "fix",
        text: "Public /book pages never fall back to staff login email for host name",
      },
    ],
  },
  {
    version: "2.70",
    date: "August 8, 2026",
    title: "Fix admin insights fetch crash",
    summary:
      "Fetching creator insights from Admin → Users no longer blanks the page — failures show an inline message instead.",
    items: [
      {
        kind: "fix",
        text: "Admin creator insights refresh no longer throws an Application error on TikTok/API failure",
      },
      {
        kind: "improve",
        text: "Insights load errors are contained so the rest of the admin user page still renders",
      },
    ],
  },
  {
    version: "2.69",
    date: "August 8, 2026",
    title: "Admin creator insights + more TikTok intel",
    summary:
      "Admin user pages surface Creator Insights with refresh, plus extra tik.tools fields like bio link, Diamond Rush league, and engagement ratios.",
    items: [
      {
        kind: "feature",
        text: "Admin → Users shows Creator Insights near the top with fetch/refresh",
      },
      {
        kind: "improve",
        text: "Insights add bio link, TikTok user id, followers/following ratio, likes/video, and Diamond Rush league when available",
      },
    ],
  },
  {
    version: "2.68",
    date: "August 8, 2026",
    title: "Course visibility by group",
    summary:
      "When creating or editing a course, pick which groups can see that training — e.g. Gaming only, not Shop Owners.",
    items: [
      {
        kind: "feature",
        text: "New course form includes “Who can see this training” group checkboxes",
      },
      {
        kind: "improve",
        text: "Course edit saves access groups with the course; list shows who each course is visible to",
      },
    ],
  },
  {
    version: "2.67",
    date: "August 8, 2026",
    title: "Space-scoped channels, Rewards leaderboard, group images",
    summary:
      "Switching groups now swaps the left channel list, the XP leaderboard lives on Rewards, and admins can upload group images.",
    items: [
      {
        kind: "improve",
        text: "Sidebar Space switcher filters channels to the selected group (Home by default)",
      },
      {
        kind: "improve",
        text: "Leaderboard moved onto the Rewards page; nested nav link removed",
      },
      {
        kind: "feature",
        text: "Admin Groups can upload a square group image shown in lists and the space switcher",
      },
    ],
  },
  {
    version: "2.66",
    date: "August 8, 2026",
    title: "Account areas with breadcrumbs",
    summary:
      "Account is a hub that opens separate pages for Booking, Creator Insights, Profile, and Security — each with breadcrumbs back to Account.",
    items: [
      {
        kind: "improve",
        text: "Split Account into /account/booking, /insights, /profile, and /security",
      },
      {
        kind: "improve",
        text: "Breadcrumb navigation on every Account sub-page",
      },
    ],
  },
  {
    version: "2.65",
    date: "August 8, 2026",
    title: "Account page feature shortcuts",
    summary:
      "Account opens with clear buttons for Calendar, Booking, Creator Insights, Profile, and Security — email and password live under Security.",
    items: [
      {
        kind: "improve",
        text: "Account page feature grid for Calendar, Booking, Insights, Profile, and Security",
      },
      {
        kind: "improve",
        text: "Email preferences, change email, and change password grouped under Security",
      },
    ],
  },
  {
    version: "2.64",
    date: "August 8, 2026",
    title: "Calendly-style staff booking",
    summary:
      "Admins set weekly availability on Account, share a /book link, and confirmed appointments email both sides plus create a private webinar room.",
    items: [
      {
        kind: "feature",
        text: "Account → Booking: weekly hours, duration, timezone, and shareable booking link",
      },
      {
        kind: "feature",
        text: "Public /book/[slug] page for guests to pick a slot and confirm",
      },
      {
        kind: "feature",
        text: "On book: confirmation emails + private webinar with guest join link",
      },
    ],
  },
  {
    version: "2.63",
    date: "August 8, 2026",
    title: "Calendar is view-only; Events stay in admin",
    summary:
      "The member calendar is a clean month view of scheduled events. Staff schedule via Admin → Events and manage availability on Account.",
    items: [
      {
        kind: "improve",
        text: "Member Calendar shows scheduled events only — no posting or booking UI",
      },
      {
        kind: "improve",
        text: "Admin → Events is the hub event scheduler (separate from the member calendar)",
      },
      {
        kind: "feature",
        text: "Staff set personal availability on Account (member event posting comes later there too)",
      },
    ],
  },
  {
    version: "2.62",
    date: "August 8, 2026",
    title: "Hub Calendar — events, availability & booking",
    summary:
      "Members and admins can schedule on the hub calendar, post go-live and free slots, book meetings, and RSVP — with mass webinars mirrored automatically.",
    items: [
      {
        kind: "feature",
        text: "Admin → Calendar: schedule meetings/events, review pending bookings",
      },
      {
        kind: "feature",
        text: "Members post availability (live / free / busy), hub events, and book open slots",
      },
      {
        kind: "feature",
        text: "RSVP on hub events; hosts confirm or decline booking requests",
      },
      {
        kind: "improve",
        text: "Mass webinars (All / CN / MN) continue to sync onto the shared calendar",
      },
    ],
  },
  {
    version: "2.61",
    date: "August 8, 2026",
    title: "Group channels & hub Projects",
    summary:
      "Group managers can create channels for their space, and admins can assign hub projects and tasks to members.",
    items: [
      {
        kind: "feature",
        text: "Group managers create channels scoped to their space (also from Admin → Groups)",
      },
      {
        kind: "feature",
        text: "Admin → Projects: create projects, add members, assign tasks with due dates",
      },
      {
        kind: "feature",
        text: "Members see My Projects only when assigned — can update status on their tasks",
      },
    ],
  },
  {
    version: "2.60",
    date: "August 8, 2026",
    title: "Groups Phase B — Home, invites & applications",
    summary:
      "Home is the main hub space, members can apply or accept invites to other groups, and Projects stay admin-only for now.",
    items: [
      {
        kind: "feature",
        text: "Home group auto-enrolls active members; main MEMBER channels attach to Home",
      },
      {
        kind: "feature",
        text: "Group roles (manager / mod / member), invite links, and apply/approve flows",
      },
      {
        kind: "feature",
        text: "Member Groups pages plus richer Admin → Groups management",
      },
      {
        kind: "improve",
        text: "Projects removed from member nav (admin-only); Leaderboard tucked under Rewards",
      },
    ],
  },
  {
    version: "2.59",
    date: "August 8, 2026",
    title: "Groups, Projects & Calendar scaffold",
    summary:
      "Foundation for three new hub modules on staging — schema, nav, and placeholder pages — ready to build out.",
    items: [
      {
        kind: "program",
        text: "Groups v2: Home space, join modes, member roles, invites & applications in the data model",
      },
      {
        kind: "program",
        text: "Hub Projects: admin-assigned projects/tasks (separate from TikTask); members only see what they’re on",
      },
      {
        kind: "program",
        text: "Calendar: events, availability slots, bookings; mass webinars sync onto the calendar",
      },
      {
        kind: "feature",
        text: "Sidebar + admin nav entries for Groups, Projects, and Calendar (scaffold pages)",
      },
    ],
  },
  {
    version: "2.58",
    date: "August 7, 2026",
    title: "Broadcast delivery, spam checks & unsubscribe",
    summary:
      "Admin broadcasts send reliably, get scored for spam risk before send, and include a real unsubscribe path.",
    items: [
      {
        kind: "fix",
        text: "Broadcasts use Resend batch sending with retries — no more mass 429 failures",
      },
      {
        kind: "feature",
        text: "Live deliverability score on Admin → Broadcast — blocks sends that look like spam",
      },
      {
        kind: "feature",
        text: "Unsubscribe link + one-click List-Unsubscribe; Account toggle to resubscribe",
      },
      {
        kind: "improve",
        text: "AI draft prompt tuned for inbox-friendly subjects and copy",
      },
    ],
  },
  {
    version: "2.57",
    date: "August 7, 2026",
    title: "Company TikTok @forge_live_cn",
    summary:
      "TriForge’s official company TikTok on the hub is now @forge_live_cn.",
    items: [
      {
        kind: "improve",
        text: "Company social TikTok set to https://www.tiktok.com/@forge_live_cn",
      },
    ],
  },
  {
    version: "2.56",
    date: "August 6, 2026",
    title: "Private Creator Insights",
    summary:
      "Owners and admins get a richer TikTok analytics dashboard on Account and Admin user pages — other members only see the public TikTok link.",
    items: [
      {
        kind: "feature",
        text: "Creator Insights panel: reach, engagement ratios, live session metrics, and hub XP/streak",
      },
      {
        kind: "feature",
        text: "When live, Pro+ room_info enriches viewers, live likes, duration, and total joined",
      },
      {
        kind: "improve",
        text: "Detailed TikTok stats removed from public member profiles (Live badge + link remain)",
      },
    ],
  },
  {
    version: "2.55",
    date: "August 6, 2026",
    title: "Live board stays fresh",
    summary:
      "Who’s Live no longer goes blank between delayed cron runs — opening the page re-checks TikTok, and confirmed lives stay visible longer.",
    items: [
      {
        kind: "fix",
        text: "Opening /live re-polls tik.tools when the roster is more than a few minutes old",
      },
      {
        kind: "fix",
        text: "LIVE status stays visible for 90 minutes (was 12) so GitHub Actions cron drift doesn’t hide streamers",
      },
      {
        kind: "improve",
        text: "Live sync GitHub Action schedules 4×/hour on off-peak minutes for more reliable polls",
      },
    ],
  },
  {
    version: "2.54",
    date: "August 6, 2026",
    title: "CN Effect badge",
    summary:
      "Admins can mark members with Effect so their CN badge shows green, and filter those members in search.",
    items: [
      {
        kind: "feature",
        text: "Admin-only Effect checkbox on user profiles — turns CN group/tag text green",
      },
      {
        kind: "feature",
        text: "Filter by Effect on admin user search and the members directory (admins)",
      },
    ],
  },
  {
    version: "2.53",
    date: "August 6, 2026",
    title: "Webinar audience targeting",
    summary:
      "Admins can schedule webinars for all members, Creator Network (CN), Media Network (MN), or admins only.",
    items: [
      {
        kind: "feature",
        text: "Create and edit webinars with audience: All, CN, MN, or Admins — hub list and join enforce the choice",
      },
    ],
  },
  {
    version: "2.52",
    date: "August 5, 2026",
    title: "Hub Bug unread badge",
    summary:
      "A red count appears next to Hub Bug in the sidebar when there are new tickets you haven’t seen yet.",
    items: [
      {
        kind: "feature",
        text: "Sidebar Hub Bug badge shows how many new entries since your last visit (clears when you open the board)",
      },
    ],
  },
  {
    version: "2.51",
    date: "August 5, 2026",
    title: "Hub Bug tickets & credit",
    summary:
      "Every Hub Bug gets a trackable ticket number (HB-0001), and admins can assign finder credit to any member.",
    items: [
      {
        kind: "feature",
        text: "Unique ticket numbers (HB-0001…) on the board, admin queue, and alert emails",
      },
      {
        kind: "feature",
        text: "Admin can reassign Hub Bug credit by choosing a member from the list",
      },
    ],
  },
  {
    version: "2.50",
    date: "August 5, 2026",
    title: "Hub Bug cleanup",
    summary:
      "Removed the legacy #bugs chat channel and the chat-import tools — Hub Bug is the only path.",
    items: [
      {
        kind: "improve",
        text: "Deleted the old #bugs chat channel from the database",
      },
      {
        kind: "improve",
        text: "Removed Hub Bug import-from-chat admin tools and scripts",
      },
    ],
  },
  {
    version: "2.49",
    date: "August 5, 2026",
    title: "Hub Bug",
    summary:
      "The bug board is now Hub Bug, with a one-click import from the old #bugs chat channel.",
    items: [
      {
        kind: "improve",
        text: "Renamed the reporting system to Hub Bug across member and admin UI",
      },
      {
        kind: "feature",
        text: "Admin can import legacy #bugs chat messages into Hub Bug (idempotent)",
      },
    ],
  },
  {
    version: "2.48",
    date: "August 5, 2026",
    title: "Richer bug reports",
    summary:
      "Bug reports now capture device type, page URL, and an optional screenshot so the team can reproduce issues faster.",
    items: [
      {
        kind: "feature",
        text: "Bug form includes where (website / iOS / Android / other), optional page URL with paste, and optional screenshot upload",
      },
    ],
  },
  {
    version: "2.47",
    date: "August 5, 2026",
    title: "Bug report board",
    summary:
      "Members file bugs on a public board with status, finder credit, and time-to-fix — admins manage timing and get email alerts.",
    items: [
      {
        kind: "feature",
        text: "Bug Reports board (/bugs) — submit, track Reported / Being worked on / Fixed / Couldn't reproduce, with credit to the finder",
      },
      {
        kind: "feature",
        text: "Admin bug queue — edit status, entered/fixed times, notes; emails when a bug is reported and when it's marked fixed",
      },
      {
        kind: "improve",
        text: "Legacy #bugs chat channel is hidden from the sidebar in favor of the new board",
      },
    ],
  },
  {
    version: "2.46",
    date: "August 5, 2026",
    title: "Profile photos that don’t expire",
    summary:
      "TikTok profile photos are saved on our CDN so they stop breaking a few days after stats refresh.",
    items: [
      {
        kind: "fix",
        text: "Mirror TikTok avatars to R2 when stats refresh — signed CDN links no longer leave broken photos on profiles",
      },
      {
        kind: "fix",
        text: "Expired avatar URLs auto-refresh on member profiles; failed images fall back to initials instead of a broken icon",
      },
    ],
  },
  {
    version: "2.45",
    date: "August 5, 2026",
    title: "TikTask completed tasks stick",
    summary:
      "Checking off a TikTask now stays crossed off when you leave and come back.",
    items: [
      {
        kind: "fix",
        text: "Completed TikTasks stay crossed off after navigating away (fresh load instead of a stale cached list)",
      },
    ],
  },
  {
    version: "2.44",
    date: "August 3, 2026",
    title: "Outside webinar stage, leave & chat fixes",
    summary:
      "Screen share takes the main stage with others onboard, leave warns on any nav link, phone shares stay readable, and outside guests can use webinar chat.",
    items: [
      {
        kind: "fix",
        text: "Screen share fills the main stage when other hosts are present (no more thin-bar focus layout)",
      },
      {
        kind: "fix",
        text: "Leaving a webinar via sidebar, logo, or other links now asks for confirmation",
      },
      {
        kind: "fix",
        text: "Phone screen shares use contain fit, and host tiles stay viewable on mobile during share",
      },
      {
        kind: "feature",
        text: "Outside-network guests can read and send webinar chat without a hub account",
      },
    ],
  },
  {
    version: "2.43",
    date: "August 3, 2026",
    title: "Hide outside webinars from the hub",
    summary:
      "Webinars with outside-network signup enabled no longer show as available to members inside the hub.",
    items: [
      {
        kind: "fix",
        text: "Outside-network webinars are invite-link only — not listed or joinable on hub Webinars for members",
      },
    ],
  },
  {
    version: "2.42",
    date: "August 2, 2026",
    title: "Remove LiveKit branding copy",
    summary:
      "Webinar admin and program copy no longer mentions LiveKit Cloud branding.",
    items: [
      {
        kind: "improve",
        text: "Removed “powered by LiveKit Cloud” and similar branding from webinar UI copy",
      },
    ],
  },
  {
    version: "2.41",
    date: "August 2, 2026",
    title: "Stage avatars & speaking glow",
    summary:
      "Your webinar avatar now fills the stage tile when the camera is off, and active speakers get an orange glow.",
    items: [
      {
        kind: "feature",
        text: "Custom stage tiles show the People-panel avatar instead of the grey silhouette",
      },
      {
        kind: "feature",
        text: "Speaking participants glow on stage (tile border + avatar halo + Talking badge)",
      },
    ],
  },
  {
    version: "2.40",
    date: "August 2, 2026",
    title: "Outside guests can join the stage",
    summary:
      "People who signed up through an outside webinar invite can raise their hand and be invited onto the host stage.",
    items: [
      {
        kind: "feature",
        text: "Outside guests can raise hand and get invited/removed from stage like members",
      },
      {
        kind: "improve",
        text: "Host raise-hand queue and People moderation include outside-network attendees",
      },
    ],
  },
  {
    version: "2.39",
    date: "August 2, 2026",
    title: "Outside-network webinar signup",
    summary:
      "Admins can open a secure public invite page so people outside the hub can register and join a webinar without becoming members.",
    items: [
      {
        kind: "feature",
        text: "Admin toggle for an outside meeting spot with a copyable secure invite link",
      },
      {
        kind: "feature",
        text: "Public /w/[token] signup page — name + email only, personal access link after register",
      },
      {
        kind: "feature",
        text: "Outside guests join the LiveKit room as audience viewers (no hub account)",
      },
    ],
  },
  {
    version: "2.38",
    date: "August 2, 2026",
    title: "Webinar leave warning & participant avatars",
    summary:
      "Hosts get a confirmation before leaving a live room, and every guest or host can set their avatar in the People panel.",
    items: [
      {
        kind: "feature",
        text: "Host leave warning when clicking Leave or closing the webinar tab",
      },
      {
        kind: "feature",
        text: "Guests, speakers, and hosts can upload or paste an avatar in the webinar People tab",
      },
    ],
  },
  {
    version: "2.37",
    date: "August 2, 2026",
    title: "Webinar host avatars",
    summary:
      "Admins can upload a host photo for each webinar — shown on the webinars list and detail pages.",
    items: [
      {
        kind: "feature",
        text: "Add/replace host avatar when creating or managing a webinar",
      },
    ],
  },
  {
    version: "2.36",
    date: "August 1, 2026",
    title: "Live board catches go-lives more reliably",
    summary:
      "Live sync no longer skips creators when tik.tools returns unknown or a partial bulk response — go-lives like roster checks fall back to a definitive check.",
    items: [
      {
        kind: "fix",
        text: "Unknown/partial bulk live results now re-check with check_alive so creators aren’t missed when they go live",
      },
      {
        kind: "fix",
        text: "Bulk live API failures fall back to per-creator checks instead of marking everyone offline",
      },
    ],
  },
  {
    version: "2.35",
    date: "August 1, 2026",
    title: "Chat opens on the latest message",
    summary:
      "Opening a channel or DM jumps you to the newest message instead of leaving you stuck at the top.",
    items: [
      {
        kind: "fix",
        text: "Channel and DM views reliably scroll to the latest message on enter",
      },
    ],
  },
  {
    version: "2.34",
    date: "August 1, 2026",
    title: "Chat names without TikTok no longer say Member",
    summary:
      "Chat falls back to a member’s hub username when they don’t have a TikTok handle yet, instead of the generic “Member” label.",
    items: [
      {
        kind: "fix",
        text: "Chat display name uses hub username when TikTok identity is missing",
      },
    ],
  },
  {
    version: "2.33",
    date: "July 31, 2026",
    title: "Live board clears when creators go offline",
    summary:
      "Creators drop off the Live page and lose the LIVE tag after they end stream — missing/unknown API rows no longer leave them stuck live.",
    items: [
      {
        kind: "fix",
        text: "Live sync marks missing bulk-check results as offline and clears stale LIVE after 12 minutes",
      },
      {
        kind: "fix",
        text: "Live page and member Live badges only show recently confirmed streams",
      },
    ],
  },
  {
    version: "2.32",
    date: "July 31, 2026",
    title: "Admin staff filter in Users",
    summary:
      "Admins and mods stay visible in User Management — filter by Staff/Admin and staff rows sort to the top.",
    items: [
      {
        kind: "improve",
        text: "User Management role filters (Staff, Admins, Mods, Creators, Members)",
      },
      {
        kind: "fix",
        text: "Staff accounts remain visible on CN/MN track tabs and sort above the roster",
      },
    ],
  },
  {
    version: "2.31",
    date: "July 31, 2026",
    title: "Admin nav sections & dashboard shortcuts",
    summary:
      "Admin is grouped into People, Tasks, Structure, Email, Chat & safety, Webinars, Learning, and Site — with dashboard buttons into every area.",
    items: [
      {
        kind: "improve",
        text: "Admin top nav uses section dropdowns instead of one long link strip",
      },
      {
        kind: "feature",
        text: "Admin dashboard — shortcut buttons for every admin area by section",
      },
    ],
  },
  {
    version: "2.30",
    date: "July 31, 2026",
    title: "Admin user search & signup handles",
    summary:
      "Find members faster in User Management, and see the @handle they used when applying.",
    items: [
      {
        kind: "feature",
        text: "Admin User Management — search by name, email, or @handle",
      },
      {
        kind: "improve",
        text: "Admin user profile shows signup handle, apply platform, and social link",
      },
    ],
  },
  {
    version: "2.29",
    date: "July 31, 2026",
    title: "Admin TikTok link editor",
    summary:
      "Admins can set a member’s TikTok profile URL from the user page so handles show on the network without waiting on the member.",
    items: [
      {
        kind: "feature",
        text: "Admin user page — edit TikTok URL / @handle and refresh stats on save",
      },
    ],
  },
  {
    version: "2.28",
    date: "July 31, 2026",
    title: "Who's Live + TikTok handles on Members",
    summary:
      "See who’s live on TikTok from a Live page, auto LIVE tags, and TikTok @handles filled into member profiles from apply data.",
    items: [
      {
        kind: "feature",
        text: "New Live page (/live) listing community creators currently live on TikTok",
      },
      {
        kind: "feature",
        text: "Automatic LIVE tag on members who are live — cleared when they go offline",
      },
      {
        kind: "improve",
        text: "Backfill TikTok URLs into social links so member network cards show @handles",
      },
      {
        kind: "improve",
        text: "Cron every 5 minutes syncs live status via tik.tools bulk check",
      },
    ],
  },
  {
    version: "2.27",
    date: "July 31, 2026",
    title: "TikTok stats & live check",
    summary:
      "Real TikTok followers, likes, videos, and Live/Offline on Account and profiles — from the member’s handle, no TikTok login.",
    items: [
      {
        kind: "feature",
        text: "TikTok stats on Account — followers, likes, video count via tik.tools (no OAuth)",
      },
      {
        kind: "feature",
        text: "Live/Offline badge with stream title and viewer count when a creator is live",
      },
      {
        kind: "feature",
        text: "Same stats card on member profiles and admin user pages",
      },
      {
        kind: "improve",
        text: "Existing members keep apply/profile handles — stats auto-load; no re-connect required",
      },
      {
        kind: "program",
        text: "TikTok Stats listed under Programs & solutions on /updates",
      },
    ],
  },
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
