import Link from "next/link";
import { hubHas } from "@/lib/hub/modules";
import {
  BUILTIN_MENU_BY_ID,
  isExternalMenuHref,
  type SiteMenuItem,
} from "@/lib/siteMenu";
import HubBugNavLink from "@/components/HubBugNavLink";
import SupportNavLink from "@/components/support/SupportNavLink";
import SuggestionNavLink from "@/components/suggestions/SuggestionNavLink";

const NAV =
  "rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90";
const LIVE =
  "rounded-lg px-3 py-1.5 font-body text-sm text-orange/90 transition hover:bg-orange/10 hover:text-orange";
const NESTED =
  "rounded-lg py-1.5 pl-6 pr-3 font-body text-sm text-off-white/45 transition hover:bg-off-white/5 hover:text-off-white/75";

export type MemberMenuGates = {
  canMenu: (id: string) => boolean;
  showMyProjects: boolean;
  personalTasksAccess: boolean;
  showProgress: boolean;
  tikTaskAccess: boolean;
  hubBugUnread: number;
  supportUnread: number;
  suggestionUnread: number;
  unreadNotifications: number;
};

function builtinVisible(id: string, gates: MemberMenuGates): boolean {
  const def = BUILTIN_MENU_BY_ID.get(id);
  if (!def) return false;
  if (!gates.canMenu(def.id)) return false;
  if (def.sku && !hubHas(def.sku)) return false;
  switch (def.gate) {
    case "projects":
      return gates.showMyProjects;
    case "personalTasks":
      return gates.personalTasksAccess;
    case "progress":
      return gates.showProgress;
    case "tiktask":
      return gates.tikTaskAccess;
    default:
      return true;
  }
}

export default function MemberMenu({
  items,
  gates,
}: {
  items: SiteMenuItem[];
  gates: MemberMenuGates;
}) {
  return (
    <div className="mb-4 border-t border-off-white/10 pt-4">
      <p className="mb-2 px-3 font-body text-[11px] font-semibold uppercase tracking-wider text-off-white/35">
        Menu
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          if (!item.enabled) return null;

          if (item.kind === "custom") {
            const href = item.href;
            if (!href) return null;
            if (isExternalMenuHref(href)) {
              return (
                <a
                  key={item.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={NAV}
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link key={item.id} href={href} className={NAV}>
                {item.label}
              </Link>
            );
          }

          if (!builtinVisible(item.id, gates)) return null;
          const def = BUILTIN_MENU_BY_ID.get(item.id);
          if (!def) return null;
          const label = item.label || def.label;

          if (item.id === "hubBug") {
            return <HubBugNavLink key={item.id} initialCount={gates.hubBugUnread} label={label} />;
          }
          if (item.id === "support") {
            return <SupportNavLink key={item.id} initialCount={gates.supportUnread} label={label} />;
          }
          if (item.id === "suggestions") {
            return (
              <SuggestionNavLink
                key={item.id}
                initialCount={gates.suggestionUnread}
                label={label}
              />
            );
          }
          if (item.id === "notifications") {
            return (
              <Link
                key={item.id}
                href={def.href}
                className="flex items-center justify-between rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
              >
                {label}
                {gates.unreadNotifications > 0 ? (
                  <span className="rounded-full bg-orange px-1.5 font-body text-[10px] font-semibold text-off-white">
                    {gates.unreadNotifications > 99 ? "99+" : gates.unreadNotifications}
                  </span>
                ) : null}
              </Link>
            );
          }

          const className = def.accent === "live" ? LIVE : def.accent === "nested" ? NESTED : NAV;
          return (
            <Link key={item.id} href={def.href} className={className}>
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
