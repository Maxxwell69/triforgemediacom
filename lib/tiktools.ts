/**
 * tik.tools client — profile stats + live checks by TikTok username.
 * Independent of TikTok Login Kit OAuth. Docs: https://tik.tools/docs
 */

const API_BASE = "https://api.tik.tools";

export function isTikToolsConfigured(): boolean {
  return !!process.env.TIKTOOLS_API_KEY;
}

function apiKey(): string {
  const key = process.env.TIKTOOLS_API_KEY;
  if (!key) throw new Error("Missing TIKTOOLS_API_KEY");
  return key;
}

/** Extract TikTok uniqueId (no @) from a profile URL, @handle, or bare handle. */
export function parseTikTokUniqueId(urlOrHandle: string | null | undefined): string | null {
  if (!urlOrHandle) return null;
  const raw = urlOrHandle.trim();
  if (!raw) return null;

  const fromUrl = raw.match(/tiktok\.com\/@([\w.-]+)/i);
  if (fromUrl) return fromUrl[1].toLowerCase();

  const bare = raw.replace(/^@/, "").trim();
  if (/^[\w.-]+$/.test(bare) && bare.length >= 2 && bare.length <= 64) {
    // Reject bare domains mistaken for handles
    if (/^[a-z0-9-]+\.(com|net|org|io|co|tv)$/i.test(bare)) return null;
    return bare.toLowerCase();
  }

  return null;
}

export type TikToolsLeague = {
  found: boolean;
  region: string | null;
  classLabel: string | null;
  rank: number | null;
  /** Present when the API key tier cannot read league data. */
  upgradeRequired: boolean;
};

export type TikToolsUserProfile = {
  uniqueId: string;
  tiktokUserId: string | null;
  nickname: string | null;
  signature: string | null;
  bioLink: string | null;
  bioLinkRisk: number | null;
  verified: boolean;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  league: TikToolsLeague | null;
};

export type TikToolsLiveStatus = {
  isLive: boolean;
  roomId: string | null;
  title: string | null;
  viewerCount: number | null;
};

async function tiktoolsGet(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey() },
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    status_code?: number;
    error?: string | { message?: string };
    message?: string;
    data?: unknown;
  };

  if (!res.ok) {
    const msg =
      (typeof data.error === "string" && data.error) ||
      (typeof data.error === "object" && data.error?.message) ||
      data.message ||
      `tik.tools request failed (${res.status})`;
    throw new Error(msg);
  }

  if (typeof data.status_code === "number" && data.status_code !== 0) {
    throw new Error(data.message || `tik.tools status_code ${data.status_code}`);
  }

  return data;
}

