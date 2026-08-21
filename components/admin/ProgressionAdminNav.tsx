import Link from "next/link";

const LINKS = [
  { href: "/admin/progression", label: "Overview" },
  { href: "/admin/progression/applications", label: "Applications" },
  { href: "/admin/progression/categories", label: "Categories" },
  { href: "/admin/progression/levels", label: "Levels" },
  { href: "/admin/progression/missions", label: "Missions" },
  { href: "/admin/progression/learn", label: "Learn" },
  { href: "/admin/progression/certs", label: "Certs" },
  { href: "/admin/progression/skills", label: "Skills" },
  { href: "/admin/progression/badges", label: "Badges" },
  { href: "/admin/progression/people", label: "People" },
];

export default function ProgressionAdminNav() {
  return (
    <nav className="mt-4 flex flex-wrap gap-2 font-body text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg border border-off-white/10 px-3 py-1 text-off-white/55 transition hover:border-cyan/40 hover:text-cyan"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
