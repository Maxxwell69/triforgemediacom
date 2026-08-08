"use client";

import { useTransition } from "react";
import { reviewGroupApplication } from "@/app/admin/groups/actions";

type AppRow = {
  id: string;
  message: string | null;
  createdAt: Date | string;
  user: { id: string; name: string | null; email: string };
};

export default function GroupApplicationsPanel({ applications }: { applications: AppRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (applications.length === 0) {
    return <p className="font-body text-sm text-off-white/40">No pending applications.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((app) => (
        <div
          key={app.id}
          className="flex flex-col gap-2 rounded-lg border border-off-white/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-body text-sm text-off-white">{app.user.name || app.user.email}</p>
            <p className="font-body text-xs text-off-white/40">{app.user.email}</p>
            {app.message && (
              <p className="mt-1 font-body text-xs text-off-white/60">{app.message}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await reviewGroupApplication(app.id, "APPROVED");
                })
              }
              className="rounded-lg bg-cyan/90 px-3 py-1 font-body text-xs font-semibold text-charcoal disabled:opacity-40"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await reviewGroupApplication(app.id, "REJECTED");
                })
              }
              className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
