"use client";

import { useTransition } from "react";
import { setReceivesAdminAlerts } from "@/app/admin/users/actions";

export default function AdminAlertsToggle({
  userId,
  receivesAlerts,
}: {
  userId: string;
  receivesAlerts: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      title={
        receivesAlerts
          ? "Receives new-application alert emails — click to opt out"
          : "Opted out of alert emails — click to opt back in"
      }
      onClick={() =>
        startTransition(async () => {
          await setReceivesAdminAlerts(userId, !receivesAlerts);
        })
      }
      className={`rounded-lg border px-3 py-1 font-body text-xs transition disabled:opacity-60 ${
        receivesAlerts
          ? "border-off-white/15 text-off-white/70 hover:border-cyan/40 hover:text-cyan"
          : "border-off-white/10 text-off-white/30 hover:border-off-white/25 hover:text-off-white/50"
      }`}
    >
      {receivesAlerts ? "🔔 Alerts on" : "🔕 Alerts off"}
    </button>
  );
}
