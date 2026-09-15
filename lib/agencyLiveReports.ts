import "server-only";

import { notFound } from "next/navigation";
import { hubHas } from "@/lib/hub/modules";
import { prisma } from "@/lib/prisma";
import {
  ensureAgencyListMember,
  fetchAgencyEventSummary,
  parseTikTokUniqueId,
} from "@/lib/tiktools";
import { getMemberAvatarUrl, getMemberDisplayName } from "@/lib/memberDisplay";
import type {
  AgencyLiveMetrics,
  AgencyRosterRow,
} from "@/lib/agencyLiveReportTypes";

export type { AgencyLiveMetrics, AgencyLiveTraffic, AgencyRosterRow } from "@/lib/agencyLiveReportTypes";

export function requireAgencyLiveReports() {
  if (!hubHas("agencyLiveReports")) notFound();
}

function memberHandle(user: {
  tiktokStatsSnapshot: { uniqueId: string | null } | null;
  profile: { socialLinks: unknown } | null;
}): string | null {
  const fromSnap = user.tiktokStatsSnapshot?.uniqueId?.replace(/^@/, "").toLowerCase();
  if (fromSnap) return fromSnap;
  return parseTikTokUniqueId(
    ((user.profile?.socialLinks as Record<string, string> | null) ?? {}).tiktok
  );
}

export function monthWindow(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const now = new Date();
  const cappedEnd = end.getTime() > now.getTime() ? now : end;
  const ms = Math.max(0, cappedEnd.getTime() - start.getTime());
  const days = Math.min(90, Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000))));
  return { start, end, days };
}

export function parseMonthParam(raw: string | undefined): { year: number; month: number } {
  const now = new Date();
  const fallback = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  if (!raw) return fallback;
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return fallback;
  return { year, month };
}

export function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthParam(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

const rosterUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  profile: { select: { socialLinks: true, username: true, showRealName: true } },
  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
  tiktokStatsSnapshot: { select: { uniqueId: true, avatarUrl: true, nickname: true } },
};

function asMetrics(value: unknown): AgencyLiveMetrics | null {
  if (!value || typeof value !== "object") return null;
  const m = value as AgencyLiveMetrics;
  if (!m.uniqueId) return null;
  return m;
}

export async function listAgencyLiveRoster(): Promise<AgencyRosterRow[]> {
  const rows = await prisma.agencyLiveRosterMember.findMany({
    orderBy: { addedAt: "desc" },
    include: {
      user: { select: rosterUserSelect },
    },
  });

  const reports = await prisma.agencyLiveReport.findMany({
    where: { userId: { in: rows.map((r) => r.userId) } },
    orderBy: [{ year: "desc" }, { month: "desc" }, { ranAt: "desc" }],
  });
  const latest = new Map<string, (typeof reports)[number]>();
  for (const report of reports) {
    if (!latest.has(report.userId)) latest.set(report.userId, report);
  }

  return rows.map((row) => {
    const report = latest.get(row.userId);
    const metrics = report ? asMetrics(report.metrics) : null;
    return {
      userId: row.userId,
      name: getMemberDisplayName(row.user),
      email: row.user.email,
      uniqueId: memberHandle(row.user),
      avatarUrl: getMemberAvatarUrl(row.user) ?? row.user.image,
      lastReport: report
        ? {
            year: report.year,
            month: report.month,
            diamonds: metrics?.diamonds ?? null,
            ranAt: report.ranAt,
          }
        : null,
    };
  });
}

