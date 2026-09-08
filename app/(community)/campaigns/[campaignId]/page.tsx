import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import {
  canJoinHubCampaign,
  canSeeHubCampaign,
  getUserCampaignAudience,
  hubCampaignCategoryMeta,
  hubCampaignMemberSelect,
  hubCampaignStatusLabel,
  requireHubCampaignsModule,
} from "@/lib/hubCampaigns";
import { getMemberAvatarUrl, getMemberDisplayName, getMemberInitial } from "@/lib/memberDisplay";
import MemberAvatar from "@/components/MemberAvatar";
import LocalWhen from "@/components/LocalWhen";
import { joinHubCampaign, leaveHubCampaign, toggleHubCampaignTask } from "../actions";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  requireHubCampaignsModule();
  const { user } = await requireProfile();
  const isAdmin = isAdminRole(user.role);
  const audience = await getUserCampaignAudience(user.id);

  const campaign = await prisma.hubCampaign.findUnique({
    where: { id: params.campaignId },
    include: {
      audienceTag: { select: { name: true, color: true } },
      audienceBadge: { select: { name: true } },
      signups: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: hubCampaignMemberSelect } },
      },
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          assignee: { select: hubCampaignMemberSelect },
        },
      },
    },
  });

  if (!campaign) notFound();

  const mySignup = campaign.signups.find((s) => s.userId === user.id);
  if (
    !canSeeHubCampaign(campaign, {
      isAdmin,
      signedUp: !!mySignup,
      audience,
    })
  ) {
    notFound();
  }

  const canJoin = canJoinHubCampaign(campaign, {
    isAdmin,
    signedUp: !!mySignup,
    signupCount: campaign.signups.length,
    audience,
  });
  const canLeave = !!mySignup && (campaign.status === "OPEN" || isAdmin);
  const canToggleTasks = isAdmin || !!mySignup;
  const meta = hubCampaignCategoryMeta(campaign.category);
  const doneCount = campaign.tasks.filter((t) => t.status === "DONE").length;
  const campaignId = campaign.id;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/campaigns"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
        >
          ← All campaigns
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-off-white/10 px-2 py-0.5 font-body text-xs text-off-white/60">
                {meta.icon} {meta.label}
              </span>
              <span
                className={`rounded px-2 py-0.5 font-body text-xs uppercase tracking-wide ${
                  campaign.status === "OPEN"
                    ? "bg-cyan/15 text-cyan"
                    : "bg-off-white/10 text-off-white/50"
                }`}
              >
                {hubCampaignStatusLabel(campaign.status)}
              </span>
            </div>
            <h1 className="mt-2 font-display text-5xl tracking-wide text-off-white">
              {campaign.title}
            </h1>
            {campaign.startsAt && (
              <p className="mt-2 font-body text-off-white/60">
                <LocalWhen
                  startsAt={campaign.startsAt.toISOString()}
                  endsAt={campaign.endsAt?.toISOString() ?? null}
                />
              </p>
            )}
            {campaign.location && (
              <p className="mt-1 font-body text-sm text-off-white/50">{campaign.location}</p>
            )}
            {isAdmin && (
              <p className="mt-2 font-body text-xs text-off-white/40">
                Audience:{" "}
                {campaign.audienceType === "TAG"
                  ? campaign.audienceTag?.name || "Tag"
                  : campaign.audienceType === "BADGE"
                    ? campaign.audienceBadge?.name || "Badge"
                    : "Everyone"}
                {" · "}
                <Link href={`/admin/hub-campaigns/${campaign.id}`} className="text-cyan hover:underline">
                  Edit
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {canJoin && (
              <form
                action={async () => {
                  "use server";
                  await joinHubCampaign(campaignId);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110"
                >
                  Sign up
                </button>
              </form>
            )}
            {canLeave && (
              <form
                action={async () => {
                  "use server";
                  await leaveHubCampaign(campaignId);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-off-white/20 px-5 py-2 font-body text-sm text-off-white/70 transition hover:bg-off-white/5"
                >
                  Leave
                </button>
              </form>
            )}
            {mySignup && !canLeave && (
              <span className="rounded-lg bg-orange/20 px-4 py-2 font-body text-sm font-semibold text-orange">
                You&apos;re in
              </span>
            )}
          </div>
        </div>

        <section className="glass mt-8 rounded-2xl p-6">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">
            What we need to do
          </h2>
          {campaign.description ? (
            <p className="mt-3 whitespace-pre-wrap font-body text-sm text-off-white/75">
              {campaign.description}
            </p>
          ) : (
            <p className="mt-3 font-body text-sm text-off-white/40">
              No brief yet. Check the list below.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {campaign.tasks.length === 0 ? (
              <p className="font-body text-sm text-off-white/40">No tasks posted yet.</p>
            ) : (
              <>
                <p className="font-body text-xs text-off-white/40">
                  {doneCount}/{campaign.tasks.length} done
                </p>
                {campaign.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-xl border border-off-white/10 px-3 py-3"
                  >
                    {canToggleTasks ? (
                      <form
                        action={async () => {
                          "use server";
                          await toggleHubCampaignTask(task.id);
                        }}
                      >
                        <button
                          type="submit"
                          aria-label={task.status === "DONE" ? "Mark to do" : "Mark done"}
                          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                            task.status === "DONE"
                              ? "border-cyan bg-cyan text-charcoal"
                              : "border-off-white/30 text-transparent"
                          }`}
                        >
                          ✓
                        </button>
                      </form>
                    ) : (
                      <span
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                          task.status === "DONE"
                            ? "border-cyan bg-cyan text-charcoal"
                            : "border-off-white/30"
                        }`}
                      >
                        {task.status === "DONE" ? "✓" : ""}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p
                        className={`font-body text-sm font-medium ${
                          task.status === "DONE"
                            ? "text-off-white/45 line-through"
                            : "text-off-white"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-1 font-body text-xs text-off-white/50">
                          {task.description}
                        </p>
                      )}
                      {task.assignee && (
                        <p className="mt-1 font-body text-xs text-off-white/40">
                          Assigned to {getMemberDisplayName(task.assignee)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        <section className="glass mt-6 rounded-2xl p-6">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">
            Who&apos;s involved
          </h2>
          <p className="mt-1 font-body text-xs text-off-white/40">
            {campaign.signups.length}
            {campaign.capacity != null ? ` / ${campaign.capacity}` : ""} signed up
          </p>
          {campaign.signups.length === 0 ? (
            <p className="mt-4 font-body text-sm text-off-white/40">
              Nobody has signed up yet. Be the first.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {campaign.signups.map((signup) => (
                <li key={signup.id} className="flex items-center gap-3 rounded-lg px-1 py-1">
                  <MemberAvatar
                    avatarUrl={getMemberAvatarUrl(signup.user)}
                    initial={getMemberInitial(signup.user)}
                    size={36}
                    textSize="text-sm"
                  />
                  <span className="truncate font-body text-sm text-off-white">
                    {getMemberDisplayName(signup.user)}
                    {signup.userId === user.id ? " (you)" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
