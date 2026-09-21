import type { LessonSeed } from "./specialtyCourseContent";

export const LIVE_STUDIO_COURSE_TITLES = [
  "TikTok LIVE Studio",
  "TikTok Live Studio",
  "Tik Tok Live Studio",
  "TikTok LIVE studio",
  "LIVE Studio",
] as const;

export const LIVE_STUDIO_MODULE = {
  title: "Before You Go LIVE",
  description: "Module 1 · Setup, guidelines, gear, and first-impression basics",
} as const;

const FOOTER = "Hub 0 · TikTok LIVE Studio";
const IMG = "https://pub-3d52ac8bf396425d80258d88b694cda4.r2.dev/learn/tiktok-live-studio";

function table(headers: string[], rows: string[][]) {
  const th = headers
    .map(
      (h) =>
        `<th style="padding: 8px 10px; border: 1px solid rgb(59, 59, 59); text-align: left; color: rgb(244, 122, 32); font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px;">${h}</th>`
    )
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="padding: 8px 10px; border: 1px solid rgb(59, 59, 59); color: rgb(222, 222, 222); font-size: 14px;">${cell}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0px 0px; background: rgb(26, 26, 26);">${`<thead><tr style="background: rgb(11, 11, 11);">${th}</tr></thead>`}<tbody>${body}</tbody></table>`;
}

