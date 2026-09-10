import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSocialPlannerModule } from "@/lib/socialPlanner/module";
import PlannerComposeForm from "@/components/socialPlanner/PlannerComposeForm";
import { createPlannerItemAction } from "../actions";

export const dynamic = "force-dynamic";

function privacyOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export default async function NewSocialPlannerItemPage() {
  requireSocialPlannerModule();
  const accounts = await prisma.socialPlannerAccount.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-body text-xs text-off-white/40">
        <Link href="/admin/social-planner" className="text-cyan hover:underline">
          Social Planner
        </Link>{" "}
        / New
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">
        NEW <span className="text-gradient">POST</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Videos publish to the connected TikTok account at the scheduled time. LIVE rows are reminders
        only.
      </p>

      <div className="glass mt-8 rounded-2xl p-6">
        <PlannerComposeForm
          action={createPlannerItemAction}
          accounts={accounts.map((a) => ({
            id: a.id,
            username: a.username,
            nickname: a.nickname,
            privacyLevelOptions: privacyOptions(a.privacyLevelOptions),
            commentDisabled: a.commentDisabled,
            duetDisabled: a.duetDisabled,
            stitchDisabled: a.stitchDisabled,
          }))}
        />
      </div>
    </main>
  );
}
