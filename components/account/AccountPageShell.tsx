import type { ReactNode } from "react";
import AccountBreadcrumbs, { type AccountCrumb } from "./AccountBreadcrumbs";

type Props = {
  title: ReactNode;
  description?: string;
  crumbs?: AccountCrumb[];
  children: ReactNode;
};

export default function AccountPageShell({
  title,
  description,
  crumbs,
  children,
}: Props) {
  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        {crumbs && crumbs.length > 0 ? <AccountBreadcrumbs items={crumbs} /> : null}
        <h1 className="font-display text-5xl tracking-wide">{title}</h1>
        {description ? (
          <p className="mt-2 font-body text-off-white/60">{description}</p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
