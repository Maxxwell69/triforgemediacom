import Link from "next/link";

export default function SuperAdminSubnav({ pathname }: { pathname: string }) {
  const hubsActive = pathname.startsWith("/superadmin") && !pathname.startsWith("/superadmin/usage");
  const sheetActive = pathname.startsWith("/superadmin/usage");

  return (
    <div className="mt-6 flex gap-2">
      <Link
        href="/superadmin"
        className={`rounded-lg px-3 py-1.5 font-body text-sm transition ${
          hubsActive
            ? "bg-off-white/10 text-off-white"
            : "text-off-white/50 hover:text-off-white/80"
        }`}
      >
        Hubs
      </Link>
      <Link
        href="/superadmin/usage"
        className={`rounded-lg px-3 py-1.5 font-body text-sm transition ${
          sheetActive
            ? "bg-off-white/10 text-off-white"
            : "text-off-white/50 hover:text-off-white/80"
        }`}
      >
        Data sheet
      </Link>
    </div>
  );
}
