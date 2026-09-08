import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  audienceWhere,
  hubCampaignCategoryMeta,
  hubCampaignMemberSelect,
  requireHubCampaignsModule,
} from "@/lib/hubCampaigns";
import {
  archiveHubCampaign,
  createHubCampaignTask,
  deleteHubCampaignTask,
  setHubCampaignSignup,
  setHubCampaignTaskStatus,
  updateHubCampaign,
  updateHubCampaignTask,
} from "../actions";
import HubCampaignForm from "@/components/admin/HubCampaignForm";
import { getMemberDisplayName } from "@/lib/memberDisplay";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none focus:border-cyan/60";

export default async function AdminHubCampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  requireHubCampaignsModule();

  const [campaign, tags, badges] = await Promise.all([
    prisma.hubCampaign.findUnique({
      where: { id: params.campaignId },
      include: {
        audienceTag: { select: { id: true, name: true } },
        audienceBadge: { select: { id: true, name: true } },
        signups: {
          orderBy: { joinedAt: "asc" },
          include: { user: { select: hubCampaignMemberSelect } },
        },
        tasks: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.badge.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!campaign) notFound();

  const eligibleUsers = await prisma.user.findMany({
    where: audienceWhere(campaign),
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true },
  });

  const signedUpIds = new Set(campaign.signups.map((s) => s.userId));
  const notSignedUp = eligibleUsers.filter((u) => !signedUpIds.has(u.id));
  const campaignId = campaign.id;
  const meta = hubCampaignCategoryMeta(campaign.category);

  async function archiveAction() {
    "use server";
    await archiveHubCampaign(campaignId);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/hub-campaigns"
        className="font-body text-sm text-off-white/50 transition hover:text-off-white"
      >
        ← All hub campaigns
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-wide text-gradient">{campaign.title}</h1>
      <p className="mt-2 font-body text-sm text-off-white/40">
        {meta.icon} {meta.label} · {campaign.signups.length}
        {campaign.capacity != null ? `/${campaign.capacity}` : ""} signed up ·{" "}
        {eligibleUsers.length} eligible
      </p>
      <p className="mt-2">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="font-body text-sm text-cyan hover:underline"
        >
          View member page →
        </Link>
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Settings</h2>
        <div className="glass mt-4 rounded-2xl p-6">
          <HubCampaignForm
            action={updateHubCampaign}
            tags={tags}
            badges={badges}
            campaignId={campaign.id}
            submitLabel="Save campaign"
            initial={{
              title: campaign.title,
              description: campaign.description ?? "",
              category: campaign.category,
              status: campaign.status,
              startsAtIso: campaign.startsAt?.toISOString() ?? null,
              endsAtIso: campaign.endsAt?.toISOString() ?? null,
              location: campaign.location ?? "",
              audienceType: campaign.audienceType,
              audienceTagId: campaign.audienceTagId ?? "",
              audienceBadgeId: campaign.audienceBadgeId ?? "",
              capacity: campaign.capacity != null ? String(campaign.capacity) : "",
            }}
          />
          <form action={archiveAction} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-orange/40 px-4 py-2 font-body text-sm font-semibold text-orange"
            >
              Archive
            </button>
          </form>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Who&apos;s involved</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Members can also sign up themselves from the campaign window.
        </p>
        <div className="glass mt-4 flex flex-col gap-4 rounded-2xl p-6">
          {notSignedUp.length > 0 && (
            <form
              action={async (formData) => {
                "use server";
                const userId = String(formData.get("userId") || "");
                if (userId) await setHubCampaignSignup(campaignId, userId, true);
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <select name="userId" required className={fieldClass}>
                <option value="">Add an eligible member</option>
                {notSignedUp.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal"
              >
                Add
              </button>
            </form>
          )}

          {campaign.signups.length === 0 ? (
            <p className="font-body text-sm text-off-white/40">Nobody has signed up yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {campaign.signups.map((signup) => (
                <li
                  key={signup.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-off-white/10 px-3 py-2"
                >
                  <span className="font-body text-sm text-off-white">
                    {getMemberDisplayName(signup.user)}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await setHubCampaignSignup(campaignId, signup.userId, false);
                    }}
                  >
                    <button
                      type="submit"
                      className="font-body text-xs text-orange hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">What we need to do</h2>
        <div className="glass mt-4 rounded-2xl p-6">
          <form
            action={async (formData) => {
              "use server";
              await createHubCampaignTask(campaignId, formData);
            }}
            className="flex flex-col gap-3"
          >
            <input name="title" required placeholder="Task title" className={fieldClass} />
            <textarea
              name="description"
              rows={2}
              placeholder="Optional details"
              className={fieldClass}
            />
            <select name="assigneeId" defaultValue="" className={fieldClass}>
              <option value="">Unassigned</option>
              {campaign.signups.map((signup) => (
                <option key={signup.userId} value={signup.userId}>
                  {getMemberDisplayName(signup.user)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="self-start rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal"
            >
              Add task
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {campaign.tasks.length === 0 && (
            <p className="glass rounded-xl p-4 font-body text-sm text-off-white/40">
              No tasks yet. Add what this campaign needs to get done.
            </p>
          )}
          {campaign.tasks.map((task) => (
            <div key={task.id} className="glass flex flex-col gap-2 rounded-xl p-4">
              <form
                action={async (formData) => {
                  "use server";
                  await updateHubCampaignTask(task.id, formData);
                }}
                className="flex flex-col gap-2"
              >
                <input name="title" defaultValue={task.title} required className={fieldClass} />
                <textarea
                  name="description"
                  defaultValue={task.description ?? ""}
                  rows={2}
                  className={fieldClass}
                />
                <select
                  name="assigneeId"
                  defaultValue={task.assigneeId ?? ""}
                  className={fieldClass}
                >
                  <option value="">Unassigned</option>
                  {campaign.signups.map((signup) => (
                    <option key={signup.userId} value={signup.userId}>
                      {getMemberDisplayName(signup.user)}
                    </option>
                  ))}
                  {task.assignee && !signedUpIds.has(task.assignee.id) && (
                    <option value={task.assignee.id}>
                      {task.assignee.name || task.assignee.email}
                    </option>
                  )}
                </select>
                <button
                  type="submit"
                  className="self-start rounded-lg bg-cyan/90 px-3 py-2 font-body text-xs font-semibold text-charcoal"
                >
                  Save
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-2">
                <form
                  action={async () => {
                    "use server";
                    await setHubCampaignTaskStatus(
                      task.id,
                      task.status === "DONE" ? "TODO" : "DONE"
                    );
                  }}
                >
                  <button
                    type="submit"
                    className={`rounded-lg border px-3 py-2 font-body text-xs font-semibold ${
                      task.status === "DONE"
                        ? "border-cyan/40 bg-cyan/10 text-cyan"
                        : "border-off-white/20 text-off-white/60"
                    }`}
                  >
                    {task.status === "DONE" ? "Done" : "Mark done"}
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await deleteHubCampaignTask(task.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-lg border border-orange/30 px-3 py-2 font-body text-xs font-semibold text-orange"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
