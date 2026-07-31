import Link from "next/link";
import Logo from "@/components/Logo";

export default function HubSiteFooter() {
  return (
    <footer className="relative z-10 border-t border-off-white/10 px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo height={22} href="/" />
          <p className="mt-3 max-w-sm font-body text-sm text-off-white/40">
            TriForge Hub — the invite-only home base for creators in the Forge
            network.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-body text-sm text-off-white/45">
          <Link href="/signin" className="transition hover:text-cyan">
            Sign in
          </Link>
          <Link href="/apply" className="transition hover:text-cyan">
            Apply
          </Link>
          <Link href="/updates" className="transition hover:text-cyan">
            Updates
          </Link>
          <Link href="/privacy" className="transition hover:text-cyan">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-cyan">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
