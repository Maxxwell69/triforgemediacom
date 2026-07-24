import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(253,72,2,0.18), transparent 60%), radial-gradient(circle at 80% 80%, rgba(0,212,255,0.14), transparent 55%)",
        }}
      />

      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <p className="mb-6 rounded-full border border-off-white/10 bg-off-white/5 px-4 py-1 text-sm font-body text-off-white/70">
          Invite-only creator community
        </p>
        <Logo height={72} href={null} priority className="sm:hidden" />
        <Logo height={110} href={null} priority className="hidden sm:block" />
        <h1 className="mt-4 font-display text-4xl leading-none tracking-wide text-off-white/80 sm:text-5xl">
          COMMUNITY
        </h1>
        <p className="mt-6 max-w-md text-balance font-body text-off-white/70">
          Real-time chat, daily task guidance, and everything TriForge Media
          creators need to grow — in one place.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/apply"
            className="rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Apply for access
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-off-white/15 px-8 py-3 font-body font-semibold text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
