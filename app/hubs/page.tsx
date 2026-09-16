import type { Metadata } from "next";
import HubSiteHeader from "@/components/hub/HubSiteHeader";
import HubSiteFooter from "@/components/hub/HubSiteFooter";
import { auth } from "@/lib/auth";
import {
  clientHubPublicUrl,
  hub0PublicUrl,
  hub0PublicHost,
  listDirectoryHubs,
  listMyHubMemberships,
  userHasForgeHubAccess,
} from "@/lib/hub/directory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hubs directory — TriForge",
  description: "Communities running on Create Hub — open a hub you were invited to, or browse the directory.",
};

function Hub0Card({
  featured,
  joined,
}: {
  featured?: boolean;
  joined?: boolean;
}) {
  const href = `${hub0PublicUrl()}/home`;
  const className = featured
    ? "flex items-center justify-between gap-4 rounded-2xl border border-orange/30 bg-orange/10 px-5 py-4 transition hover:border-orange/60"
    : "glass block rounded-2xl p-5 transition hover:border-cyan/40";

  return (
    <a href={href} className={className}>
      <div>
        <p className="font-display text-2xl tracking-wide text-off-white">Hub 0</p>
        <p className="font-body text-sm text-off-white/50">
          TriForge Hub · {hub0PublicHost()}
        </p>
        {joined ? (
          <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-cyan/80">
            Joined · Forge
          </p>
        ) : featured ? null : (
          <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-off-white/35">
            Live · Invite only
          </p>
        )}
      </div>
      {featured ? (
        <span className="shrink-0 font-body text-sm font-semibold text-orange">Open Hub 0</span>
      ) : null}
    </a>
  );
}

export default async function HubsDirectoryPage() {
  const [hubs, session] = await Promise.all([listDirectoryHubs(), auth()]);
  const userId = session?.user?.id;
  const [mine, forgeAccess] = userId
    ? await Promise.all([listMyHubMemberships(userId), userHasForgeHubAccess(userId)])
    : [[], false];
  const showMine = forgeAccess || mine.length > 0;

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
          Hub 0 is TriForge Hub. Client communities sit beside it — an invite to one of those
          does not include Forge access.
        </p>

        <div className="mt-8">
          <Hub0Card featured joined={forgeAccess} />
        </div>

        {showMine ? (
          <section className="mt-14">
            <p className="text-xs uppercase tracking-[0.3em] text-orange">Your hubs</p>
            <h2 className="mt-2 font-display text-3xl tracking-wide text-off-white">
              Invited or joined
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {forgeAccess ? (
                <li>
                  <Hub0Card joined />
                </li>
              ) : null}
              {mine.map((row) => (
                <li key={row.id}>
                  <a
                    href={`${clientHubPublicUrl(row.clientHub.slug)}/home`}
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
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-14">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan">All hubs</p>
          <h2 className="mt-2 font-display text-3xl tracking-wide text-off-white">
            Communities
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <li>
              <a
                href={`${hub0PublicUrl()}/home`}
                className="block rounded-2xl border border-orange/25 px-5 py-5 transition hover:border-orange/50"
              >
                <p className="font-display text-2xl tracking-wide text-off-white">Hub 0</p>
                <p className="mt-1 font-body text-sm text-off-white/45">{hub0PublicHost()}</p>
                <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-off-white/35">
                  Live · Invite only
                </p>
              </a>
            </li>
            {hubs.map((hub) => (
              <li key={hub.id}>
                <a
                  href={hub.provisioned ? `${hub.href}/home` : hub.href}
                  className="block rounded-2xl border border-off-white/10 px-5 py-5 transition hover:border-cyan/40"
                >
                  <p className="font-display text-2xl tracking-wide text-off-white">{hub.name}</p>
                  <p className="mt-1 font-body text-sm text-off-white/45">{hub.host}</p>
                  <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-off-white/35">
                    {hub.provisioned ? "Live" : "Reserved"}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <HubSiteFooter />
    </div>
  );
}
