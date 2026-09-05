import Link from "next/link";
import type { SuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { requireSupportModule } from "@/lib/supportReads";
import { markSuggestionsRead } from "@/lib/suggestionReads";
import {
  SUGGESTION_STATUSES,
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_SORT_ORDER,
} from "@/lib/suggestions";
import SuggestionForm from "@/components/suggestions/SuggestionForm";
import SuggestionCard from "@/components/suggestions/SuggestionCard";
import { createSuggestionAction } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS = ["ALL", ...SUGGESTION_STATUSES] as const;

function parseFilter(raw: string | undefined): (typeof FILTERS)[number] {
  if (raw && (FILTERS as readonly string[]).includes(raw)) {
    return raw as (typeof FILTERS)[number];
  }
  return "ALL";
}

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams?: { filter?: string; submitted?: string; ticket?: string; error?: string };
}) {
  requireSupportModule();
  const { user } = await requireProfile();
  await markSuggestionsRead(user.id).catch(() => {});
  const filter = parseFilter(searchParams?.filter);

  const suggestions = await prisma.suggestion.findMany({
    where: filter === "ALL" ? undefined : { status: filter as SuggestionStatus },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { socialLinks: true, username: true, showRealName: true } },
          tiktokConnection: { select: { displayName: true, avatarUrl: true } },
          tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
        },
      },
    },
  });

  suggestions.sort((a, b) => {
    const statusDiff =
      (SUGGESTION_STATUS_SORT_ORDER[a.status] ?? 99) -
      (SUGGESTION_STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl tracking-wide">
          HUB <span className="text-gradient">SUGGESTIONS</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Pitch ideas for the hub. The board shows how staff tagged each one.
        </p>

        {searchParams?.submitted === "1" && (
          <p className="mt-4 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
            Thanks — {searchParams.ticket ? <span className="font-semibold">{searchParams.ticket}</span> : "your suggestion"}{" "}
            is logged as New.
          </p>
        )}

        <div className="mt-8">
          <SuggestionForm action={createSuggestionAction} error={searchParams?.error} />
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <FilterChip href="/suggestions" active={filter === "ALL"} label="All" />
          {SUGGESTION_STATUSES.map((status) => (
            <FilterChip
              key={status}
              href={`/suggestions?filter=${status}`}
              active={filter === status}
              label={SUGGESTION_STATUS_LABELS[status]}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {suggestions.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
              No suggestions{filter === "ALL" ? " yet" : " with this tag"}.
            </p>
          )}
          {suggestions.map((item) => (
            <SuggestionCard
              key={item.id}
              suggestion={{
                ticketNumber: item.ticketNumber,
                title: item.title,
                description: item.description,
                status: item.status,
                adminNotes: item.adminNotes,
                createdAt: item.createdAt,
                authorName: getMemberDisplayName(item.author),
                authorId: item.author.id,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function FilterChip({
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
      className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition ${
        active
          ? "border-cyan/50 bg-cyan/15 text-cyan"
          : "border-off-white/15 text-off-white/50 hover:border-off-white/30 hover:text-off-white/80"
      }`}
    >
      {label}
    </Link>
  );
}
