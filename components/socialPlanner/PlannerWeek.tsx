"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { SocialPlannerItemKind, SocialPlannerItemStatus } from "@prisma/client";
import PlannerStatusBadge from "@/components/socialPlanner/PlannerStatusBadge";
import { plannerKindLabel } from "@/lib/socialPlanner/labels";

type WeekItem = {
  id: string;
  kind: SocialPlannerItemKind;
  status: SocialPlannerItemStatus;
  caption: string;
  title: string | null;
  scheduledAt: string | null;
  handle: string;
};

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function PlannerWeek({ items }: { items: WeekItem[] }) {
  const days = useMemo(() => {
    const start = startOfLocalDay(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, WeekItem[]>();
    for (const day of days) {
      map.set(day.toDateString(), []);
    }
    for (const item of items) {
      if (!item.scheduledAt) continue;
      const key = new Date(item.scheduledAt).toDateString();
      const list = map.get(key);
      if (list) list.push(item);
    }
    return map;
  }, [days, items]);

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
      {days.map((day) => {
        const key = day.toDateString();
        const dayItems = byDay.get(key) ?? [];
        return (
          <div key={key} className="glass min-h-[8rem] rounded-xl p-3">
            <p className="font-body text-[11px] uppercase tracking-wide text-off-white/40">
              {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <ul className="mt-2 space-y-2">
              {dayItems.length === 0 && (
                <li className="font-body text-xs text-off-white/25">—</li>
              )}
              {dayItems.map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/social-planner/${item.id}`} className="block">
                    <PlannerStatusBadge status={item.status} />
                    <p className="mt-1 truncate font-body text-xs text-off-white/85">
                      {plannerKindLabel(item.kind)} · {item.handle}
                    </p>
                    <p className="truncate font-body text-[11px] text-off-white/45">
                      {item.title || item.caption || "Untitled"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
