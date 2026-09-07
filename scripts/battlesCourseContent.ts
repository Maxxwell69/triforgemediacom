import type { LessonSeed, QuestionSeed } from "./specialtyCourseContent";

export const BATTLES_COURSE_TITLE = "Battle Hosts";
export const BATTLES_GROUP_NAME = "Battle Hosts";
export const BATTLES_BADGE_NAME = "Battle Hosts";

/** Previous names from the 3.167 seed — lookup aliases so re-runs rename instead of duplicating. */
export const BATTLES_COURSE_TITLE_ALIASES = [BATTLES_COURSE_TITLE, "TikTok Battles Mastery"] as const;
export const BATTLES_GROUP_NAME_ALIASES = [BATTLES_GROUP_NAME, "TikTok Battles Squad"] as const;
export const BATTLES_BADGE_NAME_ALIASES = [BATTLES_BADGE_NAME, "Battle Certified"] as const;

const FOOTER = "Collab · Battle Hosts";

export const BATTLES_COURSE = {
  title: BATTLES_COURSE_TITLE,
  description:
    "Battle Hosts certifies you on TikTok LIVE Battles (Matches / PK Battles) — the head-to-head, split-screen competition where two creators compete for gift points in real time. Five lessons plus a certification exam. Everything here lives in the TriForge hub and TikTok's own LIVE tools.",
  xpReward: 500,
  lessons: [
    {
      title: "Battle Basics & Eligibility",
      tagline: "Know the format before you tap the icon",
      objective:
        "Know what a Battle actually is and whether you're eligible to run one, before you ever tap the icon.",
      readingTime: "5 min",
      footerLabel: FOOTER,
      paragraphs: [
        "A Battle is a 5-minute, split-screen LIVE competition between two creators, scored on the gift value sent by each side's viewers. TikTok also calls this a Match or a PK Battle — same feature, different names across their own materials. You do not start one cold. You confirm you can run it, you know how scoring works, and you know what winning actually pays you.",
        "Eligibility is not optional. You need 1,000 or more followers, you must be 18+, both creators have to be live at the same time, and gifts only count inside the 5-minute timer. Regional or account restrictions can hide the Battle feature even when you meet those numbers — always confirm Battle access is live on your account before you promote one.",
        "Creators use three names for the same thing: Battle, Match, and PK Battle. If a partner says PK, they mean this split-screen gift race, not a different product. Use the same language your opponent uses so the invite doesn't stall.",
        "Winning does not transfer the opponent's gifts to you. Each side keeps only what its own viewers sent. A win is a scoreboard result and a retention moment — it is not a payout from the other creator's gifts.",
        "Before you ever go public with a Battle, start a private LIVE, open the Co-host panel, and look for the Battle icon (boxing gloves). If it is missing, do not advertise a Battle until TikTok has enabled it on your account.",
      ],
      stepTitles: [
        "Confirm eligibility and access",
        "Use the same name your partner uses",
        "Know what a win actually pays",
        "Check the Battle icon privately first",
      ],
      exercise:
        "Check your own account for the Battle icon (boxing gloves) by starting a private LIVE and opening the Co-host panel. Screenshot and log whether Battle access is live on your hub profile.",
      knowledgeCheck: [
        "How long does a standard Battle last?",
        "What is the minimum follower count to participate in a Battle?",
        "True or false: winning a Battle transfers the loser's gifts to the winner.",
        "What are two other names creators use for a Battle?",
        "Where should you confirm Battle access before you promote one?",
      ],
    },
    {
      title: "Starting & Running a Battle",
      tagline: "Go live, connect, battle, close clean",
      objective: "Execute the full technical flow from going live to closing out a Battle cleanly.",
      readingTime: "6 min",
      footerLabel: FOOTER,
      paragraphs: [
        "The technical flow is short. The mistakes are almost always skipped steps or a dropped connection. Run it the same way every time so your opponent and your chat know what is happening.",
        "Step 1: go LIVE normally from the (+) button. Do not start from a Battle shortcut you have not tested. Step 2: open Multi-guest / Co-host and invite your opponent. Wait until you are actually connected and the screen has split before you reach for Battle.",
        "Step 3: once connected, tap the Battle icon (boxing gloves). Step 4: your opponent must accept. If they decline or time out, no Battle starts — do not tell chat you are in a Battle until they accept. Step 5: the countdown begins the moment they accept and the 5-minute scoreboard timer starts automatically.",
        "Stable internet is required. A dropped connection ends the Battle early. If your connection is shaky, skip the Battle and stay in a normal co-host rather than burning both audiences on a crash.",
        "Close-out etiquette matters as much as the start. Thank both audiences, tag your opponent's handle, and stay live briefly after the result so you keep viewers instead of dumping them the second the timer hits zero.",
      ],
      stepTitles: [
        "Go live, then co-host",
        "Invite, wait for accept, then start the timer",
        "Protect the connection",
        "Close out without dumping the room",
      ],
      exercise:
        "Run one supervised practice Battle with a fellow TriForge creator. Log start time, opponent handle, and final score in your hub activity notes.",
      knowledgeCheck: [
        "What icon starts a Battle once two creators are connected?",
        "What happens if your opponent doesn't accept the Battle invite in time?",
        "What single technical failure most commonly ends a Battle early?",
        "Name one thing you should do in the 60 seconds after a Battle ends.",
        "When does the 5-minute scoreboard timer actually start?",
      ],
    },
    {
      title: "Scoring, Speed Rounds & Power-Ups",
      tagline: "Coach the scoreboard instead of guessing",
      objective: "Understand exactly how points are earned so you can coach your audience instead of guessing.",
      readingTime: "6 min",
      footerLabel: FOOTER,
      paragraphs: [
        "Points equal the coin value of gifts sent to your side during the timer. Views, likes, and comments do not decide it. If you cannot explain the scoreboard in one sentence, your chat cannot help you.",
        "The higher total when time expires wins. Say it out loud: gifts on our side versus gifts on theirs. Coach that number, not the vibe in the room.",
        "Speed rounds are short windows late in the Battle where gift point values are doubled or tripled. That is the single biggest swing moment. Call it out when it starts. Tell people the window is live. Silence during a Speed round is leaving points on the table.",
        "Power-Ups are purchasable, viewer-triggered tools: point boosters, point surges to close a gap, and defensive tools that slow or block the opponent's scoring. They are most effective stacked into a Speed round for compounding effect — not spent in the first minute when the multiplier is still 1x.",
        "Viewer coins convert to creator diamonds, which convert to payout. TikTok retains roughly half as its platform cut. You are coaching support, not promising that every coin becomes cash in your pocket at face value.",
      ],
      stepTitles: [
        "Teach the scoreboard in one sentence",
        "Call the Speed round out loud",
        "Save Power-Ups for the multiplier",
        "Be honest about coins, diamonds, and payout",
      ],
      exercise:
        "Watch one live Battle (yours or another creator's) and log the timestamp of the Speed round and which side used a Power-Up to close or extend their lead.",
      knowledgeCheck: [
        "What determines the winner of a Battle?",
        "What is a Speed round?",
        "Why is timing a Power-Up during a Speed round more valuable than using it early?",
        "What do gifts convert into before a creator can cash out?",
        "Name the three general types of Power-Ups.",
      ],
    },
    {
      title: "Audience Activation & Battle Strategy",
      tagline: "Turn chat into a battle team",
      objective: "Turn your chat into an active battle team instead of passive spectators.",
      readingTime: "6 min",
      footerLabel: FOOTER,
      paragraphs: [
        "Battles are won on community activation, not luck. Call out plays, hype your chat, and narrate the scoreboard out loud. A quiet host with a big following still loses to a smaller host who makes the room feel like a team.",
        "Your job is to turn spectators into a battle team. If chat is watching silently, they are not in the match yet — pull them in with a specific ask, not generic hype.",
        "Pre-battle prep is the job before you tap accept. Warm your audience up. Tell them a Battle is coming. Do not announce one cold and expect gifts to appear because the timer started.",
        "On-screen callouts and verbal cues — \"we're down 200, let's push\" — drive more gifting than silence. Script three lines you can reuse: pre-battle hype, mid-battle push, closing thank-you. Then actually say them.",
        "Pick a fair opponent (similar audience size and niche). A blowout is boring. A competitive match keeps people watching even if you lose. A loss with high engagement is still a growth and engagement win — track watch time and new followers gained during the Battle, not just the scoreboard.",
      ],
      stepTitles: [
        "Activate the room, don't wait on luck",
        "Warm them up before you accept",
        "Narrate the scoreboard out loud",
        "Pick a fair opponent and track more than the score",
      ],
      exercise:
        "Write a 3-line battle callout script you can reuse live (pre-battle hype, mid-battle push, closing thank-you) and save it to your hub creator notes.",
      knowledgeCheck: [
        "What generally wins Battles more reliably than raw luck?",
        "Why should you avoid announcing a Battle without warming your audience up first?",
        "What's one metric worth tracking during a Battle besides the scoreboard?",
        "Why does opponent selection matter for audience retention, not just for winning?",
      ],
    },
    {
      title: "Etiquette, Safety & Compliance",
      tagline: "Protect the account and the relationship",
      objective: "Protect your account standing and your co-host relationships every time you battle.",
      readingTime: "5 min",
      footerLabel: FOOTER,
      paragraphs: [
        "A guest's compliance issues during a Battle can affect the host's account standing. You are not only picking a fun opponent — you are attaching your LIVE to theirs for five minutes. Vet who you battle with.",
        "If you would not put them on your brand, do not put them on your Battle. Ask around in Battle Hosts, watch a recent LIVE, and skip anyone who treats the other side's chat as a target.",
        "Never pressure viewers to overspend. Frame gifting as support, not obligation. If the only way you can win is guilt, you are training the wrong habit into the room.",
        "Keep Battle content inside TikTok's LIVE guidelines. No baiting, harassment, or targeting the opposing creator's audience. Competitive does not mean hostile.",
        "Check your own account standing in LIVE Center before you schedule Battles. If you have an active warning, fix that first. Then close out respectfully: tag your opponent, thank both communities, and do not frame a loss as a grudge.",
      ],
      stepTitles: [
        "Vet the person on the other half of the screen",
        "Frame gifts as support, never as a debt",
        "Stay inside LIVE guidelines",
        "Check LIVE Center, then close with respect",
      ],
      exercise:
        "Review your account standing in LIVE Center and confirm no active violations before your next scheduled Battle.",
      knowledgeCheck: [
        "Why does a guest co-host's behavior matter to the host's own account standing?",
        "What's the right way to frame gifting to your audience?",
        "Where do you check your account standing before battling?",
        "What's a respectful way to close out a Battle you lost?",
      ],
    },
  ] satisfies LessonSeed[],
  questions: [
    {
      type: "MULTIPLE_CHOICE",
      text: "How long does a standard Battle run once the opponent accepts?",
      options: ["2 minutes", "5 minutes", "10 minutes", "Until one creator leaves"],
      correct: "5 minutes",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "What is the minimum follower count to access Battles?",
      options: ["500", "1,000", "5,000", "10,000"],
      correct: "1,000",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "What icon initiates a Battle once two creators are connected in Co-host?",
      options: ["The gift box", "The boxing gloves (Battle icon)", "The heart", "The share arrow"],
      correct: "The boxing gloves (Battle icon)",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "What determines the winner of a Battle?",
      options: ["Views", "Likes", "Gift points sent to each side", "Comment count"],
      correct: "Gift points sent to each side",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "What is a Speed round?",
      options: [
        "Extra time added after the timer",
        "A short window when gift point values are multiplied",
        "A pause so both creators can talk",
        "Sudden-death overtime if the score is tied",
      ],
      correct: "A short window when gift point values are multiplied",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "Why is a Power-Up more valuable during a Speed round than early in the Battle?",
      options: [
        "Power-Ups only unlock in the last minute",
        "The multiplied gift values compound with the Power-Up",
        "The opponent cannot use gifts during a Speed round",
        "TikTok refunds unused Power-Ups at the end",
      ],
      correct: "The multiplied gift values compound with the Power-Up",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "Which set describes the three general types of Power-Ups?",
      options: [
        "Boost, surge, and defensive",
        "Follow, like, and share",
        "Raid, host, and co-host",
        "Filter, effect, and sticker",
      ],
      correct: "Boost, surge, and defensive",
    },
    {
      type: "TRUE_FALSE",
      text: "Winning a Battle transfers the opponent's gifts to the winner.",
      correct: "False",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "What should you do before accepting a Battle, not after the timer starts?",
      options: [
        "Warm your audience up and confirm they know a Battle is coming",
        "Leave the LIVE and come back",
        "Turn off comments so chat stays quiet",
        "Ask the opponent to gift you first",
      ],
      correct: "Warm your audience up and confirm they know a Battle is coming",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "Why does picking a fair opponent matter for retention, not only for winning?",
      options: [
        "TikTok only recommends even matches",
        "A competitive match stays watchable even if you lose",
        "Uneven matches pay out more diamonds",
        "You cannot Battle someone with a different follower count",
      ],
      correct: "A competitive match stays watchable even if you lose",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "Why can a guest co-host's compliance issue affect the host's account?",
      options: [
        "It cannot — only the guest is responsible",
        "The Battle attaches both LIVEs together, so guest behavior can hit host standing",
        "TikTok always bans the larger account",
        "Only if the host gifted the guest first",
      ],
      correct: "The Battle attaches both LIVEs together, so guest behavior can hit host standing",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "What is the right way to frame gifting during a Battle?",
      options: [
        "As an obligation if they want to stay in chat",
        "As support, never as pressure to overspend",
        "As a loan the creator will pay back",
        "As the only way to keep the LIVE from ending",
      ],
      correct: "As support, never as pressure to overspend",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "Where do you check your account standing before scheduling Battles?",
      options: [
        "The Discover page",
        "LIVE Center",
        "Your email inbox",
        "The For You page analytics only",
      ],
      correct: "LIVE Center",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "Viewer coins convert into what before a creator can cash out?",
      options: ["Followers", "Likes", "Diamonds", "PK tokens"],
      correct: "Diamonds",
    },
    {
      type: "MULTIPLE_CHOICE",
      text: "Name one thing you should do in the 60 seconds after a Battle ends.",
      options: [
        "End the LIVE immediately so the scoreboard stays up",
        "Thank both audiences, tag your opponent, and stay live briefly",
        "Block the opponent's viewers",
        "Start another Battle without saying anything",
      ],
      correct: "Thank both audiences, tag your opponent, and stay live briefly",
    },
  ] satisfies QuestionSeed[],
};

export const BATTLES_MODULES = [
  { title: "Foundations", lessonTitles: ["Battle Basics & Eligibility", "Starting & Running a Battle"] },
  {
    title: "In the live",
    lessonTitles: ["Scoring, Speed Rounds & Power-Ups", "Audience Activation & Battle Strategy"],
  },
  { title: "Safety & certification", lessonTitles: ["Etiquette, Safety & Compliance"] },
] as const;

export const BATTLES_CHANNELS = [
  {
    name: "main",
    description: "Practice matches, opponent pairing, and Battle coordination.",
  },
  {
    name: "debriefs",
    description: "Post-battle recaps, scores, and what you would run differently next time.",
  },
] as const;