export async function searchAgencyRosterCandidates(q: string, limit = 12) {
  const query = q.trim();
  if (query.length < 2) return [];
  const onRoster = await prisma.agencyLiveRosterMember.findMany({
    select: { userId: true },
  });
  const skipIds = onRoster.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: {
      status: { in: ["ACTIVE", "INVITED"] },
      hiddenFromDirectory: false,
      ...(skipIds.length > 0 ? { id: { notIn: skipIds } } : {}),
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { profile: { username: { contains: query.replace(/^@/, ""), mode: "insensitive" } } },
        {
          tiktokStatsSnapshot: {
            uniqueId: { contains: query.replace(/^@/, ""), mode: "insensitive" },
          },
        },
      ],
    },
    take: 40,
    orderBy: { lastSeenAt: "desc" },
    select: rosterUserSelect,
  });

  return users
    .map((user) => ({
      userId: user.id,
      name: getMemberDisplayName(user),
      email: user.email,
      uniqueId: memberHandle(user),
      avatarUrl: getMemberAvatarUrl(user) ?? user.image,
    }))
    .filter((row) => row.uniqueId)
    .slice(0, limit);
}

export async function addAgencyRosterMember(userId: string, addedById: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      profile: { select: { socialLinks: true } },
      tiktokStatsSnapshot: { select: { uniqueId: true } },
    },
  });
  if (!user || (user.status !== "ACTIVE" && user.status !== "INVITED")) {
    throw new Error("Member not found");
  }
  const uniqueId = memberHandle(user);
  if (!uniqueId) throw new Error("That member needs a TikTok handle first");

  await prisma.agencyLiveRosterMember.upsert({
    where: { userId },
    create: { userId, addedById },
    update: {},
  });

  try {
    await ensureAgencyListMember(uniqueId);
  } catch (err) {
    console.error("tik.tools agency list enrol failed:", err);
  }
}

export async function removeAgencyRosterMember(userId: string) {
  await prisma.agencyLiveRosterMember.deleteMany({ where: { userId } });
}

function sessionDurationMs(
  session: { startedAt: Date; endedAt: Date | null },
  start: Date,
  end: Date
) {
  const from = Math.max(session.startedAt.getTime(), start.getTime());
  const to = Math.min((session.endedAt ?? new Date()).getTime(), end.getTime());
  return Math.max(0, to - from);
}

