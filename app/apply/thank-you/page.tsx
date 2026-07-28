import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TikTokNetworkCTA from "./TikTokNetworkCTA";
import { TIKTOK_CREATOR_NETWORK_INVITE_LINK } from "@/lib/tiktokNetwork";

export default async function ApplyThankYouPage({
  searchParams,
}: {
  searchParams: { track?: string; aid?: string };
}) {
  const track = searchParams.track === "cn" ? "cn" : "mn";
  const applicationId = searchParams.aid || null;

  let firstName: string | null = null;
  if (applicationId) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { user: { select: { name: true } } },
    });
    firstName = application?.user.name?.split(" ")[0] || null;
  }

  const greeting = firstName ? `Thanks, ${firstName}!` : "Thanks for applying!";

  if (track === "mn") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="glass max-w-md rounded-2xl p-10 text-center">
          <h1 className="font-display text-4xl tracking-wide text-gradient">YOU&apos;RE IN!</h1>
          <p className="mt-4 font-body text-off-white/70">
            {greeting} Since you&apos;re already represented by an agency, we&apos;ve gone ahead
            and approved you into the TriForge Hub &mdash; check your email for a link to set up
            your login and get started.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-lg border border-off-white/15 px-6 py-2 font-body text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
            APPLICATION <span className="text-gradient">SENT</span>
          </h1>
          <p className="mt-3 font-body text-off-white/60">
            {greeting} We review every application by hand &mdash; you&apos;ll hear back by email
            once a decision is made.
          </p>
        </div>

        <div className="glass mt-10 rounded-2xl p-8">
          <span className="inline-block rounded-full border border-orange/40 bg-orange/10 px-3 py-1 font-body text-xs font-semibold text-orange">
            One more step
          </span>
          <h2 className="mt-4 font-display text-3xl tracking-wide sm:text-4xl">
            JOIN THE <span className="text-gradient">TRIFORGE CREATOR NETWORK</span> ON TIKTOK
          </h2>
          <p className="mt-3 font-body leading-relaxed text-off-white/70">
            TriForge invites you to join our Creator Network &mdash; TikTok&apos;s official program
            for LIVE hosts and creators backed by an agency. It unlocks LIVE perks, priority
            support, and better monetization.
          </p>

          <p className="mt-5 font-body text-sm font-semibold text-off-white/80">
            Here&apos;s exactly what happens:
          </p>
          <ol className="mt-3 flex flex-col gap-3 font-body text-sm leading-relaxed text-off-white/70">
            <li>
              <strong className="text-off-white/90">1. Tap the button below.</strong> It opens
              TikTok and starts your application to join our network &mdash; you may see us
              listed as{" "}
              <strong className="text-off-white/90">&ldquo;Forge Creator Network&rdquo;</strong>{" "}
              in there.
            </li>
            <li>
              <strong className="text-off-white/90">2. Submit it in the TikTok app.</strong> Our
              team gets notified the moment your application comes in.
            </li>
            <li>
              <strong className="text-off-white/90">3. We&apos;ll send you a contract</strong>{" "}
              right there in TikTok. Once you accept it, you&apos;re officially part of the
              TikTok Creator Network.
            </li>
          </ol>
          <p className="mt-4 font-body leading-relaxed text-off-white/70">
            Good news: you don&apos;t have to wait on any of that for us. Tapping the button below
            also gets you straight into the{" "}
            <strong className="text-off-white/90">TriForge Hub</strong> right now &mdash; you&apos;ll
            get an email to set up your login so you can start the &ldquo;Joining the Creator
            Network&rdquo; course while the TikTok side plays out.
          </p>

          <TikTokNetworkCTA
            applicationId={applicationId}
            inviteLink={TIKTOK_CREATOR_NETWORK_INVITE_LINK}
          />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="font-body text-sm text-off-white/50 transition hover:text-cyan"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
