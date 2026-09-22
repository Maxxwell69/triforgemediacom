import type { LessonSeed } from "./specialtyCourseContent";

export const ACADEMY_OWNER_COURSE_TITLES = [
  "How to Run Your Hub",
  "Getting Started",
  "Hub Zero Getting Started",
] as const;

export const ACADEMY_OWNER_COURSE = {
  title: "How to Run Your Hub",
  description:
    "What Hub Zero is, what each system does, and what a new owner should do in the first week.",
  category: "Hub Zero Academy",
} as const;

export type AcademyModuleSeed = {
  title: string;
  description: string;
  lessons: LessonSeed[];
};

const FOOTER = "Hub Zero Academy · How to Run Your Hub";

const SHOT = {
  academy: {
    src: "/brand/hubzero-academy.jpg",
    alt: "Hub Zero Academy",
    caption: "Hub Zero Academy — training for people who run a hub.",
  },
  home: {
    src: "/sales/create-hub/home.jpg",
    alt: "Member home dashboard",
    caption: "Member Home: chat, TikTask, Learning Center, webinars, and track badges in one place.",
  },
  learn: {
    src: "/sales/create-hub/learn.jpg",
    alt: "Learning Center catalog",
    caption: "Learning Center is for your members. Academy is for hub owners.",
  },
  progress: {
    src: "/sales/create-hub/progress.jpg",
    alt: "Creator progression ladder",
    caption: "Progression lives on Hub 0. Client hubs do not get this ladder unless TriForge turns it on.",
  },
  admin: {
    src: "/sales/create-hub/admin.jpg",
    alt: "Admin dashboard",
    caption: "Admin is the command center: people, tasks, courses, events, and email.",
  },
} as const;

