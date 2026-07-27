/**
 * Minimal in-memory sliding-window rate limiter. Per-instance only (not
 * shared across multiple Railway replicas/dynos) — good enough as a first
 * line of defense against scripted abuse on public endpoints without
 * pulling in a Redis dependency. If we scale to multiple instances, swap
 * this for an Upstash/Redis-backed limiter.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so this doesn't grow unbounded across the process lifetime.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupIfNeeded() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt < now) buckets.delete(key);
  });
}

export type RateLimitResult = { limited: false } | { limited: true; retryAfterSeconds: number };

/**
 * @param key Unique identifier for the thing being limited (e.g. `apply:203.0.113.4`)
 * @param max Max allowed hits within the window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  cleanupIfNeeded();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  if (existing.count >= max) {
    return { limited: true, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { limited: false };
}

/** Best-effort client IP extraction behind Railway/Vercel-style proxies. */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
