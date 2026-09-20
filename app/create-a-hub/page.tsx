import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/Logo";
import HubSiteFooter from "@/components/hub/HubSiteFooter";

export const metadata: Metadata = {
  title: "Create a Hub for your community — TriForge",
  description:
    "Unlisted sales page: stand up a private creator hub — chat, daily tasks, learning, webinars, booking, and admin — for your community.",
  robots: { index: false, follow: false },
};

const SHOTS = {
  home: {
    src: "/sales/create-hub/home.jpg",
    alt: "Creator home dashboard with chat, TikTask, Learning Center, webinars, and track badges",
  },
  learn: {
    src: "/sales/create-hub/learn.jpg",
    alt: "Learning Center course catalog on a creator hub",
  },
  progress: {
    src: "/sales/create-hub/progress.jpg",
    alt: "Creator rank ladder and specializations for Gaming, LIVE Hosts, and Creator Network",
  },
  admin: {
    src: "/sales/create-hub/admin.jpg",
    alt: "Admin dashboard for applicants, members, tasks, and Create Hub setup",
  },
} as const;

const CREATOR_USES = [
  {
    name: "Show up every day",
    line: "TikTask tells each creator what to do today — go live, post, engage — matched to their platform and goals, with streaks and XP.",
  },
  {
    name: "Talk where the work happens",
    line: "Discord-style channels, mentions, reactions, and DMs. Groups and spaces keep Home plus invite-only rooms without another app.",
  },
  {
    name: "Train without leaving",
    line: "Learning Center courses, quizzes, certificates, and a progress ladder. Onboarding checklists walk new members through first-login steps.",
  },
  {
    name: "Go live together",
    line: "See who’s live, join webinars with stage, screen share, raise hand, chat, and recordings — including guests from outside the network.",
  },
  {
    name: "Book time & campaigns",
    line: "Public staff booking, calendar events, and sign-up campaigns for interviews, meetings, games, and battles with personal to-do lists.",
  },
  {
    name: "Get recognized",
    line: "XP, rewards store, badges, and leaderboards. Support FAQ and tickets stay in the hub so help doesn’t vanish into email threads.",
  },
] as const;

const OPERATOR_USES = [
  {
    name: "Invite-only front door",
    line: "Public apply form, approval queue, invite emails. No open signup — members enter with a valid invite, just like Forge.",
  },
  {
    name: "One admin command center",
    line: "Users, groups, tags, moderation, courses, webinars, email templates, broadcasts, and trigger campaigns — without stitching five tools.",
  },
  {
    name: "Modules you actually bought",
    line: "Turn on chat, DMs, TikTask, learning, webinars, calendar, booking, email, social planner, campaigns, onboarding, and support. Core admin is always on.",
  },
  {
    name: "Your hostname",
    line: "Each client hub lives at {slug}.hub.triforgemedia.com with its own database and login. Partners never land on the TriForge Hub by mistake.",
  },
] as const;

const MODULES = [
  { name: "Chat & DMs", line: "Channels, roles, and private messages." },
  { name: "Applications", line: "Public apply + staff approval queue." },
  { name: "TikTask", line: "Daily creator tasks admins can rewrite anytime." },
  { name: "Personal tasks", line: "Member to-dos, separate from TikTask." },
  { name: "Projects", line: "Assigned hub work only the right people see." },
  { name: "Learning Center", line: "Courses, quizzes, certificates." },
  { name: "Webinars", line: "Live stage, recordings, outside-network signup." },
  { name: "Calendar & booking", line: "Events, availability, public book links." },
  { name: "Hub campaigns", line: "Interviews, meetings, games, battles." },
  { name: "Onboarding", line: "Named checklists and required courses." },
  { name: "Email & automations", line: "Broadcasts plus first-login / go-live triggers." },
  { name: "Conversations", line: "Staff inbox to email members; they reply on the hub." },
  { name: "Social Planner", line: "Schedule TikTok posts and LIVE reminders." },
  { name: "Rewards & badges", line: "XP store, ranks, recognition." },
  { name: "Support", line: "FAQ, tickets, suggestions." },
  { name: "Directory", line: "Member profiles, groups, and tags." },
] as const;

