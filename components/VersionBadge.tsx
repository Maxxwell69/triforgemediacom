import Link from "next/link";
import { APP_VERSION } from "@/lib/version";

/**
 * Fixed-position so it never disrupts a page's own height/flex layout (e.g.
 * full-height chat views) — sits quietly in the corner on every page,
 * including public ones, since it's rendered once from the root layout.
 * Links to the public changelog so anyone can see what's live.
 */
export default function VersionBadge() {
  return (
    <Link
      href="/updates"
      className="fixed bottom-1.5 right-2 z-40 font-body text-[10px] text-off-white/25 transition hover:text-off-white/55 print:hidden"
      title="View updates & version history"
    >
      v{APP_VERSION}
    </Link>
  );
}
