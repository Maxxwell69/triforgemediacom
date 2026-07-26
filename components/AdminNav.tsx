"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/tasks", label: "Task Templates" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/channels", label: "Channels" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/social", label: "Company Social" },
  { href: "/admin/moderation", label: "Moderation Log" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex max-w-full gap-1 overflow-x-auto whitespace-nowrap font-body text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map((link) => {
        const isActive =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 transition ${
              isActive
                ? "bg-off-white/10 text-off-white"
                : "text-off-white/50 hover:text-off-white/80"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
