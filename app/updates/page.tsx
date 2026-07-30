import type { Metadata } from "next";
import Link from "next/link";
import {
  CHANGELOG,
  PLATFORM_PROGRAMS,
  type ChangelogKind,
} from "@/lib/changelog";
import { isAdminRole } from "@/lib/rbac";
import { getFreshSessionUser } from "@/lib/session";
import { APP_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: "Updates & Versions — TriForge Community",
  description:
    "Release history and programs on the TriForge Community hub — webinars, TikTask, Learning Center, Creator Network, and more.",
};

const KIND_LABEL: Record<ChangelogKind, string> = {
  feature: "New",
  program: "Program",
  fix: "Fix",
  improve: "Improve",
};

const KIND_STYLE: Record<ChangelogKind, string> = {
  feature: "border-orange/40 bg-orange/10 text-orange",
  program: "border-cyan/40 bg-cyan/10 text-cyan",
  fix: "border-off-white/20 bg-off-white/5 text-off-white/70",
  improve: "border-off-white/15 bg-off-white/[0.03] text-off-white/55",
};

export default async function UpdatesPage() {
  const latest = CHANGELOG[0];
  const user = await getFreshSessionUser();
  const showAdminLink = user ? isAdminRole(user.role) : false;

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden px-6 pb-16 pt-4 sm:px-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 15% 0%, rgba(253,72,2,0.16), transparent 45%), radial-gradient(circle at 90% 20%, rgba(0,212,255,0.12), transparent 40%), radial-gradient(circle at 50% 100%, rgba(14,26,61,0.55), transparent 55%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        {showAdminLink && (
          <Link
            href="/admin"
            className="mb-6 inline-flex font-body text-sm text-off-white/45 transition hover:text-cyan"
          >
            ← Back to admin
          </Link>
        )}
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan">
          TriForge Community
        </p>
        <h1 className="font-display text-5xl tracking-wide text-gradient sm:text-6xl">
          Updates
        </h1>
        <p className="mt-4 max-w-2xl font-body text-off-white/65">
          Every program, solution, and ship that landed on the hub — open to
          members, partners, and anyone curious what&rsquo;s live.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-orange/40 bg-orange/15 px-3 py-1.5 font-body text-sm font-semibold text-orange shadow-glow">
            Current · v{APP_VERSION}
          </span>
          <span className="font-body text-sm text-off-white/45">
            {latest.title} · {latest.date}
          </span>
        </div>

        {/* Programs */}
        <section className="mt-14">
          <h2 className="font-display text-3xl tracking-wide text-off-white">
            Programs &amp; solutions
          </h2>
          <p className="mt-2 max-w-xl font-body text-sm text-off-white/50">
            The major systems running on hub.triforgemedia.com today.
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {PLATFORM_PROGRAMS.map((program) => (
              <li
                key={program.name}
                className="glass rounded-2xl p-5 transition hover:border-cyan/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-xl tracking-wide text-off-white">
                    {program.name}
                  </p>
                  <span className="shrink-0 font-body text-[11px] uppercase tracking-wider text-off-white/35">
                    since v{program.since}
                  </span>
                </div>
                <p className="mt-1 font-body text-sm text-cyan/80">
                  {program.tagline}
                </p>
                <p className="mt-3 font-body text-sm leading-relaxed text-off-white/55">
                  {program.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Version timeline */}
        <section className="mt-16">
          <h2 className="font-display text-3xl tracking-wide text-off-white">
            Version history
          </h2>
          <p className="mt-2 max-w-xl font-body text-sm text-off-white/50">
            Newest first. Matches the version badge shown on every page.
          </p>

          <ol className="relative mt-10 space-y-0 border-l border-off-white/10 pl-6 sm:pl-8">
            {CHANGELOG.map((release, index) => {
              const isCurrent = release.version === APP_VERSION;
              return (
                <li key={release.version} className="relative pb-12 last:pb-0">
                  <span
                    className={`absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full sm:-left-[2.1rem] ${
                      isCurrent
                        ? "bg-orange shadow-glow"
                        : index === 0
                          ? "bg-cyan shadow-glow-cyan"
                          : "bg-off-white/25"
                    }`}
                    aria-hidden
                  />

                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className={`font-display text-2xl tracking-wide ${
                        isCurrent ? "text-orange" : "text-off-white"
                      }`}
                    >
                      v{release.version}
                    </span>
                    {isCurrent && (
                      <span className="rounded-md bg-orange/20 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wider text-orange">
                        Live
                      </span>
                    )}
                    <span className="font-body text-sm text-off-white/40">
                      {release.date}
                    </span>
                  </div>

                  <h3 className="mt-1 font-body text-lg font-semibold text-off-white/90">
                    {release.title}
                  </h3>
                  <p className="mt-1 max-w-2xl font-body text-sm text-off-white/50">
                    {release.summary}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {release.items.map((item) => (
                      <li
                        key={item.text}
                        className="flex flex-wrap items-start gap-2 font-body text-sm text-off-white/70 sm:flex-nowrap"
                      >
                        <span
                          className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_STYLE[item.kind]}`}
                        >
                          {KIND_LABEL[item.kind]}
                        </span>
                        <span className="leading-relaxed">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>

        <footer className="mt-16 flex flex-col gap-4 border-t border-off-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-off-white/40">
            Want in? Apply for invite-only access.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110"
            >
              Apply for access
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-off-white/15 px-5 py-2.5 font-body text-sm font-semibold text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
            >
              Sign in
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
