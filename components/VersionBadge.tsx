import { APP_VERSION } from "@/lib/version";

/**
 * Fixed-position so it never disrupts a page's own height/flex layout (e.g.
 * full-height chat views) — sits quietly in the corner on every page,
 * including public ones, since it's rendered once from the root layout.
 */
export default function VersionBadge() {
  return (
    <span
      className="pointer-events-none fixed bottom-1.5 right-2 z-40 select-none font-body text-[10px] text-off-white/25 print:hidden"
      aria-hidden="true"
    >
      v{APP_VERSION}
    </span>
  );
}
