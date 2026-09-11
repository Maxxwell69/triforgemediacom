import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import {
  HUB_CAMPAIGN_CATEGORIES,
  hubCampaignCategoryMeta,
  hubCampaignStatusLabel,
  listVisibleHubCampaigns,
  requireHubCampaignsModule,
} from "@/lib/hubCampaigns";
import LocalWhen from "@/components/LocalWhen";
import type { HubCampaignCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const CATEGORY_VALUES = new Set<string>(HUB_CAMPAIGN_CATEGORIES.map((c) => c.value));

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  requireHubCampaignsModule();
  const { user } = await requireProfile();
  const campaigns = await listVisibleHubCampaigns(user.id, user.role);
  const selected =
    searchParams.category && CATEGORY_VALUES.has(searchParams.category)
      ? (searchParams.category as HubCampaignCategory)
      : null;

  const filtered = selected
    ? campaigns.filter((c) => c.category === selected)
    : campaigns;
  const open = filtered.filter((c) => c.status === "OPEN" || c.status === "DRAFT");
  const closed = filtered.filter((c) => c.status === "CLOSED");
  const isAdmin = isAdminRole(user.role);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl tracking-wide">
              CAMP<span className="text-gradient">AIGNS</span>
            </h1>
            <p className="mt-2 font-body text-off-white/60">
              Sign up for interviews, meetings, games, and battles. Interview campaigns show
              the time, network, and booked spots after you sign up.
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/hub-campaigns"
              className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/15"
            >
              Manage
            </Link>
          )}
        </div>

        <div className="glass mt-8 overflow-hidden rounded-2xl border border-off-white/10">
          <div className="flex flex-wrap gap-1 border-b border-off-white/10 bg-off-white/[0.03] p-2">
            <CategoryTab href="/campaigns" active={!selected} label="All" />
            {HUB_CAMPAIGN_CATEGORIES.map((cat) => (
              <CategoryTab
                key={cat.value}
                href={`/campaigns?category=${cat.value}`}
                active={selected === cat.value}
                label={`${cat.icon} ${cat.label}`}
              />
            ))}
          </div>

          <div className="flex flex-col gap-8 p-5">
            {filtered.length === 0 ? (
              <p className="py-8 text-center font-body text-off-white/50">
                {selected
                  ? "Nothing in this category right now."
                  : "No campaigns are open for you yet."}
              </p>
            ) : (
              <>
                {open.length > 0 && (
                  <section>
                    <h2 className="font-display text-2xl tracking-wide text-off-white/80">
                      Open
                    </h2>
                    <div className="mt-3 flex flex-col gap-3">
                      {open.map((campaign) => (
                        <CampaignCard
                          key={campaign.id}
                          campaign={campaign}
                          joined={campaign.signups.length > 0}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {closed.length > 0 && (
                  <section>
                    <h2 className="font-display text-2xl tracking-wide text-off-white/50">
                      Closed
                    </h2>
                    <div className="mt-3 flex flex-col gap-3">
                      {closed.map((campaign) => (
                        <CampaignCard
                          key={campaign.id}
                          campaign={campaign}
                          joined={campaign.signups.length > 0}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function CategoryTab({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-wide transition ${
        active
          ? "bg-orange/20 text-orange"
          : "text-off-white/50 hover:bg-off-white/5 hover:text-off-white/80"
      }`}
    >
      {label}
    </Link>
  );
}

function CampaignCard({
  campaign,
  joined,
}: {
  campaign: {
    id: string;
    title: string;
    description: string | null;
    category: HubCampaignCategory;
    status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
    startsAt: Date | null;
    endsAt: Date | null;
    capacity: number | null;
    _count: { signups: number; tasks: number };
  };
  joined: boolean;
}) {
  const meta = hubCampaignCategoryMeta(campaign.category);
  const full =
    campaign.capacity != null && campaign._count.signups >= campaign.capacity;

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="rounded-xl border border-off-white/10 bg-charcoal/40 p-4 transition hover:border-cyan/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-body text-lg font-semibold text-off-white">{campaign.title}</h3>
            <span className="rounded bg-off-white/10 px-2 py-0.5 font-body text-xs text-off-white/60">
              {meta.icon} {meta.label}
            </span>
            <span
              className={`rounded px-2 py-0.5 font-body text-xs uppercase tracking-wide ${
                campaign.status === "OPEN"
                  ? "bg-cyan/15 text-cyan"
                  : campaign.status === "DRAFT"
                    ? "bg-off-white/10 text-off-white/50"
                    : "bg-off-white/10 text-off-white/45"
              }`}
            >
              {hubCampaignStatusLabel(campaign.status)}
            </span>
            {joined && (
              <span className="rounded bg-orange/20 px-2 py-0.5 font-body text-xs text-orange">
                You&apos;re in
              </span>
            )}
            {full && campaign.status === "OPEN" && !joined && (
              <span className="rounded bg-off-white/10 px-2 py-0.5 font-body text-xs text-off-white/50">
                Full
              </span>
            )}
          </div>
          {campaign.startsAt && (
            <p className="mt-1 font-body text-xs text-off-white/50">
              <LocalWhen
                startsAt={campaign.startsAt.toISOString()}
                endsAt={campaign.endsAt?.toISOString() ?? null}
              />
            </p>
          )}
          {campaign.description && (
            <p className="mt-2 line-clamp-2 font-body text-sm text-off-white/70">
              {campaign.description}
            </p>
          )}
          <p className="mt-2 font-body text-xs text-off-white/40">
            {campaign._count.signups}
            {campaign.capacity != null ? `/${campaign.capacity}` : ""} involved ·{" "}
            {campaign._count.tasks} to-do
            {campaign._count.tasks === 1 ? "" : "s"}
          </p>
        </div>
        <span className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white">
          {joined ? "Open" : campaign.status === "OPEN" && !full ? "Sign up" : "View"}
        </span>
      </div>
    </Link>
  );
}
