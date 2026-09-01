import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { triggerLabel } from "@/lib/campaigns/types";
import { actionTypeLabel } from "@/lib/campaigns/engine";
import { setCampaignEnabled } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      actions: { orderBy: { sortOrder: "asc" }, select: { type: true } },
      _count: { select: { runs: true } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-wide">
            CAMP<span className="text-gradient">AIGNS</span>
          </h1>
          <p className="mt-2 max-w-2xl font-body text-off-white/60">
            GoHighLevel-style automations, kept to a trigger plus email or notification actions.
            No SMS, pipelines, or wait trees — timed triggers cover follow-ups.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white hover:brightness-110"
        >
          New campaign
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {campaigns.length === 0 ? (
          <p className="font-body text-sm text-off-white/45">
            No campaigns yet. Create one for first login, inactivity, go-live, or a level-up.
          </p>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/admin/campaigns/${campaign.id}`}
                  className="font-body text-base font-semibold text-off-white hover:text-cyan"
                >
                  {campaign.name}
                </Link>
                <p className="mt-1 font-body text-xs text-off-white/45">
                  {triggerLabel(campaign.triggerType)} ·{" "}
                  {campaign.actions.map((a) => actionTypeLabel(a.type)).join(", ") || "no actions"} ·{" "}
                  {campaign._count.runs} run{campaign._count.runs === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <form
                  action={async () => {
                    "use server";
                    await setCampaignEnabled(campaign.id, !campaign.enabled);
                  }}
                >
                  <button
                    type="submit"
                    className={`rounded-full border px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wide ${
                      campaign.enabled
                        ? "border-cyan/40 bg-cyan/10 text-cyan"
                        : "border-off-white/20 text-off-white/45"
                    }`}
                  >
                    {campaign.enabled ? "On" : "Off"}
                  </button>
                </form>
                <Link
                  href={`/admin/campaigns/${campaign.id}`}
                  className="font-body text-xs text-cyan hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
