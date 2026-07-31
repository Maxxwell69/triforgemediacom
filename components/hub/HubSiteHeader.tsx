import Link from "next/link";
import Logo from "@/components/Logo";

const links = [
  { href: "/#inside", label: "Inside the Hub" },
  { href: "/#programs", label: "Programs" },
  { href: "/updates", label: "Updates" },
  { href: "/apply", label: "Apply" },
];

export default function HubSiteHeader() {
  return (
    <header className="relative z-20 flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
      <Logo height={28} href="/" />
      <nav className="hidden items-center gap-6 font-body text-sm text-off-white/55 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition hover:text-off-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/signin"
          className="rounded-lg border border-off-white/15 px-3 py-2 font-body text-sm font-semibold text-off-white/90 transition hover:border-cyan/50 hover:text-cyan sm:px-4"
        >
          Sign in
        </Link>
        <Link
          href="/apply"
          className="rounded-lg bg-orange px-3 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 sm:px-4"
        >
          Apply
        </Link>
      </div>
    </header>
  );
}
