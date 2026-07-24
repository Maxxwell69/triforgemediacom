import Logo from "@/components/Logo";
import AdminNav from "@/components/AdminNav";
import SignOutButton from "@/components/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-off-white/10 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-8">
          <Logo height={24} />
          <AdminNav />
        </div>
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
