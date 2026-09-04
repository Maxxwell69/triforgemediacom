import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ClientHubSignInForm, { ClientHubShell } from "@/components/hub/ClientHubGate";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string; rest?: string[] };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hub = await prisma.clientHub.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  if (!hub) {
    return {
      title: "Hub not found",
      description: "No community is set up at this address.",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${hub.name}`,
    description: `Private sign-in for ${hub.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function ClientHubHostPage({ params }: Props) {
  const rest = params.rest ?? [];
  const isSignIn = rest[0] === "signin" || rest[0] === "login";

  const hub = await prisma.clientHub.findUnique({
    where: { slug: params.slug },
    select: { name: true, slug: true, tenantDbAt: true },
  });

  if (!hub) {
    return (
      <ClientHubShell name="Hub">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-off-white/35">Not found</p>
        <h1 className="mb-3 text-center font-display text-5xl tracking-wide">
          THIS HUB <span className="text-gradient">ISN&apos;T HERE</span>
        </h1>
        <p className="max-w-md text-center font-body text-sm text-off-white/55">
          No community is set up at this address. If you followed a link, ask the person who
          sent it to confirm the URL.
        </p>
      </ClientHubShell>
    );
  }

  if (isSignIn) {
    return (
      <ClientHubShell name={hub.name}>
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan">{hub.name}</p>
        <h1 className="mb-2 text-center font-display text-5xl tracking-wide sm:text-6xl">
          SIGN <span className="text-gradient">IN</span>
        </h1>
        <p className="mb-8 max-w-md text-center font-body text-sm text-off-white/55">
          {hub.tenantDbAt
            ? `Member access for ${hub.name}. This login is not the TriForge Hub. Invites are next.`
            : `${hub.name} is reserved, but its database isn’t provisioned yet. Sign-in will open after that.`}
        </p>
        <ClientHubSignInForm hubName={hub.name} />
      </ClientHubShell>
    );
  }

  return (
    <ClientHubShell name={hub.name} signInHref="/signin">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan">Welcome</p>
      <h1 className="mb-3 text-center font-display text-5xl tracking-wide sm:text-6xl">
        {hub.name.toUpperCase()}
      </h1>
      <p className="mb-8 max-w-md text-center font-body text-sm text-off-white/55">
        {hub.tenantDbAt
          ? "This community is private. Sign-in will use this hub’s own database — not the TriForge Hub."
          : "This hub is reserved. The database hasn’t been provisioned yet, so members can’t sign in."}
      </p>
    </ClientHubShell>
  );
}
