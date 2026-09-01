import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CampaignForm, { type CampaignFormInitial } from "@/components/admin/CampaignForm";
import { parseTriggerConfig } from "@/lib/campaigns/types";
import { deleteCampaign, updateCampaign } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      actions: { orderBy: { sortOrder: "asc" } },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 25,
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!campaign) notFound();

  const [tags, groups, levels] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.progressionLevel.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const config = parseTriggerConfig(campaign.triggerConfig);
  const initial: CampaignFormInitial = {
    name: campaign.name,
    description: campaign.description || "",
    enabled: campaign.enabled,
    triggerType: campaign.triggerType,
    days: config.days ? String(config.days) : "7",
    triggerTagId: config.tagId || "",
    triggerLevelId: config.levelId || "",
    audienceType: campaign.audienceType,
    audienceTagId: campaign.audienceTagId || "",
    audienceGroupId: campaign.audienceGroupId || "",
    audienceTrack: campaign.audienceTrack || "CN",
    oncePerUser: campaign.oncePerUser,
    actions: campaign.actions.map((a) => ({
      type: a.type,
      emailSubject: a.emailSubject || "",
      emailBodyText: a.emailBodyText || "",
      notifyTitle: a.notifyTitle || "",
      notifyBody: a.notifyBody || "",
      notifyHref: a.notifyHref || "",
    })),
  };

  async function save(formData: FormData) {
    "use server";
    formData.set("id", params.id);
    await updateCampaign(formData);
  }

  async function remove() {
    "use server";
    await deleteCampaign(params.id);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-body text-xs text-off-white/40">
        <Link href="/admin/campaigns" className="text-cyan hover:underline">
          Campaigns
        </Link>
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">
        EDIT <span className="text-gradient">CAMPAIGN</span>
      </h1>
      <CampaignForm
        action={save}
        tags={tags}
        groups={groups}
        levels={levels}
        initial={initial}
        submitLabel="Save campaign"
      />
      <form action={remove} className="mt-6">
        <button
          type="submit"
          className="font-body text-xs text-orange/80 hover:underline"
        >
          Delete campaign
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-xl tracking-wide text-off-white/85">Recent runs</h2>
        {campaign.runs.length === 0 ? (
          <p className="mt-3 font-body text-sm text-off-white/45">No one has matched this campaign yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {campaign.runs.map((run) => (
              <li
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-off-white/10 px-3 py-2 font-body text-sm"
              >
                <Link href={`/admin/users/${run.user.id}`} className="text-cyan hover:underline">
                  {run.user.name || run.user.email}
                </Link>
                <span className="text-xs text-off-white/40">
                  {run.status.toLowerCase()} · {run.createdAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
