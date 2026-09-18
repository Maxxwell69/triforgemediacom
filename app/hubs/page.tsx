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

/** Same 16:9 cover slot client hubs fill from Admin → Hub profile. */
const HUB0_DIRECTORY_IMAGE = "/hubs/hub-0.jpg";

function Hub0Card({ joined }: { joined?: boolean }) {
  const href = `${hub0PublicUrl()}/home`;
  return (
    <a href={href} className="glass block overflow-hidden rounded-2xl transition hover:border-cyan/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HUB0_DIRECTORY_IMAGE}
        alt="TriForge Media Community Hub"
        className="aspect-[16/9] w-full object-cover"
      />
      <div className="p-5">
        <p className="font-display text-2xl tracking-wide text-off-white">Hub 0</p>
        <p className="mt-1 font-body text-sm text-off-white/50">
          TriForge Hub · {hub0PublicHost()}
        </p>
        {joined ? (
          <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-cyan/80">
            Joined · Forge
          </p>
        ) : (
          <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-off-white/35">
            Live · Invite only
          </p>
        )}
      </div>
    </a>
  );
}

function ClientHubCard({
  name,
  host,
  href,
  description,
  imageUrl,
  status,
}: {
  name: string;
  host: string;
  href: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
}) {
  return (
    <a
      href={href}
      className="glass block overflow-hidden rounded-2xl transition hover:border-cyan/40"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
      ) : null}
      <div className="p-5">
        <p className="font-display text-2xl tracking-wide text-off-white">{name}</p>
        {description ? (
          <p className="mt-2 font-body text-sm text-off-white/60">{description}</p>
        ) : null}
        <p className="mt-1 font-body text-sm text-off-white/45">{host}</p>
        <p className="mt-3 font-body text-xs uppercase tracking-[0.2em] text-cyan/80">{status}</p>
      </div>
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
                  <ClientHubCard
                    name={row.clientHub.name}
                    host={`${row.clientHub.slug}.hub.triforgemedia.com`}
                    href={`${clientHubPublicUrl(row.clientHub.slug)}/home`}
                    description={row.clientHub.directoryDescription}
                    imageUrl={row.clientHub.directoryImageUrl}
                    status={`${row.status === "INVITED" ? "Invite pending" : "Joined"} · ${row.role}${
                      row.clientHub.directoryPublic ? "" : " · Private"
                    }`}
                  />
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
          {hubs.length === 0 ? (
            <p className="mt-6 font-body text-off-white/45">
              No other public Create Hub communities yet. Hub admins list theirs from
              Admin → Hub profile.
            </p>
          ) : null}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <li>
              <Hub0Card />
            </li>
            {hubs.map((hub) => (
              <li key={hub.id}>
                <ClientHubCard
                  name={hub.name}
                  host={hub.host}
                  href={hub.provisioned ? `${hub.href}/home` : hub.href}
                  description={hub.description}
                  imageUrl={hub.imageUrl}
                  status={hub.provisioned ? "Live" : "Reserved"}
                />
              </li>
            ))}
          </ul>
        </section>
      </main>

      <HubSiteFooter />
    </div>
  );
}
