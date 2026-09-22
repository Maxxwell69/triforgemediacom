import type { LessonSeed, QuestionSeed } from "./specialtyCourseContent";

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
    caption: "Progression lives on Hub 0. Client hubs do not get this ladder unless TriForge Media turns it on.",
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
          "Know the difference between Hub 0 (TriForge Media) and a client hub — and why owners never land on the wrong login.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "Hub Zero is the invite-only operating system TriForge Media built for creator communities: chat, daily tasks, courses, webinars, booking, and admin — on one hostname, with one login.",
          "Hub 0 is TriForge Media’s own community (hub.triforgemedia.com). Your hub is separate from that.",
          "Your hub is a separate community. Members sign in on {slug}.hub.triforgemedia.com or your custom domain. Their data never mixes with Hub 0 or another client.",
          "Core admin is always on: users, groups, tags, directory, moderation, Account. Everything else is a module you turn on because you bought it.",
          "If a menu item is missing, the module is off — not broken. Ask TriForge Media before you invent a workaround.",
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
          "Hub Zero Academy (Admin → Hub Zero Academy) is owner training — this course. Every hub admin can take it. Members never see it under Learn.",
          "Learning Center (Admin → Courses, members at Learn) is for your people: welcome courses, live training, anything you publish for them.",
          "Academy stays in Academy. Learning Center stays on Learn. They do not mix.",
          "When you build a course for members, you do it under Admin → Courses. Publish only when the lessons are ready.",
        ],
        stepTitles: [
          "Academy = people who run a hub",
          "Learning Center = your members",
          "The two catalogs do not mix",
          "Member courses live under Courses",
        ],
        exercise:
          "Open Admin → Hub Zero Academy and Admin → Courses. Confirm you can tell which catalog you are in from the header alone.",
        knowledgeCheck: [
          "Who sees Hub Zero Academy?",
          "Where do members find courses?",
          "Can an Academy course show up on Learn?",
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
          "Train & recognize: Learning Center, Rewards / XP / leaderboard, Badges. Progression (ranks and missions) is Hub 0 unless TriForge Media adds it.",
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
          "Set logo, colors, and the hostname story so members never think they signed into TriForge Media by mistake.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.home],
        paragraphs: [
          "This is all on Admin → Hub profile — click what you see on that screen. You do not need a developer for it.",
          "First impression is your name plus your logo. If those still say TriForge Media, people will think they signed into someone else’s house. Open Admin → Hub profile. You will see HUB PROFILE and a Dashboard tab.",
          "Under Dashboard logo, upload a wide wordmark — 800 × 320 pixels, PNG with a clear background works best. That logo sits above the greeting on Home. It does not replace the name in the left menu.",
          "Under Background image, upload a wallpaper at 1920 × 1080. Set Canvas, Text, and the other color pickers so the hub looks like you. Click Save brand kit when you are done. Use TriForge defaults only if you want to start over.",
          "Your members already have an address like yourname.hub.triforgemedia.com (shown at the top of Hub profile). Put that link in every invite — not hub.triforgemedia.com.",
          "Want your own address (community.yourbrand.com)? Scroll to CUSTOM DOMAIN, type the hostname, click Save custom domain. The page then shows ADD THESE RECORDS — copy Type, Name, and Value into your domain host. Click Check HTTPS status until you see HTTPS IS LIVE. If it is not live yet, wait and check again. Do not add extra records on your own.",
        ],
        stepTitles: [
          "Open Hub profile",
          "Upload the logo at 800 × 320",
          "Wallpaper, colors, Save brand kit",
          "Invites use your hub address",
          "Custom domain is optional — follow the page",
        ],
        exercise:
          "Open Admin → Hub profile. Confirm Dashboard logo, hub name, and the exact address you will put in invites.",
        knowledgeCheck: [
          "What size should the dashboard logo be?",
          "What URL should an invite email use?",
          "True or false: members should sign in on hub.triforgemedia.com.",
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
          "Admin can do everything on that hub. Mod helps with chat and applicants if you grant it. Creator and Member are talent — they do not see Admin. You name any extra groups or levels yourself.",
          "The member directory is public to signed-in people. Hide shared or figurehead accounts so they do not look like extra creators.",
          "Ban is for abuse. Changing role is for trust. Do not ban someone you meant to demote.",
        ],
        stepTitles: [
          "Users is the roster",
          "Admin and Mod vs talent",
          "Directory visibility and bans",
        ],
        exercise:
          "Open your own user row. Confirm your role, groups, and whether you belong in the directory.",
        knowledgeCheck: [
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
          "Make a group when people need their own room or perk — hosts, staff, a launch cohort, whatever you named it. You invent those levels.",
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
          "DMs are a separate switch. Admin → DM settings sets who can DM whom. Reports live under Admin → DM reports.",
          "Voice is a hop-in room on a chat channel. A webinar is the scheduled stage with a start time, hosts, and a recording. They are not the same button.",
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
          "Member training lives in Admin → Courses. That is Learning Center — the catalog your people open under Learn.",
          "Structure: course → modules → lessons. Lessons can be text, optional video, and an optional exercise.",
          "Publish when the first module is teachable. A draft course is invisible to members. Quizzes are optional; skip them until you have a real pass bar.",
          "Limit a course to a group when only that group should see it. You name the groups. Do not dump every course on every member.",
          "You can write your own courses, or use ones TriForge Media shares. Gate them to the groups you created — whatever you named those groups.",
        ],
        stepTitles: [
          "Admin → Courses, not Academy",
          "Modules then lessons",
          "Publish and gate on purpose",
          "Your groups, your courses",
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
        tagline: "Do not look for TriForge Media-only tools on your hub",
        objective:
          "Know which systems stay on TriForge Media’s hub so you do not file a bug for a tool that was never yours.",
        readingTime: "4 min",
        footerLabel: FOOTER,
        figures: [SHOT.progress],
        paragraphs: [
          "Some tools live only on TriForge Media’s hub. They will not appear on yours, and that is correct.",
          "Examples: Create Hub, Agency LIVE reports, roster import, company social, public Updates, Shop (for now), Creator Progression, Branding kit.",
          "You still take Hub Zero Academy as a learner — that is this course.",
          "TikTok Live and Creator Insights show up only if they were in your package. If Live is missing, ask TriForge Media — it is not broken.",
          "If someone asks for “the TriForge Media ladder” on your hub, that ladder stays on theirs. Your hub can still have Learning Center courses, badges, and the groups you created.",
        ],
        stepTitles: [
          "Some tools stay on TriForge Media",
          "You take Academy as a learner",
          "Missing Live is a package question",
          "Your hub uses your groups",
        ],
        exercise:
          "Compare your admin menu to this lesson. Highlight anything you expected that is not there — that is the list to review with TriForge Media.",
        knowledgeCheck: [
          "Name two tools that stay on TriForge Media’s hub.",
          "If Live is missing from your hub, what should you do?",
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

/** Graded course quiz — one question for each knowledge-check prompt. */
export const ACADEMY_OWNER_QUIZ: QuestionSeed[] = [
  {
    type: "MULTIPLE_CHOICE",
    text: "What is the difference between Hub 0 and a client hub?",
    options: [
      "Hub 0 is TriForge Media’s community; a client hub is yours and the data stays separate",
      "They share the same member list",
      "A client hub is only a login page for Hub 0",
      "There is no difference",
    ],
    correct: "Hub 0 is TriForge Media’s community; a client hub is yours and the data stays separate",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Where do your members sign in?",
    options: [
      "On your hub address (yourname.hub.triforgemedia.com or your custom domain)",
      "On hub.triforgemedia.com",
      "On triforgemedia.com",
      "On any hub they pick from a list",
    ],
    correct: "On your hub address (yourname.hub.triforgemedia.com or your custom domain)",
  },
  {
    type: "TRUE_FALSE",
    text: "A missing admin page usually means that module is off — not broken.",
    correct: "True",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Who sees Hub Zero Academy?",
    options: [
      "Hub admins taking owner training",
      "Every member under Learn",
      "Only people who applied this week",
      "Guests on the public apply page",
    ],
    correct: "Hub admins taking owner training",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Where do members find courses?",
    options: [
      "Learn (Learning Center)",
      "Hub Zero Academy",
      "Create Hub",
      "The public /updates page",
    ],
    correct: "Learn (Learning Center)",
  },
  {
    type: "TRUE_FALSE",
    text: "An Academy course can show up on Learn.",
    correct: "False",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What is the difference between TikTask and Projects?",
    options: [
      "TikTask is daily creator habits; Projects are assigned hub work",
      "They are the same list with two names",
      "Projects are daily streaks; TikTask is one-off staff work",
      "TikTask is only for email",
    ],
    correct: "TikTask is daily creator habits; Projects are assigned hub work",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Where do you approve someone who applied?",
    options: [
      "Admin → Applicants",
      "Admin → Courses",
      "Admin → Hub profile",
      "The public /apply page after they submit",
    ],
    correct: "Admin → Applicants",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Which tool is email-to-one-person vs email-to-everyone?",
    options: [
      "Conversations is one person; Broadcasts is everyone",
      "Broadcasts is one person; Conversations is everyone",
      "TikTask is one person; Projects are everyone",
      "DMs and Broadcasts are the same thing",
    ],
    correct: "Conversations is one person; Broadcasts is everyone",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What size should the dashboard logo be?",
    options: [
      "800 × 320 pixels (wide wordmark)",
      "512 × 512 pixels (square)",
      "1920 × 1080 pixels (full wallpaper)",
      "Any size — the hub will crop it",
    ],
    correct: "800 × 320 pixels (wide wordmark)",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What URL should an invite email use?",
    options: [
      "Your hub address from Hub profile",
      "hub.triforgemedia.com",
      "triforgemedia.com/apply",
      "Any email they already have",
    ],
    correct: "Your hub address from Hub profile",
  },
  {
    type: "TRUE_FALSE",
    text: "Members should sign in on hub.triforgemedia.com.",
    correct: "False",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Why hide a menu item when that module is off?",
    options: [
      "A dead link feels broken to members",
      "It saves database space",
      "Academy will not open if the menu is long",
      "You cannot hide menu items",
    ],
    correct: "A dead link feels broken to members",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "When should a link open in a new tab?",
    options: [
      "Only for links that leave the hub",
      "For every Learn course",
      "For Home and Chat",
      "Never",
    ],
    correct: "Only for links that leave the hub",
  },
  {
    type: "TRUE_FALSE",
    text: "Someone can create an account from a public signup page with no invite.",
    correct: "False",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What happens when you approve an application?",
    options: [
      "They get an invite email and can set a password",
      "They are already logged in",
      "Their account is deleted",
      "They are added to every group automatically",
    ],
    correct: "They get an invite email and can set a password",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Where do you add a staff owner who never applied?",
    options: [
      "Admin → Users",
      "The public /apply form",
      "Hub Zero Academy",
      "Admin → Courses",
    ],
    correct: "Admin → Users",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What is the difference between ban and a role change?",
    options: [
      "Ban is for abuse; a role change is for trust",
      "They do the same thing",
      "A role change deletes the account",
      "Ban only hides them from the directory",
    ],
    correct: "Ban is for abuse; a role change is for trust",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "When would you hide someone from the directory?",
    options: [
      "Shared or figurehead accounts that should not look like extra creators",
      "Every Admin",
      "Anyone who finished a course",
      "You cannot hide people from the directory",
    ],
    correct: "Shared or figurehead accounts that should not look like extra creators",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "When do you make a group instead of a tag?",
    options: [
      "When those people need their own room or perk",
      "When you only need a filter on Users",
      "For every single member",
      "Tags and groups are the same",
    ],
    correct: "When those people need their own room or perk",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What does join mode on a group control?",
    options: [
      "How people get in — open, apply, or invite",
      "The color of the group icon",
      "Whether the group can send email",
      "The default timezone",
    ],
    correct: "How people get in — open, apply, or invite",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What decides who sees a channel?",
    options: [
      "Groups and roles",
      "Whoever has the link",
      "Only people who finished Academy",
      "The public directory",
    ],
    correct: "Groups and roles",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "How is Voice different from a webinar?",
    options: [
      "Voice is a hop-in chat room; a webinar is the scheduled stage",
      "They are the same button",
      "Voice records automatically; webinars never do",
      "Webinars only work in DMs",
    ],
    correct: "Voice is a hop-in chat room; a webinar is the scheduled stage",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Who edits TikTask templates?",
    options: [
      "Admins, under Task templates",
      "Each member, in their profile",
      "Only TriForge Media",
      "The apply form",
    ],
    correct: "Admins, under Task templates",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Why is a battle-night assignment a Project?",
    options: [
      "It is assigned work for specific people, not a daily habit",
      "Projects award streaks",
      "TikTask cannot have a title",
      "Projects send the invite email",
    ],
    correct: "It is assigned work for specific people, not a daily habit",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Where do you build a course for talent?",
    options: [
      "Admin → Courses (Learning Center)",
      "Hub Zero Academy",
      "Admin → Applicants",
      "The public directory",
    ],
    correct: "Admin → Courses (Learning Center)",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What does publish do?",
    options: [
      "Makes the course visible to members on Learn",
      "Deletes the draft",
      "Sends a broadcast to every hub",
      "Moves the course into Academy",
    ],
    correct: "Makes the course visible to members on Learn",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "When do you use a webinar instead of a campaign?",
    options: [
      "When you need a live stage with hosts, chat, and a start time",
      "When you only need a sign-up list",
      "When you are sending a broadcast email",
      "When you are adding a menu link",
    ],
    correct: "When you need a live stage with hosts, chat, and a start time",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Who is booking for?",
    options: [
      "People outside the hub who need a public slot (interviews, office hours)",
      "Only Hub 0 admins",
      "Anyone posting in chat",
      "Members taking Academy",
    ],
    correct: "People outside the hub who need a public slot (interviews, office hours)",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Why not run 1:1 coaching only from personal email?",
    options: [
      "Conversations keep the thread on the hub so other staff can see it",
      "Personal email is faster for the whole roster",
      "The hub cannot send email",
      "Coaching is not allowed",
    ],
    correct: "Conversations keep the thread on the hub so other staff can see it",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What does an onboarding program do that a broadcast does not?",
    options: [
      "It is a checklist they work through (profile, Home, first course)",
      "It emails the entire roster once",
      "It publishes a Learning Center course",
      "It creates a custom domain",
    ],
    correct: "It is a checklist they work through (profile, Home, first course)",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Name two tools that stay on TriForge Media’s hub.",
    options: [
      "Creator Progression and Branding kit",
      "Chat and Users",
      "Learn and Account",
      "Applicants and Groups",
    ],
    correct: "Creator Progression and Branding kit",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "If Live is missing from your hub, what should you do?",
    options: [
      "Ask TriForge Media — it was not in the package",
      "Rebuild the hub from scratch",
      "Add leftover DNS records until it appears",
      "Publish an Academy course",
    ],
    correct: "Ask TriForge Media — it was not in the package",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "Why invite five people before the full roster?",
    options: [
      "Watch where they get stuck, then fix the menu and onboarding",
      "The hub only allows five members",
      "Academy will not open with more than five",
      "Invites expire if you send more",
    ],
    correct: "Watch where they get stuck, then fix the menu and onboarding",
  },
  {
    type: "MULTIPLE_CHOICE",
    text: "What belongs on Day 1 vs Day 3?",
    options: [
      "Day 1 is logo, name, address, and menu; Day 3 is something to do (tasks or a course)",
      "Day 1 is the full roster; Day 3 is the logo",
      "Day 1 is webinars; Day 3 is Hub profile",
      "They are the same checklist",
    ],
    correct: "Day 1 is logo, name, address, and menu; Day 3 is something to do (tasks or a course)",
  },
];
