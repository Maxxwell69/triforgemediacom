/**
 * Inserts the 7 Skill Mastery specialization courses (3 lessons + quiz each)
 * as unpublished drafts. Re-runnable: updates content, never auto-publishes.
 *
 * Staging only — uses DATABASE_URL (or STAGING_DATABASE_URL if --staging).
 * Guarded against production via scripts/guardDb.ts.
 *
 *   npx tsx scripts/seedSpecialtyCourses.ts
 *   npx tsx scripts/seedSpecialtyCourses.ts --staging
 */
import "dotenv/config";
import { SPECIALTY_TRACK_NAMES } from "../lib/progression/tracks";
import type { PrismaClient } from "@prisma/client";

type QuestionSeed = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  text: string;
  options?: string[];
  correct: string;
};

type LessonSeed = {
  title: string;
  objective: string;
  points: string[];
  exercise: string | null;
  length: string;
};

type CourseSeed = {
  specialty: (typeof SPECIALTY_TRACK_NAMES)[number];
  title: string;
  description: string;
  lessons: LessonSeed[];
  questions: QuestionSeed[];
};

function lessonHtml(lesson: LessonSeed) {
  const points = lesson.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  const exercise = lesson.exercise
    ? `<h2>Exercise</h2><p>${escapeHtml(lesson.exercise)}</p>`
    : `<h2>Exercise</h2><p>None — this is a knowledge lesson.</p>`;
  return `<p><strong>Objective.</strong> ${escapeHtml(lesson.objective)}</p>
<h2>Key points</h2>
<ul>${points}</ul>
${exercise}
<p><em>Estimated length: ${escapeHtml(lesson.length)}.</em></p>
<p>Video for this lesson can be added later in Admin → Courses.</p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const COURSES: CourseSeed[] = [
  {
    specialty: "Engagement Host",
    title: "Engagement Host Fundamentals",
    description:
      "Core skills for hosting high-energy, interactive streams built around hype and direct audience interaction.",
    lessons: [
      {
        title: "Reading the Room",
        objective: "Creator can pace their own energy against what chat is actually doing in real time.",
        points: [
          "Matching energy to chat mood",
          "Recognizing when to escalate vs. settle down",
          "Using pauses effectively",
          "Reading silence as a signal, not a failure",
        ],
        exercise: "Review a past stream VOD and mark 3 moments where the energy should have shifted.",
        length: "5 min video",
      },
      {
        title: "Interactive Segments That Keep People Watching",
        objective: "Creator can run a structured interactive segment start to finish.",
        points: [
          "Picking the right format (poll, challenge, game) for the moment",
          "Setting clear rules before starting",
          "Keeping segments short enough to hold attention",
          "Transitioning out cleanly",
        ],
        exercise: "Plan one interactive segment for your next stream, written out start to finish.",
        length: "5 min video",
      },
      {
        title: "Handling Chat Like a Pro",
        objective: "Creator can manage difficult chat moments without losing the room.",
        points: [
          "De-escalation language",
          "When to ignore vs. address vs. moderate",
          "Keeping tone light under pressure",
          "Recovering the energy after a disruption",
        ],
        exercise: null,
        length: "4 min video",
      },
    ],
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        text: "What should a host do when chat energy drops during a stream?",
        options: [
          "Ignore it and keep doing the same thing",
          "Adjust pacing / bring in an interactive segment to re-engage",
          "End the stream immediately",
          "Call out chat for being quiet",
        ],
        correct: "Adjust pacing / bring in an interactive segment to re-engage",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What should you decide before starting an interactive segment?",
        options: [
          "The thumbnail for next week",
          "The rules/format, set clearly up front",
          "Who to ban first",
          "How long the whole stream will last",
        ],
        correct: "The rules/format, set clearly up front",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What are the three response options when handling a difficult chat moment?",
        options: [
          "Ignore, address, or moderate",
          "Argue, ignore, or end stream",
          "Ban, timeout, or raid",
          "Laugh, donate, or shout out",
        ],
        correct: "Ignore, address, or moderate",
      },
      {
        type: "TRUE_FALSE",
        text: "Losing your temper visibly is an effective way to handle a troll.",
        correct: "False",
      },
    ],
  },
  {
    specialty: "Gamer",
    title: "Gamer Fundamentals",
    description: "Core skills for making gameplay-first content watchable, not just playable.",
    lessons: [
      {
        title: "Commentary While You Play",
        objective: "Creator can talk through gameplay without hurting their own performance.",
        points: [
          "Splitting attention between play and narration",
          "Filling dead time without rambling",
          "Reacting out loud in real time",
          "Knowing when to go quiet and let gameplay speak",
        ],
        exercise: "Record 5 minutes of commentary over a familiar game and self-review.",
        length: "5 min video",
      },
      {
        title: "Stream Layout for Gameplay",
        objective: "Creator sets up an overlay that supports gameplay instead of cluttering it.",
        points: [
          "Camera placement that doesn't block key UI",
          "Alert/notification placement",
          "What belongs on-screen vs. what doesn't",
          "Keeping the layout consistent across sessions",
        ],
        exercise: "Audit your current overlay against the checklist covered in this lesson.",
        length: "5 min video",
      },
      {
        title: "Turning Gameplay Into Clips & Highlights",
        objective: "Creator can recognize and capture their own best moments.",
        points: [
          "What makes a moment clip-worthy (skill, reaction, chat response)",
          "Clipping live vs. reviewing after",
          "Building a habit of tagging moments as they happen",
        ],
        exercise: "Clip one moment from your next session.",
        length: "4 min video",
      },
    ],
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        text: "What's the recommended approach when there's a lull in gameplay action?",
        options: [
          "Go completely silent until something happens",
          "Fill it with commentary/story rather than going silent or rambling",
          "Switch games immediately",
          "Play music over the gameplay and stop talking",
        ],
        correct: "Fill it with commentary/story rather than going silent or rambling",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Name one thing your overlay should never block.",
        options: [
          "Your webcam",
          "Key gameplay UI",
          "The chat window",
          "Donation alerts",
        ],
        correct: "Key gameplay UI",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Give two signals that a moment might be clip-worthy.",
        options: [
          "Skill highlight, strong reaction, or chat response",
          "Only a high viewer count",
          "Only a long session",
          "Any death or fail",
        ],
        correct: "Skill highlight, strong reaction, or chat response",
      },
      {
        type: "TRUE_FALSE",
        text: "It's better to clip everything after the stream ends than tag moments as they happen.",
        correct: "False",
      },
    ],
  },
  {
    specialty: "Shop Owner",
    title: "Shop Owner Fundamentals",
    description: "Core skills for running live product sales that convert without feeling pushy.",
    lessons: [
      {
        title: "Presenting Product on Camera",
        objective: "Creator can show a product in a way that sells it, not just describes it.",
        points: [
          "Showing vs. telling",
          "Camera angles and lighting for products",
          "Talking through benefits, not just features",
          "Pacing a presentation so it doesn't drag",
        ],
        exercise: "Record a 2-minute product presentation and self-review against the lesson checklist.",
        length: "5 min video",
      },
      {
        title: "Running a Live Sales Flow",
        objective: "Creator can build urgency and guide viewers to purchase without sounding pushy.",
        points: [
          "Structuring a sales segment (hook, demo, offer, close)",
          "Using urgency honestly (real stock/time limits, not fake ones)",
          "Reading buying signals in chat",
        ],
        exercise: "Outline a 10-minute sales segment for your next stream.",
        length: "5 min video",
      },
      {
        title: "Handling Objections & Fulfilling Orders",
        objective: "Creator can respond to hesitation live and knows what happens after the sale.",
        points: [
          "Common objections (price, timing, trust) and how to respond honestly",
          "What happens after checkout",
          "Basic expectations around shipping/fulfillment communication",
        ],
        exercise: null,
        length: "4 min video",
      },
    ],
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        text: "What should a product presentation lead with — features or benefits?",
        options: ["Features", "Benefits", "Price only", "Unboxing as fast as possible"],
        correct: "Benefits",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What's the recommended approach to urgency in a sales flow?",
        options: [
          "Fake countdown timers every stream",
          "Honest urgency — real stock/time limits, not fake ones",
          "Never mention stock or time",
          "Pressure people until they buy",
        ],
        correct: "Honest urgency — real stock/time limits, not fake ones",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Name two common objections covered in this course.",
        options: [
          "Price, timing, or trust",
          "Wifi and lighting",
          "Hashtags and thumbnails",
          "Raid size and emotes",
        ],
        correct: "Price, timing, or trust",
      },
      {
        type: "TRUE_FALSE",
        text: "Fulfillment communication is outside the scope of what a Shop Owner needs to think about.",
        correct: "False",
      },
    ],
  },
  {
    specialty: "Musician",
    title: "Musician Fundamentals",
    description: "Core skills for live musical performance and audio quality on stream.",
    lessons: [
      {
        title: "Live Audio Setup",
        objective: "Creator has audio that sounds professional at a basic technical level.",
        points: [
          "Mic technique and placement",
          "Managing levels so vocals/instruments don't clip",
          "Understanding and minimizing latency",
          "Simple troubleshooting for common audio issues",
        ],
        exercise: "Do an audio level check using the method taught and document your settings.",
        length: "5 min video",
      },
      {
        title: "Performing for a Remote Audience",
        objective: "Creator can bring stage-level energy to a camera with no room to feed off.",
        points: [
          "Projecting energy without visual audience feedback",
          "Using chat reactions as your crowd",
          "Pacing a set for a screen, not a stage",
        ],
        exercise: null,
        length: "4 min video",
      },
      {
        title: "Setlists, Requests & Rights Basics",
        objective: "Creator can manage a set and stay within basic licensing boundaries.",
        points: [
          "Reading the room to adjust a setlist",
          "Handling song requests gracefully",
          "A plain-language overview of what you can and can't perform/monetize live",
        ],
        exercise: "Build a first setlist template you can reuse.",
        length: "5 min video",
      },
    ],
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        text: "What's the first thing to check in a live audio setup?",
        options: [
          "Your overlay colors",
          "Mic technique/placement and levels",
          "How many bots are in chat",
          "The next collab date",
        ],
        correct: "Mic technique/placement and levels",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Without a live room, what should a performer use as their audience feedback?",
        options: ["Chat reactions", "Follower count", "Only likes after the stream", "Studio applause tracks"],
        correct: "Chat reactions",
      },
      {
        type: "TRUE_FALSE",
        text: "Every song is automatically safe to perform and monetize live.",
        correct: "False",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What should guide setlist adjustments mid-stream?",
        options: [
          "Reading the room / audience mood",
          "Whatever is trending on another platform",
          "Only songs you posted last year",
          "The longest songs first",
        ],
        correct: "Reading the room / audience mood",
      },
    ],
  },
  {
    specialty: "Artist",
    title: "Artist Fundamentals",
    description:
      "Core skills for creating visual art live on camera and turning it into a sustainable practice.",
    lessons: [
      {
        title: "Creating Live for an Audience",
        objective: "Creator can narrate their process without breaking creative flow.",
        points: [
          "Talking through decisions as you make them",
          "Pacing a piece to fit your stream length",
          "Balancing focus between the work and the audience",
        ],
        exercise: null,
        length: "5 min video",
      },
      {
        title: "Managing Time & Requests",
        objective: "Creator can scope and pace commission/request work live.",
        points: [
          "Setting realistic time expectations up front",
          "Scoping a request before starting",
          "Saying no gracefully",
          "Managing multiple requests across a session",
        ],
        exercise: "Write a short commission policy you can post publicly.",
        length: "4 min video",
      },
      {
        title: "Showcasing & Selling Your Work",
        objective: "Creator can turn finished pieces into a portfolio and revenue.",
        points: [
          "Presenting finished work across platforms",
          "Basic portfolio structure",
          "Pricing originals/prints",
          "Connecting this back to the Shop/Monetization tools",
        ],
        exercise: "Post one finished piece using the presentation framework taught.",
        length: "5 min video",
      },
    ],
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        text: "What should an artist do before starting a commission?",
        options: [
          "Scope it and set realistic time expectations up front",
          "Start immediately so chat stays busy",
          "Quote a price after the piece is done",
          "Accept every request in chat",
        ],
        correct: "Scope it and set realistic time expectations up front",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What's one way to manage multiple requests in a single session?",
        options: [
          "Set clear scope/limits per request",
          "Work on all of them at once",
          "Ignore chat until the stream ends",
          "Promise overnight delivery on everything",
        ],
        correct: "Set clear scope/limits per request",
      },
      {
        type: "TRUE_FALSE",
        text: "A portfolio only needs to exist on one platform.",
        correct: "False",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What does showcasing finished work connect back to, per this course?",
        options: [
          "The Shop/Monetization tools",
          "Only Discord DMs",
          "Raid targets",
          "Daily task streaks",
        ],
        correct: "The Shop/Monetization tools",
      },
    ],
  },
  {
    specialty: "Educator",
    title: "Educator Fundamentals",
    description: "Core skills for teaching effectively in a live, watchable format.",
    lessons: [
      {
        title: "Structuring a Lesson for Live Delivery",
        objective: "Creator can plan a lesson with a clear beginning, middle, and takeaway.",
        points: [
          "The 3-part lesson structure",
          "Scoping a topic to fit stream length",
          "Writing a one-line takeaway before you start",
        ],
        exercise: "Outline your next lesson using the 3-part structure.",
        length: "5 min video",
      },
      {
        title: "Making Complex Topics Watchable",
        objective: "Creator can teach a hard topic without losing the audience.",
        points: [
          "Using analogies and visual aids",
          "Pacing information delivery",
          "Checking for understanding without quizzing awkwardly",
        ],
        exercise: null,
        length: "5 min video",
      },
      {
        title: "Answering Questions Without Losing the Thread",
        objective: "Creator can handle live Q&A without derailing the lesson.",
        points: [
          'The "parking lot" technique for off-topic questions',
          "Distinguishing quick answers from deeper detours",
          "Closing a Q&A segment cleanly",
        ],
        exercise: "Practice the parking lot technique on your next stream.",
        length: "4 min video",
      },
    ],
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        text: "What are the three parts of the lesson structure taught in this course?",
        options: [
          "Beginning, middle, and takeaway",
          "Hook, ads, and raid",
          "Intro, merch, and outro",
          "Warmup, collab, and clip",
        ],
        correct: "Beginning, middle, and takeaway",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What's one tool for making a complex topic watchable?",
        options: ["Analogies / visual aids", "Talking faster", "Skipping the basics", "Reading a textbook on stream"],
        correct: "Analogies / visual aids",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: 'What\'s the "parking lot" technique used for?',
        options: [
          "Setting aside off-topic questions without derailing the lesson",
          "Ending the stream when chat is quiet",
          "Saving clips for later",
          "Parking donation goals until next week",
        ],
        correct: "Setting aside off-topic questions without derailing the lesson",
      },
      {
        type: "TRUE_FALSE",
        text: "Every question should be answered in full detail the moment it's asked.",
        correct: "False",
      },
    ],
  },
  {
    specialty: "Community Builder",
    title: "Community Builder Fundamentals",
    description: "Core skills for building and sustaining a healthy creator community.",
    lessons: [
      {
        title: "Designing Your Community Space",
        objective: "Creator can structure a hub space that scales as it grows.",
        points: [
          "Basic channel/section structure",
          "Roles and permissions basics",
          "Designing for both new and long-time members",
        ],
        exercise: "Sketch out a structure for your own hub space.",
        length: "5 min video",
      },
      {
        title: "Onboarding New Members",
        objective: "Creator designs a first-24-hours experience that keeps people around.",
        points: [
          "What a new member sees first",
          "A simple welcome flow",
          "Reducing drop-off in the first day",
        ],
        exercise: "Write a welcome message template for new members.",
        length: "4 min video",
      },
      {
        title: "Keeping the Community Healthy",
        objective: "Creator can manage conflict and recognize contributors without heavy tools.",
        points: [
          "Moderation without killing culture",
          "De-escalating conflict early",
          "Informal recognition systems (shoutouts, roles, callouts) that keep contributors engaged",
        ],
        exercise: "Identify 2 ways to recognize active members this week.",
        length: "5 min video",
      },
    ],
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        text: "What matters most in the first 24 hours of a new member's experience?",
        options: [
          "A clear, simple welcome flow that reduces drop-off",
          "A long rulebook they must read first",
          "Immediate access to every private channel",
          "Asking them to donate on day one",
        ],
        correct: "A clear, simple welcome flow that reduces drop-off",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Name one informal way to recognize contributors.",
        options: [
          "Shoutouts, roles, or callouts",
          "Only paid ranks",
          "Removing their messages",
          "Ignoring them so they stay humble",
        ],
        correct: "Shoutouts, roles, or callouts",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What's the goal of moderation, per this course?",
        options: [
          "De-escalate conflict early without killing community culture",
          "Timeout everyone who disagrees",
          "Let conflict play out for clips",
          "Turn off chat during peak hours",
        ],
        correct: "De-escalate conflict early without killing community culture",
      },
      {
        type: "TRUE_FALSE",
        text: "Community structure should be designed only for brand-new members.",
        correct: "False",
      },
    ],
  },
];

async function upsertCourse(
  prisma: PrismaClient,
  seed: CourseSeed,
  index: number,
  skillMasteryId: string | null
) {
  const existing = await prisma.course.findFirst({
    where: { title: seed.title },
    select: { id: true, isPublished: true },
  });

  const data = {
    title: seed.title,
    description: seed.description,
    category: "Skill Mastery",
    isPublished: false,
    xpReward: 50,
    order: index,
    progressionEnabled: true,
    progressionCategoryId: skillMasteryId,
    progressionLevelId: null,
    progressionSpecialty: seed.specialty,
  };

  const course = existing
    ? await prisma.course.update({
        where: { id: existing.id },
        data: {
          ...data,
          // Never flip a course the admin already published; first insert is always draft.
          isPublished: existing.isPublished ? existing.isPublished : false,
        },
      })
    : await prisma.course.create({ data });

  for (let i = 0; i < seed.lessons.length; i += 1) {
    const lesson = seed.lessons[i];
    const found = await prisma.lesson.findFirst({
      where: { courseId: course.id, title: lesson.title },
      select: { id: true },
    });
    const lessonData = {
      title: lesson.title,
      order: i,
      content: lessonHtml(lesson),
      videoUrl: null,
    };
    if (found) {
      await prisma.lesson.update({ where: { id: found.id }, data: lessonData });
    } else {
      await prisma.lesson.create({ data: { courseId: course.id, ...lessonData } });
    }
  }

  const quiz = await prisma.quiz.upsert({
    where: { courseId: course.id },
    create: {
      courseId: course.id,
      title: `${seed.title} quiz`,
      passScore: 75,
    },
    update: {
      title: `${seed.title} quiz`,
      passScore: 75,
    },
  });

  await prisma.question.deleteMany({ where: { quizId: quiz.id } });
  for (let i = 0; i < seed.questions.length; i += 1) {
    const question = seed.questions[i];
    const options = question.type === "TRUE_FALSE" ? ["True", "False"] : question.options ?? [];
    await prisma.question.create({
      data: {
        quizId: quiz.id,
        type: question.type,
        text: question.text,
        options,
        correctAnswer: question.correct,
        order: i,
      },
    });
  }

  return {
    title: course.title,
    id: course.id,
    published: course.isPublished,
    specialty: seed.specialty,
    lessons: seed.lessons.length,
    questions: seed.questions.length,
  };
}

async function main() {
  if (process.argv.includes("--staging") && process.env.STAGING_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.STAGING_DATABASE_URL;
  }
  await import("./guardDb");
  const { prisma } = await import("../lib/prisma");

  const skillMastery = await prisma.progressionCategory.findFirst({
    where: { name: "Skill Mastery" },
    select: { id: true },
  });
  if (!skillMastery) {
    console.warn("Skill Mastery category not found — courses will still be created as drafts without a track id.");
  }

  const results = [];
  for (let i = 0; i < COURSES.length; i += 1) {
    results.push(await upsertCourse(prisma, COURSES[i], i, skillMastery?.id ?? null));
  }

  console.log("Seeded unpublished specialty courses:");
  for (const row of results) {
    console.log(
      `  ${row.published ? "PUBLISHED" : "DRAFT"} · ${row.specialty} · ${row.title} (${row.lessons} lessons, ${row.questions} quiz questions)`
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