function Shot({
  shot,
  priority = false,
  caption,
}: {
  shot: (typeof SHOTS)[keyof typeof SHOTS];
  priority?: boolean;
  caption?: string;
}) {
  return (
    <figure className="relative">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-70 blur-2xl"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(253,72,2,0.22), transparent 55%), radial-gradient(ellipse at 80% 50%, rgba(0,212,255,0.16), transparent 50%)",
        }}
      />
      <Image
        src={shot.src}
        alt={shot.alt}
        width={1024}
        height={576}
        priority={priority}
        className="relative w-full rounded-2xl"
      />
      {caption ? (
        <figcaption className="relative mt-3 text-center font-body text-xs uppercase tracking-[0.22em] text-off-white/40">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function CreateAHubSalesPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -15%, rgba(253,72,2,0.28), transparent 55%), radial-gradient(circle at 85% 35%, rgba(0,212,255,0.12), transparent 40%), radial-gradient(circle at 15% 70%, rgba(14,26,61,0.9), transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,245,245,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(245,245,245,0.15) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />

      <header className="relative z-20 flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <Logo height={28} href="/" />
        <p className="hidden font-body text-xs uppercase tracking-[0.28em] text-off-white/35 sm:block">
          Unlisted · for partners
        </p>
        <Link
          href="https://triforgemedia.com"
          className="rounded-lg bg-orange px-3 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 sm:px-4"
        >
          Talk to TriForge
        </Link>
      </header>

      <section className="relative z-10 flex flex-col items-center px-6 pb-10 pt-10 text-center sm:px-10 sm:pt-16">
        <p className="mb-5 font-body text-xs uppercase tracking-[0.35em] text-cyan/90">
          Create Hub
        </p>
        <h1 className="max-w-4xl font-display text-5xl leading-none tracking-wide text-off-white sm:text-7xl">
          A HUB FOR <span className="text-gradient">YOUR</span> COMMUNITY
        </h1>
        <p className="mt-6 max-w-2xl text-balance font-body text-lg text-off-white/65">
          The same operating system TriForge uses for LIVE hosts and creators — chat,
          daily tasks, learning, webinars, booking, and admin — stood up for your
          network on its own hostname.
        </p>
        <p className="mt-4 max-w-xl font-body text-sm text-off-white/40">
          This page is not in the public menu. Send the link to people you are pitching.
        </p>
        <div className="mx-auto mt-12 w-full max-w-5xl">
          <Shot shot={SHOTS.home} priority caption="Home — one login for chat, tasks, learning, and LIVE" />
        </div>
      </section>

      <section className="relative z-10 px-6 pb-16 sm:px-10">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-off-white/10 px-6 py-12 sm:px-12">
          <p className="text-xs uppercase tracking-[0.3em] text-orange">The gap</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl tracking-wide text-off-white sm:text-5xl">
            Discord, a spreadsheet, and a CRM is not a creator HQ.
          </h2>
          <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-off-white/60">
            Agencies and networks already have talent. What they lack is one invite-only
            home where creators know what to do today, staff can coach, courses actually
            get finished, and LIVE / interviews / booking live in the same login. Create
            Hub is that home — modular, so you only turn on what you sold.
          </p>
        </div>
      </section>

      <section className="relative z-10 border-t border-off-white/10 px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan">For creators</p>
            <h2 className="mt-3 font-display text-4xl tracking-wide text-off-white sm:text-5xl">
              Train in the same place they go live.
            </h2>
            <p className="mt-4 font-body text-off-white/55">
              Learning Center courses, quizzes, and certificates sit next to chat and
              TikTask — not in a third LMS. New members get a checklist instead of a
              scavenger hunt.
            </p>
          </div>
          <Shot shot={SHOTS.learn} caption="Learning Center" />
        </div>
        <ul className="mx-auto mt-16 grid max-w-5xl gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {CREATOR_USES.map((item) => (
            <li key={item.name} className="border-t border-off-white/15 pt-5">
              <h3 className="font-display text-2xl tracking-wide text-off-white">{item.name}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-off-white/50">{item.line}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative z-10 border-t border-off-white/10 px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div className="lg:order-2">
            <p className="text-xs uppercase tracking-[0.3em] text-orange">Progression</p>
            <h2 className="mt-3 font-display text-4xl tracking-wide text-off-white sm:text-5xl">
              Ranks, tracks, and a reason to stay.
            </h2>
            <p className="mt-4 font-body text-off-white/55">
              Creators climb a visible ladder and pick a lane — Gaming, LIVE Hosts,
              Creator Network — with missions and badges attached. Recognition lives
              in the hub, not a spreadsheet.
            </p>
          </div>
          <div className="lg:order-1">
            <Shot shot={SHOTS.progress} caption="Ranks + specializations" />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-off-white/10 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.3em] text-orange">For the team</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl tracking-wide text-off-white sm:text-5xl">
            Run the community without a tool stack.
          </h2>
          <div className="mt-10">
            <Shot shot={SHOTS.admin} caption="Admin — applicants, members, tasks, Create Hub" />
          </div>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2">
            {OPERATOR_USES.map((item) => (
              <li key={item.name} className="glass rounded-2xl p-6">
                <h3 className="font-display text-2xl tracking-wide text-gradient">{item.name}</h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-off-white/55">{item.line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative z-10 border-t border-off-white/10 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan">Inside a hub</p>
          <h2 className="mt-3 font-display text-4xl tracking-wide text-off-white sm:text-5xl">
            Modules you can switch on.
          </h2>
          <p className="mt-4 max-w-2xl font-body text-off-white/55">
            Core admin is always included. Everything else is optional — check only what
            that community bought. Some Forge-only tools (network LIVE reports, CN/MN
            tracks, company social) stay on Hub 0 and are not a Create Hub checkbox.
          </p>
          <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((item) => (
              <li key={item.name}>
                <h3 className="font-display text-xl tracking-wide text-off-white">{item.name}</h3>
                <p className="mt-1 font-body text-sm text-off-white/45">{item.line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-24 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 border-t border-off-white/10 pt-16 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-4xl tracking-wide text-off-white sm:text-5xl">
              Ready to stand one up?
            </h2>
            <p className="mt-3 max-w-md font-body text-off-white/55">
              Create Hub is provisioned by TriForge — DNS, database, and the first admin
              invite. Share this unlisted page, then talk to the team.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="https://triforgemedia.com"
              className="rounded-lg bg-orange px-8 py-3.5 text-center font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
            >
              Talk to TriForge
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-off-white/20 px-8 py-3.5 text-center font-body font-semibold text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
            >
              See the Forge Hub
            </Link>
          </div>
        </div>
      </section>

      <HubSiteFooter />
    </div>
  );
}
