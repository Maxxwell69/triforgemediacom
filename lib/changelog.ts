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
  {
    name: "Campaign automations",
    tagline: "Triggers → email or notify",
    description:
      "GHL-style campaigns: first login, inactivity, go-live, tags, and level-ups can email members or drop an in-hub notification.",
    since: "3.143",
  },
  {
    name: "Hub Support",
    tagline: "FAQ + ticket portal",
    description:
      "Searchable admin-editable FAQ and a member ticket portal. Emails only tell people to open the hub — conversation stays in the portal, not in email replies.",
    since: "3.161",
  },
  {
    name: "Social Planner",
    tagline: "TikTok schedule & Direct Post",
    description:
      "Admin module to draft and schedule TikTok videos and LIVE reminders, then auto-publish through TikTok’s Content Posting API. Optional Create Hub SKU.",
    since: "3.177",
  },
  {
    name: "Battle Hosts",
    tagline: "LIVE Battles specialty",
    description:
      "Rising Star specialization for TikTok LIVE Battles — five lessons, a 15-question exam, a Battle Hosts badge, and a hub group for practice matches.",
    since: "3.167",
  },
  {
    name: "Hub Campaigns",
    tagline: "Interviews · meetings · games · battles",
    description:
      "Admins publish campaigns for everyone or a tag/badge audience. Members sign up from the campaign window, can leave and rejoin, and each person has their own to-do checklist.",
    since: "3.169",
  },
  {
    name: "Onboarding checklist",
    tagline: "First-login steps & required courses",
    description:
      "Optional Create Hub SKU: named checklists (Getting Started, campaign follow-through, or custom), admin-editable steps, required course gates, dismiss with disclaimer, and reopen from Account.",
    since: "3.182",
  },
  {
    name: "Agency LIVE reports",
    tagline: "Monthly analytics + admin notes",
    description:
      "Hub 0 only: a hand-picked LIVE roster, per-creator monthly reports laid out like Creator Studio analytics, and shared admin notes. Not available on Create Hub.",
    since: "3.192",
  },
  {
    name: "Streaming kit",
    tagline: "Forge overlays for live",
    description:
      "Hub 0 only: logos, corner marks, nameplates, and camera frames as transparent PNGs, plus the creator guide — signed-in downloads from /streaming-kit.",
    since: "3.214",
  },
];

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: "3.237",
    date: "September 18, 2026",
    title: "Custom domain Railway attach fix",
    summary:
      "Saving a Create Hub custom domain talks to Railway’s current domain API so HTTPS setup can finish.",
    items: [
      {
        kind: "fix",
        text: "Admin → Hub profile custom domain save no longer fails on Railway’s domains query (needs subfields + projectId)",
      },
    ],
  },
  {
    version: "3.236",
    date: "September 18, 2026",
    title: "Self-serve custom domain HTTPS",
    summary:
      "Create Hub admins attach a vanity domain without a TriForge Railway click — saving the hostname requests the certificate automatically.",
    items: [
      {
        kind: "feature",
        text: "Admin → Hub profile: save a custom domain and Railway issues HTTPS; the page shows the CNAME and ownership TXT to add at your DNS",
      },
      {
        kind: "improve",
        text: "Check HTTPS status refreshes certificate state after DNS propagates. One RAILWAY_TOKEN on the service enables this for every hub",
      },
    ],
  },
  {
    version: "3.235",
    date: "September 17, 2026",
    title: "Create Hub custom domain",
    summary:
      "Create Hub admins can set a vanity hostname so members open the community on their own domain.",
    items: [
      {
        kind: "feature",
        text: "Admin → Hub profile: save a custom domain (CNAME to {slug}.hub.triforgemedia.com). Invites and the /hubs directory use that host when set",
      },
      {
        kind: "improve",
        text: "HTTPS on a vanity domain still needs the hostname added on Railway; the default {slug}.hub.triforgemedia.com address keeps working",
      },
    ],
  },
  {
    version: "3.234",
    date: "September 17, 2026",
    title: "Featurette opacity slider",
    summary:
      "Create Hub admins can make dashboard cards more or less opaque over the wallpaper.",
    items: [
      {
        kind: "feature",
        text: "Admin → Hub profile → Dashboard: slider for featurette (card) opacity",
      },
    ],
  },
  {
    version: "3.233",
    date: "September 17, 2026",
    title: "Brand kit tabs, admin unskinned",
    summary:
      "Create Hub brand kits no longer restyle admin. Separate tabs skin the dashboard, menu, groups rail, and chat.",
    items: [
      {
        kind: "fix",
        text: "Admin keeps the TriForge look even when a client hub has a custom kit",
      },
      {
        kind: "feature",
        text: "Hub profile brand kit tabs: dashboard, menu, groups, and chat each get their own canvas, text, and wallpaper",
      },
    ],
  },
  {
    version: "3.232",
    date: "September 17, 2026",
    title: "Brand kit on the dashboard",
    summary:
      "Create Hub wallpaper, canvas, fonts, and buttons now skin the inside of the hub, not only the login preview.",
    items: [
      {
        kind: "fix",
        text: "Background image and canvas color fill the dashboard and main column; the left menu stays a dark strip",
      },
      {
        kind: "improve",
        text: "Brand kit save no longer blocks typical orange-on-magenta palettes; preview shows the dashboard instead of sign-in",
      },
    ],
  },
  {
    version: "3.231",
    date: "September 17, 2026",
    title: "Dashboard logo and button colors",
    summary:
      "Create Hub logos sit on the home dashboard, and each hub can pick its own button fill and button text.",
    items: [
      {
        kind: "improve",
        text: "Uploaded hub logo shows above the dashboard greeting; the left menu keeps the hub name",
      },
      {
        kind: "feature",
        text: "Admin → Hub profile brand kit: button and button-text colors, with contrast checks",
      },
    ],
  },
  {
    version: "3.230",
    date: "September 17, 2026",
    title: "Brand kit deploy fix",
    summary: "Staging and production can build Create Hub brand kits after a TypeScript compile error blocked 3.229.",
    items: [
      {
        kind: "fix",
        text: "Google Fonts URL for a client hub kit no longer uses a Set spread that fails the Railway image build",
      },
    ],
  },
  {
    version: "3.229",
    date: "September 17, 2026",
    title: "Create Hub brand kits",
    summary:
      "Each Create Hub can set its own logo, colors, fonts, and wallpaper from Admin — Hub 0 stays the TriForge look.",
    items: [
      {
        kind: "feature",
        text: "Client hub Admin → Hub profile: brand kit with logo, canvas, primary, secondary, type, and background",
      },
      {
        kind: "improve",
        text: "That hub’s sign-in, signed-in chrome, and invite/broadcast emails pick up the kit; contrast and dark-canvas checks keep it readable",
      },
    ],
  },
  {
    version: "3.228",
    date: "September 17, 2026",
    title: "Hubs page without duplicate Hub 0",
    summary:
      "The extra Hub 0 card at the top of /hubs is gone — Hub 0 still appears in Your hubs and All hubs.",
    items: [
      {
        kind: "improve",
        text: "Removed the featured Hub 0 block so the directory does not show the same community twice",
      },
    ],
  },
  {
    version: "3.227",
    date: "September 17, 2026",
    title: "Hub 0 directory graphic",
    summary:
      "Hub 0 on /hubs now has a cover image like the other communities — the TriForge Media Community Hub graphic.",
    items: [
      {
        kind: "improve",
        text: "/hubs shows the Hub 0 cover on the featured card, Your hubs, and All hubs — same 16:9 slot as client directory images",
      },
    ],
  },
  {
    version: "3.226",
    date: "September 17, 2026",
    title: "iPhone Create Hub chat",
    summary:
      "Opening a channel on iPhone in a Create Hub no longer hits a Safari timestamp crash — chat stays on screen instead of the Something broke page.",
    items: [
      {
        kind: "fix",
        text: "Channel and DM timestamps use a Safari-safe clock format so iPhone does not throw when you open chat",
      },
      {
        kind: "fix",
        text: "Chat on phones fills the viewport and stays scrollable instead of jumping the whole Safari page",
      },
    ],
  },
  {
    version: "3.225",
    date: "September 17, 2026",
    title: "Profile photo build fix",
    summary:
      "Railway can build the profile photo update — Account → Profile compiles again after a TypeScript name type mismatch.",
    items: [
      {
        kind: "fix",
        text: "Profile photo page treats a missing account name as empty so staging and production image builds succeed",
      },
    ],
  },
  {
    version: "3.224",
    date: "September 17, 2026",
    title: "Profile photo",
    summary:
      "Members can upload a profile photo — it shows on their member card, chat, and the hub instead of initials or a TikTok picture.",
    items: [
      {
        kind: "feature",
        text: "Account → Profile: upload or paste a photo; remove it to fall back to TikTok when we have one",
      },
    ],
  },
  {
    version: "3.223",
    date: "September 17, 2026",
    title: "CN / MN switch sticks",
    summary:
      "Moving a member from Creator Network to Media Network (or the other way) stays after refresh — the apply-form track no longer overwrites an admin change.",
    items: [
      {
        kind: "fix",
        text: "Admin CN/MN switch writes the new track on the application and is not reset when Users or Members pages load",
      },
    ],
  },
  {
    version: "3.222",
    date: "September 17, 2026",
    title: "Admin user list memberships",
    summary:
      "Add tag, add group, and CN/MN switching stay on the admin user profile — the Users search list only shows current memberships.",
    items: [
      {
        kind: "improve",
        text: "Admin Users search cards show CN/MN, tags, and groups as pills; assign or remove them on that member’s profile",
      },
    ],
  },
  {
    version: "3.221",
    date: "September 17, 2026",
    title: "CN / MN track switch",
    summary:
      "Admins can move a member between Creator Network and Media Network, and add tags or groups on the user profile so they stick.",
    items: [
      {
        kind: "feature",
        text: "Admin user page: Creator Network (CN) and Media Network (MN) buttons; choosing one replaces the other",
      },
      {
        kind: "feature",
        text: "Admin user profile: Add tag and Add group dropdowns write to that member and stay until removed",
      },
    ],
  },
  {
    version: "3.220",
    date: "September 17, 2026",
    title: "Admin users build fix",
    summary:
      "Railway can build again after group/tag editing — the admin pills no longer pull the database client into the browser bundle.",
    items: [
      {
        kind: "fix",
        text: "Admin Users membership chips import display helpers instead of Prisma, so staging and production image builds succeed",
      },
    ],
  },
  {
    version: "3.219",
    date: "September 17, 2026",
    title: "Admin group and tag editing",
    summary:
      "Admins can remove a member’s groups and tags from the user page, and CN no longer shows twice.",
    items: [
      {
        kind: "fix",
        text: "Admin user profile no longer duplicates CN/MN as both a group pill and a tag pill",
      },
      {
        kind: "improve",
        text: "Groups and tags have a × to remove; Groups/Tags menus add or switch, and CN/MN still replace each other",
      },
    ],
  },
  {
    version: "3.218",
    date: "September 17, 2026",
    title: "Hub 0 email logo and recurring broadcasts",
    summary:
      "TriForge Media outbound mail now opens with the brand-kit logo, and Broadcasts can send automatically on a daily, weekly, or monthly schedule.",
    items: [
      {
        kind: "feature",
        text: "Hub 0 emails use the streaming-kit orange-glow TriForge Media wordmark in the header",
      },
      {
        kind: "feature",
        text: "Admin → Broadcasts: start a recurring send (daily / weekly / monthly, Eastern time), pause, resume, or send once now",
      },
    ],
  },
  {
    version: "3.217",
    date: "September 16, 2026",
    title: "Create Hub data sheet",
    summary:
      "Hub 0 Create Hub now has a data sheet: members per hub, live kit minutes, and bandwidth from the shared LiveKit project.",
    items: [
      {
        kind: "feature",
        text: "Create Hub → Data sheet lists Hub 0 and every client hub with active/invited members, webinar joins, estimated live kit minutes, and 7-day bandwidth when Analytics is configured",
      },
    ],
  },
  {
    version: "3.216",
    date: "September 16, 2026",
    title: "Hub directory profiles",
    summary:
      "Create Hub admins can set a directory image and description, then list the hub publicly or keep it private.",
    items: [
      {
        kind: "feature",
        text: "Admin → Hub profile: cover image, short description, and a public/private switch for /hubs",
      },
      {
        kind: "improve",
        text: "The public directory only shows hubs marked live; invited members still see private hubs under Your hubs",
      },
    ],
  },
  {
    version: "3.215",
    date: "September 16, 2026",
    title: "Hub 0 on the hubs directory",
    summary:
      "The /hubs list includes Hub 0 as a destination, so you can open TriForge Hub the same way you open a client community.",
    items: [
      {
        kind: "improve",
        text: "/hubs now lists Hub 0 in Your hubs (when you have Forge access) and in All hubs, linking to the Forge Hub home",
      },
    ],
  },
  {
    version: "3.214",
    date: "September 16, 2026",
    title: "Creator streaming kit",
    summary:
      "Forge Hub members can open /streaming-kit for overlay files, brand rules, and the streaming guide — Hub 0 only.",
    items: [
      {
        kind: "feature",
        text: "New Streaming kit page with logos, corner marks, nameplates, camera frames, ZIP packs, and both PDFs",
      },
      {
        kind: "program",
        text: "Files download through a signed-in API so overlays are not sitting in public/; Create Hub tenants do not get this SKU",
      },
    ],
  },
  {
    version: "3.213",
    date: "September 16, 2026",
    title: "Keep Who’s Live on Hub 0",
    summary:
      "TikTok Live stays a Forge Hub feature, staging gets the same live poll as production, and sign-in returns you to the page you opened.",
    items: [
      {
        kind: "fix",
        text: "Who’s Live and Creator Insights stay on Hub 0 (tik.tools) instead of running against empty Create Hub databases",
      },
      {
        kind: "fix",
        text: "Staging now receives the TikTok live cron so Agency LIVE reports can record go-live sessions",
      },
      {
        kind: "improve",
        text: "Sign-in after /live (and other gated pages) returns to that page; dashboard includes Who’s Live when the module is on",
      },
    ],
  },
  {
    version: "3.212",
    date: "September 16, 2026",
    title: "Fix client hub login image build",
    summary:
      "Staging and production builds compile again after the client-hub login loop fix.",
    items: [
      {
        kind: "fix",
        text: "Client-hub session lookup no longer uses Set iteration that fails next build on Railway",
      },
    ],
  },
  {
    version: "3.211",
    date: "September 16, 2026",
    title: "Fix client hub login redirect loop",
    summary:
      "Signing in on a client hub no longer bounces between /login and /home.",
    items: [
      {
        kind: "fix",
        text: "Client-hub /login no longer redirects in a loop when a session exists but that hub’s member row is missing",
      },
      {
        kind: "fix",
        text: "Logging into a client hub creates the tenant member (and Fan/Superfan enum on that hub schema) instead of sending you back to sign-in",
      },
    ],
  },
  {
    version: "3.210",
    date: "September 16, 2026",
    title: "Fan signup links to hub sign-in",
    summary:
      "If an email already has a login, the client-hub fan form points people to that hub’s sign-in page.",
    items: [
      {
        kind: "improve",
        text: "Existing-login error on public fan signup now links to that hub’s /signin page",
      },
    ],
  },
  {
    version: "3.209",
    date: "September 16, 2026",
    title: "Fix Fan signup image build",
    summary:
      "Staging and production builds compile again after adding Fan and Superfan roles.",
    items: [
      {
        kind: "fix",
        text: "Client-hub login no longer fails type-check when joining an existing network account as a Fan",
      },
    ],
  },
  {
    version: "3.208",
    date: "September 15, 2026",
    title: "Public fan signup on Create Hub",
    summary:
      "Anyone can create a Fan account on a live client hub. Network emails keep their existing profile. Admins can promote Fans to Superfan or Member.",
    items: [
      {
        kind: "feature",
        text: "Public Create Hub signup joins as Fan; an existing Forge/hub login signs in and brings that profile",
      },
      {
        kind: "feature",
        text: "Fan and Superfan roles on client hubs, with a fans chat seeded below member channels",
      },
    ],
  },
  {
    version: "3.207",
    date: "September 15, 2026",
    title: "Client hub admins invite their members",
    summary:
      "A provisioned Create Hub is live. The hub admin invites people from Admin → Users; that email is for their community, not TriForge Hub.",
    items: [
      {
        kind: "feature",
        text: "Admin → Users → Invite a member emails a signup or sign-in link on {slug}.hub.triforgemedia.com",
      },
      {
        kind: "improve",
        text: "The public hub page says the community is live and includes sign-in",
      },
    ],
  },
  {
    version: "3.206",
    date: "September 15, 2026",
    title: "Dashboard matches the module menu",
    summary:
      "Turning a module off removes it from Home as well as the sidebar — including TikTask and Webinars.",
    items: [
      {
        kind: "fix",
        text: "Home dashboard cards now use the same Create Hub module switches as the member menu",
      },
    ],
  },
  {
    version: "3.205",
    date: "September 15, 2026",
    title: "Keep your profile when a hub is given to you",
    summary:
      "Opening a Create Hub uses your existing TriForge profile. You are not asked to set one up again.",
    items: [
      {
        kind: "fix",
        text: "Staff and invited owners skip profile onboarding on a client hub when they already have a Forge profile",
      },
    ],
  },
  {
    version: "3.204",
    date: "September 15, 2026",
    title: "Client hubs stay on their own hostname",
    summary:
      "Opening a Create Hub from the directory no longer dumps you back into TriForge Hub home.",
    items: [
      {
        kind: "fix",
        text: "Signed-in redirects on {slug}.hub.triforgemedia.com stay on that host instead of AUTH_URL (hub.triforgemedia.com)",
      },
    ],
  },
  {
    version: "3.203",
    date: "September 15, 2026",
    title: "Fix Railway image build",
    summary:
      "Production builds no longer fail when compiling the email template editor after client hubs started using request-aware Prisma.",
    items: [
      {
        kind: "fix",
        text: "Keep Prisma and next/headers off the client bundle so Railway can build the Docker image",
      },
    ],
  },
  {
    version: "3.202",
    date: "September 15, 2026",
    title: "Client hubs open the real app",
    summary:
      "After you sign in on a provisioned Create Hub hostname, you land in that hub’s member app and admin — not a placeholder.",
    items: [
      {
        kind: "feature",
        text: "Signed-in visits to {slug}.hub.triforgemedia.com go to Home, with that hub’s own database and enabled modules",
      },
      {
        kind: "improve",
        text: "Core channels are seeded on provision so chat has somewhere to live when the Chat SKU is on",
      },
    ],
  },
  {
    version: "3.201",
    date: "September 15, 2026",
    title: "Forge Hub stays invite-only",
    summary:
      "A Create Hub invite does not open TriForge Hub. Client-hub people keep their community login until they also receive a Forge invite.",
    items: [
      {
        kind: "fix",
        text: "Signing in at hub.triforgemedia.com is blocked unless the account has Forge access",
      },
      {
        kind: "feature",
        text: "Admins can invite an existing client-hub person to Forge Hub (Users list, Add member, or application approve)",
      },
      {
        kind: "improve",
        text: "Directory and sign-in copy make the two invites explicit",
      },
    ],
  },
  {
    version: "3.200",
    date: "September 15, 2026",
    title: "Staff access on every Create Hub",
    summary:
      "Hub 0 admins can open any provisioned client hub with the same Forge login. The email invite is only for that community’s owner.",
    items: [
      {
        kind: "feature",
        text: "Provisioning a hub grants Active admin membership to every Hub 0 ADMIN",
      },
      {
        kind: "feature",
        text: "Signing in on a client hostname as a Hub 0 ADMIN also grants staff access if it was missing",
      },
      {
        kind: "improve",
        text: "Create Hub setup separates client-owner invite from TriForge staff access",
      },
    ],
  },
  {
    version: "3.199",
    date: "September 15, 2026",
    title: "Hubs directory",
    summary:
      "A public directory lists every Create Hub community, and signed-in members also see the hubs they were invited to.",
    items: [
      {
        kind: "feature",
        text: "Public /hubs directory (also in the site header, footer, and member menu)",
      },
      {
        kind: "feature",
        text: "Signed-in visitors see Your hubs — communities they were invited to or already joined",
      },
    ],
  },
  {
    version: "3.198",
    date: "September 15, 2026",
    title: "One login across hubs",
    summary:
      "A person has one email and password. An invite only adds them to that hub — it does not create a second account.",
    items: [
      {
        kind: "feature",
        text: "Hub memberships live on the central Hub 0 identity; client hubs no longer store a separate password",
      },
      {
        kind: "feature",
        text: "Owner invite emails a link on the client host: new people set a password once, existing people sign in to join",
      },
    ],
  },
  {
    version: "3.197",
    date: "September 15, 2026",
    title: "Create Hub owner invites",
    summary:
      "Superadmin can email a hub owner a signup link on their own hostname. They set a password and sign in against that hub’s database — not Hub 0.",
    items: [
      {
        kind: "feature",
        text: "Send / resend invite creates an admin in the tenant schema and emails {slug}.hub.triforgemedia.com/signup",
      },
      {
        kind: "feature",
        text: "Client hub signup and sign-in use that hub’s database; /api/auth is allowed on the client hostname",
      },
    ],
  },
  {
    version: "3.196",
    date: "September 15, 2026",
    title: "Create Hub sales visuals",
    summary:
      "The unlisted Create Hub page now shows the product — home, Learning Center, ranks, and admin — in the pitch layout.",
    items: [
      {
        kind: "improve",
        text: "/create-a-hub uses the new product mockups for home, learning, progression, and admin",
      },
    ],
  },
  {
    version: "3.195",
    date: "September 15, 2026",
    title: "Tenant Prisma for client hubs",
    summary:
      "The app can open a client hub’s own Postgres schema, verify it after provision, and keep Hub 0 on public.",
    items: [
      {
        kind: "feature",
        text: "Request-aware tenant Prisma: Hub 0 stays on public; a provisioned client hub uses hub_{slug}",
      },
      {
        kind: "improve",
        text: "Provision now pings the new schema, and Create Hub / client landing show whether the app can open it",
      },
    ],
  },
  {
    version: "3.194",
    date: "September 15, 2026",
    title: "Create Hub sales page",
    summary:
      "An unlisted public page for pitching a community hub — what creators use it for, and what operators can turn on.",
    items: [
      {
        kind: "feature",
        text: "Secret public page at /create-a-hub (not in the site menu, no search index) for Create Hub partner pitches",
      },
    ],
  },
  {
    version: "3.193",
    date: "September 15, 2026",
    title: "Webinar camera start",
    summary:
      "Host camera no longer times out on join because mic and camera start one after the other, and the room stays connected if publish rights flicker.",
    items: [
      {
        kind: "fix",
        text: "Webinar room waits for the mic before starting the camera, and shows a retry if getUserMedia times out",
      },
      {
        kind: "fix",
        text: "Raising someone to the stage no longer remounts LiveKit (that was aborting camera publish mid-flight)",
      },
    ],
  },
  {
    version: "3.192",
    date: "September 15, 2026",
    title: "Agency monthly LIVE reports",
    summary:
      "Admins can add creators to an agency LIVE roster, run a month, and leave notes — Hub 0 only, never a Create Hub option.",
    items: [
      {
        kind: "feature",
        text: "Admin → LIVE reports: add people by hand, open a creator, pick a month, and run a screenshot-style report",
      },
      {
        kind: "feature",
        text: "Diamonds, gifts, and gifters from tik.tools agency events; LIVE streams, duration, and valid go-LIVE days from hub sessions",
      },
      {
        kind: "feature",
        text: "Shared admin notes on each person + month; re-running overwrites metrics and keeps the thread",
      },
    ],
  },
  {
    version: "3.191",
    date: "September 14, 2026",
    title: "Onboarding activate switch",
    summary:
      "Admins can build checklists first. Members only see onboarding after you hit Activate.",
    items: [
      {
        kind: "feature",
        text: "Admin → Onboarding: Activate / Deactivate so first-login lists stay off until you are ready",
      },
    ],
  },
  {
    version: "3.190",
    date: "September 14, 2026",
    title: "Interview take-spot and booking",
    summary:
      "Taking an interview spot joins the campaign without crashing, then members book a time from the staff booking page attached to that campaign.",
    items: [
      {
        kind: "fix",
        text: "Take spot on a hub campaign now claims the numbered seat and stays on the campaign instead of the error page",
      },
      {
        kind: "feature",
        text: "Interview campaigns can attach a staff booking page; after you take a spot, Book time opens that calendar",
      },
    ],
  },
  {
    version: "3.189",
    date: "September 14, 2026",
    title: "Course steps check off",
    summary:
      "Finishing a course on a checklist now checks that step and can complete the list without waiting for a later Home visit.",
    items: [
      {
        kind: "fix",
        text: "Marking the last lesson complete or passing the course quiz updates the matching onboarding step right away",
      },
    ],
  },
  {
    version: "3.188",
    date: "September 14, 2026",
    title: "Onboarding reset sticks",
    summary:
      "Assign / Reset on a member profile clears the checklist again, even if they already finished the linked courses.",
    items: [
      {
        kind: "fix",
        text: "Course steps no longer auto-check from older course completions after an admin resets the checklist",
      },
    ],
  },
  {
    version: "3.187",
    date: "September 14, 2026",
    title: "Onboarding course steps",
    summary:
      "Admins pick a course from a dropdown when a checklist step opens a course, and members get a button to open that course.",
    items: [
      {
        kind: "feature",
        text: "Choosing Open a course on an onboarding step shows a dropdown of hub courses instead of a course id",
      },
      {
        kind: "feature",
        text: "Members can click Open [course] on Home to go straight to each selected course",
      },
    ],
  },
  {
    version: "3.186",
    date: "September 14, 2026",
    title: "Onboarding explainer video",
    summary:
      "Each checklist can show an explainer video under its title — upload a file or paste YouTube or Vimeo.",
    items: [
      {
        kind: "feature",
        text: "Admin Onboarding settings let you upload or link an explainer video under the checklist name",
      },
      {
        kind: "feature",
        text: "Assigned members see that video on Home under the checklist title",
      },
    ],
  },
  {
    version: "3.185",
    date: "September 14, 2026",
    title: "Onboarding menu lock",
    summary:
      "Each checklist can limit the member sidebar so people on that path only see the pages you pick until they finish.",
    items: [
      {
        kind: "feature",
        text: "Admin Onboarding settings let you choose which member menu items are visible while a checklist is in progress",
      },
      {
        kind: "feature",
        text: "Assigned members are sent back to Dashboard if they open a page that is not on that list; the full menu returns when they complete or dismiss",
      },
    ],
  },
  {
    version: "3.184",
    date: "September 12, 2026",
    title: "Multiple onboarding paths",
    summary:
      "Admins can create more than one checklist — Getting Started, campaign follow-through, or any custom path — and assign each to members.",
    items: [
      {
        kind: "feature",
        text: "Admin Onboarding now lists named checklists you can create and edit separately",
      },
      {
        kind: "feature",
        text: "Mark a checklist to auto-assign on first login, or assign any path from a member profile",
      },
    ],
  },
  {
    version: "3.183",
    date: "September 12, 2026",
    title: "Onboarding XP",
    summary:
      "Checklist steps and finishing the whole onboarding list can award XP, with amounts set in Admin.",
    items: [
      {
        kind: "feature",
        text: "Each onboarding step can award XP when checked off, once per member",
      },
      {
        kind: "feature",
        text: "Admins set per-step XP and a completion bonus on the Onboarding page",
      },
    ],
  },
  {
    version: "3.182",
    date: "September 12, 2026",
    title: "Member onboarding checklist",
    summary:
      "Optional hub module for a first-login checklist: admin-editable steps, required courses, dismiss with a disclaimer, and reopen from Account.",
    items: [
      {
        kind: "feature",
        text: "Onboarding checklist SKU: Home card for new members, dismiss/reopen, and course-gated complete",
      },
      {
        kind: "feature",
        text: "Admin Onboarding page to edit steps, track scope, required courses, and disclaimer",
      },
      {
        kind: "feature",
        text: "Users list onboarding status filter plus Assign/Reset on a member profile",
      },
    ],
  },
  {
    version: "3.181",
    date: "September 11, 2026",
    title: "Calendar event photos and links",
    summary:
      "Calendar events can include a photo, and location links on the event page open in a new tab.",
    items: [
      {
        kind: "feature",
        text: "Add an event photo when creating or editing a calendar event",
      },
      {
        kind: "improve",
        text: "Location/link on the event page is clickable when it’s a URL",
      },
    ],
  },
  {
    version: "3.180",
    date: "September 11, 2026",
    title: "Interview spots, time, and network",
    summary:
      "Admins set interview time, network, and how many spots. Signing up books the next open spot, and booked names show on the campaign.",
    items: [
      {
        kind: "feature",
        text: "Interview campaigns: set time, network (TikTok, Twitch, YouTube, Kick, Instagram), and spot count in admin",
      },
      {
        kind: "feature",
        text: "Member Sign up fills the next open interview spot; the campaign page shows booked vs open spots",
      },
    ],
  },
  {
    version: "3.179",
    date: "September 11, 2026",
    title: "Interview campaign list signup",
    summary:
      "Interview campaigns now have a Sign up button so members can join the list even when no times are posted yet.",
    items: [
      {
        kind: "fix",
        text: "Members can sign up for interview campaigns without picking a time; they can book a slot later when times are posted",
      },
    ],
  },
  {
    version: "3.178",
    date: "September 11, 2026",
    title: "Campaign signups and personal tasks",
    summary:
      "Leaving a campaign frees the spot so you or someone else can sign up again, and campaign tasks are now a personal checklist.",
    items: [
      {
        kind: "fix",
        text: "Members can leave an open or closed campaign and sign up again; their seat and interview time are released",
      },
      {
        kind: "fix",
        text: "Campaign to-dos are per member, so one person finishing tasks no longer looks like the campaign is done for everyone",
      },
    ],
  },
  {
    version: "3.177",
    date: "September 10, 2026",
    title: "Social Planner",
    summary:
      "Admins can draft and schedule TikTok videos and LIVE reminders, then auto-publish through TikTok’s posting API.",
    items: [
      {
        kind: "feature",
        text: "New optional hub SKU: Social Planner — admin calendar, compose, and connected TikTok posting accounts",
      },
      {
        kind: "feature",
        text: "Scheduled videos upload from R2 and publish via TikTok Direct Post; LIVE rows remind and detect go-live (tik.tools)",
      },
    ],
  },
  {
    version: "3.176",
    date: "September 9, 2026",
    title: "Interview campaign booking",
    summary: "Interview campaigns now post available times so members can book a slot, like staff booking.",
    items: [
      {
        kind: "feature",
        text: "Admins add interview times on a campaign; each slot is one member",
      },
      {
        kind: "feature",
        text: "Members pick a day and time to sign up, and can change or leave to free the slot",
      },
    ],
  },
  {
    version: "3.175",
    date: "September 9, 2026",
    title: "Calendar deploy fix",
    summary: "Production and staging builds succeed again after the new calendar event types.",
    items: [
      {
        kind: "fix",
        text: "Removed an unused calendar label argument that failed the Railway lint build",
      },
    ],
  },
  {
    version: "3.174",
    date: "September 9, 2026",
    title: "Calendar event types",
    summary: "Interviews, battles, and shop events on the hub calendar now link to the right member profiles.",
    items: [
      {
        kind: "feature",
        text: "New calendar types: Interview (one profile), Battles (two profiles), and Shop event (one profile)",
      },
      {
        kind: "feature",
        text: "Profile pickers only appear for those types, and the event page links to each member",
      },
    ],
  },
  {
    version: "3.169",
    date: "September 8, 2026",
    title: "Hub Campaigns",
    summary:
      "Admins can run interviews, meetings, games, and battles as signup campaigns, targeted by tag or badge.",
    items: [
      {
        kind: "program",
        text: "Hub Campaigns — Interviews, Meeting, Games, and Battles members can join from the campaign window",
      },
      {
        kind: "feature",
        text: "Limit a campaign to everyone, a tag, or a badge, with optional capacity and a shared to-do list",
      },
      {
        kind: "feature",
        text: "Each campaign page shows who’s involved and what we need to do",
      },
    ],
  },
  {
    version: "3.168",
    date: "September 7, 2026",
    title: "Battle Hosts",
    summary:
      "Battle Hosts is now a Rising Star specialization, with the course, group, and badge sharing that name.",
    items: [
      {
        kind: "improve",
        text: "Course, group, badge, and certification exam renamed to Battle Hosts",
      },
      {
        kind: "fix",
        text: "Battle Hosts lessons no longer show a hands-on assignment submit form — that homework is off for now",
      },
      {
        kind: "feature",
        text: "Battle Hosts added as an eighth specialization — Choose on Progress, Skill Mastery training, and the Battle Hosts course unlocks on that track",
      },
    ],
  },
  {
    version: "3.167",
    date: "September 7, 2026",
    title: "Battle Hosts",
    summary:
      "New Collab-track course certifies creators on LIVE Battles, with a Battle Hosts badge and a hub group for practice matches.",
    items: [
      {
        kind: "feature",
        text: "Learning Center: Battle Hosts — five lessons, knowledge checks, and a 15-question certification exam (500 XP)",
      },
      {
        kind: "program",
        text: "Battle Hosts group with #main and #debriefs — apply after Lessons 1–2, or auto-join when you pass the course",
      },
    ],
  },
  {
    version: "3.166",
    date: "September 5, 2026",
    title: "Recruits show their earned rank",
    summary:
      "Members who have moved past Recruit no longer stay labeled Recruit in chat or on the ladder. Hub XP now counts toward the next rank.",
    items: [
      {
        kind: "fix",
        text: "TikTask and other hub XP count toward progression ranks, so members are not stuck at Recruit after earning XP",
      },
      {
        kind: "fix",
        text: "Chat shows the earned progression rank instead of a stale Recruit membership badge",
      },
      {
        kind: "improve",
        text: "Visiting the hub re-evaluates anyone still marked Recruit so their real level lands",
      },
    ],
  },
  {
    version: "3.165",
    date: "September 5, 2026",
    title: "Clear path through every rank",
    summary:
      "Progress shows the next rank’s courses, missions, and category XP. Training requirements are waived when no course is assigned to that track.",
    items: [
      {
        kind: "fix",
        text: "Members no longer stall at Regular when Fan Favorite training lives on an earlier rank — those courses and track missions now appear in Path to Fan Favorite",
      },
      {
        kind: "improve",
        text: "Quiz/training cert gates are waived when no published course is assigned to that category",
      },
    ],
  },
  {
    version: "3.164",
    date: "September 5, 2026",
    title: "Announcement YouTube banner",
    summary: "Admins can add a YouTube link to the company announcement so members can watch it on the dashboard.",
    items: [
      {
        kind: "feature",
        text: "Admin dashboard announcement accepts an optional YouTube (or Vimeo) URL",
      },
      {
        kind: "feature",
        text: "Member home banner embeds the video under the announcement text",
      },
    ],
  },
  {
    version: "3.163",
    date: "September 5, 2026",
    title: "Booking date exceptions",
    summary:
      "Hosts can take a specific calendar day off or set custom hours for that date without changing the weekly schedule.",
    items: [
      {
        kind: "feature",
        text: "Account → Booking: day-off and custom-hours exceptions for a single date",
      },
      {
        kind: "improve",
        text: "Public /book slots skip or replace weekly hours on exception dates",
      },
    ],
  },
  {
    version: "3.162",
    date: "September 5, 2026",
    title: "Hub Suggestions board",
    summary:
      "Members can pitch hub ideas. Staff tags each one Accepted, Working on it, Applied, or Rejected.",
    items: [
      {
        kind: "feature",
        text: "Suggestions board at /suggestions with public tags and SG-0001 ticket numbers",
      },
      {
        kind: "feature",
        text: "Admin queue at /admin/suggestions to tag ideas and leave a visible staff note",
      },
    ],
  },
  {
    version: "3.161",
    date: "September 5, 2026",
    title: "Hub Support network",
    summary:
      "Members can search an admin-editable FAQ and open tickets in the hub. Emails only send people back to the portal.",
    items: [
      {
        kind: "program",
        text: "Hub Support: FAQ + ticket portal at /support (ticket numbers TF-0001)",
      },
      {
        kind: "feature",
        text: "Admin FAQ editor and support queue with reply threads, assignment, and statuses",
      },
      {
        kind: "feature",
        text: "Outbound ticket emails (opened, reply, status, closed) with Open in Hub CTAs — no inbound mailbox",
      },
    ],
  },
  {
    version: "3.160",
    date: "September 4, 2026",
    title: "Create Hub for every Hub 0 admin",
    summary: "Any main-hub Admin can open Create Hub. An email allowlist is no longer required.",
    items: [
      {
        kind: "fix",
        text: "Create Hub (/superadmin) is available to every Hub 0 ADMIN, not only SUPERADMIN_EMAILS",
      },
    ],
  },
  {
    version: "3.159",
    date: "September 4, 2026",
    title: "Client hub sign-in stays on that hub",
    summary: "Sign in on a client hub landing page no longer opens the staging/TriForge login.",
    items: [
      {
        kind: "fix",
        text: "Client hub Sign in goes to that hub’s own sign-in page instead of Hub 0 /signin",
      },
    ],
  },
  {
    version: "3.158",
    date: "September 4, 2026",
    title: "Client hub tenant database",
    summary: "Super-admins can provision an empty Postgres schema for a client hub on this environment’s database.",
    items: [
      {
        kind: "feature",
        text: "Create Hub → Provision creates schema hub_{slug} and runs migrations; Hub 0 public data is untouched",
      },
      {
        kind: "improve",
        text: "Tenant database can no longer be marked done by checkbox — only a successful provision counts",
      },
    ],
  },
  {
    version: "3.157",
    date: "September 4, 2026",
    title: "Client hub hostname gate",
    summary: "Wildcard client hosts no longer open Hub 0, and new hubs start with core only.",
    items: [
      {
        kind: "feature",
        text: "{slug}.hub.triforgemedia.com shows that hub’s own page and login — unknown slugs 404 instead of the TriForge Hub",
      },
      {
        kind: "improve",
        text: "Create Hub leaves optional modules off until you check them; flagship TriForge SKUs cannot be added",
      },
    ],
  },
  {
    version: "3.156",
    date: "September 4, 2026",
    title: "Host active meetings",
    summary: "Hosts can open upcoming bookings and cancel, send a reminder, or reschedule from the hub.",
    items: [
      {
        kind: "feature",
        text: "Booking → Active meetings lists upcoming appointments from your public link",
      },
      {
        kind: "feature",
        text: "Open a meeting to cancel it, email a reminder, or move it to another open slot",
      },
    ],
  },
  {
    version: "3.155",
    date: "September 4, 2026",
    title: "Booking reminders and cancel links",
    summary: "Guests can opt into a 1-hour reminder, and every booking email includes a cancel link.",
    items: [
      {
        kind: "feature",
        text: "Public booking: optional 1-hour reminder email to guest and host",
      },
      {
        kind: "feature",
        text: "Confirmation, reminder, and host emails include a cancel link that frees the slot",
      },
    ],
  },
  {
    version: "3.154",
    date: "September 4, 2026",
    title: "Booking types, room links, and calendar-aware slots",
    summary: "Hosts can offer multiple meeting types, fill extra open hours, and emails now open the meeting room.",
    items: [
      {
        kind: "feature",
        text: "Booking setup: create meeting types that land on the hub calendar when booked",
      },
      {
        kind: "feature",
        text: "Add one-off open hours; bookable times skip hub calendar events, webinars, and other bookings",
      },
      {
        kind: "improve",
        text: "Confirmation emails and the calendar event include a direct meeting-room link",
      },
    ],
  },
  {
    version: "3.153",
    date: "September 3, 2026",
    title: "Unblock staging pre-deploy",
    summary: "Staging can finish migrations when an older announcement-media change is already in the database.",
    items: [
      {
        kind: "fix",
        text: "Pre-deploy clears a failed additive migration (P3009) so staging can apply My Tasks category and start",
      },
    ],
  },
  {
    version: "3.152",
    date: "September 3, 2026",
    title: "Sort My Tasks by due date or category",
    summary: "Personal tasks can be tagged and reordered so the work due soonest or in one category sits together.",
    items: [
      {
        kind: "feature",
        text: "My Tasks: optional category on each to-do, plus sort by added, due date, or category",
      },
    ],
  },
  {
    version: "3.151",
    date: "September 3, 2026",
    title: "Task due dates stay on the day you pick",
    summary: "Entering 9/7 no longer lists the task as due 9/6.",
    items: [
      {
        kind: "fix",
        text: "Personal task due dates are stored and shown as calendar days, so they no longer shift back one day in US timezones",
      },
    ],
  },
  {
    version: "3.150",
    date: "September 3, 2026",
    title: "Webinar leave warning on groups",
    summary: "Leaving a live room via the group rail now asks before you drop off stage.",
    items: [
      {
        kind: "fix",
        text: "Clicking a group icon or Groups from a webinar room shows the leave warning instead of navigating away silently",
      },
    ],
  },
  {
    version: "3.149",
    date: "September 1, 2026",
    title: "Staging migrate recover",
    summary: "Deploys no longer fail if announcement image/video columns already exist in the database.",
    items: [
      {
        kind: "fix",
        text: "Pre-deploy marks the announcement-media migration applied when those columns are already present, so staging can start",
      },
    ],
  },
  {
    version: "3.148",
    date: "September 1, 2026",
    title: "Home after sign-in",
    summary: "The dashboard no longer crashes when announcement media columns are still catching up.",
    items: [
      {
        kind: "fix",
        text: "Home loads the announcement banner without requiring image/video columns that were added to the schema ahead of their migration",
      },
    ],
  },
  {
    version: "3.147",
    date: "September 1, 2026",
    title: "Sign-in without server render",
    summary: "The sign-in form now loads in the browser only, so a server-component crash cannot blank the page.",
    items: [
      {
        kind: "fix",
        text: "Sign-in no longer server-renders next-auth or search params — Auth.js custom page stays on /login to avoid clashing with /signin",
      },
    ],
  },
  {
    version: "3.146",
    date: "September 1, 2026",
    title: "Sign-in page cache",
    summary: "The sign-in screen is no longer served from a year-long cache that could stick on an error page.",
    items: [
      {
        kind: "fix",
        text: "Sign-in always renders fresh (no ISR cache) and no longer uses a search-params bailout that could replace the form with a blank Application error",
      },
    ],
  },
  {
    version: "3.145",
    date: "September 1, 2026",
    title: "Sign-in after campaign tables",
    summary: "Signing in no longer crashes if campaign/notification columns are still applying.",
    items: [
      {
        kind: "fix",
        text: "Login and the hub shell no longer depend on firstLoginAt / hub notifications being present — sign-in works even if that migration is still catching up",
      },
    ],
  },
  {
    version: "3.144",
    date: "September 1, 2026",
    title: "Staging healthcheck",
    summary: "Railway healthcheck now hits a 200 JSON route instead of the /login redirect.",
    items: [
      {
        kind: "fix",
        text: "Deploy healthcheck uses /api/health so a 307 from /login → /signin cannot fail the replica",
      },
    ],
  },
  {
    version: "3.143",
    date: "September 1, 2026",
    title: "Activity roster and campaign triggers",
    summary:
      "Admins can see levels, hub participation, and TikTok go-lives in one roster, and run GHL-style campaigns that email or notify when someone signs in, goes quiet, or goes live.",
    items: [
      {
        kind: "feature",
        text: "Activity roster (Admin → People, and a link from the Network dashboard): levels, XP, TikTask, chat, live counts, and filters for who has signed into the hub",
      },
      {
        kind: "feature",
        text: "Live session history starts now — the TikTok live poll records each go-live so the roster can show how many times and when",
      },
      {
        kind: "feature",
        text: "Campaigns (Admin → Email): trigger → email member, hub notification, or notify admins — first login, onboarding, approval, tag, level, go-live, inactivity, and never signed in",
      },
      {
        kind: "feature",
        text: "In-hub notifications with a bell in the member menu",
      },
    ],
  },
  {
    version: "3.142",
    date: "August 26, 2026",
    title: "Learning and mission points",
    summary:
      "Lessons, quizzes, course bonuses, cert tiers, specialty unlocks, missions, and streak milestones now award the official Tri Forge point values — including backfill for work already done.",
    items: [
      {
        kind: "feature",
        text: "Learning Center: 15 XP per lesson (25 with an exercise), 50 for a quiz pass (75 at 100%), and 100 when a course is fully complete",
      },
      {
        kind: "feature",
        text: "Certification tiers award +150 Trainee / +300 Certified / +750 Master; unlocking a specialty skill awards +200",
      },
      {
        kind: "feature",
        text: "Mission tiers (micro / standard / milestone / major) with daily caps on micro and standard tasks, plus 3/7/30-day streak bonuses",
      },
      {
        kind: "feature",
        text: "Members who already finished lessons, quizzes, courses, certs, skills, missions, or streaks receive the matching points",
      },
    ],
  },
  {
    version: "3.141",
    date: "August 26, 2026",
    title: "Home group no longer 404s for new members",
    summary:
      "Clicking Home opens the space for every member, not only the first forty people on the roster.",
    items: [
      {
        kind: "fix",
        text: "Group pages check your membership directly instead of scanning a 40-person preview list — new test users no longer get a 404 on Home",
      },
    ],
  },
  {
    version: "3.140",
    date: "August 26, 2026",
    title: "Specialty picks open matching groups",
    summary:
      "Choosing a Creator Progression specialty immediately adds you to that specialty’s hub group, including Gamer → Gaming.",
    items: [
      {
        kind: "feature",
        text: "Picking a specialty on Progress joins the matching group and its channel right away",
      },
      {
        kind: "feature",
        text: "Members who already chose a specialty are added to that group the next time they open the hub",
      },
    ],
  },
  {
    version: "3.139",
    date: "August 25, 2026",
    title: "Progress is live for members",
    summary:
      "Everyone sees Progress in the hub menu. Creator Network members join the ladder as Recruits; Media Network members apply until they are approved.",
    items: [
      {
        kind: "feature",
        text: "Progress nav and dashboard card show for all members, not just staff",
      },
      {
        kind: "feature",
        text: "MN members land on the Progress application sheet until an admin approves them as Recruit",
      },
    ],
  },
  {
    version: "3.138",
    date: "August 24, 2026",
    title: "Templated specialty lessons",
    summary:
      "Skill Mastery specialty lessons now use the Tri Forge lesson template — dark header, objective callout, method steps, and a close — with the same teaching copy.",
    items: [
      {
        kind: "improve",
        text: "Rewrote all 21 specialty-course lessons into the shared e-learning template",
      },
    ],
  },
  {
    version: "3.137",
    date: "August 24, 2026",
    title: "Readable written lessons",
    summary:
      "Written lesson text on the off-white content card is charcoal again instead of inheriting the hub’s white body color.",
    items: [
      {
        kind: "fix",
        text: "Lesson articles no longer render white-on-white — body copy is charcoal on the light canvas",
      },
    ],
  },
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
