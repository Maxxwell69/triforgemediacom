import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSocialPlannerModule } from "@/lib/socialPlanner/module";
import { accountHandle, plannerKindLabel } from "@/lib/socialPlanner/labels";
import PlannerComposeForm from "@/components/socialPlanner/PlannerComposeForm";
import PlannerItemButtons from "@/components/socialPlanner/PlannerItemButtons";
import PlannerStatusBadge from "@/components/socialPlanner/PlannerStatusBadge";
import LocalWhen from "@/components/LocalWhen";
import { updatePlannerItemAction } from "../actions";

export const dynamic = "force-dynamic";

function privacyOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export default async function SocialPlannerItemPage({
  params,
}: {
  params: { itemId: string };
}) {
  requireSocialPlannerModule();
  const item = await prisma.socialPlannerItem.findUnique({
    where: { id: params.itemId },
    include: {
      account: true,
      attempts: { orderBy: { startedAt: "desc" }, take: 8 },
      calendarEvent: { select: { id: true, title: true } },
    },
  });
  if (!item) notFound();

  const accounts = await prisma.socialPlannerAccount.findMany({ orderBy: { createdAt: "asc" } });
  const locked = item.status === "PUBLISHING" || item.status === "PUBLISHED" || item.status === "CANCELED";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-body text-xs text-off-white/40">
        <Link href="/admin/social-planner" className="text-cyan hover:underline">
          Social Planner
        </Link>{" "}
        / {plannerKindLabel(item.kind)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl tracking-wide text-off-white">
          {item.title || item.caption || "Untitled"}
        </h1>
        <PlannerStatusBadge status={item.status} />
      </div>
      <p className="mt-2 font-body text-sm text-off-white/50">
        {accountHandle(item.account)}
        {item.scheduledAt ? (
          <>
            {" · "}
            <LocalWhen startsAt={item.scheduledAt.toISOString()} />
          </>
        ) : null}
      </p>
      {item.tiktokShareUrl && (
        <p className="mt-2 font-body text-sm">
          <a href={item.tiktokShareUrl} className="text-cyan hover:underline" target="_blank" rel="noreferrer">
            Open on TikTok
          </a>
        </p>
      )}
      {item.lastError && (
        <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 font-body text-sm text-red-200">
          {item.lastError}
        </p>
      )}
      {item.kind === "LIVE" && (
        <p className="mt-3 font-body text-xs text-off-white/45">
          LIVE cannot be started from the hub. A reminder email goes out about an hour before. If
          tik.tools sees this account go live near the scheduled time, the row is marked published.
          {item.calendarEvent ? ` Hub calendar: ${item.calendarEvent.title}.` : ""}
        </p>
      )}

      <div className="mt-6">
        <PlannerItemButtons
          itemId={item.id}
          canCancel={item.status === "DRAFT" || item.status === "SCHEDULED" || item.status === "FAILED"}
          canRetry={
            (item.kind === "VIDEO" || item.kind === "PHOTO") &&
            (item.status === "FAILED" || item.status === "DRAFT" || item.status === "SCHEDULED")
          }
        />
      </div>

      {!locked ? (
        <div className="glass mt-8 rounded-2xl p-6">
          <PlannerComposeForm
            action={updatePlannerItemAction}
            accounts={accounts.map((a) => ({
              id: a.id,
              username: a.username,
              nickname: a.nickname,
              privacyLevelOptions: privacyOptions(a.privacyLevelOptions),
              commentDisabled: a.commentDisabled,
              duetDisabled: a.duetDisabled,
              stitchDisabled: a.stitchDisabled,
            }))}
            defaults={{
              id: item.id,
              accountId: item.accountId,
              kind: item.kind,
              caption: item.caption,
              title: item.title,
              privacyLevel: item.privacyLevel,
              disableComment: item.disableComment,
              disableDuet: item.disableDuet,
              disableStitch: item.disableStitch,
              scheduledAtIso: item.scheduledAt?.toISOString() ?? null,
              mediaR2Key: item.mediaR2Key,
              mediaUrl: item.mediaUrl,
              mediaMime: item.mediaMime,
              mediaBytes: item.mediaBytes,
              calendarEventId: item.calendarEventId,
              consentGiven: Boolean(item.consentGivenAt),
            }}
          />
        </div>
      ) : (
        <div className="glass mt-8 rounded-2xl p-6 font-body text-sm text-off-white/60">
          <p>{item.caption || "No caption."}</p>
          {item.mediaUrl && item.kind !== "LIVE" && (
            <p className="mt-3 truncate text-xs text-off-white/40">{item.mediaUrl}</p>
          )}
        </div>
      )}

      {item.attempts.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">Publish attempts</h2>
          <ul className="mt-3 space-y-2">
            {item.attempts.map((attempt) => (
              <li key={attempt.id} className="glass rounded-xl p-3 font-body text-xs text-off-white/55">
                <LocalWhen startsAt={attempt.startedAt.toISOString()} />
                {attempt.rawStatus ? ` · ${attempt.rawStatus}` : ""}
                {attempt.ok ? " · ok" : ""}
                {attempt.error ? ` · ${attempt.error}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
