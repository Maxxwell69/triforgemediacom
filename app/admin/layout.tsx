import Logo from "@/components/Logo";
import AdminNav from "@/components/AdminNav";
import SignOutButton from "@/components/SignOutButton";
import { requireAdminPage } from "@/lib/session";
import { ADMIN_NAV_SECTIONS, filterAdminNavSections } from "@/lib/adminNav";
import { hubHas } from "@/lib/hub/modules";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  const sections = filterAdminNavSections(ADMIN_NAV_SECTIONS, hubHas);

  return (
    <div className="min-h-screen">
      <header className="border-b border-off-white/10 px-4 py-3 sm:px-10 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Logo height={24} href="/home" />
          <SignOutButton />
        </div>
        <div className="mt-3">
          <AdminNav sections={sections} showCreateHub={user.role === "ADMIN"} />
        </div>
      </header>
      {children}
    </div>
  );
}
