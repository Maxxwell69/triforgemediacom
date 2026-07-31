import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/Logo";
import HubSiteHeader from "@/components/hub/HubSiteHeader";
import HubSiteFooter from "@/components/hub/HubSiteFooter";

export const metadata: Metadata = {
  title: "TriForge Hub — Creator Community",
  description:
    "The invite-only TriForge Hub: real-time chat, TikTask, Learning Center, webinars, Creator Network tracks, and rewards — in one place.",
};

const INSIDE = [
  {
    name: "Community chat",
    line: "Channels, mentions, reactions, and replies — the Discord-style home for Forge creators.",
  },
  {
    name: "TikTask",
    line: "Personalized daily tasks from your platform and goals, with streaks and XP.",
  },
  {
    name: "Learning Center",
    line: "Courses, quizzes, badges, and certificates built for LIVE and creator growth.",
  },
  {
    name: "Live webinars",
    line: "Multi-host sessions with stage, chat, screen share, and recordings.",
  },
  {
    name: "Rewards",
    line: "Spend XP on real perks — tracked on the leaderboard day, week, and month.",
  },
  {
    name: "Creator Network",
    line: "CN and Media Network tracks with the right groups, tags, and training.",
  },
] as const;

const PROGRAMS = [
  {
    title: "Forge Creator Network",
    body: "For US/CA creators without an outside agency — pathway into TikTok's official Creator Network with Forge.",
  },
  {
    title: "Media Network",
    body: "For agency-represented creators and international applicants — same Hub tools, MN-specific routing.",
  },
  {
    title: "Ops for the team",
    body: "Admins approve applications, broadcast email, run courses and webinars, and manage the whole network from one dashboard.",
  },
] as const;

export default function HubLandingPage() {
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
      {/* subtle grain / grid atmosphere */}
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

      <HubSiteHeader />

      {/* HERO — one composition: brand, headline, support, CTAs */}
      <section className="relative z-10 flex min-h-[calc(100vh-5.5rem)] flex-col items-center justify-center px-6 pb-20 pt-8 text-center sm:px-10">
        <p
          className="mb-6 font-body text-xs uppercase tracking-[0.35em] text-cyan/90 animate-[hubFadeUp_0.7s_ease-out_both]"
        >
          Invite-only · hub.triforgemedia.com
        </p>
        <Logo
          height={64}
          href={null}
          priority
          className="sm:hidden animate-[hubFadeUp_0.8s_ease-out_0.05s_both]"
        />
        <Logo
          height={96}
          href={null}
          priority
          className="hidden sm:block animate-[hubFadeUp_0.8s_ease-out_0.05s_both]"
        />
        <h1 className="mt-5 font-display text-6xl leading-none tracking-wide text-off-white sm:text-8xl animate-[hubFadeUp_0.85s_ease-out_0.1s_both]">
          THE <span className="text-gradient">HUB</span>
        </h1>
        <p className="mt-6 max-w-lg text-balance font-body text-lg text-off-white/65 animate-[hubFadeUp_0.9s_ease-out_0.18s_both]">
          Where TriForge creators live, train, and grow — chat, daily tasks, courses, and
          network tracks in one home base.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row animate-[hubFadeUp_0.95s_ease-out_0.25s_both]">
          <Link
            href="/apply"
            className="rounded-lg bg-orange px-8 py-3.5 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Apply for access
          </Link>
          <Link
            href="/signin"
            className="rounded-lg border border-off-white/20 px-8 py-3.5 font-body font-semibold text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
          >
            Sign in
          </Link>
        </div>
        <a
          href="#inside"
          className="mt-16 font-body text-xs uppercase tracking-[0.25em] text-off-white/35 transition hover:text-cyan animate-[hubFadeUp_1s_ease-out_0.35s_both]"
        >
          See what&apos;s inside ↓
        </a>
      </section>

      {/* INSIDE THE HUB */}
      <section
        id="inside"
        className="relative z-10 scroll-mt-20 border-t border-off-white/10 px-6 py-20 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.3em] text-orange">Inside the Hub</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl tracking-wide text-off-white sm:text-5xl">
            Everything a Forge creator needs — without the tab chaos.
          </h2>
          <p className="mt-4 max-w-2xl font-body text-off-white/55">
            The Hub isn’t a marketing site. It’s the operating system for the community:
            show up, get coached, learn, go live together, and get recognized for the work.
          </p>

          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {INSIDE.map((item, i) => (
              <li
                key={item.name}
                className="border-t border-off-white/15 pt-5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <h3 className="font-display text-2xl tracking-wide text-off-white">
                  {item.name}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-off-white/50">
                  {item.line}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHAT IT REPRESENTS */}
      <section className="relative z-10 px-6 py-20 sm:px-10">
        <div
          className="mx-auto max-w-5xl overflow-hidden rounded-3xl px-6 py-14 sm:px-12"
          style={{
            background:
              "linear-gradient(135deg, rgba(14,26,61,0.85) 0%, rgba(10,10,10,0.95) 50%, rgba(253,72,2,0.12) 100%)",
            border: "1px solid rgba(245,245,245,0.08)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cyan">What it represents</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl tracking-wide text-off-white sm:text-5xl">
            A private forge for public creators.
          </h2>
          <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-off-white/60">
            TriForge Media backs LIVE hosts and creators who take the craft seriously. The Hub
            is where that support becomes daily: accountability through TikTask, culture through
            chat, skill through the Learning Center, and belonging through CN and MN tracks —
            not another scattered Discord + spreadsheet stack.
          </p>
        </div>
      </section>

      {/* PROGRAMS */}
      <section
        id="programs"
        className="relative z-10 scroll-mt-20 border-t border-off-white/10 px-6 py-20 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.3em] text-orange">Programs</p>
          <h2 className="mt-3 font-display text-4xl tracking-wide text-off-white sm:text-5xl">
            Two tracks. One Hub.
          </h2>
          <p className="mt-4 max-w-xl font-body text-off-white/55">
            Application answers route you into the right network — then the same tools serve
            everyone inside.
          </p>
          <ul className="mt-12 grid gap-8 lg:grid-cols-3">
            {PROGRAMS.map((p) => (
              <li key={p.title} className="flex flex-col">
                <h3 className="font-display text-2xl tracking-wide text-gradient">{p.title}</h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-off-white/50">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 border-t border-off-white/10 pt-16 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-4xl tracking-wide text-off-white sm:text-5xl">
              Ready to step in?
            </h2>
            <p className="mt-3 max-w-md font-body text-off-white/55">
              Access is invite-only. Apply to join, or sign in if you already have credentials.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/apply"
              className="rounded-lg bg-orange px-8 py-3.5 text-center font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
            >
              Apply for access
            </Link>
            <Link
              href="/signin"
              className="rounded-lg border border-off-white/20 px-8 py-3.5 text-center font-body font-semibold text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
            >
              Sign in to the Hub
            </Link>
          </div>
        </div>
      </section>

      <HubSiteFooter />
    </div>
  );
}
