import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getControlPrisma, getTenantPrisma, pingTenantSchema } from "@/lib/hub/tenantPrisma";
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
    select: { name: true, slug: true, tenantDbAt: true, tenantDbName: true },
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
    let validEmail: string | null = null;
    if (token && hub.tenantDbName && canAuth) {
      const application = await getTenantPrisma(hub.tenantDbName).application.findUnique({
        where: { inviteToken: token },
        include: { user: true },
      });
      const isValid =
        !!application &&
        application.status === "APPROVED" &&
        application.user.status === "INVITED" &&
        (!application.inviteTokenExpiresAt || application.inviteTokenExpiresAt.getTime() > Date.now());
      if (isValid) validEmail = application.user.email;
    }

    return (
      <ClientHubShell name={hub.name} signInHref="/signin">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan">{hub.name}</p>
        <h1 className="mb-2 text-center font-display text-5xl tracking-wide sm:text-6xl">
          SET UP <span className="text-gradient">YOUR ACCOUNT</span>
        </h1>
        {validEmail && token ? (
          <>
            <p className="mb-8 max-w-md text-center font-body text-sm text-off-white/55">
              Choose a password for your {hub.name} admin login. This is not the TriForge Hub.
            </p>
            <ClientHubSignupForm token={token} email={validEmail} />
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
    return (
      <ClientHubShell name={hub.name}>
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan">Signed in</p>
        <h1 className="mb-3 text-center font-display text-5xl tracking-wide sm:text-6xl">
          YOU&apos;RE IN
        </h1>
        <p className="max-w-md text-center font-body text-sm text-off-white/55">
          {session.user.email} is the admin for {hub.name}. Your account lives in this hub’s
          own database. The full member app on this hostname is next — you will not land in
          the TriForge Hub from here.
        </p>
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
        {!hub.tenantDbAt
          ? "This hub is reserved. The database hasn’t been provisioned yet, so members can’t sign in."
          : canAuth
            ? "This community is private. Sign in with the invite your admin sent — you won’t land in the TriForge Hub from here."
            : "This hub is reserved, but the app couldn’t open its database yet. Ask TriForge to check provision."}
      </p>
    </ClientHubShell>
  );
}
