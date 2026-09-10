import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSocialPlannerModule } from "@/lib/socialPlanner/module";
import { accountHandle, plannerKindLabel } from "@/lib/socialPlanner/labels";
import PlannerWeek from "@/components/socialPlanner/PlannerWeek";
import PlannerStatusBadge from "@/components/socialPlanner/PlannerStatusBadge";
import LocalWhen from "@/components/LocalWhen";

export const dynamic = "force-dynamic";

export default async function AdminSocialPlannerPage() {
  requireSocialPlannerModule();

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  const [accounts, weekItems, queue] = await Promise.all([
    prisma.socialPlannerAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, username: true, nickname: true },
    }),
    prisma.socialPlannerItem.findMany({
      where: {
        scheduledAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000), lt: weekEnd },
        status: { not: "CANCELED" },
      },
      orderBy: { scheduledAt: "asc" },
      include: { account: { select: { username: true, nickname: true } } },
    }),
    prisma.socialPlannerItem.findMany({
      where: { status: { in: ["DRAFT", "FAILED", "SCHEDULED", "PUBLISHING"] } },
      orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { updatedAt: "desc" }],
      take: 40,
      include: { account: { select: { username: true, nickname: true } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-wide">
            SOCIAL <span className="text-gradient">PLANNER</span>
          </h1>
          <p className="mt-2 max-w-2xl font-body text-off-white/60">
            Schedule TikTok videos and LIVE reminders for accounts this hub admin connected. Videos
            publish through TikTok&apos;s Content Posting API. LIVE cannot be started via API — we
            remind you and detect when the account goes live.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/social-planner/accounts"
            className="rounded-lg border border-off-white/20 px-4 py-2 font-body text-sm text-off-white/80"
          >
            Accounts ({accounts.length})
          </Link>
          <Link
            href="/admin/social-planner/new"
            className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow"
          >
            New post
          </Link>
        </div>
      </div>

      {accounts.length === 0 && (
        <p className="glass mt-8 rounded-xl p-6 font-body text-sm text-off-white/55">
          Connect a TikTok account with posting permission first.{" "}
          <Link href="/admin/social-planner/accounts" className="text-cyan hover:underline">
            Open accounts
          </Link>
        </p>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">This week</h2>
        <div className="mt-4">
          <PlannerWeek
            items={weekItems.map((item) => ({
              id: item.id,
              kind: item.kind,
              status: item.status,
              caption: item.caption,
              title: item.title,
              scheduledAt: item.scheduledAt?.toISOString() ?? null,
              handle: accountHandle(item.account),
            }))}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Queue</h2>
        <div className="mt-4 flex flex-col gap-2">
          {queue.length === 0 && (
            <p className="glass rounded-xl p-6 text-center font-body text-sm text-off-white/40">
              No drafts, scheduled posts, or failures.
            </p>
          )}
          {queue.map((item) => (
            <Link
              key={item.id}
              href={`/admin/social-planner/${item.id}`}
              className="glass flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-body text-sm font-medium text-off-white">
                  <span className="mr-2 text-xs text-cyan">{plannerKindLabel(item.kind)}</span>
                  {item.title || item.caption || "Untitled"}
                </p>
                <p className="font-body text-xs text-off-white/40">
                  {accountHandle(item.account)}
                  {item.scheduledAt ? (
                    <>
                      {" · "}
                      <LocalWhen startsAt={item.scheduledAt.toISOString()} />
                    </>
                  ) : (
                    " · No time set"
                  )}
                </p>
                {item.lastError && (
                  <p className="mt-1 font-body text-xs text-red-300">{item.lastError}</p>
                )}
              </div>
              <PlannerStatusBadge status={item.status} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
