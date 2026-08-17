import Link from "next/link";
import Logo from "@/components/Logo";
import SignOutButton from "@/components/SignOutButton";
import { requireSuperAdminPage } from "@/lib/session";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdminPage();

  return (
    <div className="min-h-screen">
      <header className="border-b border-off-white/10 px-4 py-3 sm:px-10 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Logo height={24} href="/home" />
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-body text-sm text-off-white/50 hover:text-off-white"
            >
              Admin
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
