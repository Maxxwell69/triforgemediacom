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

export type TikToolsUserProfile = {
  uniqueId: string;
  nickname: string | null;
  signature: string | null;
  verified: boolean;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
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
        uniqueId?: string;
        nickname?: string;
        signature?: string;
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
    };
  };

  const profile = data.data?.profile;
  if (!profile?.uniqueId && !profile?.stats) {
    throw new Error("tik.tools returned no profile data");
  }

  const stats = profile.stats ?? {};
  return {
    uniqueId: (profile.uniqueId || uniqueId).toLowerCase(),
    nickname: profile.nickname ?? null,
    signature: profile.signature ?? null,
    verified: !!profile.verified,
    avatarUrl: profile.avatarMedium || profile.avatarLarger || profile.avatarThumb || null,
    followerCount: Number(stats.followerCount ?? 0),
    followingCount: Number(stats.followingCount ?? 0),
    heartCount: Number(stats.heartCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
  };
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
    data?: Array<{
      unique_id?: string;
      room_id?: string;
      alive?: boolean | null;
      is_live?: boolean | null;
      alive_status?: string;
      title?: string;
      userCount?: number;
      check_failed?: boolean;
    }>;
  };

  if (!res.ok) {
    throw new Error(data.message || `tik.tools bulk_live_check failed (${res.status})`);
  }

  const rows = Array.isArray(data.data) ? data.data : [];
  return rows.map((row) => {
    const status = (row.alive_status || "").toLowerCase();
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
