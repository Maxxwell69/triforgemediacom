import Link from "next/link";

export default function WebinarJoinChooser({
  webinarId,
  title,
  status,
}: {
  webinarId: string;
  title: string;
  status: string;
}) {
  const live = status === "LIVE";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <Link
          href={`/webinars/${webinarId}`}
          className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
        >
          ← Back
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-wide text-off-white">{title}</h1>
        <p className="mt-2 font-body text-off-white/60">
          {live ? "This webinar is live." : "Lobby is open."} How do you want to join?
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/webinars/${webinarId}/room?as=host`}
            className="rounded-2xl border border-orange/40 bg-orange/10 p-5 transition hover:bg-orange/15"
          >
            <p className="font-display text-xl tracking-wide text-orange">Join as host</p>
            <p className="mt-2 font-body text-sm text-off-white/70">
              Publish camera/mic, start or end the session, and invite members on stage.
            </p>
          </Link>

          <Link
            href={`/webinars/${webinarId}/room?as=watch`}
            className="rounded-2xl border border-cyan/30 bg-cyan/10 p-5 transition hover:bg-cyan/15"
          >
            <p className="font-display text-xl tracking-wide text-cyan">Watch &amp; chat</p>
            <p className="mt-2 font-body text-sm text-off-white/70">
              Join as audience — watch the stage and use chat. No camera or mic.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
