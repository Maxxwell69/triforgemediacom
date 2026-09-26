import type { LessonSeed, QuestionSeed } from "./specialtyCourseContent";

export const SERVICEPLUS_COURSE_TITLE = "Service+ Setup: Turn LIVE Viewers Into Clients";
export const SERVICEPLUS_COURSE_TITLE_ALIASES = [
  "Service+ Setup",
  "Service Plus Setup",
  "serviceplus-setup",
] as const;
export const SERVICEPLUS_BADGE_NAME = "Service+ Certified";
export const SERVICEPLUS_FOOTER = "Hub 0 · Service+ Setup";

export type ServicePlusImageMap = Record<string, string>;

function shot(images: ServicePlusImageMap, file: string, alt: string) {
  const src = images[file];
  if (!src) return undefined;
  return { src, alt, caption: alt };
}

function shots(images: ServicePlusImageMap, ...rows: Array<[string, string]>) {
  return rows.map(([file, alt]) => shot(images, file, alt)).filter(Boolean) as NonNullable<
    ReturnType<typeof shot>
  >[];
}

function extraList(items: string[]) {
  return `      <ul style="margin: 0px; padding-left: 20px;">
${items
  .map((item) => `        <li style="margin: 0px 0px 8px;">${item}</li>`)
  .join("\n")}
      </ul>`;
}