export const ACADEMY_OWNER_MODULES: AcademyModuleSeed[] = [
  {
    title: "The map",
    description: "Module 1 · What Hub Zero is and how the pieces fit",
    lessons: [
      {
        title: "What Hub Zero is",
        tagline: "One operating system, your own hostname",
        objective:
          "Know the difference between Hub 0 (TriForge) and a client hub — and why owners never land on the wrong login.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "Hub Zero is the invite-only operating system TriForge built for creator communities: chat, daily tasks, courses, webinars, booking, and admin — on one hostname, with one login.",
          "Hub 0 is triforgemedia.com’s own community (hub.triforgemedia.com). That is where Academy is written, Create Hub is run, and Forge-only tools live.",
          "Your hub is a separate community. Members sign in on {slug}.hub.triforgemedia.com or your custom domain. Their data never mixes with Hub 0 or another client.",
          "Core admin is always on: users, groups, tags, directory, moderation, Account. Everything else is a module you turn on because you bought it.",
          "If a menu item is missing, the module is off — not broken. Ask TriForge before you invent a workaround.",
        ],
        stepTitles: [
          "Hub 0 is the mothership",
          "Your hub is its own community",
          "Core is always on",
          "Missing menu = module off",
        ],
        exercise:
          "Write your hub hostname and one sentence for “who this community is for.” Pin it in your owner notes.",
        knowledgeCheck: [
          "What is the difference between Hub 0 and a client hub?",
          "Where do your members sign in?",
          "True or false: a missing admin page usually means the SKU is off.",
        ],
      },
      {
        title: "Academy vs Learning Center",
        tagline: "Owners train here. Members train there.",
        objective:
          "Never mix owner training with creator courses. Academy and Learning Center are two catalogs.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.academy, SHOT.learn],
        paragraphs: [
          "Two catalogs sit in the same product. Mixing them up is the fastest way to hide a course from the people who need it.",
          "Hub Zero Academy (Admin → Hub Zero Academy) is owner training. Hub 0 writes it. Every hub admin can take it. Members never see it in Learning Center.",
          "Learning Center (Admin → Courses, members at /learn) is for your creators: LIVE Studio, Battle Hosts, onboarding courses you publish.",
          "A course flagged hub-owner-only never appears on /learn. A published Learning Center course never appears in Academy.",
          "When you build a course, decide the audience first: owners (Academy) or members (Courses). Then publish only when the lessons are ready.",
        ],
        stepTitles: [
          "Academy = people who run a hub",
          "Learning Center = your members",
          "The flags do not cross",
          "Pick the audience before you write",
        ],
        exercise:
          "Open Admin → Hub Zero Academy and Admin → Courses. Confirm you can tell which catalog you are in from the header alone.",
        knowledgeCheck: [
          "Who sees Hub Zero Academy?",
          "Where do members find courses?",
          "Can an Academy course show up on /learn?",
        ],
      },
      {
        title: "The systems at a glance",
        tagline: "What each module is for — in one pass",
        objective:
          "Name every major system and the job it does so you know where to click instead of guessing.",
        readingTime: "6 min",
        footerLabel: FOOTER,
        figures: [SHOT.admin],
        paragraphs: [
          "You do not need every module on day one. You do need a map so “where do I…?” has an answer.",
          "People: Users (roles, bans, groups), Applicants (approve/reject), Groups & tags, Onboarding checklists, Directory.",
          "Work: Chat channels, DMs, TikTask (daily creator habits), Personal tasks (member to-dos), Projects (assigned hub work).",
          "Train & recognize: Learning Center, Rewards / XP / leaderboard, Badges. Progression (ranks and missions) is Hub 0 unless TriForge adds it.",
          "Show up live: Webinars, Calendar, Staff booking, Hub campaigns, Social Planner.",
          "Reach people: Email broadcasts, templates, trigger campaigns, Conversations inbox. Support: FAQ, tickets, suggestions, Hub Bug.",
        ],
        stepTitles: [
          "People — who is allowed in",
          "Work — what they do today",
          "Train and recognize",
          "Live time on the calendar",
          "Email and help",
        ],
        extraHtml: `<ul style="margin: 16px 0px 0px; padding-left: 22px; color: rgb(222, 222, 222); font-size: 15px;">
      <li style="margin: 0px 0px 6px;"><strong>Users</strong> — roles, bans, TikTok links, groups, tags.</li>
      <li style="margin: 0px 0px 6px;"><strong>Applicants</strong> — public apply queue. Approve sends the invite email.</li>
      <li style="margin: 0px 0px 6px;"><strong>TikTask</strong> — daily habits from admin-editable templates. Not Projects.</li>
      <li style="margin: 0px 0px 6px;"><strong>Projects</strong> — assigned work only the right people see.</li>
      <li style="margin: 0px 0px 6px;"><strong>Conversations</strong> — staff emails a member; the thread stays on the hub.</li>
      <li style="margin: 0px 0px 6px;"><strong>Broadcasts</strong> — one-way announcement email to a list.</li>
    </ul>`,
        exercise:
          "List the five modules your hub actually has on. Star the two you will use this week.",
        knowledgeCheck: [
          "What is the difference between TikTask and Projects?",
          "Where do you approve someone who applied?",
          "Name one tool that is email-to-one-person vs email-to-everyone.",
        ],
      },
    ],
  },
  {
    title: "Open the doors",
    description: "Module 2 · Brand, menu, invites, and the apply form",
    lessons: [
      {
        title: "Brand, hostname, and hub profile",
        tagline: "Look like you before anyone joins",
        objective:
          "Set logo, colors, and the hostname story so members never think they signed into TriForge by mistake.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "First impression is the hostname plus the logo. If those still say Forge, talent will treat this as someone else’s house.",
          "Open Admin → Hub profile (or Brand). Upload the logo, set the display name, and confirm the slug hostname: {slug}.hub.triforgemedia.com.",
          "A custom domain (hub.yourbrand.com) comes after the slug works. Save the hostname in Hub profile, add the DNS records TriForge shows, wait until Cloudflare says Active.",
          "Members always sign in on your hub URL — not hub.triforgemedia.com. Send that link in every invite.",
          "Do not attach leftover Railway DNS once Cloudflare is Active. If HTTPS looks wrong, refresh status — do not invent extra records.",
        ],
        stepTitles: [
          "Logo and name first",
          "Slug hostname before vanity",
          "Invites use your URL",
          "Custom domain is step two",
        ],
        exercise:
          "Open Hub profile. Confirm logo, display name, and the exact URL you will put in invites.",
        knowledgeCheck: [
          "What URL should an invite email use?",
          "When do you add a custom domain?",
          "True or false: members should sign in on Hub 0.",
        ],
      },
      {
        title: "Menu — what members see",
        tagline: "If it is not in the menu, it does not exist to them",
        objective:
          "Edit the member menu so Home, chat, tasks, and learn match the modules you turned on.",
        readingTime: "3 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "The member menu is the product. Extra dead links feel broken. Missing Learning Center hides every course you just built.",
          "Admin → Menu (or the menu editor). Nest items under a parent when you have a family (Learn, Account). Mark “open in new tab” only for off-hub links.",
          "Turn a link off when the SKU is off. Do not leave “Shop” in the menu if Shop is Hub 0 only.",
          "Walk Home as a member (or a test account) after you save. If you cannot find TikTask in two clicks, fix the menu before you invite anyone else.",
        ],
        stepTitles: [
          "Menu is the product",
          "Nest families, new-tab only off-hub",
          "Hide what you did not buy",
        ],
        exercise:
          "As a non-admin test user (or incognito after a member login), click every top-level menu item. Delete or nest anything that 404s.",
        knowledgeCheck: [
          "Why hide a menu item when the SKU is off?",
          "When should a link open in a new tab?",
        ],
      },
      {
        title: "Invites and the apply form",
        tagline: "No public signup — on purpose",
        objective:
          "Run the front door: public /apply, approve in Applicants, invite email, first login.",
        readingTime: "5 min",
        footerLabel: FOOTER,
        figures: [SHOT.admin],
        paragraphs: [
          "There is no open signup. People apply or you send an invite. That is how the room stays yours.",
          "Share /apply on your hub hostname. The form stores an Application. You review it under Admin → Applicants.",
          "Approve with a note if you want. The system creates an invite token and Resend sends the signup email. Reject with a reason when it is a no.",
          "They set a password with that token, then land in profile setup (platform + goals if TikTask is on). Then Home.",
          "You can also add a member from Users without an apply — use that for staff and owners, not a public back door.",
        ],
        stepTitles: [
          "Send them to /apply on your host",
          "Approve or reject in Applicants",
          "They sign up only with the token",
          "Staff can be added by hand",
        ],
        exercise:
          "Submit a test apply on your hub (or reopen a pending one). Practice approve vs reject without sending a real talent email if you can use a test address.",
        knowledgeCheck: [
          "Can someone create an account from the public signup page?",
          "What happens when you approve an application?",
          "Where do you add a staff owner who never applied?",
        ],
      },
    ],
  },
  {
    title: "People and rooms",
    description: "Module 3 · Users, groups, tags, chat, and DMs",
    lessons: [
      {
        title: "Users, roles, and the directory",
        tagline: "Who can do what",
        objective:
          "Use Admin / Mod / Creator / Member correctly, and keep figurehead accounts out of the public directory if needed.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.admin],
        paragraphs: [
          "Admin → Users is the roster. Click a person for role, groups, tags, TikTok handle, ban, and onboarding assignment.",
          "Admin can do everything on that hub. Mod helps with chat and applicants if you grant it. Creator and Member are talent — they do not see Admin.",
          "True Admin on Hub 0 is the only role that authors Academy and Create Hub. Client hub owners are admins of their hub, not of Forge.",
          "The member directory is public to signed-in people. Hide shared or figurehead accounts so they do not look like extra creators.",
          "Ban is for abuse. Changing role is for trust. Do not ban someone you meant to demote.",
        ],
        stepTitles: [
          "Users is the roster",
          "Admin and Mod vs talent",
          "Hub 0 authors Academy",
          "Directory visibility and bans",
        ],
        exercise:
          "Open your own user row. Confirm your role, groups, and whether you belong in the directory.",
        knowledgeCheck: [
          "Who can edit Hub Zero Academy?",
          "What is the difference between ban and a role change?",
          "When would you hide someone from the directory?",
        ],
      },
      {
        title: "Groups and tags",
        tagline: "Spaces first, labels second",
        objective:
          "Use groups for rooms and access. Use tags for filters. Do not build a group for every label.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "A group is a space: Home plus invite-only rooms, optional channels, optional TikTask access, join mode (open / apply / invite).",
          "Put Battle Hosts in a group when they need a practice channel. Put CN vs MN in groups when the rooms and perks differ.",
          "Tags are filters on Users and broadcasts: “needs lighting,” “week-1,” “US.” Tags do not create channels.",
          "If you create 20 groups, nobody knows where to talk. Start with Home, one talent group, one staff group. Add the third when a room is actually noisy.",
        ],
        stepTitles: [
          "Group = space and access",
          "Use groups when rooms differ",
          "Tag = filter, not a room",
        ],
        exercise:
          "List every group you have. Merge or archive any group that does not own a channel or a perk.",
        knowledgeCheck: [
          "When do you make a group instead of a tag?",
          "What does join mode on a group control?",
        ],
      },
      {
        title: "Chat and DMs",
        tagline: "Talk where the work happens",
        objective:
          "Stand up the channels people actually need, and set DM rules before the first argument.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "Chat is Discord-style channels. Visibility follows groups and roles. Admin → Channels (or a group’s channel list) is where you add them.",
          "Start small: announcements, general, intros, and one work channel (LIVE, battles, or shop). Archive instead of multiplying ghosts.",
          "DMs are a separate SKU. Admin → DM settings sets who can DM whom. Reports and archive live under Admin → DM reports.",
          "Voice is hop-in in a group channel — not a webinar, not LiveKit minutes. Webinars are the big stage.",
        ],
        stepTitles: [
          "Channels follow groups",
          "Four rooms is enough at first",
          "Set DM rules on day one",
        ],
        exercise:
          "Open chat as a member. If you cannot find announcements in five seconds, rename or pin the channel.",
        knowledgeCheck: [
          "What decides who sees a channel?",
          "How is Voice different from a webinar?",
        ],
      },
    ],
  },
  {
    title: "Work and training",
    description: "Module 4 · TikTask, projects, and Learning Center",
    lessons: [
      {
        title: "TikTask, personal tasks, and projects",
        tagline: "Three lists. Three jobs.",
        objective:
          "Never put a one-off staff assignment into TikTask, or a daily LIVE habit into Projects.",
        readingTime: "5 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "Three task systems look similar and break if you swap them.",
          "TikTask is the daily creator engine. Admin → Task templates define “go live,” “post,” “engage” by platform and goal. Members check them off. Streaks and XP follow. Edit templates — do not hardcode habits in chat.",
          "Personal tasks are a member’s own to-dos. Useful. Not the agency scoreboard.",
          "Projects are assigned hub work: “edit this VOD,” “show up Friday.” Only people on the project see it. That is staff ops, not a streak.",
          "If you want everyone to go live three times a week, that is a TikTask template. If you want three people to run a battle night, that is a Project.",
        ],
        stepTitles: [
          "TikTask = daily habits you can edit",
          "Personal tasks = their list",
          "Projects = assigned work",
          "Pick the list before you assign",
        ],
        exercise:
          "Write one TikTask template you will actually run this week, and one Project that should not be a TikTask.",
        knowledgeCheck: [
          "Who edits TikTask templates?",
          "Why is a battle-night assignment a Project?",
        ],
      },
      {
        title: "Learning Center for your members",
        tagline: "Courses they finish. Academy they never see.",
        objective:
          "Publish member courses under Admin → Courses, with modules, lessons, and a quiz only if you need a cert.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.learn],
        paragraphs: [
          "Member training lives in Admin → Courses. That is Learning Center — the same place talent already know from Forge.",
          "Structure: course → modules → lessons. Lessons are HTML (this dark-card format), optional video, optional exercise XP.",
          "Publish when the first module is teachable. A draft course is invisible to members. Quizzes are optional; skip them until you have a real pass bar.",
          "Group-gate a course when only Battle Hosts should see it. Do not dump every course on every member.",
          "Tik Tok Live Studio and Battle Hosts are Forge examples. Your hub can carry the same courses or write your own.",
        ],
        stepTitles: [
          "Admin → Courses, not Academy",
          "Modules then lessons",
          "Publish and gate on purpose",
          "Reuse Forge courses or write yours",
        ],
        exercise:
          "Open Admin → Courses. Open one published course and one draft. Note how a member would (or would not) see each.",
        knowledgeCheck: [
          "Where do you build a course for talent?",
          "What does publish do?",
        ],
      },
    ],
  },
  {
    title: "Live time and inbox",
    description: "Module 5 · Events, email, conversations, onboarding",
    lessons: [
      {
        title: "Webinars, calendar, booking, campaigns",
        tagline: "Put the live hour on a calendar they can trust",
        objective:
          "Pick the right live tool: webinar stage, calendar event, public booking, or a joinable hub campaign.",
        readingTime: "5 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "If it happens at a time with other people, it belongs on a calendar — not only in chat.",
          "Webinars are the stage: hosts, screen share, raise hand, chat, recordings, and outside-network invite pages. Admin → Webinars.",
          "Calendar events are meetings and go-live windows. Members see them. Availability on Account feeds booking.",
          "Staff booking is a public page so someone outside the hub can grab a slot. Use it for interviews and office hours.",
          "Hub campaigns are sign-up lists: interviews, meetings, games, battles. Members join; they get a personal to-do. Different from a webinar room.",
        ],
        stepTitles: [
          "Webinar = the stage",
          "Calendar = the schedule",
          "Booking = public slots",
          "Campaign = sign-up list",
        ],
        exercise:
          "Put next week’s one must-attend hour on the calendar (or as a webinar). Link it in announcements.",
        knowledgeCheck: [
          "When do you use a webinar instead of a campaign?",
          "Who is booking for?",
        ],
      },
      {
        title: "Email, Conversations, and onboarding",
        tagline: "One-to-many, one-to-one, and the first-week list",
        objective:
          "Use broadcasts for announcements, Conversations for a thread, and Onboarding so new members are not scavenger-hunting.",
        readingTime: "5 min",
        footerLabel: FOOTER,
        figures: [SHOT.admin],
        paragraphs: [
          "Three ways to talk outside the chat — they are not interchangeable.",
          "Broadcasts and email campaigns: one message to a list, plus triggers (approved, first login, go-live). Admin → Broadcasts / Campaigns / Email templates.",
          "Conversations: you email one member from the hub inbox; they reply and the thread stays on the hub. Use this instead of a personal Gmail that nobody else can see.",
          "Onboarding: named checklists (Getting Started, battle launch). Steps, required courses, dismiss with a disclaimer, reopen from Account. Assign a program on the user page.",
          "A new member who only gets a Discord dump will vanish. A checklist with “set profile, join Home, start course 1” keeps them.",
        ],
        stepTitles: [
          "Broadcast = the announcement",
          "Conversations = the thread",
          "Onboarding = the first-week list",
          "Give them a path, not a dump",
        ],
        exercise:
          "Open Onboarding and confirm a Getting Started program exists. If not, create three steps: profile, Home channel, first course.",
        knowledgeCheck: [
          "Why not run 1:1 coaching only from personal email?",
          "What does an onboarding program do that a broadcast does not?",
        ],
      },
    ],
  },
  {
    title: "Stay on your hub",
    description: "Module 6 · Hub 0-only tools and the first-week list",
    lessons: [
      {
        title: "What stays on Hub 0",
        tagline: "Do not look for Forge-only tools on a client hub",
        objective:
          "Know which systems are TriForge flagship so you do not file a bug for a SKU that was never yours.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.progress],
        paragraphs: [
          "Some tools are Hub 0 only. They will not appear on a client hub, and that is correct.",
          "Create Hub, Hub Zero Academy authoring, Agency LIVE reports, GHL/roster import, company social, public /updates, CN/MN apply routing, Shop (for now), Creator Progression, Branding kit.",
          "Your hub still has Academy as a learner: you take owner courses. You do not write them unless you are a Hub 0 true admin.",
          "TikTok Live page and Creator Insights can be on if that SKU was sold. If /live is missing, it was not in the package.",
          "When talent asks for “the Forge ladder” on a partner hub, the answer is: that ladder is Hub 0. Your hub can still have Learning Center courses and badges.",
        ],
        stepTitles: [
          "Flagship list",
          "You take Academy, Hub 0 writes it",
          "Missing /live is a package question",
          "The Forge ladder stays on Hub 0",
        ],
        exercise:
          "Compare your admin menu to this lesson. Highlight anything you expected that is not there — that is the SKU list to review with TriForge.",
        knowledgeCheck: [
          "Name two Hub 0-only tools.",
          "Can a client hub admin author Academy courses?",
        ],
      },
      {
        title: "Your first-week checklist",
        tagline: "Do these in order. Then invite talent.",
        objective:
          "Finish a one-week owner path so the hub is safe to open.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.academy, SHOT.admin],
        paragraphs: [
          "Do not invite 50 people into an empty house. Run this list once.",
          "Day 1: logo, name, hostname, menu, your admin account, one other owner. Walk Home as a member.",
          "Day 2: groups (Home + staff), four channels, DM rules, /apply tested, one onboarding checklist.",
          "Day 3: one TikTask template or one Project, one Learning Center course (even a short welcome), calendar or webinar for week two.",
          "Day 4: Conversations from-address if you have the SKU, one broadcast template, Support FAQ with three answers.",
          "Day 5: invite five trusted people. Watch where they get stuck. Fix the menu and onboarding before the rest of the roster.",
        ],
        stepTitles: [
          "Day 1 — look like you",
          "Day 2 — rooms and the door",
          "Day 3 — something to do",
          "Day 4 — email and help",
          "Day 5 — five people, then scale",
        ],
        exercise:
          "Copy the five days into a Project for yourself. Check off Day 1 today.",
        knowledgeCheck: [
          "Why invite five people before the full roster?",
          "What belongs on Day 1 vs Day 3?",
        ],
      },
    ],
  },
];
