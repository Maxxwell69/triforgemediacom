import Logo from "@/components/Logo";
import AdminNav from "@/components/AdminNav";
import SignOutButton from "@/components/SignOutButton";
import { requireAdminPage } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="min-h-screen">
      <header className="border-b border-off-white/10 px-4 py-3 sm:px-10 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Logo height={24} href="/home" />
          <SignOutButton />
        </div>
        <div className="mt-3">
          <AdminNav />
        </div>
      </header>
      {children}
    </div>
  );
}
