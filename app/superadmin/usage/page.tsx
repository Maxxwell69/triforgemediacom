import { headers } from "next/headers";
import { requireSuperAdminPage } from "@/lib/session";
import { loadCreateHubDataSheet } from "@/lib/hub/dataSheet";
import SuperAdminSubnav from "@/components/superadmin/SuperAdminSubnav";
import CreateHubDataSheetTable from "@/components/superadmin/CreateHubDataSheetTable";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function SuperAdminUsagePage() {
  await requireSuperAdminPage();
  const sheet = await loadCreateHubDataSheet();
  const pathname = headers().get("x-pathname") || "/superadmin/usage";

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
        Admin only · Create Hub
      </p>
      <h1 className="mt-1 font-display text-5xl tracking-wide">
        DATA <span className="text-gradient">SHEET</span>
      </h1>
      <p className="mt-2 max-w-2xl font-body text-sm text-off-white/55">
        Members on each hub, plus live kit use this month ({sheet.monthLabel}, UTC). Bandwidth is
        from the shared LiveKit Cloud project when Analytics is available — it attaches to the
        webinar rooms on that hub.
      </p>
      <SuperAdminSubnav pathname={pathname} />
      {sheet.livekit.note ? (
        <p className="mt-6 font-body text-xs text-off-white/45">{sheet.livekit.note}</p>
      ) : null}
      <div className="mt-6">
        <CreateHubDataSheetTable sheet={sheet} />
      </div>
    </main>
  );
}
