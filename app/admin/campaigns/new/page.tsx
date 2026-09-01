import { prisma } from "@/lib/prisma";
import CampaignForm from "@/components/admin/CampaignForm";
import { createCampaign } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const [tags, groups, levels] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.progressionLevel.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        NEW <span className="text-gradient">CAMPAIGN</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Pick a trigger, optionally filter who it applies to, then add email and/or notification
        actions.
      </p>
      <CampaignForm
        action={createCampaign}
        tags={tags}
        groups={groups}
        levels={levels}
        submitLabel="Create campaign"
      />
    </main>
  );
}
