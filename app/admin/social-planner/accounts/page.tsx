import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSocialPlannerModule } from "@/lib/socialPlanner/module";
import { isTikTokConfigured } from "@/lib/tiktokOAuth";
import { accountHandle, plannerPrivacyLabel } from "@/lib/socialPlanner/labels";
import PlannerAccountButtons from "@/components/socialPlanner/PlannerAccountButtons";

export const dynamic = "force-dynamic";

function privacyOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export default async function SocialPlannerAccountsPage({
  searchParams,
}: {
  searchParams: { tiktok?: string; tiktok_message?: string };
}) {
  requireSocialPlannerModule();
  const accounts = await prisma.socialPlannerAccount.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { items: true } } },
  });
  const configured = isTikTokConfigured();
  const flash =
    searchParams.tiktok === "connected"
      ? "TikTok posting account connected."
      : searchParams.tiktok === "error"
        ? searchParams.tiktok_message || "Could not connect TikTok."
        : null;
  const flashError = searchParams.tiktok === "error";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-body text-xs text-off-white/40">
        <Link href="/admin/social-planner" className="text-cyan hover:underline">
          Social Planner
        </Link>{" "}
        / Accounts
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">
        TIKTOK <span className="text-gradient">ACCOUNTS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Connect TikTok accounts this hub can publish to. This is separate from member Login Kit
        stats. You need Content Posting API + <code className="text-cyan">video.publish</code> on
        the TikTok developer app, then an app audit before posts can be public.
      </p>

      {flash && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 font-body text-sm ${
            flashError ? "border border-red-400/30 bg-red-400/10 text-red-200" : "border border-cyan/30 bg-cyan/10 text-cyan"
          }`}
        >
          {flash}
        </p>
      )}

      <div className="glass mt-8 rounded-2xl p-6">
        {!configured ? (
          <p className="font-body text-sm text-off-white/55">
            Set <code className="text-cyan">TIKTOK_CLIENT_KEY</code> and{" "}
            <code className="text-cyan">TIKTOK_CLIENT_SECRET</code>, then register{" "}
            <code className="text-cyan">/api/tiktok/publish/callback</code> on the TikTok app.
          </p>
        ) : (
          <a
            href="/api/tiktok/publish/connect"
            className="inline-flex rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow"
          >
            Connect TikTok for posting
          </a>
        )}
        <p className="mt-3 font-body text-xs text-off-white/40">
          Until TikTok audits the app, Direct Post is forced to private / only-me. LIVE cannot be
          started from here.
        </p>
      </div>

      <section className="mt-8 flex flex-col gap-3">
        {accounts.length === 0 && (
          <p className="font-body text-sm text-off-white/40">No posting accounts connected yet.</p>
        )}
        {accounts.map((account) => (
          <div key={account.id} className="glass flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-body text-sm font-medium text-off-white">{accountHandle(account)}</p>
              <p className="font-body text-xs text-off-white/40">
                {account._count.items} planned items
                {privacyOptions(account.privacyLevelOptions).length > 0
                  ? ` · ${privacyOptions(account.privacyLevelOptions).map(plannerPrivacyLabel).join(", ")}`
                  : ""}
              </p>
            </div>
            <PlannerAccountButtons accountId={account.id} />
          </div>
        ))}
      </section>
    </main>
  );
}