export async function fetchUserProfile(
  uniqueId: string,
  opts?: { nocache?: boolean }
): Promise<TikToolsUserProfile> {
  const params: Record<string, string> = { unique_id: uniqueId };
  if (opts?.nocache) params.nocache = "1";

  const data = (await tiktoolsGet("/webcast/user_profile", params)) as {
    data?: {
      profile?: {
        id?: string | number;
        uniqueId?: string;
        nickname?: string;
        signature?: string;
        bioLink?: string;
        bioLinkRisk?: number;
        verified?: boolean;
        avatarMedium?: string;
        avatarLarger?: string;
        avatarThumb?: string;
        stats?: {
          followerCount?: number;
          followingCount?: number;
          heartCount?: number;
          videoCount?: number;
        };
      };
      league?: {
        found?: boolean;
        region?: string | null;
        classLabel?: string | null;
        rank?: number | null;
        available_on?: string;
        message?: string;
      };
    };
  };

  const profile = data.data?.profile;
  if (!profile?.uniqueId && !profile?.stats) {
    throw new Error("tik.tools returned no profile data");
  }

  const stats = profile.stats ?? {};
  const bioLinkRaw = typeof profile.bioLink === "string" ? profile.bioLink.trim() : "";
  const leagueRaw = data.data?.league;
  let league: TikToolsLeague | null = null;
  if (leagueRaw) {
    const upgradeRequired = Boolean(leagueRaw.available_on || /upgrade/i.test(leagueRaw.message || ""));
    league = {
      found: !!leagueRaw.found && !upgradeRequired,
      region: leagueRaw.region ?? null,
      classLabel: leagueRaw.classLabel ?? null,
      rank: typeof leagueRaw.rank === "number" ? leagueRaw.rank : null,
      upgradeRequired,
    };
  }

  return {
    uniqueId: (profile.uniqueId || uniqueId).toLowerCase(),
    tiktokUserId:
      profile.id != null && String(profile.id).trim() ? String(profile.id) : null,
    nickname: profile.nickname ?? null,
    signature: profile.signature ?? null,
    bioLink: bioLinkRaw || null,
    bioLinkRisk: typeof profile.bioLinkRisk === "number" ? profile.bioLinkRisk : null,
    verified: !!profile.verified,
    avatarUrl: profile.avatarMedium || profile.avatarLarger || profile.avatarThumb || null,
    followerCount: Number(stats.followerCount ?? 0),
    followingCount: Number(stats.followingCount ?? 0),
    heartCount: Number(stats.heartCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
    league,
  };
}

export type TikToolsRoomInfo = {
  roomId: string | null;
  title: string | null;
  userCount: number | null;
  totalUser: number | null;
  likeCount: number | null;
  liveDurationSeconds: number | null;
  status: number | null;
};

/**
 * Pro+ server-side room snapshot (mode:fetch). Needs a room_id from checkLive.
 * Returns null when the key/tier cannot fetch or the creator is offline.
 */
export async function fetchRoomInfo(roomId: string): Promise<TikToolsRoomInfo | null> {
  if (!roomId.trim()) return null;

  try {
    const url = new URL(`${API_BASE}/webcast/room_info`);
    url.searchParams.set("apiKey", apiKey());

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey(),
      },
      body: JSON.stringify({ room_id: roomId, mode: "fetch" }),
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as {
      status_code?: number;
      message?: string;
      error?: string | { message?: string };
      data?: {
        room_id?: string;
        title?: string;
        user_count?: number | null;
        total_user?: number | null;
        like_count?: number | null;
        live_duration_seconds?: number | null;
        status?: number | null;
      };
    };

    if (!res.ok) {
      console.error(
        "tik.tools room_info failed:",
        typeof data.error === "string"
          ? data.error
          : data.error?.message || data.message || res.status
      );
      return null;
    }

    if (typeof data.status_code === "number" && data.status_code !== 0) {
      console.error("tik.tools room_info status_code:", data.status_code, data.message);
      return null;
    }

    const room = data.data;
    if (!room) return null;

    return {
      roomId: room.room_id ?? roomId,
      title: room.title ?? null,
      userCount: typeof room.user_count === "number" ? room.user_count : null,
      totalUser: typeof room.total_user === "number" ? room.total_user : null,
      likeCount: typeof room.like_count === "number" ? room.like_count : null,
      liveDurationSeconds:
        typeof room.live_duration_seconds === "number" ? room.live_duration_seconds : null,
      status: typeof room.status === "number" ? room.status : null,
    };
  } catch (err) {
    console.error("tik.tools room_info error:", err);
    return null;
  }
}

/** Definitive live check (title + viewers when live). */
export async function checkLive(uniqueId: string): Promise<TikToolsLiveStatus> {
  const data = (await tiktoolsGet("/webcast/check_alive", { unique_id: uniqueId })) as {
    data?: Array<{
      room_id?: string;
      alive?: boolean;
      title?: string;
      userCount?: number;
    }>;
  };

  const entry = Array.isArray(data.data) ? data.data[0] : undefined;
  if (!entry) {
    return { isLive: false, roomId: null, title: null, viewerCount: null };
  }

  return {
    isLive: !!entry.alive,
    roomId: entry.room_id ?? null,
    title: entry.title ?? null,
    viewerCount: typeof entry.userCount === "number" ? entry.userCount : null,
  };
}

export type TikToolsBulkLiveRow = TikToolsLiveStatus & {
  uniqueId: string;
  /** When true, upstream was inconclusive — do not flip offline. */
  unknown: boolean;
};

/**
 * Batch live check (Pro: up to 50 / call). Prefer this over looping checkLive.
 */
