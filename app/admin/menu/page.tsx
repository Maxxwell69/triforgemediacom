import { getSiteMenuItems } from "@/lib/siteMenu.server";
import { clientSlugFromHeaders } from "@/lib/hub/requestHost";
import MenuLineupEditor from "@/components/admin/MenuLineupEditor";

export const dynamic = "force-dynamic";

export default async function AdminMenuLineupPage() {
  const items = await getSiteMenuItems();
  const slug = clientSlugFromHeaders();
  const hubLabel = slug ? `this hub (${slug})` : "Hub 0";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        MENU <span className="text-gradient">LINEUP</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/50">
        Organize the member sidebar Menu for {hubLabel}. Each hub has its own lineup — check the
        items you want, nest rows under a parent, and add custom links that open in a new tab or
        the same window.
      </p>
      <MenuLineupEditor initialItems={items} />
    </main>
  );
}
