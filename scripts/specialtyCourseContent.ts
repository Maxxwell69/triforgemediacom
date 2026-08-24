import { SPECIALTY_TRACK_NAMES } from "../lib/progression/tracks";

export type QuestionSeed = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  text: string;
  options?: string[];
  correct: string;
};

export type LessonSeed = {
  title: string;
  objective: string;
  readingTime: string;
  paragraphs: string[];
  exercise: string | null;
};

export type CourseSeed = {
  specialty: (typeof SPECIALTY_TRACK_NAMES)[number];
  title: string;
  description: string;
  lessons: LessonSeed[];
  questions: QuestionSeed[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function lessonHtml(lesson: LessonSeed) {
  const body = lesson.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n");
  const exercise = lesson.exercise
    ? `<h2>Exercise</h2>\n<p>${escapeHtml(lesson.exercise)}</p>`
    : `<h2>Exercise</h2>\n<p>None — this is a knowledge lesson.</p>`;
  return `<p><strong>Objective.</strong> ${escapeHtml(lesson.objective)}</p>
${body}
${exercise}
<p><em>Written lesson · Est. reading time: ${escapeHtml(lesson.readingTime)}.</em></p>`;
}

export const COURSES: CourseSeed[] = [
  {
    specialty: "Engagement Host",
    title: "Engagement Host Fundamentals",
    description:
      "Core skills for hosting high-energy, interactive streams built around hype and direct audience interaction.",
    lessons: [
      {
        title: "Reading the Room",
        objective: "Creator can pace their own energy against what chat is actually doing in real time.",
        readingTime: "4 min",
        paragraphs: [
          "Every stream has a rhythm, and that rhythm is set by your chat, not by you. The biggest mistake new hosts make is running their own energy on a fixed setting — always loud, always hyped, or always low-key — regardless of what the room is actually doing. Reading the room means constantly checking: is chat energized right now, or flat? Are people typing fast and joking around, or quiet and just watching? Your job is to match that, then gently pull it where you want it to go.",
          "Start by learning to read silence correctly. A quiet chat isn't always a bad sign — sometimes it means people are genuinely absorbed in what you're doing. Panicking and overcompensating with forced energy usually makes it worse. Instead, use a calm check-in (\"You all still with me?\") and see what comes back before you decide whether to escalate or settle in.",
          "Escalating and de-escalating are both skills. When chat is buzzing — lots of messages, jokes landing, people hyping each other up — that's your cue to lean into it: raise your energy, call out what's happening, ride the wave. When things get chaotic or overheated, a host who can bring the temperature down without killing the mood is far more valuable than one who can only turn things up. Practice both directions, not just the exciting one.",
          "Finally, use pauses on purpose. New hosts often fill every second of dead air out of nervousness. A well-placed pause — after a big moment, before a punchline, right after asking a question — gives chat room to react and gives you room to actually read what's coming back.",
        ],
        exercise: "Review a past stream VOD and mark 3 moments where the energy should have shifted but didn't.",
      },
      {
        title: "Interactive Segments That Keep People Watching",
        objective: "Creator can run a structured interactive segment start to finish.",
        readingTime: "4 min",
        paragraphs: [
          "An interactive segment is any planned moment where you hand some control to your audience — a poll, a challenge, a mini-game, a Q&A block. Done well, these are the moments that turn a passive viewer into an active participant, and active participants stick around longer and come back more often. Done badly, they drag, confuse people, or fizzle out with no clear ending — which is worse than not running one at all.",
          "The first decision is format. Polls are best for quick temperature checks (which game next, yes/no calls). Challenges work when you want sustained engagement over several minutes (a task chat votes on, a dare, a mini-competition). Q&A blocks work when you want depth and connection rather than speed. Match the format to what you actually want out of the moment — don't default to the same segment every stream just because it's familiar.",
          "Before you start any segment, state the rules clearly and once. \"For the next five minutes, drop your vote for X or Y and I'll go with whichever's ahead\" is enough — you don't need to over-explain, but you do need everyone to know what's happening and how it ends. Ambiguous rules are the number one reason segments feel messy.",
          "Keep segments shorter than you think they need to be. Energy peaks early and fades fast; a segment that runs long past its natural end point drains the exact energy it was meant to build. And always transition out with intention — announce the result, thank participants by name if you can, and move cleanly into what's next rather than letting it trail off.",
        ],
        exercise: "Plan one interactive segment for your next stream, written out start to finish.",
      },
      {
        title: "Handling Chat Like a Pro",
        objective: "Creator can manage difficult chat moments without losing the room.",
        readingTime: "4 min",
        paragraphs: [
          "Every host eventually deals with a troll, a bad-faith comment, or chat turning sour. How you handle that moment says more about your hosting than almost anything else you do, because everyone watching is taking notes on how you react under pressure.",
          "You generally have three options: ignore, address, or moderate. Ignoring works for low-stakes noise — a single off comment that isn't gaining traction is often best left alone; reacting gives it more attention than it deserves. Addressing works when a comment is genuinely worth responding to, either to correct something or to defuse it with humor — but keep it brief and don't let it become the focus of the stream. Moderating (timeout, ban, or looping in a mod) is for anything that's actually harmful, repeated, or escalating despite the first two options.",
          "The tone you use matters as much as the option you pick. Visibly losing your temper, even briefly, tends to encourage more of the exact behavior you're trying to stop — it shows it landed. Staying light, even while being firm, signals that nothing about your stream is rattled by it. This isn't about faking calm; it's a skill that gets easier with repetition.",
          "After any disruption, don't just move on silently — actively bring the energy back. A quick joke, a callback to something fun from earlier, or simply re-engaging chat with a question resets the room faster than pretending nothing happened.",
        ],
        exercise: null,
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
        readingTime: "4 min",
        paragraphs: [
          "Commentary is the skill that separates a stream from someone simply playing a game on camera. It's also one of the hardest skills to build because it asks your brain to do two demanding things simultaneously: perform well and narrate that performance in real time. The good news is this splits cleanly into a learnable habit, not raw talent.",
          "Start by accepting that your performance may dip slightly while you're talking, especially early on — that trade-off is normal and viewers generally prefer engaging commentary over a marginally cleaner run. Games with more downtime (turn-based, strategy, exploration-heavy titles) are easier to commentate over than twitch-reflex games, so if you're new to this, practice on lower-intensity content first before layering commentary onto your highest-skill gameplay.",
          "Dead time — loading screens, walking between objectives, waiting in a queue — is where new commentators either go silent or ramble. Neither is ideal. Prepare a small mental list of things you can talk about in those moments: what you're planning next, a story from a previous session, a question for chat. This turns unavoidable downtime into some of your most engaging content instead of dead air.",
          "React out loud, in the moment, even for small things. A quiet \"oh that's clean\" or an audible reaction to a close call does more for viewer connection than a highlight reel ever will, because it makes people feel like they're experiencing the moment with you rather than watching it happen to someone else. And know when to go quiet — high-intensity moments that require your full focus are allowed to be silent; forcing commentary through them often hurts both the play and the narration.",
        ],
        exercise: "Record 5 minutes of commentary over a familiar game and self-review.",
      },
      {
        title: "Stream Layout for Gameplay",
        objective: "Creator sets up an overlay that supports gameplay instead of cluttering it.",
        readingTime: "3 min",
        paragraphs: [
          "Your overlay exists to add context, not to compete with the game for attention. The single most common mistake in gameplay layouts is placing elements — webcam, alerts, chat box — directly over information the viewer or the player actually needs, like a minimap, health bar, or ability cooldowns. Before finalizing any layout, play the game for a few minutes and note exactly where the important UI lives, then design around it.",
          "Camera placement should follow the same logic. Most games put critical information in the corners, so a camera dead-center-bottom is often safer than a corner placement, but this varies by title — there's no universal \"right\" spot, only the spot that avoids what that specific game needs visible.",
          "Alerts and notifications (follows, subs, gifts) should be visible but not disruptive. Oversized, slow, or frequently-triggering alerts pull attention away from gameplay repeatedly throughout a session, which hurts both your performance and viewer immersion. Keep them quick, clearly designed, and positioned somewhere that doesn't block active gameplay elements.",
          "Finally, consistency matters more than perfection. A layout that stays the same stream to stream helps regular viewers navigate your content instantly and makes your channel feel more professional. It's better to have a good-enough layout you keep than to redesign constantly chasing an ideal one.",
        ],
        exercise: "Audit your current overlay against the checklist covered in this lesson.",
      },
      {
        title: "Turning Gameplay Into Clips & Highlights",
        objective: "Creator can recognize and capture their own best moments.",
        readingTime: "3 min",
        paragraphs: [
          "Not every gameplay session produces highlight-worthy content, and that's fine — but every session has at least a few moments worth capturing if you know what to look for. The three clearest signals are a skill highlight (a clutch play, a precise execution, something genuinely impressive), a strong reaction (yours or the game's, something funny or surprising), and a spike in chat activity (if chat lights up, something worth clipping just happened, even if you're not sure why yet).",
          "There are two approaches to capturing these: clipping live, in the moment, or reviewing the full VOD afterward. Clipping live is faster and means you never lose track of what to look for later, but it requires enough attention to hit a button without breaking your commentary or gameplay flow. Reviewing after is more thorough but takes real time investment, and moments can be harder to find without a rough sense of when they happened.",
          "The practical answer for most creators starting out is a hybrid: build the habit of a quick mental (or literal) tag the moment something clip-worthy happens — even just muttering \"clip that\" out loud works as a marker — then do a lighter pass afterward to actually capture and trim it. Over time, this habit becomes automatic and the tagging gets faster.",
        ],
        exercise: "Clip one moment from your next session.",
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
        options: ["Your webcam", "Key gameplay UI", "The chat window", "Donation alerts"],
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
        readingTime: "4 min",
        paragraphs: [
          "There's a real difference between describing a product and presenting it, and that difference is almost entirely about showing versus telling. Listing specifications — material, size, price — informs a viewer. Physically demonstrating how something works, feels, or solves a problem sells it. Whenever possible, put the product to its actual use on camera instead of just holding it up and talking about it.",
          "Lead with benefits, not features. A feature is \"this bag has three compartments.\" A benefit is \"you'll never have to dig around for your keys again.\" Viewers connect with what a product does for their life far more than with a spec sheet, even when the underlying information is identical. Translate every feature you mention into what it actually means for the person watching.",
          "Camera angle and lighting deserve more attention than most new sellers give them. A product that looks great in person can look flat or unclear on camera if it's poorly lit or shot from an angle that hides its best qualities. Take a few minutes before going live to test your product under your actual stream lighting, not just under normal room light.",
          "Pacing is the last piece. A presentation that's too fast skips past the details that actually convince people; one that's too slow loses attention entirely. A good rule of thumb: cover the product's core value in the first 30 seconds, then use the rest of the segment to go deeper for people who are already interested, while still making it easy for a new viewer who just tuned in to catch up quickly.",
        ],
        exercise: "Record a 2-minute product presentation and self-review against the lesson checklist.",
      },
      {
        title: "Running a Live Sales Flow",
        objective: "Creator can build urgency and guide viewers to purchase without sounding pushy.",
        readingTime: "4 min",
        paragraphs: [
          "A live sales segment has a natural shape: hook, demo, offer, close. The hook is what grabs attention in the first few seconds — a bold statement, a visual, a question. The demo is where you actually show the product doing what it does, using the presentation skills from the previous lesson. The offer is the specific ask: what it costs, what's included, and why now. The close is the direct, clear call to action — tell people exactly what to do to buy, don't leave it implied.",
          "Urgency is one of the most powerful tools in a sales flow, and also the easiest to misuse. Honest urgency — real limited stock, an actual time-boxed discount, a genuine one-time restock — drives action because it's true, and audiences can tell the difference over time between real scarcity and manufactured pressure. Fake urgency might work once, but it erodes trust with your audience fast, and trust is the thing your entire shop depends on long-term.",
          "Reading buying signals in chat helps you know when to push toward the close versus when to keep building the case. Questions about sizing, shipping, or \"does this come in—\" are strong buying signals; you can often move directly to the offer/close with someone showing that kind of interest rather than continuing a general pitch. Silence or off-topic chat, on the other hand, might mean it's worth spending more time on the demo before asking for the sale.",
        ],
        exercise: "Outline a 10-minute sales segment for your next stream.",
      },
      {
        title: "Handling Objections & Fulfilling Orders",
        objective: "Creator can respond to hesitation live and knows what happens after the sale.",
        readingTime: "3 min",
        paragraphs: [
          "Objections aren't rejections — they're usually just questions in disguise, and how you handle them live, in front of everyone watching, matters as much as how you handle the sale itself. The three most common objections are price (\"that's expensive\"), timing (\"I'll think about it\"), and trust (\"is this actually good quality / will it actually ship\"). Each deserves a specific, honest response rather than a generic pitch repeated louder.",
          "For price objections, connect back to value rather than defending the number — remind them what the benefit actually is, or mention any current offer, but don't get defensive. For timing objections, respect it; pressuring someone who's said they need to think tends to backfire, but making sure they know how to come back and buy later (saved cart, link in bio, restock notice) keeps the door open. For trust objections, honesty is the only real answer — share real details about shipping times, materials, or return policy rather than vague reassurance.",
          "Once a sale happens, your responsibility doesn't end at checkout. Buyers should have a clear, honest sense of what happens next: roughly when to expect shipping, how they'll be notified, and where to go if something's wrong. You don't need to manage fulfillment logistics personally, but you do need to be able to set accurate expectations live, because a buyer who feels informed is far less likely to become a frustrated one.",
        ],
        exercise: null,
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
        options: ["Price, timing, or trust", "Wifi and lighting", "Hashtags and thumbnails", "Raid size and emotes"],
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
        readingTime: "4 min",
        paragraphs: [
          "For a musician streaming live, audio quality isn't a nice-to-have — it's the entire product. Viewers will forgive a rough camera angle far more readily than they'll forgive audio that's distorted, unbalanced, or hard to listen to. The good news is that most audio problems come from a small set of fixable issues, not expensive equipment gaps.",
          "Mic technique and placement come first. Distance from the mic changes your sound more than almost any setting — too close and you get harsh plosives and bass buildup; too far and you lose presence and pick up more room noise. Find a consistent distance that works for your voice or instrument and stick with it stream to stream so your levels stay predictable.",
          "Levels are the next most common issue. Vocals or instruments that clip (that harsh, distorted peak sound) are one of the fastest ways to lose a listener, because it's physically uncomfortable to hear. Set your levels so your loudest moments sit comfortably below the clipping point, with some headroom — it's far better to be slightly quieter than to risk distortion.",
          "Latency — the delay between when you play and when it's heard — becomes especially noticeable for musicians, since timing is part of the performance itself. Understand your setup's latency and, where possible, monitor with settings that minimize it; even small delays can throw off your own sense of timing if you're not accounting for them.",
          "Finally, build a basic troubleshooting habit: check input levels, check that the correct device is selected, and do a quick sound test before every stream. Most audio disasters are caught in thirty seconds of pre-stream checking rather than fixed mid-performance.",
        ],
        exercise: "Do an audio level check using the method taught and document your settings.",
      },
      {
        title: "Performing for a Remote Audience",
        objective: "Creator can bring stage-level energy to a camera with no room to feed off.",
        readingTime: "3 min",
        paragraphs: [
          "Performing live in a room and performing live on stream ask very different things of you. On a stage, you feed off visible, immediate crowd energy — applause, movement, eye contact. On stream, that feedback loop is delayed and text-based, which means you have to generate and sustain your own energy without waiting for a crowd to hand it to you.",
          "The practical fix is to treat chat as your crowd, deliberately. Read reactions out loud, respond to comments between songs, and let chat's energy inform your pacing the same way a room's energy would. This does two things: it keeps you engaged with real feedback instead of performing into a void, and it makes viewers feel like active participants in the performance rather than passive listeners.",
          "Pacing a set for a screen also differs from pacing for a stage. Attention spans and viewing patterns online mean that a set built entirely around a slow build to one big climax — which can work brilliantly in a room — may lose viewers before it pays off on stream. Consider structuring sets with more frequent high points, and use chat interaction between songs as a pacing tool in itself, not just a break.",
        ],
        exercise: null,
      },
      {
        title: "Setlists, Requests & Rights Basics",
        objective: "Creator can manage a set and stay within basic licensing boundaries.",
        readingTime: "4 min",
        paragraphs: [
          "A great live set isn't fully planned in advance — it's planned enough to have direction, then adjusted based on what the room (or the chat) is telling you. Go in with a flexible structure rather than a rigid, unchangeable order, and be willing to reorder, extend, or cut songs based on how the audience is responding in real time.",
          "Song requests are one of the best engagement tools available to a musician, but they need boundaries to stay manageable. Decide ahead of time how you'll handle them — a request list, a point system, certain songs reserved for certain moments — and communicate that system clearly so it doesn't turn into chaos mid-stream. It's completely fine to decline a request gracefully if it doesn't fit the set or isn't something you can perform; a quick, friendly \"not tonight, but I've got it queued for next time\" keeps goodwill intact.",
          "Rights and licensing is the part most new streaming musicians skip past, and it's worth taking seriously. In plain terms: performing a song live is different from monetizing a recording of that performance, and different platforms and licensing situations have different rules about what's allowed. This course won't make you a licensing expert, but the core habit to build is simple — before treating any cover or outside composition as fully safe to perform and monetize, understand what license or permission situation you're actually operating under, and lean toward original material or properly licensed content when in doubt.",
        ],
        exercise: "Build a first setlist template you can reuse.",
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
        readingTime: "4 min",
        paragraphs: [
          "Creating art live is fundamentally different from creating it alone, because now part of your job is translating an internal, often intuitive process into something an audience who can't read your mind can follow and enjoy. That means narrating your decisions as you make them — why you picked that color, why you're reworking that line, what you're trying to achieve with a particular technique — even when, off-stream, you'd normally make those calls silently.",
          "This narration takes practice to do without breaking your actual creative flow. Start by talking through decisions you'd naturally pause on anyway — most artists already have small internal moments of reconsideration during a piece, and those are ideal, low-friction points to think out loud, since you're already slowing down mentally in that moment.",
          "Pacing a piece to fit your stream length is its own skill. Complex work that would normally take many sessions needs to be planned around what's realistic to show meaningful progress on in a single stream — whether that means choosing simpler pieces for shorter streams, working on one section of a larger piece per session, or being transparent with your audience about a piece spanning multiple streams.",
          "Balancing focus between the work and the audience is the ongoing challenge. You don't need to constantly split attention — there will be stretches where you're quiet and focused, and that's fine, even good, as it shows genuine craft. The skill is knowing when to surface back up: after finishing a section, when chat asks something, or at a natural pause point, so viewers never feel forgotten for too long.",
        ],
        exercise: null,
      },
      {
        title: "Managing Time & Requests",
        objective: "Creator can scope and pace commission/request work live.",
        readingTime: "3 min",
        paragraphs: [
          "Live requests and commissions are a great way to engage an audience, but without clear boundaries they can quickly overwhelm a session or leave you overcommitted. The fix starts before you ever go live: set realistic time expectations for what you can actually complete, and communicate them clearly rather than assuming everyone understands how long art takes.",
          "Scoping a request before starting it is the single most important habit here. A vague request (\"draw my character\") can turn into an open-ended, unbounded task. Before starting, clarify the specifics that matter — complexity, level of detail, color vs. line art — so you're working from a shared, realistic expectation rather than guessing what someone actually wants mid-stream.",
          "Saying no gracefully is a skill worth practicing deliberately. Not every request fits your current session, your skill focus, or your available time, and it's completely reasonable to decline or defer one. A simple, friendly explanation — \"that's a bit much for today's session, but I'd love to take it on next time\" — protects your time without damaging goodwill.",
          "When managing multiple requests across a single session, a visible queue or simple prioritization system (first-come, subscriber priority, whatever fits your community) keeps things fair and predictable, and reduces the mental load of juggling requests on the fly.",
        ],
        exercise: "Write a short commission policy you can post publicly.",
      },
      {
        title: "Showcasing & Selling Your Work",
        objective: "Creator can turn finished pieces into a portfolio and revenue.",
        readingTime: "4 min",
        paragraphs: [
          "A finished piece created live is only half the value — what happens to it afterward is where a lot of artists leave opportunity on the table. Presenting finished work well, across more than one platform, extends its life far beyond the stream it was made on and introduces it to audiences who never saw the process.",
          "A basic portfolio structure doesn't need to be complicated: a consistent place (or places) where your best finished work lives, organized in a way that's easy for a new visitor to browse quickly. Consistency in presentation — similar framing, similar description style — makes a portfolio feel intentional rather than like a random collection of posts.",
          "Pricing originals and prints is a common sticking point for artists moving into selling their work. There's no single formula, but a reasonable starting approach factors in time spent, materials, your current experience level, and what comparable work in your space sells for — and it's fine, even expected, for pricing to evolve as your skill and audience grow.",
          "This is also where showcasing connects directly back to the Shop and Monetization tools available through the platform — finished pieces, prints, or commission slots can become actual shop listings, turning what was created live into an ongoing revenue stream rather than a one-time stream moment.",
        ],
        exercise: "Post one finished piece using the presentation framework taught.",
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
          "Use a visible queue or simple prioritization system",
          "Work on all of them at once",
          "Ignore chat until the stream ends",
          "Promise overnight delivery on everything",
        ],
        correct: "Use a visible queue or simple prioritization system",
      },
      {
        type: "TRUE_FALSE",
        text: "A portfolio only needs to exist on one platform.",
        correct: "False",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What does showcasing finished work connect back to, per this course?",
        options: ["The Shop/Monetization tools", "Only Discord DMs", "Raid targets", "Daily task streaks"],
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
        readingTime: "4 min",
        paragraphs: [
          "Teaching live without any structure tends to drift — a promising topic wanders into tangents, runs long, and ends without viewers feeling like they actually learned something concrete. A simple three-part structure fixes most of this: beginning, middle, takeaway.",
          "The beginning sets expectations. In the first minute or two, tell viewers plainly what they're about to learn and why it matters — this single habit dramatically improves how well people follow and retain the rest of the lesson, because their brain now has a framework to file information into as it comes in.",
          "The middle is the actual teaching, and it's where scoping matters most. A topic that would take a semester to fully cover needs to be deliberately narrowed to fit your stream length — pick the most useful slice of a large topic rather than attempting a shallow pass over everything. It's better to teach one thing well than five things thinly.",
          "The takeaway closes the loop. Before you wrap up, explicitly restate the one thing you most want viewers to walk away with — write this single sentence out before you even start planning the lesson, since it should shape everything that comes before it, not just summarize it afterward.",
        ],
        exercise: "Outline your next lesson using the 3-part structure.",
      },
      {
        title: "Making Complex Topics Watchable",
        objective: "Creator can teach a hard topic without losing the audience.",
        readingTime: "4 min",
        paragraphs: [
          "Complex topics don't lose audiences because they're inherently boring — they lose audiences because they're presented in a way that assumes too much prior context or delivers information faster than it can actually be absorbed. Making a hard topic watchable is a presentation skill, separate from how well you understand the material yourself.",
          "Analogies and visual aids are your most powerful tools here. Connecting an unfamiliar concept to something your audience already understands compresses the mental effort needed to grasp it. A rough sketch, a simple diagram, or even gesturing through a physical comparison often communicates more in five seconds than a full minute of verbal explanation.",
          "Pacing matters as much as the explanation itself. Resist the urge to cover everything you know about a topic; instead, deliver one idea, pause, let it land, then build the next idea on top of it. Viewers absorb layered information far better than a continuous stream of facts delivered at full speed.",
          "Checking for understanding doesn't require a formal quiz mid-stream — that often feels awkward and puts people on the spot. Instead, watch chat for questions or confusion signals, and periodically ask a simple, low-pressure check-in like \"does that make sense so far?\" which invites feedback without demanding it.",
        ],
        exercise: null,
      },
      {
        title: "Answering Questions Without Losing the Thread",
        objective: "Creator can handle live Q&A without derailing the lesson.",
        readingTime: "3 min",
        paragraphs: [
          "Live teaching invites live questions, which is great for engagement but can easily pull a well-structured lesson off course if every question gets a full, immediate detour. The \"parking lot\" technique solves this directly: when a question comes in that's valuable but off-topic or too deep for right now, acknowledge it, say you're setting it aside to answer properly, and note it somewhere visible — then actually come back to it later.",
          "The skill within this technique is quickly distinguishing quick answers from deeper detours. A clarifying question that takes ten seconds to answer can usually just be answered in the moment without disrupting flow. A question that would require several minutes of explanation, or that jumps ahead of where the lesson currently is, is a strong candidate for the parking lot instead.",
          "Closing a Q&A segment cleanly matters just as much as running it well. Rather than letting questions trail off until the stream just ends, give a clear signal — \"let's take two more questions\" — and wrap with a short summary of what was covered, so the session ends on a structured note rather than fading out.",
        ],
        exercise: "Practice the parking lot technique on your next stream.",
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
        text: "What's the \"parking lot\" technique used for?",
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
        readingTime: "4 min",
        paragraphs: [
          "A community space that works well with twenty members can completely break down at two thousand if it wasn't structured with growth in mind. Designing your hub space thoughtfully from the start saves you from a painful, disruptive restructure later.",
          "Basic structure starts with clear, purposeful sections — a small number of well-defined spaces beats a large number of vague, overlapping ones. Members should be able to look at your hub's layout and immediately understand where general chat happens, where announcements live, and where specific topics or activities belong, without needing an explanation.",
          "Roles and permissions don't need to be complicated early on, but having even a basic framework — a way to recognize active members, a way to manage moderation, a way to distinguish access levels if relevant — makes it far easier to layer in more structure later without a disruptive overhaul.",
          "Design for both new and long-time members simultaneously. A space built purely around insider jokes and long-running conversations can feel unwelcoming to newcomers, while a space that only ever addresses first-timers can feel stale to your most loyal members. A dedicated space for newcomers alongside spaces for deeper community conversation lets both groups feel served.",
        ],
        exercise: "Sketch out a structure for your own hub space.",
      },
      {
        title: "Onboarding New Members",
        objective: "Creator designs a first-24-hours experience that keeps people around.",
        readingTime: "3 min",
        paragraphs: [
          "The first day a new member spends in your community determines, more than almost anything else, whether they stick around. Most drop-off happens not because a community is bad, but because a new member never quite figured out where to go or what to do, and quietly drifted away without ever really engaging.",
          "What a new member sees first matters enormously. A clear entry point — a welcome message, a short explanation of the space, an obvious next step — gives them somewhere to go instead of landing in the middle of an unfamiliar, ongoing conversation with no context.",
          "A simple welcome flow doesn't need to be elaborate. Even a short automated or templated greeting that points to a couple of key spaces (where to introduce yourself, where the main conversation happens) dramatically reduces the disorientation a brand-new member feels in their first few minutes.",
          "Reducing drop-off in that first day is really about giving people an easy, low-pressure way to take one small action — react to something, answer a simple prompt, introduce themselves — because a member who's taken even one small action is far more likely to come back than one who only observed silently.",
        ],
        exercise: "Write a welcome message template for new members.",
      },
      {
        title: "Keeping the Community Healthy",
        objective: "Creator can manage conflict and recognize contributors without heavy tools.",
        readingTime: "4 min",
        paragraphs: [
          "A healthy community isn't one with no conflict — it's one where conflict gets handled before it spreads and where good behavior gets reinforced consistently. Both sides of that require ongoing, light-touch attention rather than a one-time setup.",
          "Moderation without killing culture means intervening early and proportionately. Waiting until a disagreement has fully escalated before stepping in usually requires a much heavier response than catching it early would have. A quick, friendly redirect at the first sign of tension is often enough to prevent something from becoming an actual moderation issue at all.",
          "De-escalating conflict early relies on the same instincts covered in handling difficult chat moments live — staying calm, not taking sides publicly and immediately, and giving people a way to disengage without losing face. Communities that model calm conflict resolution tend to develop that same tone among their members over time.",
          "Recognition matters just as much as moderation, and it's often under-used. Informal systems — public shoutouts, a special role, simply naming and thanking active contributors — cost little effort but meaningfully increase how invested your most engaged members feel. A community that only ever hears from its owner when something goes wrong will feel very different from one that also hears from its owner when something goes right.",
        ],
        exercise: "Identify 2 ways to recognize active members this week.",
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
