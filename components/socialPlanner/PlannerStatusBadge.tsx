import type { SocialPlannerItemStatus } from "@prisma/client";
import { plannerStatusLabel } from "@/lib/socialPlanner/labels";

const STYLES: Record<SocialPlannerItemStatus, string> = {
  DRAFT: "border-off-white/20 text-off-white/60",
  SCHEDULED: "border-cyan/40 text-cyan",
  PUBLISHING: "border-orange/40 text-orange",
  PUBLISHED: "border-emerald-400/40 text-emerald-300",
  FAILED: "border-red-400/40 text-red-300",
  CANCELED: "border-off-white/15 text-off-white/35",
};

export default function PlannerStatusBadge({ status }: { status: SocialPlannerItemStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 font-body text-[11px] uppercase tracking-wide ${STYLES[status]}`}
    >
      {plannerStatusLabel(status)}
    </span>
  );
}
