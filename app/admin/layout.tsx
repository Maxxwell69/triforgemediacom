import Logo from "@/components/Logo";
import AdminNav from "@/components/AdminNav";
import SignOutButton from "@/components/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-off-white/10 px-4 py-3 sm:px-10 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Logo height={24} />
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