export async function bulkCheckLive(uniqueIds: string[]): Promise<TikToolsBulkLiveRow[]> {
  if (uniqueIds.length === 0) return [];

  const key = apiKey();
  const res = await fetch(`https://api.tik.tools/webcast/bulk_live_check?apiKey=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({ unique_ids: uniqueIds }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    status_code?: number;
    message?: string;
    error?: string;
    data?: Array<{
      unique_id?: string;
      room_id?: string;
      alive?: boolean | null;
      is_live?: boolean | null;
      alive_status?: string;
      live_status?: string;
      title?: string;
      userCount?: number;
      check_failed?: boolean;
    }>;
  };

  if (!res.ok) {
    throw new Error(
      data.message || data.error || `tik.tools bulk_live_check failed (${res.status})`
    );
  }

  if (typeof data.status_code === "number" && data.status_code !== 0) {
    throw new Error(data.message || `tik.tools bulk_live_check status_code ${data.status_code}`);
  }

  const rows = Array.isArray(data.data) ? data.data : [];
  return rows.map((row) => {
    // live_status is a documented alias of alive_status
    const status = (row.alive_status || row.live_status || "").toLowerCase();
    const uniqueId = (row.unique_id || "").replace(/^@/, "").toLowerCase();
    // Explicit offline from alive_status wins even if other fields are messy
    if (status === "offline") {
      return {
        uniqueId,
        isLive: false,
        unknown: false,
        roomId: null,
        title: null,
        viewerCount: null,
      };
    }
    if (status === "live") {
      return {
        uniqueId,
        isLive: true,
        unknown: false,
        roomId: row.room_id ?? null,
        title: row.title ?? null,
        viewerCount: typeof row.userCount === "number" ? row.userCount : null,
      };
    }
    const unknown =
      row.check_failed === true ||
      status === "unknown" ||
      (row.alive == null && row.is_live == null && !status);
    const isLive = unknown ? false : !!(row.alive ?? row.is_live);
    return {
      uniqueId,
      isLive,
      unknown,
      roomId: isLive ? row.room_id ?? null : null,
      title: isLive ? row.title ?? null : null,
      viewerCount: isLive && typeof row.userCount === "number" ? row.userCount : null,
    };
  });
}

async function tiktoolsRequest(
  path: string,
  opts?: {
    method?: "GET" | "POST";
    params?: Record<string, string>;
    body?: unknown;
  }
): Promise<unknown> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(opts?.params ?? {})) {
    if (v) url.searchParams.set(k, v);
  }
  const method = opts?.method ?? "GET";
  const res = await fetch(url.toString(), {
    method,
    headers: {
      "x-api-key": apiKey(),
      ...(opts?.body != null ? { "Content-Type": "application/json" } : {}),
    },
    body: opts?.body != null ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    status_code?: number;
    error?: string | { message?: string };
    message?: string;
    ok?: boolean;
  };
  if (!res.ok) {
    const msg =
      (typeof data.error === "string" && data.error) ||
      (typeof data.error === "object" && data.error?.message) ||
      data.message ||
      `tik.tools request failed (${res.status})`;
    throw new Error(msg);
  }
  if (typeof data.status_code === "number" && data.status_code !== 0) {
    throw new Error(data.message || `tik.tools status_code ${data.status_code}`);
  }
  return data;
}

export type TikToolsAgencyEventSummary = {
  creator: string;
  days: number;
  gifts: { events: number; diamonds: number; uniqueGifters: number };
  battles: { total: number; wins: number };
  chat: { messages: number; uniqueChatters: number };
  activity: { likes: number; joins: number };
};

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchAgencyEventSummary(
  uniqueId: string,
  days: number
): Promise<TikToolsAgencyEventSummary> {
  const lookback = Math.min(90, Math.max(1, Math.round(days)));
  const raw = (await tiktoolsRequest("/webcast/agency/events", {
    params: {
      creator: uniqueId.replace(/^@/, ""),
      type: "summary",
      days: String(lookback),
    },
  })) as {
    creator?: string;
    days?: number;
    gifts?: { events?: number; diamonds?: number; uniqueGifters?: number };
    battles?: { total?: number; wins?: number };
    chat?: { messages?: number; uniqueChatters?: number };
    activity?: { likes?: number; joins?: number };
    data?: {
      gifts?: { events?: number; diamonds?: number; uniqueGifters?: number };
      battles?: { total?: number; wins?: number };
      chat?: { messages?: number; uniqueChatters?: number };
      activity?: { likes?: number; joins?: number };
    };
  };

  const payload = raw.data ?? raw;
  return {
    creator: (raw.creator || uniqueId).replace(/^@/, "").toLowerCase(),
    days: num(raw.days) || lookback,
    gifts: {
      events: num(payload.gifts?.events),
      diamonds: num(payload.gifts?.diamonds),
      uniqueGifters: num(payload.gifts?.uniqueGifters),
    },
    battles: {
      total: num(payload.battles?.total),
      wins: num(payload.battles?.wins),
    },
    chat: {
      messages: num(payload.chat?.messages),
      uniqueChatters: num(payload.chat?.uniqueChatters),
    },
    activity: {
      likes: num(payload.activity?.likes),
      joins: num(payload.activity?.joins),
    },
  };
}

const AGENCY_LIST_NAME = "TriForge Agency";

export async function ensureAgencyListMember(uniqueId: string): Promise<void> {
  const handle = uniqueId.replace(/^@/, "").toLowerCase();
  if (!handle) return;

  let listId = (process.env.TIKTOOLS_AGENCY_LIST_ID || "").trim();
  if (!listId) {
    const listsRaw = (await tiktoolsRequest("/webcast/agency/lists")) as {
      lists?: Array<{ id?: string; name?: string }>;
    };
    const existing = (listsRaw.lists ?? []).find(
      (list) => (list.name || "").trim().toLowerCase() === AGENCY_LIST_NAME.toLowerCase()
    );
    if (existing?.id) {
      listId = existing.id;
    } else {
      const created = (await tiktoolsRequest("/webcast/agency/lists", {
        method: "POST",
        body: { name: AGENCY_LIST_NAME },
      })) as { id?: string };
      if (!created.id) throw new Error("Could not create tik.tools agency list");
      listId = created.id;
    }
  }

  await tiktoolsRequest("/webcast/agency/list/members", {
    method: "POST",
    body: { id: listId, uniqueId: handle, action: "add" },
  });
}