export const LIVE_STUDIO_LESSONS: LessonSeed[] = [
  {
    title: "What LIVE Studio Actually Does For You",
    tagline: "Desktop control room, not a phone call",
    objective:
      "Know why TriForge creators broadcast from LIVE Studio instead of the mobile app — and treat it as the baseline, not an upgrade.",
    readingTime: "4 min",
    footerLabel: FOOTER,
    paragraphs: [
      "LIVE Studio is TikTok's free desktop broadcasting app — your creator control room. Instead of streaming straight off your phone, you route in real cameras, microphones, capture cards, and sound gear so the stream looks and sounds like a produced show.",
      "Production-grade quality is the first reason. You get clean audio and sharp video instead of compressed phone-camera output.",
      "Real hardware support is the second. Plug in external cameras, mics, capture cards, and audio interfaces instead of being stuck with what's built into the phone.",
      "The setup flow is built so a first-time streamer and a seasoned one can both get running fast. Formats stay flexible — gaming, IRL, or talk.",
      "You also get built-in growth data and TikTok-only interaction, engagement, and monetization tools that only exist inside this ecosystem.",
    ],
    stepTitles: [
      "Quality over phone compression",
      "Use real cameras and mics",
      "Learn the desk once, then go live",
      "Read the numbers TikTok actually gives you",
    ],
    exercise:
      "Open LIVE Studio on your computer (or download it if you haven't). Screenshot the home screen and note whether your camera and mic already appear as sources.",
    knowledgeCheck: [
      "What is LIVE Studio, in one sentence?",
      "Name two reasons TriForge wants creators on LIVE Studio instead of mobile.",
      "True or false: LIVE Studio is an optional upgrade for serious LIVE growth.",
    ],
  },
  {
    title: "Community Guidelines & Staying Off TikTok's Radar",
    tagline: "Guardrails before anyone hits Go Live",
    objective:
      "Keep streams inside TikTok's rules so one bad night does not cost LIVE access — or the agency's income.",
    readingTime: "8 min",
    footerLabel: FOOTER,
    paragraphs: [
      "Before anyone on the roster goes live, they need the guardrails. Getting flagged doesn't just risk a single stream — repeated violations can cost LIVE access entirely.",
      "Don't stream pre-recorded content. Always use a strong connection (frozen frames and rollbacks read as recorded). Never loop old segments. Stay on camera — a no-face effect or long step-away drops the live signal.",
      "Keep these completely out of streams: other people's personal info, sexual or sexually suggestive content, harassment or hate (including slurs), and targeted profanity aimed at a person or group.",
      "Don't rebroadcast what you don't own — sports, PPV, movies, TV, another creator's stream, or video from other platforms. Screen-share with your face on camera, no blank screen, no QR codes, no third-party links. Need a break? Use Pause LIVE under End LIVE.",
      "Long stretches with zero interaction hurt visibility. Pause instead of ghosting. Read and respond to comments in real time.",
      "Streams get banned outright for nudity, graphic violence or imitated sex acts, driving while live, vulgar attacks, insulting gestures, or promoting gambling.",
      "TikTok mixes automation and human review on language. Auto-bleep in LIVE Studio mutes flagged audio in the moment. Repeat offenses can restrict LIVE. Default to inclusive language. Appeal a wrong strike through the TikTok LIVE Creator Hub.",
    ],
    stepTitles: [
      "Stay actually live",
      "Topics and language that are off-limits",
      "Copyright — don't rebroadcast what isn't yours",
      "Stay engaged or pause",
      "Conduct that ends the account",
      "Language strikes and auto-bleep",
    ],
    exercise:
      "Turn on auto-bleep in LIVE Studio and write three phrases you will never say on stream. Save them in your creator notes.",
    knowledgeCheck: [
      "Why does a weak connection raise the risk TikTok treats the stream as recorded?",
      "What should you use instead of leaving an unattended LIVE running?",
      "Name two categories of content that are completely off-limits.",
      "Where do you appeal a strike that feels wrong?",
    ],
  },
  {
    title: "Choosing What to Stream",
    tagline: "Match the lane, then stay consistent",
    objective:
      "Pick a content lane you can hold — gaming, lifestyle, or talk — and run a format viewers can recognize.",
    readingTime: "5 min",
    footerLabel: FOOTER,
    paragraphs: [
      "Content choice is the single biggest lever for whether a stream holds an audience. Match the approach to the creator's lane.",
      "Gaming: pick a game you actually enjoy, not only what's trending. Popular titles bring more eyeballs and more competition; niche titles bring less of both. Find a signature style (teaching, comedy, commentary) and stay consistent. Keep it fresh with co-hosts, viewer teammates, or a game rotation.",
      "Lifestyle: lock a niche you care about — fitness, cooking, fashion, day-in-the-life. Run a consistent format and schedule. Mix tutorials, Q&As, BTS, or collabs so sessions don't flatten.",
      "Chat/talk: talk about what you and the audience both care about. Acknowledge comments by name. Use polls, requests, or interactive games to keep energy up.",
      "Across every lane: treat the audience like they matter, stay authentic, and adjust based on what chat actually responds to.",
    ],
    stepTitles: [
      "Gaming — enjoy it, then brand it",
      "Lifestyle — niche plus a schedule",
      "Talk — conversation, not a lecture",
      "Rules that apply in every lane",
    ],
    exercise:
      "Write your lane (gaming / lifestyle / talk), your signature format in one sentence, and the three nights/times you will go live this week.",
    knowledgeCheck: [
      "Why is 'whatever is trending' a weak default for gaming streams?",
      "What makes a lifestyle channel recognizable?",
      "Name one way a talk stream makes viewers feel part of the conversation.",
    ],
  },
  {
    title: "Building Your LIVE Kit",
    tagline: "Gear that matches the stage you're in",
    objective:
      "Buy for the stream you run today. Know the floor specs for computer, camera, sound, and light — and the words that come up in every setup.",
    readingTime: "8 min",
    footerLabel: FOOTER,
    paragraphs: [
      "Gear should match where the creator actually is — not a maxed-out rig on day one. Use this as a buying guide, scaled to budget and goal. Mentions are educational, not brand endorsements.",
      "A phone can go live. A computer unlocks real production quality. Tier the build to how much you ask of it.",
      "A solid camera is the fastest visible upgrade. Add a tripod, and at intermediate/advanced add a capture card, dummy battery, and L bracket so the camera doesn't die or overheat mid-stream.",
      "Sound cards blend mics, media, and speakers. All-in-one is plug-and-play for most people. 'For LIVE' is lower latency for non-music creators. 'For recording' is studio fidelity for music and usually needs extra software for co-hosts or effects.",
      "Lighting is placement, temperature, and brightness: key light on the face, fill to soften shadows, backlight to separate you from the wall, atmosphere for mood. One light for tight shots, two for a balanced setup, three for full-body or a larger room.",
    ],
    stepTitles: [
      "Computer — floor specs, not a shopping list",
      "Camera — the fastest quality jump",
      "Sound card — pick the job, not the brand",
      "Lighting — key, fill, back, mood",
    ],
    extraHtml: `${table(
      ["Spec", "Entry", "Intermediate", "Advanced"],
      [
        ["Best for", "Basic streaming, no plugins", "Co-host / multi-guest / effects", "Pro plugins, audio software, lighting rigs"],
        ["CPU", "Intel Core i5-10400", "Intel Core i7-10700K", "Intel Core i9-10900K"],
        ["GPU", "NVIDIA GTX 1650 Super", "NVIDIA RTX 2060", "NVIDIA RTX 3080"],
        ["Memory", "8 GB", "16 GB", "32 GB"],
        ["Resolution", "720p", "1080p", "1080p"],
        ["Frame rate", "30 FPS", "30/60 FPS", "60 FPS"],
      ]
    )}
    <p style="margin: 8px 0px 0px; color: rgb(176, 176, 176); font-size: 13px;">These are floor specs per tier, not a mandate to buy that exact model.</p>
    ${table(
      ["", "Entry", "Intermediate", "Advanced"],
      [
        ["Type", "Webcam", "Digital camera", "Mirrorless / DSLR"],
        ["What it gets you", "HD on a small budget", "Better image, some background blur", "Sharp, customizable, pro-grade"],
        ["USB / tripod", "Yes", "Yes", "Yes"],
        ["Capture card / dummy battery / L bracket", "—", "Yes", "Yes"],
        ["Interchangeable lens", "—", "Depends on model", "Yes"],
      ]
    )}
    <p style="margin: 20px 0px 8px; color: rgb(244, 122, 32); font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;"><strong>Quick glossary</strong></p>
    <ul style="margin: 0px; padding-left: 22px; color: rgb(222, 222, 222); font-size: 15px;">
      <li style="margin: 0px 0px 6px;"><strong>CPU</strong> — the computer's brain.</li>
      <li style="margin: 0px 0px 6px;"><strong>GPU</strong> — graphics and video rendering.</li>
      <li style="margin: 0px 0px 6px;"><strong>RAM</strong> — how much the machine can juggle at once.</li>
      <li style="margin: 0px 0px 6px;"><strong>Resolution</strong> — image clarity. 720p and 1080p are the LIVE standards.</li>
      <li style="margin: 0px 0px 6px;"><strong>Frame rate (FPS)</strong> — smoothness. 30 and 60 are standard.</li>
      <li style="margin: 0px 0px 6px;"><strong>Tripod</strong> — stabilizes the camera.</li>
      <li style="margin: 0px 0px 6px;"><strong>Capture card</strong> — pulls camera video into LIVE Studio at full quality.</li>
      <li style="margin: 0px 0px 6px;"><strong>Dummy battery</strong> — external power so the camera doesn't die or overheat.</li>
      <li style="margin: 0px 0px 6px;"><strong>L bracket</strong> — flip horizontal/vertical on the same tripod head.</li>
    </ul>`,
    exercise:
      "List the kit you have today (computer, camera, mic, lights) and circle the single upgrade that would change the stream most. Put a budget next to it.",
    knowledgeCheck: [
      "What is the entry-tier resolution and frame-rate floor?",
      "When do you need a capture card?",
      "Name the three lights that do real work (not atmosphere).",
      "What does a dummy battery prevent mid-stream?",
    ],
  },
  {
    title: "Installing & Setting Up LIVE Studio",
    tagline: "Download, sign in, guided setup, welcome",
    objective:
      "Install official LIVE Studio and finish the four-step setup so the desk is ready before you apply for LIVE access.",
    readingTime: "6 min",
    footerLabel: FOOTER,
    paragraphs: [
      "Walk this sequence exactly. Skip unofficial installers. If the creator is not LIVE-enabled on mobile yet, they likely will not have LIVE access in the app — that is the next lesson.",
      "Step 1 — Download. Grab the installer from TikTok's official LIVE Studio site (macOS and Windows), then run it.",
      "Step 2 — Log in with the creator's TikTok account (or create one on the spot).",
      "Step 3 — Set up the environment. Coming from another tool? Use Import from another tool. Brand new? Use Set up now: pick LIVE content type, connect microphone and camera, then accept or adjust the suggested LIVE quality.",
      "Step 4 — After setup, the welcome walkthrough highlights core features. Next stop is LIVE access if it is not already approved.",
    ],
    stepTitles: [
      "Download from the official site",
      "Log in on the creator account",
      "Guided environment setup",
      "Welcome screen, then access",
    ],
    stepFigures: [
      [
        {
          src: `${IMG}/install-01-download.png`,
          alt: "Official LIVE Studio download page",
          caption: "Official LIVE Studio download page.",
        },
      ],
      undefined,
      [
        {
          src: `${IMG}/install-02-content.png`,
          alt: "LIVE content selection step",
          caption: "Pick the content type so the app can recommend a starting setup.",
        },
        {
          src: `${IMG}/install-03-camera-mic.png`,
          alt: "Camera and microphone setup step",
          caption: "Connect hardware for clean audio and video.",
        },
        {
          src: `${IMG}/install-04-quality.png`,
          alt: "LIVE quality setup step",
          caption: "Accept or adjust resolution and frame rate for this machine.",
        },
        {
          src: `${IMG}/install-05-setup-extra.png`,
          alt: "Additional environment setup screen",
          caption: "Finish the guided environment setup.",
        },
      ],
      [
        {
          src: `${IMG}/install-06-welcome.png`,
          alt: "LIVE Studio welcome screen",
          caption: "Welcome walkthrough after setup finishes.",
        },
      ],
    ],
    exercise:
      "Install LIVE Studio, complete Set up now, and screenshot the welcome screen. Confirm camera and mic show a live preview.",
    knowledgeCheck: [
      "Where should the installer come from?",
      "What are the three guided setup choices after Set up now?",
      "What do you do if you already use another streaming tool?",
    ],
  },
  {
    title: "Applying for LIVE Access",
    tagline: "Check status, then take the path that matches the account",
    objective:
      "Find LIVE access in the top-right of LIVE Studio and apply on the path that matches this account — already live on mobile, or coming from another platform.",
    readingTime: "5 min",
    footerLabel: FOOTER,
    paragraphs: [
      "Every new TriForge creator needs LIVE access before they can broadcast from LIVE Studio. Check status first. Do not quote follower or age numbers to talent — thresholds vary by region and change.",
      "Inside LIVE Studio, LIVE access sits in the top-right corner. Click Your LIVE access to start.",
      "Path A — already an active LIVE creator on TikTok mobile. Instant approval is possible when the account is in good standing (age, recent LIVE time, followers, no recent suspension). Click Get access. Approved access renews while the account stays clean.",
      "Path B — coming from another platform or not yet active on TikTok. Your LIVE access opens a form about the channel elsewhere. Click Apply. Review can take a few days. Approval lands as a TikTok app notification.",
      "Once access is approved, move on to first-LIVE fundamentals (the next module when it ships).",
    ],
    stepTitles: [
      "Find Your LIVE access",
      "Path A — already live on mobile",
      "Path B — other platform or new to TikTok",
      "Wait for approval, then keep going",
    ],
    stepFigures: [
      [
        {
          src: `${IMG}/access-01-status.png`,
          alt: "LIVE access status location in LIVE Studio",
          caption: "LIVE access status is in the top-right.",
        },
      ],
      [
        {
          src: `${IMG}/access-02-instant.png`,
          alt: "Instant LIVE access approval flow",
          caption: "Get access if the account already goes live on mobile.",
        },
      ],
      [
        {
          src: `${IMG}/access-03-form.png`,
          alt: "LIVE access application form for creators from other platforms",
          caption: "Application form when the account is new to TikTok LIVE.",
        },
        {
          src: `${IMG}/access-04-review.png`,
          alt: "LIVE access application review step",
          caption: "Review can take a few days. Watch TikTok notifications.",
        },
      ],
    ],
    exercise:
      "Open LIVE Studio, click Your LIVE access, and write down which path you are on (A or B) plus the status it shows today.",
    knowledgeCheck: [
      "Where do you check LIVE access inside LIVE Studio?",
      "What is Path A for?",
      "How does Path B tell you that you were approved?",
      "True or false: you should quote exact follower minimums to talent.",
    ],
  },
  {
    title: "Growing Reach With a Consistent Schedule",
    tagline: "If they don't know when, they can't show up",
    objective:
      "Put a repeatable LIVE schedule on the profile and announce it with LIVE Event plus a short teaser.",
    readingTime: "3 min",
    footerLabel: FOOTER,
    paragraphs: [
      "Consistency is the growth habit that actually works. If viewers don't know when a creator streams, they can't build the habit of showing up.",
      "Post the LIVE schedule and the main content type or game on the profile so anyone landing there knows what to expect.",
      "Use LIVE Studio's LIVE Event feature to announce upcoming streams ahead of time.",
      "Drop a short teaser clip with the event details to drive turnout. Set it, share it everywhere, and let the schedule remind people when to tune in.",
    ],
    stepTitles: [
      "Write the schedule on the profile",
      "Create a LIVE Event",
      "Tease it before you go live",
    ],
    exercise:
      "Create one LIVE Event in LIVE Studio for your next stream and paste the same days/times into your TikTok bio.",
    knowledgeCheck: [
      "What should sit on the profile besides the display name?",
      "Which LIVE Studio feature announces a stream before it starts?",
      "Why does a teaser clip matter if the Event already exists?",
    ],
  },
  {
    title: "Making a Strong First Impression",
    tagline: "The first seconds decide stay or swipe",
    objective:
      "Give every new viewer instant clarity — title, About Me, topic, camera on — before they decide to leave.",
    readingTime: "3 min",
    footerLabel: FOOTER,
    paragraphs: [
      "Viewers decide whether to stay or swipe almost instantly. The first few seconds carry outsized weight.",
      "Put the content type or game and the streaming schedule in the LIVE title and About Me so people know what they're watching.",
      "Camera on, always. Showing your real face builds trust faster than anything else.",
      "Two-step checklist before you go live: (1) clear title, real About Me, LIVE topic that matches the content; (2) run the whole stream with the camera on. Nail that, and a scroll-by turns into a follower.",
    ],
    stepTitles: [
      "Title and About Me do the explaining",
      "Camera on the whole time",
      "Run the two-step checklist",
    ],
    exercise:
      "Write tonight's LIVE title and a two-sentence About Me that names the content and the schedule. Use them on the next stream.",
    knowledgeCheck: [
      "Where should the schedule appear besides the profile?",
      "Why does TikTok want the camera on for a LIVE?",
      "What are the two checks before you hit Go Live?",
    ],
  },
];
