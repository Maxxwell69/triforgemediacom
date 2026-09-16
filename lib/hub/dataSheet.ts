import "server-only";

import { AccessToken } from "livekit-server-sdk";
import { getControlPrisma, getTenantPrisma } from "@/lib/hub/tenantPrisma";
import { isLiveKitConfigured, listLiveKitRooms } from "@/lib/livekit";
import type { PrismaClient } from "@prisma/client";

const TOKEN_TTL_HOURS = 6;

export type HubDataSheetRow = {
  id: string;
  name: string;
  slug: string;
  kind: "hub0" | "client";
  provisioned: boolean;
  membersActive: number;
  membersInvited: number;
  webinarsThisMonth: number;
  joinsThisMonth: number;
  estimatedMinutesThisMonth: number;
  liveParticipants: number;
  bandwidthBytes7d: number | null;
};

export type CreateHubDataSheet = {
  monthLabel: string;
  rows: HubDataSheetRow[];
  totals: {
    membersActive: number;
    membersInvited: number;
    webinarsThisMonth: number;
    joinsThisMonth: number;
    estimatedMinutesThisMonth: number;
    liveParticipants: number;
    bandwidthBytes7d: number | null;
  };
  livekit: {
    configured: boolean;
    analytics: boolean;
    note: string | null;
  };
};

function monthStartUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function monthLabel(now = new Date()) {
  return now.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function minutesBetween(joinedAt: Date, leftAt: Date | null, now: Date) {
  const end = leftAt && leftAt > joinedAt ? leftAt : now;
  const ms = Math.max(0, end.getTime() - joinedAt.getTime());
  const capped = Math.min(ms, TOKEN_TTL_HOURS * 60 * 60 * 1000);
  return capped / 60_000;
}

async function webinarStats(db: PrismaClient, from: Date, now: Date) {
  const [webinarsThisMonth, attendances, guestJoins, rooms] = await Promise.all([
    db.webinar.count({
      where: {
        OR: [{ startedAt: { gte: from } }, { scheduledAt: { gte: from } }],
      },
    }),
    db.webinarAttendance.findMany({
      where: { joinedAt: { gte: from } },
      select: { joinedAt: true, leftAt: true },
    }),
    db.webinarGuest.count({
      where: { joinedAt: { gte: from } },
    }),
    db.webinar.findMany({
      select: { livekitRoomName: true },
    }),
  ]);

  const estimatedMinutesThisMonth = attendances.reduce(
    (sum, row) => sum + minutesBetween(row.joinedAt, row.leftAt, now),
    0
  );

  return {
    webinarsThisMonth,
    joinsThisMonth: attendances.length + guestJoins,
    estimatedMinutesThisMonth,
    roomNames: rooms.map((row) => row.livekitRoomName).filter(Boolean),
  };
}

function emptyStats() {
  return {
    webinarsThisMonth: 0,
    joinsThisMonth: 0,
    estimatedMinutesThisMonth: 0,
    roomNames: [] as string[],
  };
}

async function listLiveKitRoomParticipantCounts() {
  if (!isLiveKitConfigured()) return new Map<string, number>();
  try {
    const rooms = await listLiveKitRooms();
    const map = new Map<string, number>();
    for (const room of rooms) {
      map.set(room.name, room.numParticipants ?? 0);
    }
    return map;
  } catch (err) {
    console.error("LiveKit listRooms failed", err);
    return new Map<string, number>();
  }
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (value && typeof value === "object" && "low" in (value as object)) {
    return Number(value) || 0;
  }
  return 0;
}

async function fetchLiveKitBandwidthByRoom(): Promise<{
  byRoom: Map<string, number>;
  error: string | null;
}> {
  const projectId = process.env.LIVEKIT_PROJECT_ID?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!projectId || !apiKey || !apiSecret) {
    return {
      byRoom: new Map(),
      error: projectId
        ? null
        : "Set LIVEKIT_PROJECT_ID (from cloud.livekit.io /projects/p_…) to attach Cloud bandwidth.",
    };
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { ttl: "1h" });
    at.addGrant({ roomList: true });
    const token = await at.toJwt();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 6);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = new Date().toISOString().slice(0, 10);
    const byRoom = new Map<string, number>();

    for (let page = 0; page < 5; page += 1) {
      const url = new URL(`https://cloud-api.livekit.io/api/project/${projectId}/sessions`);
      url.searchParams.set("start", startStr);
      url.searchParams.set("end", endStr);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "100");
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return {
          byRoom: new Map(),
          error:
            res.status === 403 || res.status === 401
              ? "LiveKit Analytics needs a Scale plan (or higher) on this project."
              : `LiveKit Analytics returned ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`,
        };
      }
      const data = (await res.json()) as { sessions?: Array<Record<string, unknown>> };
      const sessions = data.sessions ?? [];
      for (const session of sessions) {
        const roomName = String(session.roomName || "");
        if (!roomName) continue;
        const bytes =
          toNumber(session.bandwidthIn) +
          toNumber(session.bandwidthOut) +
          toNumber(session.bandwidth);
        byRoom.set(roomName, (byRoom.get(roomName) ?? 0) + bytes);
      }
      if (sessions.length < 100) break;
    }

    return { byRoom, error: null };
  } catch (err) {
    console.error("LiveKit Analytics failed", err);
    return {
      byRoom: new Map(),
      error: "Could not reach LiveKit Analytics.",
    };
  }
}

function sumBandwidth(roomNames: string[], byRoom: Map<string, number>) {
  if (byRoom.size === 0) return null;
  let total = 0;
  let matched = false;
  for (const name of roomNames) {
    if (byRoom.has(name)) {
      matched = true;
      total += byRoom.get(name) ?? 0;
    }
  }
  return matched ? total : 0;
}

