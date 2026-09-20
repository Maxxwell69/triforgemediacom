import type { ReactNode } from "react";
import Link from "next/link";
import { hubHas } from "@/lib/hub/modules";
import {
  BUILTIN_MENU_BY_ID,
  isExternalMenuHref,
  menuChildren,
  menuRoots,
  type SiteMenuItem,
} from "@/lib/siteMenu";
import HubBugNavLink from "@/components/HubBugNavLink";
import SupportNavLink from "@/components/support/SupportNavLink";
import SuggestionNavLink from "@/components/suggestions/SuggestionNavLink";
import MemberMenuDropdown from "@/components/MemberMenuDropdown";

const NAV =
  "flex w-full items-center rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90";
const LIVE =
  "flex w-full items-center rounded-lg px-3 py-1.5 font-body text-sm text-orange/90 transition hover:bg-orange/10 hover:text-orange";
const NESTED =
  "flex w-full items-center rounded-lg py-1.5 pl-2 pr-3 font-body text-sm text-off-white/45 transition hover:bg-off-white/5 hover:text-off-white/75";

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

function wrapNested(nested: boolean, node: ReactNode) {
  if (!nested) return node;
  return <div className="w-full">{node}</div>;
}

function CustomMenuLink({ item, nested }: { item: SiteMenuItem; nested: boolean }) {
  const href = item.href;
  if (!href) return null;
  const className = nested ? NESTED : NAV;
  if (item.newTab) {
    return (
      <a key={item.id} href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
      </a>
    );
  }
  if (isExternalMenuHref(href)) {
    return (
      <a key={item.id} href={href} className={className}>
        {item.label}
      </a>
    );
  }
  return (
    <Link key={item.id} href={href} className={className}>
      {item.label}
    </Link>
  );
}

function MenuRow({
  item,
  nested,
  gates,
}: {
  item: SiteMenuItem;
  nested: boolean;
  gates: MemberMenuGates;
}) {
  if (!item.enabled) return null;

  if (item.kind === "custom") {
    return <CustomMenuLink item={item} nested={nested} />;
  }

  if (!builtinVisible(item.id, gates)) return null;
  const def = BUILTIN_MENU_BY_ID.get(item.id);
  if (!def) return null;
  const label = item.label || def.label;
  const className = nested ? NESTED : def.accent === "live" ? LIVE : NAV;

  if (item.id === "hubBug") {
    return wrapNested(nested, <HubBugNavLink initialCount={gates.hubBugUnread} label={label} />);
  }
  if (item.id === "support") {
    return wrapNested(nested, <SupportNavLink initialCount={gates.supportUnread} label={label} />);
  }
  if (item.id === "suggestions") {
    return wrapNested(
      nested,
      <SuggestionNavLink initialCount={gates.suggestionUnread} label={label} />
    );
  }
  if (item.id === "notifications") {
    return (
      <Link
        href={def.href}
        className={`flex w-full items-center justify-between ${nested ? NESTED : NAV}`}
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

  return (
    <Link href={def.href} className={className}>
      {label}
    </Link>
  );
}

export default function MemberMenu({
  items,
  gates,
}: {
  items: SiteMenuItem[];
  gates: MemberMenuGates;
}) {
  const roots = menuRoots(items);

  function visibleChildren(parent: SiteMenuItem) {
    return menuChildren(items, parent.id).filter((child) => {
      if (!child.enabled) return false;
      if (child.kind === "custom") return Boolean(child.href);
      return builtinVisible(child.id, gates);
    });
  }

  function parentShown(item: SiteMenuItem) {
    if (!item.enabled) return false;
    if (item.kind === "custom") return Boolean(item.href);
    return builtinVisible(item.id, gates);
  }

  return (
    <div className="mb-4 border-t border-off-white/10 pt-4">
      <p className="mb-2 px-3 font-body text-[11px] font-semibold uppercase tracking-wider text-off-white/35">
        Menu
      </p>
      <div className="flex w-full flex-col gap-0.5">
        {roots.map((root) => {
          const kids = visibleChildren(root);
          const showRoot = parentShown(root);
          if (!showRoot && kids.length === 0) return null;
          const childRows = kids.map((child) => (
            <MenuRow key={child.id} item={child} nested={showRoot} gates={gates} />
          ));
          if (showRoot && kids.length > 0) {
            return (
              <MemberMenuDropdown key={root.id} parent={<MenuRow item={root} nested={false} gates={gates} />}>
                {childRows}
              </MemberMenuDropdown>
            );
          }
          return (
            <div key={root.id} className="flex w-full flex-col">
              {showRoot ? <MenuRow item={root} nested={false} gates={gates} /> : null}
              {childRows}
            </div>
          );
        })}
      </div>
    </div>
  );
}
