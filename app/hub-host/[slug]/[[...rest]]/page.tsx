import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { clientHubPublicHost } from "@/lib/hub/host";
import { getControlPrisma, pingTenantSchema } from "@/lib/hub/tenantPrisma";
import { findHubInviteByToken } from "@/lib/hub/membership";
import ClientHubSignInForm, { ClientHubShell } from "@/components/hub/ClientHubGate";
import ClientHubSignupForm from "@/components/hub/ClientHubSignupForm";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string; rest?: string[] };
  searchParams?: { token?: string; welcome?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hub = await getControlPrisma().clientHub.findUnique({
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

export default async function ClientHubHostPage({ params, searchParams }: Props) {
  const rest = params.rest ?? [];
  const isSignIn = rest[0] === "signin" || rest[0] === "login";
  const isSignup = rest[0] === "signup";
  const session = await auth();

  const hub = await getControlPrisma().clientHub.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, tenantDbAt: true, tenantDbName: true },
  });

  const tenantReady = !!(hub?.tenantDbName && hub.tenantDbAt);
  const tenantPing = tenantReady && hub.tenantDbName ? await pingTenantSchema(hub.tenantDbName) : null;
  const canAuth = !!(tenantPing?.ok);

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

  if (isSignup) {
    const token = searchParams?.token;
    const invite = token && canAuth ? await findHubInviteByToken(token, hub.id) : null;
    const hasPassword = !!invite?.user.passwordHash;

    return (
      <ClientHubShell name={hub.name} signInHref="/signin">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan">{hub.name}</p>
        <h1 className="mb-2 text-center font-display text-5xl tracking-wide sm:text-6xl">
          {hasPassword ? (
            <>
              JOIN <span className="text-gradient">{hub.name.toUpperCase()}</span>
            </>
          ) : (
            <>
              SET UP <span className="text-gradient">YOUR ACCOUNT</span>
            </>
          )}
        </h1>
        {invite && token && hasPassword ? (
          <p className="max-w-md text-center font-body text-sm text-off-white/55">
            {invite.user.email} already has a login. Sign in with that password to join {hub.name}.
            You will not land in the TriForge Hub unless you also have access there.
          </p>
        ) : invite && token ? (
          <>
            <p className="mb-8 max-w-md text-center font-body text-sm text-off-white/55">
              Choose a password once. The same login will work on any other hub that invites you.
            </p>
            <ClientHubSignupForm token={token} email={invite.user.email} />
          </>
        ) : (
          <p className="max-w-md text-center font-body text-sm text-off-white/55">
            This invite link is invalid, expired, or has already been used.
          </p>
        )}
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
          {!hub.tenantDbAt
            ? `${hub.name} is reserved, but its database isn’t provisioned yet.`
            : canAuth
              ? `Sign in to ${hub.name}. This login is not the TriForge Hub.`
              : `${hub.name} has a database on file, but the app couldn’t open it yet.`}
        </p>
        <ClientHubSignInForm
          hubName={hub.name}
          enabled={canAuth}
          welcome={searchParams?.welcome === "1"}
        />
      </ClientHubShell>
    );
  }

  if (session?.user) {
    redirect(`https://${clientHubPublicHost(hub.slug)}/home`);
  }

  return (
    <ClientHubShell name={hub.name}>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan">Welcome</p>
      <h1 className="mb-3 text-center font-display text-5xl tracking-wide sm:text-6xl">
        {hub.name.toUpperCase()}
      </h1>
      <p className="mb-8 max-w-md text-center font-body text-sm text-off-white/55">
        {!hub.tenantDbAt
          ? "This hub is reserved. The database hasn’t been provisioned yet, so members can’t sign in."
          : canAuth
            ? "This hub is live and private. Sign in if you were invited. Admins invite members from Admin → Users."
            : "This hub is reserved, but the app couldn’t open its database yet. Ask TriForge to check provision."}
      </p>
      {canAuth ? (
        <ClientHubSignInForm hubName={hub.name} enabled />
      ) : null}
    </ClientHubShell>
  );
}