export function buildServicePlusCourse(images: ServicePlusImageMap): {
  title: string;
  description: string;
  lessons: LessonSeed[];
  questions: QuestionSeed[];
} {
  const join = shot(images, "l2-step2-join-serviceplus.png", "Service+ join screen");

  return {
    title: SERVICEPLUS_COURSE_TITLE,
    description:
      "Set up your Service+ page, DM shortcut, and pinned cards so viewers can reach you in one tap. TikTok may change Service+ screens and limits — check the app if something looks different.",
    lessons: [
      {
        title: "What Service+ Is and Why It Matters",
        tagline: "Your LIVE is a storefront. Service+ is the front door.",
        objective:
          "Know what Service+ is, what it unlocks, and why TriForge creators use it to turn viewers into clients.",
        readingTime: "5 min",
        footerLabel: SERVICEPLUS_FOOTER,
        figures: join ? [join] : [],
        paragraphs: [
          "Service+ is TikTok LIVE’s built-in toolkit for creators who offer a service — coaching, lessons, consulting, custom work, local services. It gives viewers a direct path from watching you to messaging you. Gifts are one income stream. Clients are another. Service+ turns attention into leads you can follow up with after the stream ends.",
          "The viewer is watching your LIVE and looking for a way to work with you.",
          "They tap the orange bubble on their screen to open your Service+ page.",
          "They send a message through the Service+ shortcut instead of hunting for a bio link.",
          "You reply, book, and convert the lead after (or during) the stream.",
        ],
        stepTitles: [
          "Viewer watches",
          "Viewer taps the orange bubble",
          "Viewer messages you",
          "You convert the lead",
        ],
        extraHtml: extraList([
          "<strong>Discovery</strong> — TikTok surfaces your LIVE to people searching for services like yours.",
          "<strong>Conversion tools</strong> — real-time messaging, paid courses, appointment booking.",
          "<strong>Verification badge</strong> — a professional badge that builds trust with new viewers.",
        ]),
        exercise:
          "Write one sentence: who you help, what you do, and the result they get. You will paste a shorter version onto your Service+ page in Lesson 3.",
        knowledgeCheck: [
          "What is the main purpose of Service+?",
          "Which listed benefit is not a Service+ benefit: verification badge, search promotion, automatic follower growth, or messaging tools?",
        ],
      },
      {
        title: "Activate Service+",
        tagline: "Three choices. Two minutes. Choose carefully.",
        objective: "Join Service+ from LIVE setup, pick the right content focus, and choose the correct account type.",
        readingTime: "6 min",
        footerLabel: SERVICEPLUS_FOOTER,
        paragraphs: [
          "You activate Service+ before you go live. The content focus can only be changed every 90 days, so pick the category that matches your main offer — not a side offer. Only offer license-free services under Specialized counseling. If your service requires a license, make sure you hold it.",
          "Open the LIVE setup screen (before you go live). Tap the Service+ icon in the tool row.",
          "Tap Join.",
          "Pick your content focus. Coaching or consulting → Specialized counseling. Teaching a skill or course → Skill training. Other options include Automotive, Real estate, Local services, and Custom goods & wholesale.",
          "Pick your account type. No registered business → Individual creator (freelancers, sole proprietors, self-employed). Registered LLC or company → Registered business.",
        ],
        stepTitles: [
          "Open LIVE setup and tap Service+",
          "Tap Join",
          "Pick your content focus",
          "Pick your account type",
        ],
        stepFigures: [
          shots(images, ["l2-step1-serviceplus-icon.png", "Service+ icon on the LIVE setup screen"]),
          shots(images, ["l2-step2-join-serviceplus.png", "Service+ join screen"]),
          shots(images, ["l2-step3-content-focus.png", "Choose your content focus"]),
          shots(images, ["l2-step4-account-type.png", "Individual creator vs registered business"]),
        ],
        extraHtml: extraList([
          "<strong>Warning:</strong> Your content focus can only be changed every <strong>90 days</strong>. Pick the category that fits your main offer.",
          "<strong>Tip:</strong> Only offer license-free services under Specialized counseling.",
        ]),
        exercise:
          "Open LIVE setup, tap Service+, and write down the content focus and account type you will choose before you tap Join.",
        knowledgeCheck: [
          "You teach martial arts classes online. Which content focus fits best?",
          "You don’t have an LLC yet. Which account type do you choose?",
          "How often can you change your content focus?",
        ],
      },
      {
        title: "Build Your Service Page",
        tagline: "One sentence. 120 characters. Make it count.",
        objective: "Write a 120-character service description using who you are, what you do, and the result for them.",
        readingTime: "5 min",
        footerLabel: SERVICEPLUS_FOOTER,
        paragraphs: [
          "After joining, TikTok asks you to set up your Service+ page — this is what viewers see when they tap the Service+ button during your LIVE.",
          "Tap Quick start (recommended) — or Start from scratch if you want full control.",
          "Write one sentence describing your service. 120 characters max. Formula: [Who you are] + [what you do] + [result for them].",
        ],
        stepTitles: ["Tap Quick start", "Write one sentence (120 characters)"],
        stepFigures: [
          shots(images, ["l3-step1-quick-start.png", "Quick start button"]),
          shots(images, ["l3-step2-describe-services.png", "Describe your services"]),
        ],
        extraHtml: extraList([
          "<strong>Formula:</strong> Who you are + what you do + result for them.",
          "Navy vet &amp; martial arts coach. I build custom training plans so you get stronger and more confident.",
          "Web designer for small businesses. I build sites that turn visitors into customers.",
          "Pro streamer coaching new creators on going live with confidence and growing fast.",
        ]),
        exercise:
          "Write your 120-character line and count the characters. Cut anything that is not who you are, what you do, or the result.",
        knowledgeCheck: [
          "What is the character limit for your service description?",
          "Which description is strongest: “I’m a consultant,” “DM me for stuff,” or a specific trainer line with a result?",
        ],
      },
      {
        title: "Set Up Your DM Shortcut",
        tagline: "Make it easy to start the conversation.",
        objective: "Add up to three FAQ questions, optional auto-replies, and a greeting that opens every new DM.",
        readingTime: "7 min",
        footerLabel: SERVICEPLUS_FOOTER,
        paragraphs: [
          "Most viewers won’t type a message from scratch. Give them buttons. Write FAQ questions in the viewer’s voice, as if they are asking. Structure the greeting as hook question → credibility → call to action.",
          "Tap Set up questions. Write up to 3 one-tap questions viewers can send you.",
          "Under each question, add an automated reply so the viewer gets an instant answer — even mid-stream.",
          "Set a greeting that appears at the top of every new conversation. Example: Want to train smarter without wasting months? I’ve coached martial arts for years and I build plans that fit your schedule. Tap a question below to get started!",
        ],
        stepTitles: ["Set up FAQ questions", "Add auto-replies", "Write the greeting"],
        stepFigures: [
          shots(images, ["l4-parta-set-up-questions.png", "Set up questions screen"]),
          shots(images, ["l4-parta-faq-auto-reply.png", "FAQ question with automated reply"]),
          shots(
            images,
            ["l4-partc-greeting-editor.png", "Greeting message editor"],
            ["l4-partc-viewer-dm-preview.png", "Viewer DM preview"]
          ),
        ],
        extraHtml: `${extraList([
          "<strong>What classes do you offer?</strong> — I offer 1-on-1 and small group sessions, online and in person. Want details on either?",
          "<strong>How much does coaching cost?</strong> — Packages start at [price]. Reply “PLANS” and I’ll send the full list.",
          "<strong>Can I book a free intro call?</strong> — Yes! Reply with your best day and time and I’ll lock it in.",
        ])}`,
        exercise:
          "Draft 3 FAQ questions in the viewer’s voice, one auto-reply each, and a greeting that asks a hook question, states your credibility, and tells them what to tap.",
        knowledgeCheck: [
          "What is the max number of FAQ questions?",
          "Why set auto-replies?",
          "Where does the greeting message appear?",
        ],
      },
      {
        title: "Edit Your Setup Anytime",
        tagline: "Your offer will evolve. Your page should too.",
        objective: "Find Your services from LIVE setup and know what Insights and verification mean.",
        readingTime: "5 min",
        footerLabel: SERVICEPLUS_FOOTER,
        paragraphs: [
          "You can change the page after you join. The main page also shows Insights — a 7-day summary of messages and leads. Check it weekly. If you see “Additional materials needed to verify your identity,” complete it. Verification unlocks the badge.",
          "On the LIVE setup screen (before going live), tap Service+. That opens your Service+ main page.",
          "Tap Your services.",
          "Edit your service description, contact options (message, phone, email), greeting message, and frequently asked questions.",
        ],
        stepTitles: ["Open Service+ from LIVE setup", "Tap Your services", "Edit the page"],
        stepFigures: [
          shots(images, ["l5-step1-open-serviceplus.png", "Open Service+ from LIVE setup"]),
          shots(images, ["l5-step2-main-page.png", "Service+ main page, Your services"]),
          shots(images, ["l5-step3-your-services.png", "Your services edit screen"]),
        ],
        exercise: "Open Your services and confirm your description, greeting, and FAQs match what you wrote in Lessons 3 and 4.",
        knowledgeCheck: [
          "Where do you edit your greeting and FAQs?",
          "What does Insights show?",
        ],
      },
      {
        title: "Pinned Cards: Your On-Stream Call to Action",
        tagline: "The pinned card is your highest-converting tool. Use it on a rhythm.",
        objective:
          "Edit the Direct message pinned card, pin it during LIVE on a 3-minute rhythm, and point viewers to the orange bubble.",
        readingTime: "10 min",
        footerLabel: SERVICEPLUS_FOOTER,
        paragraphs: [
          "The pinned card stays on screen for 30 seconds, then you wait 3 minutes, with a max of 20 pins per hour. Even when the card isn’t pinned, viewers can tap the orange bubble (bottom-left of their screen) to see your Service+ bio and FAQs. Remind them often.",
          "On the Service+ main page, open LIVE tools, then Pinned cards.",
          "Tap the edit (pencil) icon on the Direct message card. Write a short, specific, outcome-focused call to action. Weak: “You can send me a direct message right now!” Strong: “Get your custom training plan — tap Message now!”",
          "While live, tap the Service+ button in your bottom toolbar.",
          "Tap the pin icon next to your card. Viewers see the card with a Message button.",
          "Set a 3-minute repeating timer. Every time it fires: pin the card and say one line out loud pointing to it. Rotate verbal lines so it doesn’t sound robotic.",
          "Point to the orange bubble so people can still find your services when no card is pinned.",
        ],
        stepTitles: [
          "Open Pinned cards before LIVE",
          "Edit the Direct message CTA",
          "Tap Service+ while live",
          "Pin the card",
          "Run the 3-minute pin rhythm",
          "Remind them about the orange bubble",
        ],
        stepFigures: [
          shots(
            images,
            ["l6-parta-pinned-cards-menu.png", "Pinned cards under LIVE tools"],
            ["l6-parta-pinned-cards-tile.png", "Pinned cards tile"]
          ),
          shots(images, ["l6-parta-edit-cta.png", "Edit pinned card call to action"]),
          shots(images, ["l6-partb-live-serviceplus-button.png", "Service+ button during LIVE"]),
          shots(
            images,
            ["l6-partb-pin-icon.png", "Pin icon in Service+ LIVE panel"],
            ["l6-rules-viewer-pinned-card.png", "Pinned card as viewers see it"]
          ),
          [],
          shots(
            images,
            ["l6-partc-orange-bubble.png", "Orange bubble in viewer toolbar"],
            ["l6-partc-serviceplus-bio.png", "Service+ bio viewers see"]
          ),
        ],
        extraHtml: extraList([
          "<strong>Card stays on screen:</strong> 30 seconds.",
          "<strong>Cooldown between pins:</strong> 3 minutes.",
          "<strong>Max pins per hour:</strong> 20.",
          "Verbal cue: “Card’s up — tap Message if you want a plan built for you.”",
          "Verbal cue: “If you’re new here, hit that orange bubble bottom left and check my services.”",
          "Verbal cue: “Questions about coaching? Tap the card, I answer every one.”",
        ]),
        exercise:
          "Run one LIVE of 30+ minutes with at least 8 pins. Submit a screenshot of your Service+ Insights showing the stream. An admin reviews it.",
        knowledgeCheck: [
          "How long does a pinned card stay up?",
          "How often can you pin?",
          "Max pins in one hour?",
          "Where can viewers find your services when no card is pinned?",
        ],
      },
    ],
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        text: "What is the main purpose of Service+?",
        options: [
          "Increase gift revenue",
          "Give viewers a direct path to contact you for your services",
          "Replace your TikTok bio",
          "Schedule LIVEs",
        ],
        correct: "Give viewers a direct path to contact you for your services",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Which of these is NOT listed as a Service+ benefit?",
        options: [
          "Verification badge",
          "Promotion to users searching for your service",
          "Automatic follower growth",
          "Built-in messaging tools",
        ],
        correct: "Automatic follower growth",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "You teach martial arts classes online. Which content focus fits best?",
        options: ["Local services", "Skill training", "Custom goods", "Real estate"],
        correct: "Skill training",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "You don’t have an LLC yet. Which account type do you choose?",
        options: ["Registered business", "Individual creator"],
        correct: "Individual creator",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "How often can you change your content focus?",
        options: ["Anytime", "Every 30 days", "Every 90 days", "Once per year"],
        correct: "Every 90 days",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What is the character limit for your service description?",
        options: ["60", "120", "280", "No limit"],
        correct: "120",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Which description is strongest?",
        options: [
          "I’m a consultant.",
          "DM me for stuff.",
          "Certified trainer. I build 30-day plans so you hit your fitness goal without guesswork.",
        ],
        correct: "Certified trainer. I build 30-day plans so you hit your fitness goal without guesswork.",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Max number of FAQ questions?",
        options: ["1", "3", "5", "Unlimited"],
        correct: "3",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Why set auto-replies?",
        options: [
          "Required by TikTok",
          "Viewers get an instant answer even while you’re busy streaming",
          "They increase gift revenue",
        ],
        correct: "Viewers get an instant answer even while you’re busy streaming",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Where does the greeting message appear?",
        options: ["In your LIVE chat", "At the start of every new DM conversation", "On your profile bio"],
        correct: "At the start of every new DM conversation",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Where do you edit your greeting and FAQs?",
        options: ["Profile settings", "Service+ main page → Your services", "Only during a LIVE"],
        correct: "Service+ main page → Your services",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "What does Insights show?",
        options: ["Follower count", "7-day summary of messages and leads", "Gift totals"],
        correct: "7-day summary of messages and leads",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "How long does a pinned card stay up?",
        options: ["10 seconds", "30 seconds", "3 minutes", "Until you remove it"],
        correct: "30 seconds",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "How often can you pin?",
        options: ["Every 30 seconds", "Every minute", "Every 3 minutes"],
        correct: "Every 3 minutes",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Max pins in one hour?",
        options: ["10", "20", "30"],
        correct: "20",
      },
      {
        type: "MULTIPLE_CHOICE",
        text: "Where can viewers find your services when no card is pinned?",
        options: ["Your profile only", "The orange bubble, bottom-left", "Nowhere"],
        correct: "The orange bubble, bottom-left",
      },
    ],
  };
}