function liveParticipants(roomNames: string[], live: Map<string, number>) {
  let total = 0;
  for (const name of roomNames) {
    total += live.get(name) ?? 0;
  }
  return total;
}

export function formatSheetMinutes(value: number) {
  return `${Math.round(value).toLocaleString()} min`;
}

export function formatSheetBytes(bytes: number | null) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 0.1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export async function loadCreateHubDataSheet(): Promise<CreateHubDataSheet> {
  const control = getControlPrisma();
  const now = new Date();
  const from = monthStartUtc(now);

  const [hubs, hub0Active, hub0Invited, memberships, liveRooms, analytics] = await Promise.all([
    control.clientHub.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        tenantDbName: true,
        tenantDbAt: true,
      },
    }),
    control.user.count({
      where: { platformAccess: true, status: "ACTIVE" },
    }),
    control.user.count({
      where: { platformAccess: true, status: "INVITED" },
    }),
    control.hubMembership.groupBy({
      by: ["clientHubId", "status"],
      where: { status: { in: ["ACTIVE", "INVITED"] } },
      _count: { _all: true },
    }),
    listLiveKitRoomParticipantCounts(),
    fetchLiveKitBandwidthByRoom(),
  ]);

  const memberMap = new Map<string, { active: number; invited: number }>();
  for (const row of memberships) {
    const current = memberMap.get(row.clientHubId) ?? { active: 0, invited: 0 };
    if (row.status === "ACTIVE") current.active = row._count._all;
    if (row.status === "INVITED") current.invited = row._count._all;
    memberMap.set(row.clientHubId, current);
  }

  const hub0Stats = await webinarStats(control, from, now).catch((err) => {
    console.error("Hub 0 webinar stats failed", err);
    return emptyStats();
  });

  const clientStats = await Promise.all(
    hubs.map(async (hub) => {
      if (!hub.tenantDbName || !hub.tenantDbAt) {
        return { id: hub.id, ...emptyStats() };
      }
      try {
        const stats = await webinarStats(getTenantPrisma(hub.tenantDbName), from, now);
        return { id: hub.id, ...stats };
      } catch (err) {
        console.error("tenant webinar stats failed", hub.slug, err);
        return { id: hub.id, ...emptyStats() };
      }
    })
  );
  const statsByHub = new Map(clientStats.map((row) => [row.id, row]));

  const hub0Row: HubDataSheetRow = {
    id: "hub0",
    name: "Hub 0",
    slug: "hub",
    kind: "hub0",
    provisioned: true,
    membersActive: hub0Active,
    membersInvited: hub0Invited,
    webinarsThisMonth: hub0Stats.webinarsThisMonth,
    joinsThisMonth: hub0Stats.joinsThisMonth,
    estimatedMinutesThisMonth: hub0Stats.estimatedMinutesThisMonth,
    liveParticipants: liveParticipants(hub0Stats.roomNames, liveRooms),
    bandwidthBytes7d: sumBandwidth(hub0Stats.roomNames, analytics.byRoom),
  };

  const clientRows: HubDataSheetRow[] = hubs.map((hub) => {
    const members = memberMap.get(hub.id) ?? { active: 0, invited: 0 };
    const stats = statsByHub.get(hub.id) ?? { id: hub.id, ...emptyStats() };
    return {
      id: hub.id,
      name: hub.name,
      slug: hub.slug,
      kind: "client",
      provisioned: Boolean(hub.tenantDbAt),
      membersActive: members.active,
      membersInvited: members.invited,
      webinarsThisMonth: stats.webinarsThisMonth,
      joinsThisMonth: stats.joinsThisMonth,
      estimatedMinutesThisMonth: stats.estimatedMinutesThisMonth,
      liveParticipants: liveParticipants(stats.roomNames, liveRooms),
      bandwidthBytes7d: sumBandwidth(stats.roomNames, analytics.byRoom),
    };
  });

  const rows = [hub0Row, ...clientRows];
  const bandwidthKnown = rows.some((row) => row.bandwidthBytes7d != null);

  const totals = {
    membersActive: rows.reduce((sum, row) => sum + row.membersActive, 0),
    membersInvited: rows.reduce((sum, row) => sum + row.membersInvited, 0),
    webinarsThisMonth: rows.reduce((sum, row) => sum + row.webinarsThisMonth, 0),
    joinsThisMonth: rows.reduce((sum, row) => sum + row.joinsThisMonth, 0),
    estimatedMinutesThisMonth: rows.reduce((sum, row) => sum + row.estimatedMinutesThisMonth, 0),
    liveParticipants: rows.reduce((sum, row) => sum + row.liveParticipants, 0),
    bandwidthBytes7d: bandwidthKnown
      ? rows.reduce((sum, row) => sum + (row.bandwidthBytes7d ?? 0), 0)
      : null,
  };

  const analyticsOk = analytics.byRoom.size > 0 && !analytics.error;
  const note = !isLiveKitConfigured()
    ? "Live kit is not configured on this environment."
    : analytics.error
      ? `${analytics.error} Minutes are estimated from webinar joins this month.`
      : analyticsOk
        ? "Bandwidth is last 7 days from LiveKit Cloud, matched to each hub’s webinar rooms. Minutes are estimated from attendance this month (UTC)."
        : "Bandwidth needs LIVEKIT_PROJECT_ID. Minutes are estimated from webinar joins this month (UTC).";

  return {
    monthLabel: monthLabel(now),
    rows,
    totals,
    livekit: {
      configured: isLiveKitConfigured(),
      analytics: analyticsOk,
      note,
    },
  };
}