async function liveSessionStats(userId: string, start: Date, end: Date) {
  const sessions = await prisma.tikTokLiveSession.findMany({
    where: {
      userId,
      startedAt: { lte: end },
      OR: [{ endedAt: null }, { endedAt: { gte: start } }],
    },
    select: { startedAt: true, endedAt: true },
  });

  let liveDurationSeconds = 0;
  const days = new Set<string>();
  for (const session of sessions) {
    const ms = sessionDurationMs(session, start, end);
    if (ms <= 0) continue;
    liveDurationSeconds += Math.round(ms / 1000);
    const from = new Date(Math.max(session.startedAt.getTime(), start.getTime()));
    const to = new Date(Math.min((session.endedAt ?? new Date()).getTime(), end.getTime()));
    for (let t = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()); t <= to.getTime(); t += 24 * 60 * 60 * 1000) {
      const d = new Date(t);
      days.add(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`);
    }
  }

  return {
    liveStreams: sessions.filter((s) => sessionDurationMs(s, start, end) > 0).length,
    liveDurationSeconds,
    validGoLiveDays: days.size,
  };
}

function rate(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator <= 0) return null;
  return numerator / denominator;
}

export async function runAgencyLiveReport(opts: {
  userId: string;
  year: number;
  month: number;
  ranById: string;
}) {
  const onRoster = await prisma.agencyLiveRosterMember.findUnique({
    where: { userId: opts.userId },
  });
  if (!onRoster) throw new Error("Add this person to the LIVE report roster first");

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: {
      id: true,
      profile: { select: { socialLinks: true } },
      tiktokStatsSnapshot: { select: { uniqueId: true, followerCount: true } },
    },
  });
  if (!user) throw new Error("Member not found");
  const uniqueId = memberHandle(user);
  if (!uniqueId) throw new Error("That member needs a TikTok handle first");

  const { start, end, days } = monthWindow(opts.year, opts.month);
  const [sessions, prevReport] = await Promise.all([
    liveSessionStats(opts.userId, start, end),
    prisma.agencyLiveReport.findUnique({
      where: {
        userId_year_month: {
          userId: opts.userId,
          year: opts.month === 1 ? opts.year - 1 : opts.year,
          month: opts.month === 1 ? 12 : opts.month - 1,
        },
      },
    }),
  ]);

  let agency: Awaited<ReturnType<typeof fetchAgencyEventSummary>> | null = null;
  let agencyError: string | null = null;
  try {
    await ensureAgencyListMember(uniqueId);
    agency = await fetchAgencyEventSummary(uniqueId, days);
  } catch (err) {
    agencyError = err instanceof Error ? err.message : "tik.tools agency events failed";
    console.error("fetchAgencyEventSummary failed:", err);
  }

  const uniqueGifters = agency ? agency.gifts.uniqueGifters : null;
  const joins = agency ? agency.activity.joins || null : null;
  const impressions: number | null = null;
  const reachedAudience: number | null = null;
  const views: number | null = null;
  const viewers: number | null = null;
  const prev = prevReport ? asMetrics(prevReport.metrics) : null;

  const metrics: AgencyLiveMetrics = {
    uniqueId,
    diamonds: agency ? agency.gifts.diamonds : null,
    giftEvents: agency ? agency.gifts.events : null,
    uniqueGifters,
    likes: agency ? agency.activity.likes : null,
    joins: agency ? agency.activity.joins : null,
    battles: agency ? agency.battles.total : null,
    battleWins: agency ? agency.battles.wins : null,
    liveStreams: sessions.liveStreams,
    liveDurationSeconds: sessions.liveDurationSeconds,
    validGoLiveDays: sessions.validGoLiveDays,
    newFollowers: null,
    avgWatchDurationSeconds: null,
    impressions,
    reachedAudience,
    views,
    viewers,
    tapThroughRate: rate(views, impressions) ?? rate(reachedAudience, impressions),
    giftingRate: rate(uniqueGifters, viewers) ?? rate(uniqueGifters, joins),
    traffic: {
      liveFeed: null,
      forYou: null,
      following: null,
      share: null,
      other: null,
    },
    prior: prev
      ? {
          diamonds: prev.diamonds,
          validGoLiveDays: prev.validGoLiveDays,
          liveDurationSeconds: prev.liveDurationSeconds,
          liveStreams: prev.liveStreams,
          newFollowers: prev.newFollowers,
          avgWatchDurationSeconds: prev.avgWatchDurationSeconds,
        }
      : null,
    source: {
      agencyEventsOk: !!agency,
      agencyEventsError: agencyError,
      daysLookback: days,
    },
  };

  return prisma.agencyLiveReport.upsert({
    where: {
      userId_year_month: { userId: opts.userId, year: opts.year, month: opts.month },
    },
    create: {
      userId: opts.userId,
      year: opts.year,
      month: opts.month,
      periodStart: start,
      periodEnd: end,
      ranAt: new Date(),
      ranById: opts.ranById,
      metrics,
    },
    update: {
      periodStart: start,
      periodEnd: end,
      ranAt: new Date(),
      ranById: opts.ranById,
      metrics,
    },
  });
}

export async function loadAgencyLiveReport(userId: string, year: number, month: number) {
  const [member, roster, report] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: rosterUserSelect,
    }),
    prisma.agencyLiveRosterMember.findUnique({ where: { userId } }),
    prisma.agencyLiveReport.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: {
        notes: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, email: true } } },
        },
        ranBy: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  if (!member || !roster) return null;

  return {
    userId,
    name: getMemberDisplayName(member),
    email: member.email,
    uniqueId: memberHandle(member),
    avatarUrl: getMemberAvatarUrl(member) ?? member.image,
    report,
    metrics: report ? asMetrics(report.metrics) : null,
  };
}

export async function addAgencyLiveReportNote(reportId: string, authorId: string, body: string) {
  const text = body.trim();
  if (text.length < 2) throw new Error("Write a note first");
  if (text.length > 4000) throw new Error("Note is too long");
  const report = await prisma.agencyLiveReport.findUnique({
    where: { id: reportId },
    select: { id: true },
  });
  if (!report) throw new Error("Run the report first, then add a note");
  return prisma.agencyLiveReportNote.create({
    data: { reportId, authorId, body: text },
  });
}
