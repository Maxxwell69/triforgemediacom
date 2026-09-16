import type { Metadata } from "next";
import Link from "next/link";
import HubSiteHeader from "@/components/hub/HubSiteHeader";
import HubSiteFooter from "@/components/hub/HubSiteFooter";
import { auth } from "@/lib/auth";
import { clientHubPublicUrl, listDirectoryHubs, listMyHubMemberships } from "@/lib/hub/directory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hubs directory — TriForge",
  description: "Communities running on Create Hub — open a hub you were invited to, or browse the directory.",
};

export default async function HubsDirectoryPage() {
  const [hubs, session] = await Promise.all([listDirectoryHubs(), auth()]);
  const mine = session?.user?.id ? await listMyHubMemberships(session.user.id) : [];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -15%, rgba(253,72,2,0.22), transparent 55%), radial-gradient(circle at 80% 40%, rgba(0,212,255,0.1), transparent 40%)",
        }}
      />
      <HubSiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-20 pt-10 sm:px-10">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-cyan">Directory</p>
        <h1 className="mt-3 font-display text-5xl tracking-wide text-off-white sm:text-6xl">
          HUBS
        </h1>
        <p className="mt-4 max-w-2xl font-body text-off-white/55">
          Every Create Hub community on this platform. An invite to one of these hubs does not
          include TriForge Hub — that network stays invite-only.
        </p>

        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-orange/30 bg-orange/10 px-5 py-4">
          <div>
            <p className="font-display text-2xl tracking-wide text-off-white">TriForge Hub</p>
            <p className="font-body text-sm text-off-white/50">
              hub.triforgemedia.com — Forge members only, separate invite
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/signin" className="font-body text-sm text-off-white/70 hover:text-cyan">
              Sign in
            </Link>
            <Link href="/apply" className="font-body text-sm text-orange">
              Apply
            </Link>
          </div>
        </div>

        {mine.length > 0 ? (
          <section className="mt-14">
            <p className="text-xs uppercase tracking-[0.3em] text-orange">Your hubs</p>
            <h2 className="mt-2 font-display text-3xl tracking-wide text-off-white">
              Invited or joined
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {mine.map((row) => (
                <li key={row.id}>
                  <Link
                    href={clientHubPublicUrl(row.clientHub.slug)}
                    className="glass block rounded-2xl p-5 transition hover:border-cyan/40"
                  >
                    <p className="font-display text-2xl tracking-wide text-off-white">
                      {row.clientHub.name}
                    </p>
                    <p className="mt-1 font-body text-sm text-off-white/45">
                      {row.clientHub.slug}.hub.triforgemedia.com
                    </p>
                    <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-cyan/80">
                      {row.status === "INVITED" ? "Invite pending" : "Joined"} · {row.role}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-14">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan">All hubs</p>
          <h2 className="mt-2 font-display text-3xl tracking-wide text-off-white">
            Communities on Create Hub
          </h2>
          {hubs.length === 0 ? (
            <p className="mt-6 font-body text-off-white/45">
              No client hubs yet. When TriForge stands one up, it will show here.
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {hubs.map((hub) => (
                <li key={hub.id}>
                  <Link
                    href={hub.href}
                    className="block rounded-2xl border border-off-white/10 px-5 py-5 transition hover:border-cyan/40"
                  >
                    <p className="font-display text-2xl tracking-wide text-off-white">{hub.name}</p>
                    <p className="mt-1 font-body text-sm text-off-white/45">{hub.host}</p>
                    <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-off-white/35">
                      {hub.provisioned ? "Live" : "Reserved"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <HubSiteFooter />
    </div>
  );
}
