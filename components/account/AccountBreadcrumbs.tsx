import Link from "next/link";

export type AccountCrumb = {
  label: string;
  href?: string;
};

type Props = {
  items: AccountCrumb[];
};

export default function AccountBreadcrumbs({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 font-body text-sm text-off-white/45">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/account" className="transition hover:text-cyan">
            Account
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              <span className="text-off-white/25" aria-hidden>
                /
              </span>
              {isLast || !item.href ? (
                <span className="text-off-white/70" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="transition hover:text-cyan">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
