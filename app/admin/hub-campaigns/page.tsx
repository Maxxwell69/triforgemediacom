import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireHubCampaignsModule, hubCampaignCategoryMeta, hubCampaignStatusLabel } from "@/lib/hubCampaigns";
import { createHubCampaign } from "./actions";
import HubCampaignForm from "@/components/admin/HubCampaignForm";

export const dynamic = "force-dynamic";

export default async function AdminHubCampaignsPage() {
  requireHubCampaignsModule();

  const [campaigns, tags, badges] = await Promise.all([
    prisma.hubCampaign.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      include: {
        audienceTag: { select: { name: true } },
        audienceBadge: { select: { name: true } },
        _count: { select: { signups: true, tasks: true } },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.badge.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        HUB <span className="text-gradient">CAMPAIGNS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Interviews, meetings, games, and battles. Target a tag or badge, then members sign up
        from the campaign window.
      </p>

      <div className="glass mt-8 rounded-2xl p-6">
        <h2 className="mb-4 font-display text-xl tracking-wide text-off-white/80">New campaign</h2>
        <HubCampaignForm
          action={createHubCampaign}
          tags={tags}
          badges={badges}
          submitLabel="Create campaign"
        />
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {campaigns.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No campaigns yet.
          </p>
        )}
        {campaigns.map((campaign) => {
          const meta = hubCampaignCategoryMeta(campaign.category);
          const audience =
            campaign.audienceType === "TAG"
              ? campaign.audienceTag?.name || "Tag"
              : campaign.audienceType === "BADGE"
                ? campaign.audienceBadge?.name || "Badge"
                : "Everyone";
          return (
            <Link
              key={campaign.id}
              href={`/admin/hub-campaigns/${campaign.id}`}
              className="glass flex items-center justify-between gap-4 rounded-xl p-4 transition hover:border-cyan/30"
            >
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-medium text-off-white">
                  {meta.icon} {campaign.title}
                </p>
                <p className="truncate font-body text-xs text-off-white/40">
                  {meta.label} · {hubCampaignStatusLabel(campaign.status)} · {audience} ·{" "}
                  {campaign._count.signups}
                  {campaign.capacity != null ? `/${campaign.capacity}` : ""} signed up ·{" "}
                  {campaign._count.tasks} tasks
                </p>
              </div>
              <span className="font-body text-sm text-off-white/40">→</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
