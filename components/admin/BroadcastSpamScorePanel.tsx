"use client";

import type { BroadcastSpamScore } from "@/lib/broadcastSpamScore";

const gradeLabel: Record<BroadcastSpamScore["grade"], string> = {
  good: "Inbox-friendly",
  ok: "Acceptable",
  poor: "Risky",
  blocked: "Blocked — fix before send",
};

const gradeColor: Record<BroadcastSpamScore["grade"], string> = {
  good: "text-cyan border-cyan/40 bg-cyan/10",
  ok: "text-off-white border-off-white/25 bg-off-white/5",
  poor: "text-orange border-orange/40 bg-orange/10",
  blocked: "text-orange border-orange/50 bg-orange/15",
};

export default function BroadcastSpamScorePanel({ score }: { score: BroadcastSpamScore }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${gradeColor[score.grade]}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg tracking-wide">
          Deliverability {score.score}
          <span className="text-sm opacity-70">/100</span>
        </p>
        <p className="font-body text-xs font-semibold uppercase tracking-wide opacity-90">
          {gradeLabel[score.grade]}
        </p>
      </div>
      {score.issues.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 font-body text-xs opacity-90">
          {score.issues.slice(0, 6).map((issue) => (
            <li key={issue.text}>
              <span className="uppercase tracking-wide opacity-60">{issue.severity}</span>
              {" — "}
              {issue.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 font-body text-xs opacity-80">
          Looks clean — short subject, calm tone, no common spam triggers.
        </p>
      )}
    </div>
  );
}
